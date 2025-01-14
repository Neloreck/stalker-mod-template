import { game } from "xray16";

import { getManager, registry } from "@/engine/core/database";
import { AbstractManager } from "@/engine/core/managers/abstract";
import { dialogConfig } from "@/engine/core/managers/dialogs/DialogConfig";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { TItemUpgradeBranch } from "@/engine/core/managers/upgrades/item_upgrades_types";
import { ITEM_UPGRADES, STALKER_UPGRADE_INFO, upgradesConfig } from "@/engine/core/managers/upgrades/UpgradesConfig";
import { getRepairPrice } from "@/engine/core/managers/upgrades/utils";
import {
  parseConditionsList,
  parseStringsList,
  pickSectionFromCondList,
  TConditionList,
} from "@/engine/core/utils/ini";
import { FALSE, TRUE } from "@/engine/lib/constants/words";
import {
  AnyObject,
  GameObject,
  LuaArray,
  Optional,
  TCount,
  TLabel,
  TName,
  TNotCastedBoolean,
  TRate,
} from "@/engine/lib/types";
import { TSection } from "@/engine/lib/types/scheme";

/**
 * Manager to handle upgrading of items with mechanics logics.
 */
export class UpgradesManager extends AbstractManager {
  public override initialize(): void {
    const eventsManager: EventsManager = getManager(EventsManager);

    eventsManager.registerCallback(EGameEvent.DUMP_LUA_DATA, this.onDebugDump, this);
  }

  public override destroy(): void {
    const eventsManager: EventsManager = getManager(EventsManager);

    eventsManager.unregisterCallback(EGameEvent.DUMP_LUA_DATA, this.onDebugDump);
  }

  /**
   * @param hints - list of hints to set as current upgrading values
   */
  public setCurrentHints(hints: Optional<LuaArray<TLabel>>): void {
    upgradesConfig.UPGRADES_HINTS = hints;
  }

  /**
   * @param rate - discount rate [0...1] for current upgrading operations
   */
  public setCurrentPriceDiscount(rate: TRate): void {
    upgradesConfig.PRICE_DISCOUNT_RATE = rate;
  }

  /**
   * Gets repair service payment from the actor.
   *
   * @param section - section of the item to get price for
   * @param condition - current condition state of the item object
   */
  public getRepairItemPayment(section: TSection, condition: TRate): void {
    registry.actor.give_money(-getRepairPrice(section, condition));
  }

  /**
   * @param name - ?
   * @param section - upgrade section
   * @param loading - not casted value, whether game is loading
   */
  public getUpgradeItemPayment(name: TName, section: TSection, loading: TNotCastedBoolean): void {
    if (loading === 0) {
      registry.actor.give_money(
        math.floor(ITEM_UPGRADES.r_u32(section, "cost") * upgradesConfig.PRICE_DISCOUNT_RATE) * -1
      );
    }
  }

  /**
   * @param mechanicName - name of the mechanic
   * @param possibilities - condition list to switch possibilities logics
   * @returns label describing upgrade possibilities
   */
  public getPossibilitiesLabel(mechanicName: TName, possibilities: TConditionList): TLabel {
    let hintsLabel: TLabel = "";

    if (upgradesConfig.UPGRADES_HINTS) {
      for (const [, caption] of upgradesConfig.UPGRADES_HINTS) {
        hintsLabel += `\\n - ${game.translate_string(caption)}`;
      }
    }

    return hintsLabel === "" ? " - add hints for this upgrade" : hintsLabel;
  }

  /**
   * @param section - item section to check
   * @param mechanicName - name of the mechanic to verify
   * @returns whether mechanic can upgrade item of provided section
   */
  public canUpgradeItem(section: TSection, mechanicName: TName): boolean {
    upgradesConfig.CURRENT_MECHANIC_NAME = mechanicName;

    this.setupDiscounts();

    return (
      // Check if it is not `repair only` mechanic type.
      !STALKER_UPGRADE_INFO.line_exist(mechanicName, "he_upgrade_nothing") &&
      // Check if it can upgrade specific item.
      STALKER_UPGRADE_INFO.line_exist(mechanicName, section)
    );
  }

  /**
   * Setup discount value based on current mechanic.
   */
  public setupDiscounts(): void {
    if (STALKER_UPGRADE_INFO.line_exist(upgradesConfig.CURRENT_MECHANIC_NAME, "discount_condlist")) {
      const data: string = STALKER_UPGRADE_INFO.r_string(upgradesConfig.CURRENT_MECHANIC_NAME, "discount_condlist");

      pickSectionFromCondList(registry.actor, null, parseConditionsList(data));
    }
  }

