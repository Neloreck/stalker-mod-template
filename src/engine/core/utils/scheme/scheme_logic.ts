import { callback, clsid, game, time_global } from "xray16";

import { ObjectRestrictionsManager } from "@/engine/core/ai/restriction";
import { TAbstractSchemeConstructor } from "@/engine/core/ai/scheme";
import {
  IBaseSchemeLogic,
  IBaseSchemeState,
  IRegistryObjectState,
  IRegistryOfflineState,
  registry,
} from "@/engine/core/database";
import { updateObjectMapSpot } from "@/engine/core/managers/map/utils";
import { getTerrainJobByObjectId } from "@/engine/core/objects/smart_terrain/job/job_pick";
import type { SmartTerrain } from "@/engine/core/objects/smart_terrain/SmartTerrain";
import { assert, assertDefined } from "@/engine/core/utils/assertion";
import {
  getObjectConfigOverrides,
  getSchemeFromSection,
  pickSectionFromCondList,
  readIniConditionList,
  readIniString,
} from "@/engine/core/utils/ini";
import { LuaLogger } from "@/engine/core/utils/logging";
import { getObjectTerrain, sendToNearestAccessibleVertex } from "@/engine/core/utils/position";
import { emitSchemeEvent } from "@/engine/core/utils/scheme/scheme_event";
import { scriptReleaseMonster } from "@/engine/core/utils/scheme/scheme_monster";
import {
  initializeObjectCanSelectWeaponState,
  initializeObjectGroup,
  initializeObjectIgnoreThreshold,
  initializeObjectInfo,
  initializeObjectInvulnerability,
  initializeObjectTakeItemsEnabledState,
} from "@/engine/core/utils/scheme/scheme_object_initialization";
import { NIL } from "@/engine/lib/constants/words";
import { EScheme, ESchemeEvent, ESchemeType, GameObject, IniFile, Optional, TName, TSection } from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename, { file: "scheme" });

/**
 * Check whether section is active in logics for an object.
 *
 * @param object - object to check
 * @param section - logic section to check
 * @returns whether object logics active section is same as provided
 */
export function isActiveSection(object: GameObject, section?: Optional<TSection>): boolean {
  return section === registry.objects.get(object.id()).activeSection;
}

/**
 * Determine which section to activate for an object.
 * In case of offline->online switch try to restore previous job.
 * In other cases try to get active scheme from ini config settings.
 *
 * @param object - game object to get object section
 * @param ini - ini file of the object
 * @param section - desired logics section
 * @returns section to activate
 */
export function getSectionToActivate(object: GameObject, ini: IniFile, section: TSection): TSection {
  if (!ini.section_exist(section)) {
    return NIL;
  }

  const offlineObjectDescriptor: Optional<IRegistryOfflineState> = registry.offlineObjects.get(object.id());

  /**
   * If offline object detected, try to continue previous jon on online switch.
   */
  if (offlineObjectDescriptor?.activeSection) {
    const sectionToRetry: TSection = offlineObjectDescriptor.activeSection;

    offlineObjectDescriptor.activeSection = null;

    if (ini.section_exist(sectionToRetry)) {
      return sectionToRetry;
    }
  }

  const activeSectionCond: Optional<IBaseSchemeLogic> = readIniConditionList(ini, section, "active");

  if (activeSectionCond) {
    const section: Optional<TSection> = pickSectionFromCondList(registry.actor, object, activeSectionCond.condlist);

    // todo: Log also ini file path for simplicity of debug?
    assert(section, "'%s' => '%s', 'active' field has no conditionless else clause.", object.name(), section);

    return section;
  } else {
    return NIL;
  }
}

/**
 * Activate logics section for an object.
 * Respect resetting of shared generic schemes, game loading logic.
 * If no section provided (null), try to find any section from active smart terrain.
 * Emit activation signal for new scheme implementation.
 *
 * @param object - game object
 * @param ini - target object logics ini file
 * @param section - target section to activate
 * @param smartTerrainName - smart terrain name
 * @param isLoading - whether loading object on game load, `false` means manual scheme switch
 */
