import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { disposeManager, getManager } from "@/engine/core/database";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { taskConfig } from "@/engine/core/managers/tasks/TaskConfig";
import { TaskManager } from "@/engine/core/managers/tasks/TaskManager";
import { TaskObject } from "@/engine/core/managers/tasks/TaskObject";
import { ETaskState } from "@/engine/core/managers/tasks/types";
import { NIL } from "@/engine/lib/constants/words";
import { AnyObject, TSection } from "@/engine/lib/types";
import { mockRegisteredActor, resetRegistry } from "@/fixtures/engine";
import { MockLuaTable } from "@/fixtures/lua/mocks/LuaTable.mock";
import { EPacketDataType, MockIniFile, MockNetProcessor } from "@/fixtures/xray";

describe("TaskManager", () => {
  beforeAll(() => {
    require("@/engine/scripts/declarations/tasks");
  });

  beforeEach(() => {
    resetRegistry();
    mockRegisteredActor();
    taskConfig.ACTIVE_TASKS = new LuaTable();
  });

  it("should correctly initialize and destroy", () => {
    const manager: TaskManager = getManager(TaskManager);
    const eventsManager: EventsManager = getManager(EventsManager);

    expect(MockLuaTable.getMockSize(taskConfig.ACTIVE_TASKS)).toBe(0);
    expect(eventsManager.getSubscribersCount()).toBe(2);
    expect(eventsManager.getEventSubscribersCount(EGameEvent.DUMP_LUA_DATA)).toBe(1);
    expect(eventsManager.getEventSubscribersCount(EGameEvent.TASK_STATE_UPDATE)).toBe(1);

    disposeManager(TaskManager);

    expect(eventsManager.getSubscribersCount()).toBe(0);
    expect(MockLuaTable.getMockSize(taskConfig.ACTIVE_TASKS)).toBe(0);
  });

  it("should correctly save and load empty list data", () => {
    const manager: TaskManager = getManager(TaskManager);
    const processor: MockNetProcessor = new MockNetProcessor();

    manager.save(processor.asNetPacket());

    expect(processor.writeDataOrder).toEqual([EPacketDataType.U16, EPacketDataType.U16]);
    expect(processor.dataList).toEqual([0, 1]);

    disposeManager(TaskManager);

    const tasksBefore: LuaTable<TSection, TaskObject> = taskConfig.ACTIVE_TASKS;
    const newManager: TaskManager = getManager(TaskManager);

    newManager.load(processor.asNetProcessor());

    expect(processor.readDataOrder).toEqual(processor.writeDataOrder);
    expect(processor.dataList).toHaveLength(0);
    expect(newManager).not.toBe(manager);
    expect(taskConfig.ACTIVE_TASKS).toEqual(tasksBefore);
  });

  it("should correctly save and load with tasks data", () => {
    const manager: TaskManager = getManager(TaskManager);
    const processor: MockNetProcessor = new MockNetProcessor();

    manager.giveTask("hide_from_surge");

    manager.save(processor.asNetPacket());

    expect(processor.writeDataOrder).toEqual([
      EPacketDataType.U16,
      EPacketDataType.STRING,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U8,
      EPacketDataType.U16,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.STRING,
      EPacketDataType.U16,
      EPacketDataType.U16,
    ]);
    expect(processor.dataList).toEqual([
      1,
      "hide_from_surge",
      2,
      12,
      6,
      12,
      9,
      30,
      0,
      0,
      "hide_from_surge_name_1",
      "translated_hide_from_surge_descr_1_a",
      NIL,
      11,
      14,
    ]);

    disposeManager(TaskManager);

    const newManager: TaskManager = getManager(TaskManager);

    newManager.load(processor.asNetReader());

    expect(processor.writeDataOrder).toEqual(processor.writeDataOrder);
    expect(processor.dataList).toHaveLength(0);

    expect(newManager).not.toBe(manager);
    expect(MockLuaTable.getMockSize(taskConfig.ACTIVE_TASKS)).toBe(1);
  });

  it.todo("should correctly give tasks");

  it("should correctly check if tasks are active", () => {
    const taskManager: TaskManager = getManager(TaskManager);

    expect(taskManager.isTaskActive("test_task")).toBeFalsy();

    expect(taskManager.isTaskActive("another_task")).toBeFalsy();

    taskConfig.ACTIVE_TASKS.set("test_task", { state: ETaskState.COMPLETED } as TaskObject);
    expect(taskManager.isTaskActive("test_task")).toBeTruthy();

    taskConfig.ACTIVE_TASKS.set("test_task", { state: ETaskState.NEW } as TaskObject);
    expect(taskManager.isTaskActive("test_task")).toBeTruthy();
  });

  it("should correctly check if tasks are failed", () => {
    const taskManager: TaskManager = getManager(TaskManager);
    const task: TaskObject = new TaskObject("test", MockIniFile.mock("test.ltx", { test: {} }));

    expect(taskManager.isTaskFailed("test_task")).toBeFalsy();

    taskConfig.ACTIVE_TASKS.set("test_task", task);

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.COMPLETED);
    expect(taskManager.isTaskFailed("test_task")).toBeFalsy();

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.NEW);
    expect(taskManager.isTaskFailed("test_task")).toBeFalsy();

    task.state = ETaskState.FAIL;
    jest.spyOn(task, "update").mockImplementation(() => ETaskState.FAIL);
    expect(taskManager.isTaskFailed("test_task")).toBeTruthy();

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.REVERSED);
    expect(taskManager.isTaskFailed("test_task")).toBeTruthy();
  });

  it("should correctly check if tasks are completed", () => {
    const taskManager: TaskManager = getManager(TaskManager);
    const task: TaskObject = new TaskObject("test", MockIniFile.mock("test.ltx", { test: {} }));

    expect(taskManager.isTaskCompleted("test_task")).toBeFalsy();

    taskConfig.ACTIVE_TASKS.set("test_task", task);

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.NEW);
    task.state = ETaskState.NEW;
    expect(taskManager.isTaskCompleted("test_task")).toBeFalsy();

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.FAIL);
    task.state = ETaskState.FAIL;
    expect(taskManager.isTaskCompleted("test_task")).toBeFalsy();

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.REVERSED);
    task.state = ETaskState.REVERSED;
    expect(taskManager.isTaskCompleted("test_task")).toBeFalsy();

    jest.spyOn(task, "update").mockImplementation(() => ETaskState.COMPLETED);
    task.state = ETaskState.COMPLETED;
    expect(taskManager.isTaskCompleted("test_task")).toBeTruthy();
  });

  it.todo("should correctly handle task updates");

  it("should correctly handle debug dump event", () => {
    const manager: TaskManager = getManager(TaskManager);
    const data: AnyObject = {};

    EventsManager.emitEvent(EGameEvent.DUMP_LUA_DATA, data);

    expect(data).toEqual({ TaskManager: expect.any(Object) });
    expect(manager.onDebugDump({})).toEqual({ TaskManager: expect.any(Object) });
  });
});
