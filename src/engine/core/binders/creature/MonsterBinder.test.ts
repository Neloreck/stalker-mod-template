import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { callback, clsid } from "xray16";

import { MonsterBinder } from "@/engine/core/binders/creature/MonsterBinder";
import {
  getManager,
  IBaseSchemeState,
  ILogicsOverrides,
  IRegistryObjectState,
  registerObject,
  registerOfflineObject,
  registerSimulator,
  registry,
} from "@/engine/core/database";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { SoundManager } from "@/engine/core/managers/sounds";
import { Squad } from "@/engine/core/objects/squad";
import { updateMonsterSquadAction } from "@/engine/core/objects/squad/update";
import { SchemeHear } from "@/engine/core/schemes/shared/hear";
import { hasInfoPortion } from "@/engine/core/utils/info_portion";
import { parseConditionsList } from "@/engine/core/utils/ini";
import { setupSpawnedObjectPosition } from "@/engine/core/utils/object";
import {
  emitSchemeEvent,
  scriptReleaseMonster,
  setupObjectLogicsOnSpawn,
  trySwitchToAnotherSection,
} from "@/engine/core/utils/scheme";
import { ACTOR_ID } from "@/engine/lib/constants/ids";
import { X_VECTOR, ZERO_VECTOR } from "@/engine/lib/constants/vectors";
import { EScheme, ESchemeEvent, ESchemeType, GameObject, ServerMonsterBaseObject } from "@/engine/lib/types";
import { mockRegisteredActor, mockSchemeState, MockSquad, resetRegistry } from "@/fixtures/engine";
import { resetFunctionMock } from "@/fixtures/jest";
import {
  EPacketDataType,
  MockAlifeMonsterBase,
  MockCTime,
  MockGameObject,
  MockNetProcessor,
  MockObjectBinder,
} from "@/fixtures/xray";

jest.mock("@/engine/core/utils/scheme");
jest.mock("@/engine/core/objects/squad/update");
jest.mock("@/engine/core/utils/object");

