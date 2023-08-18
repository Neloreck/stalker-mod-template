import * as path from "path";

import { describe, expect, it } from "@jest/globals";

import { registerZone } from "@/engine/core/database";
import { SmartTerrain, SmartTerrainControl } from "@/engine/core/objects";
import { EJobPathType, EJobType } from "@/engine/core/utils/job";
import { createStalkerGuardJobs } from "@/engine/core/utils/job/job_create/job_create_stalker_guard";
import { jobPreconditionGuard, jobPreconditionGuardFollower } from "@/engine/core/utils/job/job_precondition";
import { StringBuilder } from "@/engine/core/utils/string";
import { mockSmartTerrain, readInGameTestLtx } from "@/fixtures/engine";
import { mockClientGameObject } from "@/fixtures/xray";

describe("should correctly generate stalker guard jobs", () => {
  it("should correctly generate default guard jobs with no collector patrols", async () => {
    const smartTerrain: SmartTerrain = mockSmartTerrain("empty_smart");

    const [jobs, builder] = createStalkerGuardJobs(smartTerrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe("");
    expect(jobs).toEqualLuaArrays([]);
  });

  it("should correctly generate default guard jobs with test smart", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_guard.default.ltx")
    );

    const smartTerrain: SmartTerrain = mockSmartTerrain();
    const [jobs, builder] = createStalkerGuardJobs(smartTerrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays([
      {
        preconditionFunction: jobPreconditionGuard,
        preconditionParameters: {
          wayName: "test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_guard_1_walk",
        priority: 25,
        type: EJobType.GUARD,
      },
      {
        preconditionFunction: jobPreconditionGuardFollower,
        preconditionParameters: {
          nextDesiredJob: "logic@test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@follower_test_smart_guard_1_walk",
        priority: 24,
        type: EJobType.GUARD_FOLLOWER,
      },
    ]);
  });

  it("should correctly generate default guard jobs with restrictor", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_guard.restrictor.ltx")
    );

    const smartTerrain: SmartTerrain = mockSmartTerrain();

    smartTerrain.defendRestrictor = "test_defend_restrictor";

    const [jobs, builder] = createStalkerGuardJobs(smartTerrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays([
      {
        preconditionFunction: jobPreconditionGuard,
        preconditionParameters: {
          wayName: "test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_guard_1_walk",
        priority: 25,
        type: EJobType.GUARD,
      },
      {
        preconditionFunction: jobPreconditionGuardFollower,
        preconditionParameters: {
          nextDesiredJob: "logic@test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@follower_test_smart_guard_1_walk",
        priority: 24,
        type: EJobType.GUARD_FOLLOWER,
      },
    ]);
  });

  it("should correctly generate default guard jobs with ignore restrictor", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_guard.ignore.ltx")
    );

    const smartTerrain: SmartTerrain = mockSmartTerrain();

    smartTerrain.defendRestrictor = "test_defend_restrictor";
    smartTerrain.smartTerrainActorControl = { ignoreZone: "some_restrictor" } as SmartTerrainControl;

    registerZone(mockClientGameObject({ name: () => "some_restrictor", inside: () => true }));

    const [jobs, builder] = createStalkerGuardJobs(smartTerrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays([
      {
        preconditionFunction: jobPreconditionGuard,
        preconditionParameters: {
          wayName: "test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_guard_1_walk",
        priority: 25,
        type: EJobType.GUARD,
      },
      {
        preconditionFunction: jobPreconditionGuardFollower,
        preconditionParameters: {
          nextDesiredJob: "logic@test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@follower_test_smart_guard_1_walk",
        priority: 24,
        type: EJobType.GUARD_FOLLOWER,
      },
    ]);
  });

  it("should correctly generate default guard jobs with invulnerable state", async () => {
    const jobsLtx: string = await readInGameTestLtx(
      path.resolve(__dirname, "__test__", "job_create_stalker_guard.invulnerable.ltx")
    );

    const smartTerrain: SmartTerrain = mockSmartTerrain();

    smartTerrain.defendRestrictor = "test_defend_restrictor";
    smartTerrain.smartTerrainActorControl = { ignoreZone: "some_restrictor" } as SmartTerrainControl;
    smartTerrain.safeRestrictor = "safe_restrictor_test";

    registerZone(mockClientGameObject({ name: () => "safe_restrictor_test", inside: () => true }));

    const [jobs, builder] = createStalkerGuardJobs(smartTerrain, new LuaTable(), new StringBuilder());

    expect(builder.build()).toBe(jobsLtx);
    expect(jobs).toEqualLuaArrays([
      {
        preconditionFunction: jobPreconditionGuard,
        preconditionParameters: {
          wayName: "test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@test_smart_guard_1_walk",
        priority: 25,
        type: EJobType.GUARD,
      },
      {
        preconditionFunction: jobPreconditionGuardFollower,
        preconditionParameters: {
          nextDesiredJob: "logic@test_smart_guard_1_walk",
        },
        isMonsterJob: false,
        pathType: EJobPathType.PATH,
        section: "logic@follower_test_smart_guard_1_walk",
        priority: 24,
        type: EJobType.GUARD_FOLLOWER,
      },
    ]);
  });
});
