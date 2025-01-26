import { describe, expect, it } from "@jest/globals";

import { IBaseSchemeLogic } from "@/engine/core/database";
import { parseConditionsList } from "@/engine/core/utils/ini/ini_parse";
import {
  readIniBoolean,
  readIniConditionList,
  readIniFieldsAsList,
  readIniFieldsAsSet,
  readIniNumber,
  readIniNumberAndConditionList,
  readIniNumberList,
  readIniSectionAsNumberMap,
  readIniSectionAsSet,
  readIniSectionAsStringMap,
  readIniSectionsAsList,
  readIniSectionsAsSet,
  readIniString,
  readIniStringAndCondList,
  readIniStringList,
  readIniStringSet,
  readIniStringWB,
  readIniTwoNumbers,
  readIniTwoStringsAndConditionsList,
} from "@/engine/core/utils/ini/ini_read";
import { IniFile, Optional } from "@/engine/lib/types";
import { MockIniFile } from "@/fixtures/xray/mocks/ini";

describe("readIniString util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "a1",
        b: "b2",
      },
    });

    expect(readIniString(ini, "section1", "a", true)).toBe("a1");
    expect(readIniString(ini, "section1", "b", true)).toBe("b2");

    expect(readIniString(ini, "section1", "a", true, "")).toBe("a1");
    expect(readIniString(ini, "section1", "b", true, "prefix")).toBe("prefix_b2");

    expect(readIniString(ini, "section1", "c", false)).toBeNull();
    expect(readIniString(ini, "section1", "c", false, null, "def")).toBe("def");
    expect(() => readIniString(ini, "section1", "c", true)).toThrow();

    expect(() => readIniString(ini, "section2", "a", true)).toThrow();
    expect(() => readIniString(ini, "section2", "a", false)).not.toThrow();
  });
});

describe("readIniStringWB util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "a1",
        b: "b2",
        q1: `"${1} 2 another"`,
        q2: `"${1} 2 another`,
      },
    });

    expect(readIniStringWB(ini, "section1", "a", true)).toBe("a1");
    expect(readIniStringWB(ini, "section1", "b", true)).toBe("b2");
    expect(readIniStringWB(ini, "section1", "q1", true)).toBe("1 2 another");
    expect(readIniStringWB(ini, "section1", "q2", true)).toBe(`"${1} 2 another`);

    expect(readIniStringWB(ini, "section1", "b", true, "")).toBe("b2");
    expect(readIniStringWB(ini, "section1", "a", true, "prefix")).toBe("prefix_a1");
    expect(readIniStringWB(ini, "section1", "q1", true, "prefix")).toBe("prefix_1 2 another");

    expect(readIniStringWB(ini, "section1", "c", false)).toBeNull();
    expect(readIniStringWB(ini, "section1", "c", false, null, "def")).toBe("def");
    expect(() => readIniStringWB(ini, "section1", "c", true)).toThrow();

    expect(() => readIniStringWB(ini, "section2", "a", true)).toThrow();
    expect(() => readIniStringWB(ini, "section2", "a", false)).not.toThrow();
  });
});

describe("readIniStringList util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "a1",
        b: "b2, b3, b4",
        c: "",
        f: "a,,c",
      },
    });

    expect(readIniStringList(ini, "section1", "a", true, "")).toEqualLuaArrays(["a1"]);
    expect(readIniStringList(ini, "section1", "b", true, "")).toEqualLuaArrays(["b2", "b3", "b4"]);
    expect(readIniStringList(ini, "section1", "c", true, "")).toEqualLuaArrays([]);
    expect(readIniStringList(ini, "section1", "d", false)).toEqualLuaArrays([]);
    expect(readIniStringList(ini, "section1", "d", false, "")).toEqualLuaArrays([]);
    expect(readIniStringList(ini, "section1", "e", false, "e1, e2")).toEqualLuaArrays(["e1", "e2"]);
    expect(readIniStringList(ini, "section1", "f", false, "e1, e2")).toEqualLuaArrays(["a", "c"]);

    expect(() => readIniStringList(ini, "section2", "a", true)).toThrow();
    expect(() => readIniStringList(ini, "section2", "3", true)).toThrow();
    expect(() => readIniStringList(ini, "section2", "3", true, "")).toThrow();
    expect(() => readIniStringList(ini, "section2", "3", false)).not.toThrow();
  });
});