describe("MonsterBinder", () => {
  beforeEach(() => {
    resetRegistry();
    registerSimulator();

    resetFunctionMock(emitSchemeEvent);
    resetFunctionMock(trySwitchToAnotherSection);
    resetFunctionMock(setupObjectLogicsOnSpawn);
    resetFunctionMock(scriptReleaseMonster);
    resetFunctionMock(updateMonsterSquadAction);
    resetFunctionMock(setupSpawnedObjectPosition);
  });

  it("should correctly initialize", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: MonsterBinder = new MonsterBinder(object);

    expect(binder.isLoaded).toBe(false);
    expect(binder.state).toBeUndefined();
  });

  it("should correctly re-init", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: MonsterBinder = new MonsterBinder(object);

    binder.reinit();

    expect(registry.objects.get(object.id())).toEqual({ object });
    expect(binder.state).toBe(registry.objects.get(object.id()));

    expect(object.set_callback).toHaveBeenCalledTimes(4);
    expect(object.set_callback).toHaveBeenCalledWith(callback.patrol_path_in_point, binder.onWaypoint, binder);
    expect(object.set_callback).toHaveBeenCalledWith(callback.hit, binder.onHit, binder);
    expect(object.set_callback).toHaveBeenCalledWith(callback.death, binder.onDeath, binder);
    expect(object.set_callback).toHaveBeenCalledWith(callback.sound, binder.onHearSound, binder);
  });

  it("should handle going online/offline when spawn check is falsy", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    (binder as unknown as MockObjectBinder).canSpawn = false;

    expect(binder.net_spawn(serverObject)).toBe(false);

    expect(setupObjectLogicsOnSpawn).toHaveBeenCalledTimes(0);
    expect(registry.objects.length()).toBe(0);
  });

  it("should handle going online/offline when released", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();

    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    registry.simulator.release(serverObject, true);

    expect(binder.net_spawn(serverObject)).toBe(false);

    expect(setupObjectLogicsOnSpawn).toHaveBeenCalledTimes(0);
    expect(registry.objects.length()).toBe(0);
  });

  it("should handle going online/offline when spawn dead", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();

    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    jest.spyOn(object, "alive").mockImplementation(() => false);

    expect(binder.net_spawn(serverObject)).toBe(true);

    expect(setupObjectLogicsOnSpawn).toHaveBeenCalledTimes(0);
    expect(registry.objects.length()).toBe(0);
  });

  it("should handle going online/offline", () => {
    mockRegisteredActor();

    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);
    const manager: SoundManager = getManager(SoundManager);

    jest.spyOn(manager, "stop").mockImplementation(jest.fn());

    binder.net_spawn(serverObject);

    const state: IRegistryObjectState = binder.state;

    state.overrides = { onOffline: parseConditionsList("%+on_offline_info%") } as ILogicsOverrides;

    registerOfflineObject(object.id());

    expect(setupObjectLogicsOnSpawn).toHaveBeenCalledWith(object, state, ESchemeType.MONSTER, false);
    expect(registry.objects.get(object.id())).toBe(state);
    expect(hasInfoPortion("on_offline_info")).toBe(false);

    registry.actorCombat.set(object.id(), true);
    state.activeScheme = EScheme.ANIMPOINT;
    state[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    expect(setupSpawnedObjectPosition).toHaveBeenCalledTimes(1);
    expect(setupSpawnedObjectPosition).toHaveBeenCalledWith(object, serverObject.m_smart_terrain_id);

    binder.net_destroy();

    expect(registry.objects.get(object.id())).toBeNull();
    expect(registry.actorCombat.length()).toBe(0);

    expect(object.set_callback).toHaveBeenCalledTimes(4);
    expect(object.set_callback).toHaveBeenCalledWith(callback.death, null);
    expect(object.set_callback).toHaveBeenCalledWith(callback.patrol_path_in_point, null);
    expect(object.set_callback).toHaveBeenCalledWith(callback.hit, null);
    expect(object.set_callback).toHaveBeenCalledWith(callback.sound, null);

    expect(manager.stop).toHaveBeenCalledWith(object.id());
    expect(emitSchemeEvent).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledWith(
      state[state.activeScheme] as IBaseSchemeState,
      ESchemeEvent.SWITCH_OFFLINE,
      object
    );

    expect(registry.offlineObjects.get(object.id())).toEqual({
      levelVertexId: object.level_vertex_id(),
      activeSection: binder.state.activeSection,
    });

    expect(hasInfoPortion("on_offline_info")).toBe(true);
  });

  it("should handle update event when dead", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    jest.spyOn(object, "alive").mockImplementation(() => false);

    binder.reinit();
    binder.net_spawn(serverObject);
    binder.update(100);

    expect(object.set_tip_text).toHaveBeenCalledTimes(0);
    expect(trySwitchToAnotherSection).toHaveBeenCalledTimes(0);
  });

  it("should handle update event when released", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    binder.reinit();
    binder.net_spawn(serverObject);

    registry.simulator.release(serverObject, true);

    const state: IRegistryObjectState = registry.objects.get(object.id());

    state.activeScheme = EScheme.ANIMPOINT;
    state[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    binder.update(100);

    expect(object.set_tip_text).toHaveBeenCalledTimes(1);
    expect(trySwitchToAnotherSection).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledTimes(0);
  });

  it("should handle update event when in combat", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    jest.spyOn(object, "get_enemy").mockImplementation(() => MockGameObject.mock());

    binder.reinit();
    binder.net_spawn(serverObject);

    const state: IRegistryObjectState = registry.objects.get(object.id());

    state.activeScheme = EScheme.ANIMPOINT;
    state[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    binder.update(100);

    expect(trySwitchToAnotherSection).toHaveBeenCalledTimes(1);
    expect(object.set_tip_text).toHaveBeenCalledTimes(1);

    expect(scriptReleaseMonster).toHaveBeenCalledTimes(1);
    expect(scriptReleaseMonster).toHaveBeenCalledWith(object);
  });

  it("should handle update event when command squad", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);
    const squad: Squad = MockSquad.mock();

    jest.spyOn(squad, "update").mockImplementation(jest.fn());

    serverObject.group_id = squad.id;

    binder.reinit();
    binder.net_spawn(serverObject);
    binder.update(100);

    expect(squad.update).toHaveBeenCalledTimes(0);
    expect(updateMonsterSquadAction).toHaveBeenCalledTimes(1);
    expect(updateMonsterSquadAction).toHaveBeenCalledWith(object, squad);

    jest.spyOn(squad, "commander_id").mockImplementation(() => serverObject.id);

    binder.update(100);

    expect(squad.update).toHaveBeenCalledTimes(1);
    expect(updateMonsterSquadAction).toHaveBeenCalledTimes(2);
    expect(updateMonsterSquadAction).toHaveBeenCalledWith(object, squad);
  });

  it("should handle generic update event with combat tracking", () => {
    const { actorGameObject } = mockRegisteredActor();
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    registry.actorCombat.set(object.id(), true);
    jest.spyOn(object, "best_enemy").mockImplementation(() => actorGameObject);

    binder.reinit();
    binder.net_spawn(serverObject);

    const state: IRegistryObjectState = registry.objects.get(object.id());

    state.activeScheme = EScheme.ANIMPOINT;
    state[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    binder.update(100);

    expect(registry.actorCombat.get(object.id())).toBe(true);
    expect(object.set_tip_text).toHaveBeenCalledWith("");
    expect(trySwitchToAnotherSection).toHaveBeenCalledWith(object, state[state.activeScheme] as IBaseSchemeState);
    expect(emitSchemeEvent).toHaveBeenCalledWith(
      state[state.activeScheme] as IBaseSchemeState,
      ESchemeEvent.UPDATE,
      100
    );

    jest.spyOn(object, "best_enemy").mockImplementation(() => null);

    binder.update(100);

    expect(registry.actorCombat.length()).toBe(0);
  });

  it("should be net save relevant", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: MonsterBinder = new MonsterBinder(object);

    expect(binder.net_save_relevant()).toBe(true);
  });

  it("should handle save/load", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: MonsterBinder = new MonsterBinder(object);
    const processor: MockNetProcessor = new MockNetProcessor();

    jest.spyOn(Date, "now").mockImplementationOnce(() => 2000);

    registerObject(object);

    binder.reinit();

    const state: IRegistryObjectState = registry.objects.get(object.id());

    state.activationTime = 5000;
    state.activationGameTime = MockCTime.mock(2012, 6, 12, 20, 15, 30, 500);
    state.jobIni = "job_ini.ltx";
    state.iniFilename = "ini.ltx";
    state.sectionLogic = "logic";
    state.activeSection = "scheme@section";
    state.smartTerrainName = "some_smart";

    binder.save(processor.asNetPacket());

    expect(processor.writeDataOrder).toEqual([
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.I32,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U16,
      EPacketDataType.U32,
      EPacketDataType.U16,
      EPacketDataType.U16,
    ]);
    expect(processor.dataList).toEqual([
      "save_from_MonsterBinder",
      "job_ini.ltx",
      "ini.ltx",
      "logic",
      "scheme@section",
      "some_smart",
      3000,
      12,
      6,
      12,
      20,
      15,
      30,
      500,
      0,
      14,
      16,
    ]);

    binder.load(processor.asNetReader());

    expect(binder.isLoaded).toBe(true);
    expect(processor.readDataOrder).toEqual(processor.writeDataOrder);
    expect(processor.dataList).toHaveLength(0);
  });

  it("should handle waypoint event", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);

    binder.reinit();
    binder.net_spawn(serverObject);
    binder.onWaypoint(object, 1, 5);

    expect(emitSchemeEvent).toHaveBeenCalledTimes(0);

    binder.state.activeScheme = EScheme.PATROL;
    binder.state.activeSection = `${EScheme.PATROL}@test`;
    binder.state[EScheme.PATROL] = mockSchemeState(EScheme.PATROL);

    binder.onWaypoint(object, 1, 5);

    expect(emitSchemeEvent).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledWith(binder.state[EScheme.PATROL], ESchemeEvent.WAYPOINT, object, 1, 5);
  });

  it("should handle death event", () => {
    mockRegisteredActor();

    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);
    const killer: GameObject = MockGameObject.mock();
    const manager: EventsManager = getManager(EventsManager);

    jest.spyOn(manager, "emitEvent");
    jest.spyOn(binder, "onHit").mockImplementation(jest.fn());
    jest.spyOn(binder, "resetCallbacks").mockImplementation(jest.fn());

    binder.reinit();
    binder.net_spawn(serverObject);

    const state: IRegistryObjectState = binder.state;

    registry.actorCombat.set(object.id(), true);

    state.activeScheme = EScheme.ANIMPOINT;

    state[EScheme.MOB_DEATH] = mockSchemeState(EScheme.MOB_DEATH);
    state[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    binder.onDeath(object, killer);

    expect(registry.actorCombat.length()).toBe(0);
    expect(binder.onHit).toHaveBeenCalledTimes(1);
    expect(binder.onHit).toHaveBeenCalledWith(object, 1, ZERO_VECTOR, killer, -1);
    expect(binder.resetCallbacks).toHaveBeenCalledTimes(1);

    expect(emitSchemeEvent).toHaveBeenCalledTimes(2);
    expect(emitSchemeEvent).toHaveBeenCalledWith(state[EScheme.MOB_DEATH], ESchemeEvent.DEATH, object, killer);
    expect(emitSchemeEvent).toHaveBeenCalledWith(state[state.activeScheme], ESchemeEvent.DEATH, object, killer);

    expect(manager.emitEvent).toHaveBeenCalledTimes(1);
    expect(manager.emitEvent).toHaveBeenCalledWith(EGameEvent.MONSTER_DEATH, object, killer);

    expect(registry.simulator.release).toHaveBeenCalledTimes(0);
  });

  it("should handle death event for poltergeist", () => {
    mockRegisteredActor();

    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);
    const killer: GameObject = MockGameObject.mock();

    jest.spyOn(object, "clsid").mockImplementation(() => clsid.poltergeist_s);

    binder.reinit();
    binder.net_spawn(serverObject);
    binder.onDeath(object, killer);

    expect(registry.simulator.release).toHaveBeenCalledTimes(1);
    expect(registry.simulator.release).toHaveBeenCalledWith(serverObject, true);
  });

  it("should handle hit event", () => {
    const serverObject: ServerMonsterBaseObject = MockAlifeMonsterBase.mock();
    const object: GameObject = MockGameObject.mock({ id: serverObject.id });
    const binder: MonsterBinder = new MonsterBinder(object);
    const hitting: GameObject = MockGameObject.mock();
    const manager: EventsManager = getManager(EventsManager);

    jest.spyOn(manager, "emitEvent");

    binder.reinit();
    binder.net_spawn(serverObject);
    binder.onHit(object, 1, X_VECTOR, hitting, "1");

    expect(emitSchemeEvent).toHaveBeenCalledTimes(0);
    expect(manager.emitEvent).toHaveBeenCalledTimes(1);
    expect(manager.emitEvent).toHaveBeenCalledWith(EGameEvent.MONSTER_HIT, object, 1, X_VECTOR, hitting, "1");

    binder.state[EScheme.HIT] = mockSchemeState(EScheme.HIT);

    binder.onHit(object, 1, X_VECTOR, hitting, "1");

    expect(emitSchemeEvent).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledWith(
      binder.state[EScheme.HIT],
      ESchemeEvent.HIT,
      object,
      1,
      X_VECTOR,
      hitting,
      "1"
    );
    expect(manager.emitEvent).toHaveBeenCalledTimes(2);
  });

  it("should handle hear event", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: MonsterBinder = new MonsterBinder(object);

    jest.spyOn(SchemeHear, "onObjectHearSound").mockImplementation(jest.fn());

    // Do not listen for self.
    binder.onHearSound(object, object.id(), 128, X_VECTOR, 10);
    expect(SchemeHear.onObjectHearSound).not.toHaveBeenCalled();

    // Do not listen when dead.
    jest.spyOn(object, "alive").mockImplementationOnce(() => false);
    binder.onHearSound(object, ACTOR_ID, 128, X_VECTOR, 10);
    expect(SchemeHear.onObjectHearSound).not.toHaveBeenCalled();

    binder.onHearSound(object, ACTOR_ID, 128, X_VECTOR, 10);
    expect(SchemeHear.onObjectHearSound).toHaveBeenCalledWith(object, ACTOR_ID, 128, X_VECTOR, 10);
  });
});
