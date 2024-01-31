import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { RestrictorBinder } from "@/engine/core/binders/zones/RestrictorBinder";
import { getManager, IRegistryObjectState, registerObject, registry } from "@/engine/core/database";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { SoundManager } from "@/engine/core/managers/sounds";
import { AbstractPlayableSound } from "@/engine/core/managers/sounds/objects";
import { soundsConfig } from "@/engine/core/managers/sounds/SoundsConfig";
import { hasInfoPortion } from "@/engine/core/utils/info_portion";
import { emitSchemeEvent, initializeObjectSchemeLogic } from "@/engine/core/utils/scheme";
import { AnyObject, EScheme, ESchemeEvent, ESchemeType, GameObject, ServerObject, TName } from "@/engine/lib/types";
import { mockRegisteredActor, mockSchemeState, resetRegistry } from "@/fixtures/engine";
import { resetFunctionMock } from "@/fixtures/jest";
import {
  EPacketDataType,
  MockGameObject,
  MockNetProcessor,
  MockObjectBinder,
  mockServerAlifeObject,
} from "@/fixtures/xray";

jest.mock("@/engine/core/utils/scheme/scheme_event", () => ({
  emitSchemeEvent: jest.fn(),
}));

jest.mock("@/engine/core/utils/scheme/scheme_initialization", () => ({
  initializeObjectSchemeLogic: jest.fn(),
}));