export function activateSchemeBySection(
  object: GameObject,
  ini: IniFile,
  section: Optional<TSection>,
  smartTerrainName: Optional<TName>,
  isLoading: boolean
): void {
  logger.info("Activate scheme: '%s' %s' %s'", object.name(), section, smartTerrainName);

  assertDefined(isLoading, "scheme/logic: activateBySection: loading field is null, true || false expected.");

  const state: IRegistryObjectState = registry.objects.get(object.id());

  if (!isLoading) {
    state.activationTime = time_global();
    state.activationGameTime = game.get_game_time();
  }

  if (section === NIL) {
    state.overrides = null;

    resetObjectGenericSchemesOnSectionSwitch(object, EScheme.NIL, NIL);

    state.activeSection = null;
    state.activeScheme = null;

    return;
  }

  // Assign scheme with smart terrain jobs.
  if (section === null) {
    const currentSmartTerrain: Optional<SmartTerrain> = getObjectTerrain(object);

    assert(currentSmartTerrain, "scheme/logic: activate_by_section: section is NIL && NPC !in smart.");

    section = getTerrainJobByObjectId(currentSmartTerrain, object.id())?.section as TSection;
  }

  const scheme: Optional<EScheme> = getSchemeFromSection(section);

  assert(scheme, "object '%s': unable to determine scheme name from section name '%s'", object.name(), section);
  assert(ini.section_exist(section), "'%s': activate_by_section section '%s' does not exist.", object.name(), section);

  state.overrides = getObjectConfigOverrides(ini, section, object);

  resetObjectGenericSchemesOnSectionSwitch(object, scheme, section);

  const schemeImplementation: Optional<TAbstractSchemeConstructor> = registry.schemes.get(scheme);

  assert(schemeImplementation, "Scheme '%s' is not registered.", scheme);

  // logger.format("Set active scheme: %s -> %s %s %s", scheme, object.name(), section, additional);

  schemeImplementation.activate(object, ini, scheme, section as TSection, smartTerrainName);

  state.activeSection = section;
  state.activeScheme = scheme;

  if (state.schemeType === ESchemeType.STALKER) {
    sendToNearestAccessibleVertex(object, object.level_vertex_id());
  }

  emitSchemeEvent(state[scheme] as IBaseSchemeState, ESchemeEvent.ACTIVATE, object, isLoading);
}

/**
 * Enable generic base schemes for object on logics activation.
 *
 * @param object - game object
 * @param ini - target object ini configuration
 * @param schemeType - type of object applied scheme
 * @param logicsSection - next active logic section, source of object logic
 */
