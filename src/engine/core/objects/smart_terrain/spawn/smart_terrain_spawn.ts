import { game } from "xray16";

import { registry } from "@/engine/core/database";
import {
  createSimulationSquad,
  getSimulationTerrainAssignedSquadsCount,
} from "@/engine/core/managers/simulation/utils";
import type { SmartTerrain } from "@/engine/core/objects/smart_terrain/SmartTerrain";
import { smartTerrainConfig } from "@/engine/core/objects/smart_terrain/SmartTerrainConfig";
import { Squad } from "@/engine/core/objects/squad";
import { abort } from "@/engine/core/utils/assertion";
import { parseConditionsList, parseStringsList, pickSectionFromCondList, readIniString } from "@/engine/core/utils/ini";
import { TRUE } from "@/engine/lib/constants/words";
import { LuaArray, Optional, TCount, Time, TSection } from "@/engine/lib/types";

/**
 * Apply respawn configuration for provided smart terrain.
 * Based on provided section tries to read list of squad sections to get exact targets and count to spawn.
 *
 * @param terrain - target smart terrain to set configuration for
 * @param section - section in smart terrain ini configuration file to read spawn information from
 */
export function applySmartTerrainRespawnSectionsConfig(terrain: SmartTerrain, section: TSection): void {
  terrain.isRespawnPoint = true;
  terrain.spawnSquadsConfiguration = new LuaTable();
  terrain.spawnedSquadsList = new LuaTable();

  if (!terrain.ini.section_exist(section)) {
    abort("Could not find respawn configuration section '%s' for '%s'.", section, terrain.name());
  }

  const parametersCount: TCount = terrain.ini.line_count(section);

  if (parametersCount === 0) {
    abort("Wrong smart terrain respawn configuration section '%s' - empty for '%s'.", section, terrain.name());
  }

  for (const it of $range(0, parametersCount - 1)) {
    const [, sectionName] = terrain.ini.r_line(section, it, "", "");

    // Validate respawn section line.
    if (!terrain.ini.section_exist(sectionName)) {
      abort(
        "Wrong smart terrain respawn configuration section '%s' line '%s' - there is no such section.",
        section,
        sectionName
      );
    }

    const squadsCount: Optional<string> = readIniString(terrain.ini, sectionName, "spawn_num", false);
    const squadsToSpawn: Optional<string> = readIniString(terrain.ini, sectionName, "spawn_squads", false);

    // Validate each line to be defined.
    if (squadsToSpawn === null) {
      abort(
        "Wrong smart terrain respawn configuration section '%s' line 'spawn_squads' in '%s' is not defined.",
        section,
        sectionName
      );
    } else if (squadsCount === null) {
      abort(
        "Wrong smart terrain respawn configuration section '%s' line 'spawn_num' in '%s' is not defined.",
        section,
        sectionName
      );
    }

    terrain.spawnedSquadsList.set(sectionName, { num: 0 });
    terrain.spawnSquadsConfiguration.set(sectionName, {
      num: parseConditionsList(squadsCount),
      squads: parseStringsList(squadsToSpawn),
    });
  }
}

/**
 * Respawn random squad section from smart terrain spawn config.
 * Finds random one available to spawn and assigns it to the terrain.
 *
 * @param terrain - target smart terrain to spawn squad in
 * @returns spawned squad or null if cannot spawn any
 */
export function respawnSmartTerrainSquad(terrain: SmartTerrain): Optional<Squad> {
  // logger.format("Respawn squad in smart: %s", this.name());

  const availableSections: LuaArray<TSection> = new LuaTable();

  // Pick section that can be used for spawn and have available spots.
  for (const [section, descriptor] of terrain.spawnSquadsConfiguration) {
    if (
      tonumber(pickSectionFromCondList(registry.actor, null, descriptor.num))! >
      terrain.spawnedSquadsList.get(section).num
    ) {
      table.insert(availableSections, section);
    }
  }

  // No available spawn spots.
  if (availableSections.length() === 0) {
    return null;
  }

  const spawnSection: TSection = table.random(availableSections)[1];
  const squadSection: TSection = table.random(terrain.spawnSquadsConfiguration.get(spawnSection).squads)[1];

  const squad: Squad = createSimulationSquad(terrain, squadSection);

  squad.respawnPointId = terrain.id;
  squad.respawnPointSection = spawnSection;

  terrain.spawnedSquadsList.get(spawnSection).num += 1;

  return squad;
}

/**
 * @param terrain - target smart terrain to check spawn availability for
 * @returns whether smart terrain squad spawn operation can be performed
 */
export function canRespawnSmartTerrainSquad(terrain: SmartTerrain): boolean {
  const now: Time = game.get_game_time();

  // Throttle respawn attempts period.
  // Memoize `false` state for `idle` period of time.
  if (
    terrain.lastRespawnUpdatedAt !== null &&
    now.diffSec(terrain.lastRespawnUpdatedAt) <= smartTerrainConfig.RESPAWN_IDLE
  ) {
    return false;
  } else {
    terrain.lastRespawnUpdatedAt = now;
  }

  return (
    pickSectionFromCondList(registry.actor, terrain, terrain.isSimulationAvailableConditionList) === TRUE &&
    getSimulationTerrainAssignedSquadsCount(terrain.id) < terrain.maxStayingSquadsCount &&
    registry.actorServer.position.distance_to_sqr(terrain.position) > smartTerrainConfig.RESPAWN_RADIUS_RESTRICTION_SQR
  );
}