describe("RestrictorBinder", () => {
  beforeEach(() => {
    resetFunctionMock(emitSchemeEvent);
    resetRegistry();
  });

  it("should correctly initialize", () => {
    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());

    expect(binder.isInitialized).toBe(false);
    expect(binder.isLoaded).toBe(false);
    expect(binder.isVisited).toBe(false);
  });

  it("should correctly be net save relevant", () => {
    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());

    expect(binder.net_save_relevant()).toBe(true);
  });

  it("should correctly handle re-init", () => {
    const object: GameObject = MockGameObject.mock();
    const binder: RestrictorBinder = new RestrictorBinder(object);

    binder.reinit();

    expect(registry.objects.get(object.id())).toEqual({ object });
  });

  it("should correctly handle going online and offline", () => {
    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());
    const serverObject: ServerObject = mockServerAlifeObject({ id: binder.object.id() });
    const soundManager: SoundManager = getManager(SoundManager);
    const mockSound: AbstractPlayableSound = {} as AnyObject as AbstractPlayableSound;

    jest.spyOn(soundManager, "playLooped").mockImplementation(jest.fn());
    jest.spyOn(soundManager, "stop").mockImplementation(jest.fn());

    soundsConfig.looped.set(serverObject.id, $fromObject<TName, AbstractPlayableSound>({ first: mockSound }));

    binder.net_spawn(serverObject);

    const objectState: IRegistryObjectState = registry.objects.get(serverObject.id);

    objectState.activeScheme = EScheme.ANIMPOINT;
    objectState[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    expect(registry.zones.length()).toBe(1);
    expect(registry.objects.length()).toBe(1);
    expect(soundManager.playLooped).toHaveBeenCalledTimes(1);
    expect(soundManager.playLooped).toHaveBeenCalledWith(serverObject.id, "first");

    binder.net_destroy();

    expect(soundManager.stop).toHaveBeenCalledTimes(1);
    expect(soundManager.stop).toHaveBeenCalledWith(serverObject.id);
    expect(emitSchemeEvent).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledWith(
      binder.object,
      objectState[EScheme.ANIMPOINT],
      ESchemeEvent.SWITCH_OFFLINE,
      binder.object
    );

    expect(registry.zones.length()).toBe(0);
    expect(registry.objects.length()).toBe(0);
  });

  it("should correctly handle going online and offline when check to spawn is falsy", () => {
    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());
    const serverObject: ServerObject = mockServerAlifeObject({ id: binder.object.id() });
    const soundManager: SoundManager = getManager(SoundManager);

    jest.spyOn(soundManager, "playLooped").mockImplementation(jest.fn());
    jest.spyOn(soundManager, "stop").mockImplementation(jest.fn());

    (binder as unknown as MockObjectBinder).canSpawn = false;

    binder.net_spawn(serverObject);

    expect(soundManager.stop).toHaveBeenCalledTimes(0);
    expect(soundManager.playLooped).toHaveBeenCalledTimes(0);
    expect(emitSchemeEvent).toHaveBeenCalledTimes(0);

    expect(registry.zones.length()).toBe(0);
    expect(registry.objects.length()).toBe(0);
  });

  it("should correctly handle update event", () => {
    mockRegisteredActor();

    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());
    const serverObject: ServerObject = mockServerAlifeObject({ id: binder.object.id() });
    const soundManager: SoundManager = getManager(SoundManager);
    const onVisit = jest.fn();

    getManager(EventsManager).registerCallback(EGameEvent.RESTRICTOR_ZONE_VISITED, onVisit);

    jest.spyOn(soundManager, "update").mockImplementation(jest.fn());

    binder.net_spawn(serverObject);

    const objectState: IRegistryObjectState = registry.objects.get(serverObject.id);

    objectState.activeScheme = EScheme.ANIMPOINT;
    objectState[EScheme.ANIMPOINT] = mockSchemeState(EScheme.ANIMPOINT);

    binder.update(100);

    expect(binder.isInitialized).toBe(true);
    expect(initializeObjectSchemeLogic).toHaveBeenCalledTimes(1);
    expect(initializeObjectSchemeLogic).toHaveBeenCalledWith(binder.object, objectState, false, ESchemeType.RESTRICTOR);

    expect(soundManager.update).toHaveBeenCalledTimes(1);
    expect(soundManager.update).toHaveBeenCalledWith(serverObject.id);

    expect(emitSchemeEvent).toHaveBeenCalledTimes(1);
    expect(emitSchemeEvent).toHaveBeenCalledWith(
      binder.object,
      objectState[EScheme.ANIMPOINT],
      ESchemeEvent.UPDATE,
      100
    );

    expect(onVisit).not.toHaveBeenCalled();
    expect(binder.isVisited).toBe(false);
    expect(hasInfoPortion(binder.object.name() + "_visited")).toBe(false);

    jest.spyOn(binder.object, "inside").mockImplementation(() => true);

    binder.update(100);

    expect(binder.isVisited).toBe(true);
    expect(hasInfoPortion(binder.object.name() + "_visited")).toBe(true);
    expect(onVisit).toHaveBeenCalledTimes(1);
    expect(onVisit).toHaveBeenCalledWith(binder.object, binder);

    binder.update(2555);
    expect(onVisit).toHaveBeenCalledTimes(1);
  });

  it("should correctly handle save/load", () => {
    jest.spyOn(Date, "now").mockImplementation(() => 5000);

    const netProcessor: MockNetProcessor = new MockNetProcessor();
    const binder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());
    const binderState: IRegistryObjectState = registerObject(binder.object);

    binder.isVisited = true;
    binderState.jobIni = "test.ltx";
    binderState.iniFilename = "test_filename.ltx";
    binderState.sectionLogic = "logic";
    binderState.activeSection = "test@test";
    binderState.smartTerrainName = "test-smart";

    binder.save(netProcessor.asNetPacket());

    expect(netProcessor.writeDataOrder).toEqual([
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.I32,
      EPacketDataType.U8,
      EPacketDataType.U32,
      EPacketDataType.U16,
      EPacketDataType.BOOLEAN,
      EPacketDataType.U16,
    ]);
    expect(netProcessor.dataList).toEqual([
      "save_from_RestrictorBinder",
      "test.ltx",
      "test_filename.ltx",
      "logic",
      "test@test",
      "test-smart",
      -5000,
      255,
      0,
      8,
      true,
      11,
    ]);

    const newBinder: RestrictorBinder = new RestrictorBinder(MockGameObject.mock());
    const newBinderState: IRegistryObjectState = registerObject(newBinder.object);

    expect(newBinder.isLoaded).toBe(false);

    newBinder.load(netProcessor.asNetReader());

    expect(newBinder.isInitialized).toBe(false);
    expect(newBinder.isLoaded).toBe(true);
    expect(newBinder.isVisited).toBe(true);
    expect(newBinderState.jobIni).toBe("test.ltx");
    expect(newBinderState.loadedSectionLogic).toBe("logic");
    expect(newBinderState.loadedActiveSection).toBe("test@test");
    expect(newBinderState.loadedSmartTerrainName).toBe("test-smart");
    expect(newBinderState.loadedIniFilename).toBe("test_filename.ltx");

    expect(netProcessor.readDataOrder).toEqual(netProcessor.writeDataOrder);
    expect(netProcessor.dataList).toHaveLength(0);
  });
});
