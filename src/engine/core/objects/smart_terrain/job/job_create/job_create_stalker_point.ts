import { EJobPathType, EJobType, TSmartTerrainJobsList } from "@/engine/core/objects/smart_terrain/job/job_types";
import type { SmartTerrain } from "@/engine/core/objects/smart_terrain/SmartTerrain";
import { smartTerrainConfig } from "@/engine/core/objects/smart_terrain/SmartTerrainConfig";
import { StringBuilder } from "@/engine/core/utils/string";
import { TName } from "@/engine/lib/types";

/**
 * Create point jobs for stalkers in smart terrain.
 *
 * @param smartTerrain - smart terrain to create default animpoint jobs for
 * @param jobs - list of smart terrain jobs to insert into
 * @param builder - builder of large ltx file
 * @returns cover jobs list and updated string builder
 */
export function createStalkerPointJobs(
  smartTerrain: SmartTerrain,
  jobs: TSmartTerrainJobsList,
  builder: StringBuilder
): LuaMultiReturn<[TSmartTerrainJobsList, StringBuilder]> {
  const smartTerrainName: TName = smartTerrain.name();

  for (const index of $range(1, smartTerrainConfig.JOBS.STALKER_POINT.COUNT)) {
    const patrolName: TName = string.format("%s_point_%s", smartTerrainName, index);

    table.insert(jobs, {
      type: EJobType.POINT,
      isMonsterJob: false,
      priority: smartTerrainConfig.JOBS.STALKER_POINT.PRIORITY,
      section: string.format("logic@%s", patrolName),
      pathType: EJobPathType.POINT,
    });

    builder.append(
      string.format(
        `[logic@%s]
active = cover@%s
[cover@%s]
meet = meet@generic_lager
smart = %s
radius_min = %s
radius_max = %s
use_attack_direction = false
anim = {!npc_community(zombied)} sit, guard
`,
        patrolName,
        patrolName,
        patrolName,
        smartTerrainName,
        smartTerrainConfig.JOBS.STALKER_POINT.MIN_RADIUS,
        smartTerrainConfig.JOBS.STALKER_POINT.MAX_RADIUS
      )
    );

    if (smartTerrain.defendRestrictor !== null) {
      builder.append(string.format("out_restr = %s\n", smartTerrain.defendRestrictor));
    }

    if (smartTerrain.smartTerrainActorControl !== null && smartTerrain.smartTerrainActorControl.ignoreZone !== null) {
      // todo: Probably smart.base_on_actor_control.ignore_zone should be injected? Original issue.
      builder.append(
        `combat_ignore_cond = {=npc_in_zone(smart.base_on_actor_control.ignore_zone)} true
combat_ignore_keep_when_attacked = true
`
      );
    }
  }

  return $multi(jobs, builder);
}
