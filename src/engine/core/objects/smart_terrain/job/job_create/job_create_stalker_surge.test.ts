import * as path from "path";

import { describe, expect, it, jest } from "@jest/globals";

import { registerZone } from "@/engine/core/database";
import { SmartTerrain, SmartTerrainControl } from "@/engine/core/objects/smart_terrain";
import { EJobPathType, EJobType } from "@/engine/core/objects/smart_terrain/job";
import { createStalkerSurgeJobs } from "@/engine/core/objects/smart_terrain/job/job_create/job_create_stalker_surge";
import { jobPreconditionSurge } from "@/engine/core/objects/smart_terrain/job/job_precondition";
import { range } from "@/engine/core/utils/number";
import { StringBuilder } from "@/engine/core/utils/string";
import { GameObject } from "@/engine/lib/types";
import { MockSmartTerrain, readInGameTestLtx } from "@/fixtures/engine";
import { MockGameObject } from "@/fixtures/xray";

describe("jobs_general should correctly generate stalkers surge jobs", () => {
  it("should correctly generate surge jobs for stalkers when no patrols exist", async () => {
    const terrain: SmartTerrain = MockSmartTerrain.mock("test_surge_paths_smart");

    const [jobs, builder] = createStalkerSurgeJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe("");
    expect(jobs).toEqualLuaArrays([]);
  });

  it("should correctly generate surge jobs for stalkers when patrols exist", async () => {
    const surgeJobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_surge.ltx")
    );
    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");

    terrain.defendRestrictor = null;

    const [jobs, builder] = createStalkerSurgeJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(surgeJobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3, 1).map((it) => ({
        preconditionFunction: jobPreconditionSurge,
        preconditionParameters: {},
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: `logic@test_smart_surge_${it}_walk`,
        type: EJobType.SURGE,
        priority: 50,
      }))
    );
  });

  it("should correctly generate surge jobs for stalkers when patrols exist with restrictors", async () => {
    const surgeJobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_surge.restrictors.ltx")
    );
    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");

    terrain.defendRestrictor = "def_restrictor_test";
    terrain.smartTerrainActorControl = { ignoreZone: "test_ignore_zone" } as SmartTerrainControl;

    const [jobs, builder] = createStalkerSurgeJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(surgeJobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3, 1).map((it) => ({
        preconditionFunction: jobPreconditionSurge,
        preconditionParameters: {},
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: `logic@test_smart_surge_${it}_walk`,
        type: EJobType.SURGE,
        priority: 50,
      }))
    );
  });

  it("should correctly generate surge jobs for stalkers when patrols exist, when in restrictor", async () => {
    const surgeJobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_surge.ignore.ltx")
    );
    const terrain: SmartTerrain = MockSmartTerrain.mock("test_smart");
    const object: GameObject = MockGameObject.mock({ name: "some_restrictor" });

    jest.spyOn(object, "inside").mockImplementation(() => true);

    registerZone(object);

    terrain.defendRestrictor = "def_restrictor_test";
    terrain.smartTerrainActorControl = { ignoreZone: "some_restrictor" } as SmartTerrainControl;

    const [jobs, builder] = createStalkerSurgeJobs(terrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(surgeJobsLtx);
    expect(jobs).toEqualLuaArrays(
      range(3, 1).map((it) => ({
        preconditionFunction: jobPreconditionSurge,
        preconditionParameters: {},
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: `logic@test_smart_surge_${it}_walk`,
        type: EJobType.SURGE,
        priority: 50,
      }))
    );
  });
});