export function enableObjectBaseSchemes(
  object: GameObject,
  ini: IniFile,
  schemeType: ESchemeType,
  logicsSection: TSection
): void {
  switch (schemeType) {
    case ESchemeType.STALKER: {
      registry.schemes.get(EScheme.DANGER).activate(object, ini, EScheme.DANGER, "danger");
      registry.schemes.get(EScheme.GATHER_ITEMS).activate(object, ini, EScheme.GATHER_ITEMS, "gather_items");

      const combatSection: TSection = readIniString(ini, logicsSection, "on_combat", false);

      registry.schemes.get(EScheme.COMBAT).activate(object, ini, EScheme.COMBAT, combatSection);

      initializeObjectInvulnerability(object);

      const infoSection: Optional<TSection> = readIniString(ini, logicsSection, "info", false);

      if (infoSection !== null) {
        initializeObjectInfo(object, ini, infoSection);
      }

      const hitSection: Optional<string> = readIniString(ini, logicsSection, "on_hit", false);

      if (hitSection !== null) {
        registry.schemes.get(EScheme.HIT).activate(object, ini, EScheme.HIT, hitSection);
      }

      const woundedSection: TSection = readIniString(ini, logicsSection, "wounded", false);

      // todo: null can be replaced with actual section.
      registry.schemes.get(EScheme.WOUNDED).activate(object, ini, EScheme.WOUNDED, woundedSection);
      registry.schemes.get(EScheme.ABUSE).activate(object, ini, EScheme.ABUSE, logicsSection);
      registry.schemes
        .get(EScheme.HELP_WOUNDED)
        .activate(object, ini, EScheme.HELP_WOUNDED, null as unknown as TSection);
      registry.schemes
        .get(EScheme.CORPSE_DETECTION)
        .activate(object, ini, EScheme.CORPSE_DETECTION, null as unknown as TSection);

      const meetSection: TSection = readIniString(ini, logicsSection, "meet", false);

      registry.schemes.get(EScheme.MEET).activate(object, ini, EScheme.MEET, meetSection);

      const deathSection: TSection = readIniString(ini, logicsSection, "on_death", false);

      registry.schemes.get(EScheme.DEATH).activate(object, ini, EScheme.DEATH, deathSection);
      // todo: null can be replaced with actual section.
      registry.schemes
        .get(EScheme.COMBAT_IGNORE)
        .activate(object, ini, EScheme.COMBAT_IGNORE, null as unknown as TSection);
      // todo: null can be replaced with actual section.
      registry.schemes.get(EScheme.REACH_TASK).activate(object, ini, EScheme.REACH_TASK, null as unknown as TSection);

      return;
    }

    case ESchemeType.MONSTER: {
      const combatSection: Optional<TSection> = readIniString(ini, logicsSection, "on_combat", false);

      if (combatSection !== null) {
        registry.schemes.get(EScheme.MOB_COMBAT).activate(object, ini, EScheme.MOB_COMBAT, combatSection);
      }

      const deathSection: Optional<TSection> = readIniString(ini, logicsSection, "on_death", false);

      if (deathSection !== null) {
        registry.schemes.get(EScheme.MOB_DEATH).activate(object, ini, EScheme.MOB_DEATH, deathSection);
      }

      initializeObjectInvulnerability(object);

      const hitSection: Optional<TSection> = readIniString(ini, logicsSection, "on_hit", false);

      if (hitSection !== null) {
        registry.schemes.get(EScheme.HIT).activate(object, ini, EScheme.HIT, hitSection);
      }

      registry.schemes
        .get(EScheme.COMBAT_IGNORE)
        .activate(object, ini, EScheme.COMBAT_IGNORE, null as unknown as TSection);

      return;
    }

    case ESchemeType.OBJECT: {
      const hitSection: Optional<TSection> = readIniString(ini, logicsSection, "on_hit", false);

      if (hitSection !== null) {
        registry.schemes.get(EScheme.PH_ON_HIT).activate(object, ini, EScheme.PH_ON_HIT, hitSection);
      }

      return;
    }

    case ESchemeType.HELICOPTER: {
      const hitSection: Optional<TSection> = readIniString(ini, logicsSection, "on_hit", false);

      if (hitSection !== null) {
        registry.schemes.get(EScheme.HIT).activate(object, ini, EScheme.HIT, hitSection);
      }

      return;
    }
  }
}

/**
 * Reset generic schemes on activation of new scheme.
 * Called after scheme switch to new section.
 *
 * @param object - game object
 * @param scheme - new active scheme type
 * @param section - new active section
 */
export function resetObjectGenericSchemesOnSectionSwitch(object: GameObject, scheme: EScheme, section: TSection): void {
  const state: IRegistryObjectState = registry.objects.get(object.id());

  switch (state.schemeType) {
    case ESchemeType.STALKER: {
      registry.schemes.get(EScheme.MEET).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.HELP_WOUNDED).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.CORPSE_DETECTION).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.ABUSE).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.WOUNDED).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.DEATH).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.DANGER).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.GATHER_ITEMS).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.COMBAT_IGNORE).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.HEAR).reset(object, scheme, state, section);

      updateObjectMapSpot(object, scheme, state, section);

      initializeObjectIgnoreThreshold(object, scheme, state, section);
      initializeObjectInvulnerability(object);
      initializeObjectGroup(object, state.ini, section);
      initializeObjectTakeItemsEnabledState(object, scheme, state, section);
      initializeObjectCanSelectWeaponState(object, scheme, state, section);
      ObjectRestrictionsManager.activateForObject(object, section);

      return;
    }

    case ESchemeType.MONSTER: {
      scriptReleaseMonster(object);

      if (object.clsid() === clsid.bloodsucker_s) {
        object.set_manual_invisibility(scheme !== EScheme.NIL);
      }

      registry.schemes.get(EScheme.COMBAT_IGNORE).reset(object, scheme, state, section);
      registry.schemes.get(EScheme.HEAR).reset(object, scheme, state, section);
      initializeObjectInvulnerability(object);
      ObjectRestrictionsManager.activateForObject(object, section);

      return;
    }

    case ESchemeType.OBJECT: {
      object.set_callback(callback.use_object, null);
      object.set_nonscript_usable(true);

      return;
    }
  }
}