describe("readIniStringSet util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "a1",
        b: "b2, b3, b4",
        c: "",
        f: "a,,c",
      },
    });

    expect(readIniStringSet(ini, "section1", "a", true, "")).toEqualLuaTables({ a1: true });
    expect(readIniStringSet(ini, "section1", "b", true, "")).toEqualLuaTables({ b2: true, b3: true, b4: true });
    expect(readIniStringSet(ini, "section1", "c", true, "")).toEqualLuaTables({});
    expect(readIniStringSet(ini, "section1", "d", false)).toEqualLuaTables({});
    expect(readIniStringSet(ini, "section1", "d", false, "")).toEqualLuaTables({});
    expect(readIniStringSet(ini, "section1", "e", false, "e1, e2")).toEqualLuaTables({ e1: true, e2: true });
    expect(readIniStringSet(ini, "section1", "e", false, "e1 e2")).toEqualLuaTables({ e1: true, e2: true });
    expect(readIniStringSet(ini, "section1", "f", false, "e1 e2")).toEqualLuaTables({ a: true, c: true });

    expect(() => readIniStringSet(ini, "section2", "a", true)).toThrow();
    expect(() => readIniStringSet(ini, "section2", "3", true)).toThrow();
    expect(() => readIniStringSet(ini, "section2", "3", true, "")).toThrow();
    expect(() => readIniStringSet(ini, "section2", "3", false)).not.toThrow();
  });
});

describe("readIniNumber util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: 1,
        b: 2,
      },
    });

    expect(readIniNumber(ini, "section1", "a", true)).toBe(1);
    expect(readIniNumber(ini, "section1", "b", true)).toBe(2);

    expect(readIniNumber(ini, "section1", "c", false)).toBeNull();
    expect(readIniNumber(ini, "section1", "c", false, 3)).toBe(3);

    expect(() => readIniNumber(ini, "section2", "a", true)).toThrow();
  });
});

describe("readIniNumberList util", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "a1, 2, 3",
        b: "1, 2.5, -3, -5.1, 6.0",
        c: "1, a, 2.5, b, -3, c, -5.1, d, 6.0",
        d: "1,,2",
        e: "",
      },
    });

    expect(readIniNumberList(ini, "section1", "a", true, "")).toEqualLuaArrays([1, 2, 3]);
    expect(readIniNumberList(ini, "section1", "b", true, "")).toEqualLuaArrays([1, 2.5, -3, -5.1, 6]);
    expect(readIniNumberList(ini, "section1", "c", true, "")).toEqualLuaArrays([1, 2.5, -3, -5.1, 6]);
    expect(readIniNumberList(ini, "section1", "d", false)).toEqualLuaArrays([1, 2]);
    expect(readIniNumberList(ini, "section1", "e", false)).toEqualLuaArrays([]);
    expect(readIniNumberList(ini, "section1", "f", false, "")).toEqualLuaArrays([]);
    expect(readIniNumberList(ini, "section1", "g", false, "e1, e2")).toEqualLuaArrays([1, 2]);

    expect(() => readIniNumberList(ini, "section2", "a", true)).toThrow();
    expect(() => readIniNumberList(ini, "section2", "3", true)).toThrow();
    expect(() => readIniNumberList(ini, "section2", "3", true, "")).toThrow();
    expect(() => readIniNumberList(ini, "section2", "3", false)).not.toThrow();
  });
});

