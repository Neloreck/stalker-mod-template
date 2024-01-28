import * as path from "path";

import { describe, expect, it, jest } from "@jest/globals";

import { registerZone } from "@/engine/core/database";
import { SmartTerrain, SmartTerrainControl } from "@/engine/core/objects/smart_terrain";
import { EJobPathType, EJobType } from "@/engine/core/objects/smart_terrain/job";
import { createStalkerPatrolJobs } from "@/engine/core/objects/smart_terrain/job/job_create/job_create_stalker_patrol";
import { jobPreconditionPatrol } from "@/engine/core/objects/smart_terrain/job/job_precondition";
import { range } from "@/engine/core/utils/number";
import { StringBuilder } from "@/engine/core/utils/string";
import { GameObject } from "@/engine/lib/types";
import { MockSmartTerrain, readInGameTestLtx } from "@/fixtures/engine";
import { MockGameObject } from "@/fixtures/xray";

describe("should correctly generate stalker patrol jobs", () => {
  it("should correctly generate default patrol jobs with no patrols", async () => {
    const terrain: SmartTerrain = MockSmartTerrain.mock("empty_smart");
    const [jobs, builder] = createStalkerPatrolJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe("");
    expect(jobs).toEqualLuaArrays([]);
  });

  it("should correctly generate default patrol jobs with test smart", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_patrol.default.ltx")
    );

    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");
    const [jobs, builder] = createStalkerPatrolJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3).map(() => ({
        preconditionFunction: jobPreconditionPatrol,
        preconditionParameters: {
          wayName: "test_smart_patrol_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_patrol_1_walk",
        type: EJobType.PATROL,
        priority: 20,
      }))
    );
  });

  it("should correctly generate default patrol jobs with restrictor", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_patrol.restrictor.ltx")
    );

    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");

    terrain.defendRestrictor = "test_defend_restrictor";

    const [jobs, builder] = createStalkerPatrolJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3).map(() => ({
        preconditionFunction: jobPreconditionPatrol,
        preconditionParameters: {
          wayName: "test_smart_patrol_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_patrol_1_walk",
        type: EJobType.PATROL,
        priority: 20,
      }))
    );
  });

  it("should correctly generate default patrol jobs with ignore restrictor", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_patrol.ignore.ltx")
    );

    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");

    terrain.defendRestrictor = "test_defend_restrictor";
    terrain.smartTerrainActorControl = { ignoreZone: "some_restrictor" } as SmartTerrainControl;

    const object: GameObject = MockGameObject.mock({ name: "some_restrictor" });

    jest.spyOn(object, "inside").mockImplementation(() => true);

    registerZone(object);

    jest.spyOn(terrain, "name").mockImplementation(() => "test_smart");

    const [jobs, builder] = createStalkerPatrolJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3).map(() => ({
        preconditionFunction: jobPreconditionPatrol,
        preconditionParameters: {
          wayName: "test_smart_patrol_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_patrol_1_walk",
        type: EJobType.PATROL,
        priority: 20,
      }))
    );
  });

  it("should correctly generate default patrol jobs with invulnerable state", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_patrol.invulnerable.ltx")
    );

    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");

    terrain.defendRestrictor = "test_defend_restrictor";
    terrain.smartTerrainActorControl = { ignoreZone: "some_restrictor" } as SmartTerrainControl;
    terrain.safeRestrictor = "safe_restrictor_test";

    const object: GameObject = MockGameObject.mock({ name: "safe_restrictor_test" });

    jest.spyOn(object, "inside").mockImplementation(() => true);

    registerZone(object);

    const [jobs, builder] = createStalkerPatrolJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3).map(() => ({
        preconditionFunction: jobPreconditionPatrol,
        preconditionParameters: {
          wayName: "test_smart_patrol_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_patrol_1_walk",
        type: EJobType.PATROL,
        priority: 20,
      }))
    );
  });
});
