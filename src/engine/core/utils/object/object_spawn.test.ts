import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { level } from "xray16";

import { registerOfflineObject, registerSimulator, registry } from "@/engine/core/database";
import { setupSpawnedObjectPosition } from "@/engine/core/utils/object/object_spawn";
import { GameObject, ServerCreatureObject, Vector } from "@/engine/lib/types";
import { mockRegisteredActor, MockSmartTerrain, resetRegistry } from "@/fixtures/engine";
import { MockAlifeMonsterBase, MockGameObject, MockVector } from "@/fixtures/xray";

describe("setupSpawnedObjectPosition util", () => {
  beforeEach(() => {
    resetRegistry();
    registerSimulator();
  });

  it("should handle sync with defined spawn vertex", () => {
    const serverObject: ServerCreatureObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const position: Vector = MockVector.mock();

    registry.spawnedVertexes.set(object.id(), 400);
    jest.spyOn(level, "vertex_position").mockImplementationOnce(() => position);

    setupSpawnedObjectPosition(object, serverObject.m_smart_terrain_id);

    expect(object.set_npc_position).toHaveBeenCalledWith(position);
    expect(level.vertex_position).toHaveBeenCalledWith(400);
    expect(registry.spawnedVertexes.length()).toBe(0);
  });

  it("should handle sync with existing offline state", () => {
    const serverObject: ServerCreatureObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const position: Vector = MockVector.mock();

    registerOfflineObject(object.id(), { levelVertexId: 500, activeSection: null });

    jest.spyOn(level, "vertex_position").mockImplementationOnce(() => position);

    setupSpawnedObjectPosition(object, serverObject.m_smart_terrain_id);

    expect(level.vertex_position).toHaveBeenCalledWith(500);
    expect(object.set_npc_position).toHaveBeenCalledWith(position);
  });

  it("should handle sync when have assigned job", () => {
    mockRegisteredActor();

    const terrain: MockSmartTerrain = MockSmartTerrain.mockRegistered();
    const serverObject: ServerCreatureObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });

    serverObject.m_smart_terrain_id = terrain.id;

    terrain.register_npc(serverObject);
    setupSpawnedObjectPosition(object, serverObject.m_smart_terrain_id);

    expect(object.set_npc_position).toHaveBeenCalledTimes(1);
    expect(object.set_npc_position).toHaveBeenCalledWith(
      terrain.objectJobDescriptors.get(object.id()).job?.alifeTask?.position()
    );
  });
});