describe("readIniBoolean util for ini file", () => {
  it("utils should correctly get data from ini files", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: true,
        b: false,
      },
    });

    expect(readIniBoolean(ini, "section1", "a", true)).toBe(true);
    expect(readIniBoolean(ini, "section1", "b", true)).toBe(false);
    expect(readIniBoolean(ini, "section1", "c", false)).toBe(false);
    expect(readIniBoolean(ini, "section1", "c", false, true)).toBe(true);

    expect(() => readIniBoolean(ini, "section2", "a", true)).toThrow();
    expect(() => readIniBoolean(ini, "section2", "a", false)).not.toThrow();
  });
});

describe("readIniTwoNumbers util", () => {
  it("util should get two numbers correctly", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "-4.3, 2",
        b: "10 -5",
        c: "10",
        d: "",
      },
    });

    expect(readIniTwoNumbers(ini, "section1", "a", 1, 1)).toEqual([-4.3, 2]);
    expect(readIniTwoNumbers(ini, "section1", "b", 1, 1)).toEqual([10, -5]);
    expect(readIniTwoNumbers(ini, "section1", "c", 1, 1)).toEqual([10, 1]);
    expect(readIniTwoNumbers(ini, "section1", "d", 1, 1)).toEqual([1, 1]);
    expect(readIniTwoNumbers(ini, "section1", "e", 1, 1)).toEqual([1, 1]);
  });
});

describe("readIniTwoNumbers util", () => {
  it("util should get two numbers correctly", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "-4.3, 2",
        b: "10 -5",
        c: "10",
        d: "",
      },
    });

    expect(readIniTwoNumbers(ini, "section1", "a", 1, 1)).toEqual([-4.3, 2]);
    expect(readIniTwoNumbers(ini, "section1", "b", 1, 1)).toEqual([10, -5]);
    expect(readIniTwoNumbers(ini, "section1", "c", 1, 1)).toEqual([10, 1]);
    expect(readIniTwoNumbers(ini, "section1", "d", 1, 1)).toEqual([1, 1]);
    expect(readIniTwoNumbers(ini, "section1", "e", 1, 1)).toEqual([1, 1]);
  });
});

describe("readIniConditionList util", () => {
  it("should read empty ini", () => {
    expect(readIniConditionList(MockIniFile.mock("test.ltx", {}), "section1", "a")).toBeNull();
  });

  it("should correctly parse data", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a:
          "ph_idle@sound %=anim_obj_forward(pas_b400_door_way) =heal_squad(pas_b400_stalkers_squad)" +
          " +pas_b400_way_button_pressed -pas_b400_about_gates%",
        b: "{-lx8_scentific_door_open} ph_door@open %+lx8_scentific_door_open%, ph_door@open",
      },
    });

    const firstScheme: Optional<IBaseSchemeLogic> = readIniConditionList(ini, "section1", "a");

    expect(firstScheme).toEqualLuaTables({
      name: "a",
      condlist: parseConditionsList(
        "ph_idle@sound %=anim_obj_forward(pas_b400_door_way) =heal_squad(pas_b400_stalkers_squad)" +
          " +pas_b400_way_button_pressed -pas_b400_about_gates%"
      ),
      objectId: null,
      p1: null,
      p2: null,
    });

    const secondScheme: Optional<IBaseSchemeLogic> = readIniConditionList(ini, "section1", "b");

    expect(secondScheme).toEqualLuaTables({
      name: "b",
      condlist: parseConditionsList("{-lx8_scentific_door_open} ph_door@open %+lx8_scentific_door_open%, ph_door@open"),
      objectId: null,
      p1: null,
      p2: null,
    });
  });
});