  /**
   * todo: Description.
   */
  public getPreconditionFunctorA(name: TName, section: TSection): TItemUpgradeBranch {
    if (STALKER_UPGRADE_INFO.line_exist(upgradesConfig.CURRENT_MECHANIC_NAME + "_upgr", section)) {
      const param: string = STALKER_UPGRADE_INFO.r_string(upgradesConfig.CURRENT_MECHANIC_NAME + "_upgr", section);

      if (param !== null) {
        if (param === FALSE) {
          return 1;
        } else if (param !== TRUE) {
          const possibilitiesConditionList: TConditionList = parseConditionsList(param);
          const possibility: Optional<TSection> = pickSectionFromCondList(
            registry.actor,
            dialogConfig.ACTIVE_SPEAKER,
            possibilitiesConditionList
          );

          if (!possibility || possibility === FALSE) {
            return 2;
          }
        }
      }
    }

    if (registry.actor !== null) {
      const price: TCount = math.floor(ITEM_UPGRADES.r_u32(section, "cost") * upgradesConfig.PRICE_DISCOUNT_RATE);
      const cash: TCount = registry.actor.money();

      if (cash < price) {
        return 2;
      }
    }

    return 0;
  }

  /**
   * todo: Description.
   */
  public getPreRequirementsFunctorA(name: TName, section: TSection): TLabel {
    const actor: GameObject = registry.actor;
    let label: TLabel = "";

    if (STALKER_UPGRADE_INFO.line_exist(upgradesConfig.CURRENT_MECHANIC_NAME + "_upgr", section)) {
      const param: string = STALKER_UPGRADE_INFO.r_string(upgradesConfig.CURRENT_MECHANIC_NAME + "_upgr", section);

      if (param !== null) {
        if (param === FALSE) {
          return label;
        } else {
          upgradesConfig.UPGRADES_HINTS = null;

          const possibilitiesConditionList: TConditionList = parseConditionsList(param);
          const possibility: Optional<TSection> = pickSectionFromCondList(
            actor,
            dialogConfig.ACTIVE_SPEAKER,
            possibilitiesConditionList
          );

          if (!possibility || possibility === FALSE) {
            label =
              label + this.getPossibilitiesLabel(upgradesConfig.CURRENT_MECHANIC_NAME, possibilitiesConditionList);
          }
        }
      }
    }

    if (actor !== null) {
      const price: TCount = math.floor(ITEM_UPGRADES.r_u32(section, "cost") * upgradesConfig.PRICE_DISCOUNT_RATE);

      if (actor.money() < price) {
        return string.format("%s\\n - %s", label, game.translate_string("st_upgr_enough_money"));
      }
    }

    return label;
  }

  /**
   * todo: Description.
   */
  public getPropertyFunctorA(data: string, upgrade: TName): TLabel {
    const propertyName: TName = ITEM_UPGRADES.r_string(upgrade, "name");
    const translatedPropertyName: TLabel = game.translate_string(propertyName);

    const sections: LuaArray<TSection> = parseStringsList(data);
    const sectionsCount: TCount = sections.length();

    if (sectionsCount === 0) {
      return "";
    }

    let value: string = "0";
    let sum: TCount = 0;

    for (const it of $range(1, sectionsCount)) {
      if (!ITEM_UPGRADES.line_exist(sections.get(it), "value") || !ITEM_UPGRADES.r_string(sections.get(it), "value")) {
        return translatedPropertyName;
      }

      value = ITEM_UPGRADES.r_string(sections.get(it), "value");
      if (upgrade === "prop_night_vision") {
        sum = tonumber(value)!;
      } else {
        sum += tonumber(value)!;
      }
    }

    value = sum < 0 ? tostring(sum) : "+" + sum;

    if (upgrade === "prop_ammo_size" || upgrade === "prop_artefact") {
      return translatedPropertyName + " " + value;
    } else if (upgrade === "prop_restore_bleeding" || upgrade === "prop_restore_health" || upgrade === "prop_power") {
      if (upgrade === "prop_power") {
        value = "+" + tonumber(value)! * 2;
      }

      // --        const str = string.format("%s %4.1f", t_prorerty_name, value)
      // --        return str
      return translatedPropertyName + " " + value;
    } else if (upgrade === "prop_tonnage" || upgrade === "prop_weightoutfit" || upgrade === "prop_weight") {
      return string.format("%s %5.2f %s", translatedPropertyName, value, game.translate_string("st_kg"));
    } else if (upgrade === "prop_night_vision") {
      return tonumber(value) === 1
        ? translatedPropertyName
        : game.translate_string(propertyName + "_" + tonumber(value));
    } else if (upgrade === "prop_no_buck" || upgrade === "prop_autofire") {
      return translatedPropertyName;
    }

    return translatedPropertyName + " " + value + "%";
  }

  /**
   * Handle dump data event.
   *
   * @param data - data to dump into file
   */
  public onDebugDump(data: AnyObject): AnyObject {
    data[this.constructor.name] = {
      upgradesConfig: upgradesConfig,
    };

    return data;
  }
}
