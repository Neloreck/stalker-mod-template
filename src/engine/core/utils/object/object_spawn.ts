import { level } from "xray16";

import { registry } from "@/engine/core/database";
import { ISmartTerrainJobDescriptor, SmartTerrain } from "@/engine/core/objects/smart_terrain";
import { assert } from "@/engine/core/utils/assertion";
import { MAX_ALIFE_ID } from "@/engine/lib/constants/memory";
import { ALifeSmartTerrainTask, GameObject, Optional, TNumberId } from "@/engine/lib/types";

/**
 * Handle object position sync when net spawn event is happening.
 *
 * @param object - game object
 * @param terrainId - target object linked smart terrain id
 */
export function setupSpawnedObjectPosition(object: GameObject, terrainId: Optional<TNumberId> = null): void {
  const objectId: TNumberId = object.id();

  if (registry.spawnedVertexes.has(objectId)) {
    object.set_npc_position(level.vertex_position(registry.spawnedVertexes.get(objectId)));
    registry.spawnedVertexes.delete(objectId);
  } else if (registry.offlineObjects.get(objectId)?.levelVertexId) {
    object.set_npc_position(level.vertex_position(registry.offlineObjects.get(objectId).levelVertexId as TNumberId));
  } else if (terrainId && terrainId !== MAX_ALIFE_ID) {
    const terrain: SmartTerrain = registry.simulator.object<SmartTerrain>(terrainId)!;

    if (!terrain.arrivingObjects.get(objectId)) {
      const job: Optional<ISmartTerrainJobDescriptor> = terrain.objectJobDescriptors.get(objectId)?.job;
      const task: ALifeSmartTerrainTask = job?.alifeTask as ALifeSmartTerrainTask;

      assert(
        task,
        "Expected terrain task to exist when spawning in smart terrain: '%s' in '%s', job: '%s'.",
        object.name(),
        terrain.name(),
        job?.section
      );

      object.set_npc_position(task.position());
    }
  }
}