describe("readIniNumberAndConditionList util", () => {
  it("should read empty ini", () => {
    expect(readIniNumberAndConditionList(MockIniFile.mock("test.ltx", {}), "section1", "a")).toBeNull();
  });

  it("should correctly parse data", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "5 | {-jup_b19_actor_damaged_zombied} %+jup_b19_actor_damaged_zombied%",
        b: "150 | {-jup_b4_actor_go_away} %+jup_b4_actor_go_away%",
        c:
          "0 | sr_idle@end {!squad_exist(zat_b38_bloodsuckers_sleepers)} %+zat_b57_gas_running_stop" +
          " +zat_b57_den_of_the_bloodsucker_tell_stalkers_about_destroy_lair_give%",
      },
    });

    expect(readIniNumberAndConditionList(ini, "section1", "a")).toEqualLuaTables({
      name: "a",
      condlist: parseConditionsList("{-jup_b19_actor_damaged_zombied} %+jup_b19_actor_damaged_zombied%"),
      objectId: null,
      p1: 5,
      p2: null,
    });

    expect(readIniNumberAndConditionList(ini, "section1", "b")).toEqualLuaTables({
      name: "b",
      condlist: parseConditionsList("{-jup_b4_actor_go_away} %+jup_b4_actor_go_away%"),
      objectId: null,
      p1: 150,
      p2: null,
    });

    expect(readIniNumberAndConditionList(ini, "section1", "c")).toEqualLuaTables({
      name: "c",
      condlist: parseConditionsList(
        "sr_idle@end {!squad_exist(zat_b38_bloodsuckers_sleepers)} %+zat_b57_gas_running_stop" +
          " +zat_b57_den_of_the_bloodsucker_tell_stalkers_about_destroy_lair_give%"
      ),
      objectId: null,
      p1: 0,
      p2: null,
    });
  });
});

describe("readIniStringAndCondList util", () => {
  it("should read empty ini", () => {
    expect(readIniStringAndCondList(MockIniFile.mock("test.ltx", {}), "section1", "a")).toBeNull();
  });

  it("should correctly parse data", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "lx8_sr_lab | sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%",
        b: "path_end | camper@military_2_heli_2_fight",
      },
    });

    expect(readIniStringAndCondList(ini, "section1", "a")).toEqualLuaTables({
      name: "a",
      condlist: parseConditionsList(
        "sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%"
      ),
      objectId: null,
      p1: "lx8_sr_lab ",
      p2: null,
    });

    expect(readIniStringAndCondList(ini, "section1", "b")).toEqualLuaTables({
      name: "b",
      condlist: parseConditionsList("camper@military_2_heli_2_fight"),
      objectId: null,
      p1: "path_end ",
      p2: null,
    });
  });
});

describe("readIniConditionList util", () => {
  it("should correctly parse data", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%",
        b: "camper@military_2_heli_2_fight",
      },
    });

    expect(readIniConditionList(ini, "section1", "a")).toEqualLuaTables({
      name: "a",
      condlist: parseConditionsList(
        "sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%"
      ),
      objectId: null,
      p1: null,
      p2: null,
    });

    expect(readIniConditionList(ini, "section1", "b")).toEqualLuaTables({
      name: "b",
      condlist: parseConditionsList("camper@military_2_heli_2_fight"),
      objectId: null,
      p1: null,
      p2: null,
    });
  });
});

describe("readIniTwoStringsAndConditionsList util", () => {
  it("should read empty ini", () => {
    expect(readIniTwoStringsAndConditionsList(MockIniFile.mock("test.ltx", {}), "section1", "a")).toBeNull();
  });

  it("should correctly parse data", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: {
        a: "first|second|sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%",
        b: "third|fourth|camper@military_2_heli_2_fight",
      },
    });

    expect(readIniTwoStringsAndConditionsList(ini, "section1", "a")).toEqualLuaTables({
      name: "a",
      condlist: parseConditionsList(
        "sr_idle@two %+lx8_lab_tushkano_spawn =create_squad(lx8_tushkano_lab_squad:lx8_smart_terrain)%"
      ),
      objectId: null,
      p1: "first",
      p2: "second",
    });

    expect(readIniTwoStringsAndConditionsList(ini, "section1", "b")).toEqualLuaTables({
      name: "b",
      condlist: parseConditionsList("camper@military_2_heli_2_fight"),
      objectId: null,
      p1: "third",
      p2: "fourth",
    });
  });
});

describe("readIniSectionAsSet util", () => {
  it("should correctly transform section to set", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: ["d", "e"],
      section3: {
        x: 1,
        y: false,
      },
    });

    expect(readIniSectionAsSet(ini, "section1")).toEqualLuaTables({
      a: true,
      b: true,
      c: true,
    });
    expect(readIniSectionAsSet(ini, "section2")).toEqualLuaTables({
      d: true,
      e: true,
    });
    expect(readIniSectionAsSet(ini, "section3")).toEqualLuaTables({
      x: true,
      y: true,
    });
  });
});

describe("readIniSectionsAsSet util", () => {
  it("should correctly transform section to set", () => {
    expect(readIniSectionsAsSet(MockIniFile.mock("test.ltx", {}))).toEqualLuaTables({});
    expect(
      readIniSectionsAsSet(
        MockIniFile.mock("example.ltx", {
          section1: ["a", "b", "c"],
          section2: ["d", "e"],
          section3: {
            x: 1,
            y: false,
          },
        })
      )
    ).toEqualLuaTables({
      section1: true,
      section2: true,
      section3: true,
    });
  });
});

describe("readIniSectionsAsList util", () => {
  it("should correctly transform section to list", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: ["d", "e"],
      section3: {
        x: 1,
        y: false,
      },
    });

    expect(readIniSectionsAsList(MockIniFile.mock("test.ltx", {}))).toEqualLuaTables({});
    expect(readIniSectionsAsList(ini)).toEqualLuaTables({
      1: "section1",
      2: "section2",
      3: "section3",
    });
  });
});

describe("readIniFieldsAsList util", () => {
  it("should correctly transform section fields to list", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: {
        x: 1,
        y: false,
      },
    });

    expect(readIniFieldsAsList(MockIniFile.mock("test.ltx", {}), "section1")).toEqualLuaTables({});
    expect(readIniFieldsAsList(ini, "section1")).toEqualLuaTables({
      1: "a",
      2: "b",
      3: "c",
    });
    expect(readIniFieldsAsList(ini, "section2")).toEqualLuaTables({
      1: "x",
      2: "y",
    });
  });
});

describe("readIniFieldsAsSet util", () => {
  it("should correctly transform section fields to list", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: {
        x: 1,
        y: false,
      },
    });

    expect(readIniFieldsAsSet(MockIniFile.mock("test.ltx", {}), "section1")).toEqualLuaTables({});
    expect(readIniFieldsAsSet(ini, "section1")).toEqualLuaTables({
      a: true,
      b: true,
      c: true,
    });
    expect(readIniFieldsAsSet(ini, "section2")).toEqualLuaTables({
      x: true,
      y: true,
    });
  });
});

describe("readIniSectionAsStringMap util", () => {
  it("should correctly transform section to string based map", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: { a: "b", c: "d", e: "f" },
      section3: {
        x: 1,
        y: false,
      },
    });

    expect(readIniSectionAsStringMap(ini, "section1")).toEqualLuaTables({
      a: null,
      b: null,
      c: null,
    });
    expect(readIniSectionAsStringMap(ini, "section2")).toEqualLuaTables({
      a: "b",
      c: "d",
      e: "f",
    });
    expect(readIniSectionAsStringMap(ini, "section3")).toEqualLuaTables({
      x: 1,
      y: false,
    });
  });
});

describe("readIniSectionAsNumberMap util", () => {
  it("should correctly transform section to number based map", () => {
    const ini: IniFile = MockIniFile.mock("example.ltx", {
      section1: ["a", "b", "c"],
      section2: { a: "1", c: 2, e: "f" },
      section3: {
        x: 1,
        y: false,
      },
    });

    expect(readIniSectionAsNumberMap(ini, "section1")).toEqualLuaTables({
      a: null,
      b: null,
      c: null,
    });
    expect(readIniSectionAsNumberMap(ini, "section2")).toEqualLuaTables({
      a: 1,
      c: 2,
      e: null,
    });
    expect(readIniSectionAsNumberMap(ini, "section3")).toEqualLuaTables({
      x: 1,
      y: null,
    });
  });
});
