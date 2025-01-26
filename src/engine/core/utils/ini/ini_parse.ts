import { flags32, patrol } from "xray16";

import { registry } from "@/engine/core/database/registry";
import { abort, assert, assertDefined } from "@/engine/core/utils/assertion";
import {
  IBoneStateDescriptor,
  IConfigCondition,
  IConfigSwitchCondition,
  ISpawnDescriptor,
  IWaypointData,
  TConditionList,
} from "@/engine/core/utils/ini/ini_types";
import { TInfoPortion } from "@/engine/lib/constants/info_portions";
import { NIL, TRUE } from "@/engine/lib/constants/words";
import {
  AnyObject,
  EScheme,
  Flags32,
  LuaArray,
  Optional,
  Patrol,
  StringOptional,
  TCount,
  TIndex,
  TName,
  TPath,
  TProbability,
  TSection,
} from "@/engine/lib/types";

/**
 * Parse list of strings separated by commas and whitespaces.
 *
 * @param data - string to parse
 * @returns list of parsed strings
 */
export function parseStringsList<T extends string = string>(data: string): LuaArray<T> {
  const result: LuaArray<T> = new LuaTable();

  for (const it of string.gfind(data, "([%w_%-.\\]+)%p*")) {
    table.insert(result, it as T);
  }

  return result;
}

/**
 * Parse list of strings separated by commas and whitespaces as set.
 *
 * @param data - string to parse
 * @returns list of parsed strings
 */
export function parseStringsSet<T extends string = string>(data: string): LuaTable<T, boolean> {
  const result: LuaTable<T, boolean> = new LuaTable();

  for (const it of string.gfind(data, "([%w_%-.\\]+)%p*")) {
    result.set(it as T, true);
  }

  return result;
}

/**
 * Parse util to transform string of numbers to array.
 * Example: "1, 2, 3" -> [1, 2, 3].
 *
 * @param data - string to parse
 * @returns parsed array of numbers
 */
export function parseNumbersList<T extends number = number>(data: string): LuaArray<T> {
  const result: LuaArray<T> = new LuaTable();

  for (const it of string.gfind(data, "([%-%d%.]+)%,*")) {
    table.insert(result, tonumber(it) as T);
  }

  return result;
}

/**
 * Parse pairs of spawn details from string to number.
 * Example input values:
 * - "1,1"
 * - "2,1"
 * - "1,0.5,1,1"
 *
 * todo: Just simplify and expect even number of parameters after parse or throw.
 *
 * @param data - string to parse
 * @returns list of spawn details
 */
export function parseSpawnDetails(data: string): LuaArray<ISpawnDescriptor> {
  const list: LuaArray<ISpawnDescriptor> = new LuaTable();
  const parameters: LuaArray<TName> = parseStringsList(data);
  const count: TCount = parameters.length();

  let index: TIndex = 1;

  // Parse pairs of probabilities.
  while (index <= count) {
    const spawn: ISpawnDescriptor = {
      count: tonumber(parameters.get(index)) as TCount,
    } as ISpawnDescriptor;

    if (parameters.get(index + 1) === null) {
      spawn.probability = 1;
      index += 1;
    } else {
      const probability: Optional<TProbability> = tonumber(parameters.get(index + 1)) as TProbability;

      if (probability === null) {
        spawn.probability = 1;
        index += 1;
      } else {
        spawn.probability = probability;
        index += 2;
      }
    }

    table.insert(list, spawn);
  }

  return list;
}

/**
 * Parse function call parameters separated with pipe.
 *
 * Example: "a|b|c" ==> { 1 = "a", 2 = "b", 3 = "c" }
 * todo: trim parameters
 *
 * @param data - string to parse
 * @returns array of parsed parameters separated with `|`
 */
export function parseParameters<T extends string>(data: T): LuaArray<T> {
  const result: LuaArray<T> = new LuaTable();

  for (const field of string.gfind(data, "%s*([^|]+)%s*")) {
    table.insert(result, field as T);
  }

  return result;
}

/**
 * Parse condition list supplied from game ltx files.
 * Used as conditional descriptor of actions/info portions/effects and things to switch engine logic based on state.
 *
 * Example:
 * {+infop1} section1 %-infop2%, {+infop3 -infop4} section2 ...
 * {
 *   1 = { infop_check = { 1 = {"infop1" = true} }, infop_set = { 1 = {"infop2" = false } }, section = "section1" },
 *   2 = { infop_check = { 1 = {"infop3" = true}, 2 = {"infop4" = false} }, infop_set = {}, section = "section2" },
 * }
 *
 * todo: trimming of whitespaces in names
 * todo: throw on empty string?
 *
 * @param data - raw string from config to parse
 * @returns parsed condlist descriptor
 */
export function parseConditionsList(data: string): TConditionList {
  // All condition lists are just readonly descriptors. Cache them.
  if (registry.cache.conditionLists.has(data)) {
    return registry.cache.conditionLists.get(data);
  }

  const result: LuaArray<IConfigSwitchCondition> = new LuaTable();

  for (const condition of string.gfind(data, "%s*([^,]+)%s*")) {
    let rest: string = condition;

    const [infoPortionsCheckStart, infoPortionsCheckEnd, infoPortionsCheckList] = string.find(
      condition,
      "{%s*(.*)%s*}"
    );

    if (infoPortionsCheckList !== null) {
      rest =
        string.sub(rest, 1, (infoPortionsCheckStart as number) - 1) +
        string.sub(rest, (infoPortionsCheckEnd as number) + 1);
    }

    const [infoPortionsSetStart, infoPortionsSetEnd, infoPortionsSetList] = string.find(rest, "%%%s*(.*)%s*%%");

    if (infoPortionsSetList !== null) {
      rest =
        string.sub(rest, 1, (infoPortionsSetStart as number) - 1) +
        string.sub(rest, (infoPortionsSetEnd as number) + 1);
    }

    const [, , newSection] = string.find(rest, "%s*(.*)%s*");

    assertDefined(newSection, "Syntax error in switch condition: '%s' from entry '%s'.", condition, data);

    table.insert(result, {
      section: tostring(newSection),
      infop_check: parseInfoPortions(new LuaTable(), infoPortionsCheckList),
      infop_set: parseInfoPortions(new LuaTable(), infoPortionsSetList),
    });
  }

  // Memoize condlist.
  registry.cache.conditionLists.set(data, result);

  return result;
}

/**
 * Parse condlist infoPortions/conditions/effects section.
 * Has side effect - modifies provided destination lua array.
 * Example: `+save_zat_b42_arrived_to_controler_lair =scenario_autosave(st_save_zat_b42_arrived_to_controler_lair)`.
 *
 * @param destination - target array for insertion
 * @param data - condlist part to parse
 * @returns modified list of config conditions
 */
export function parseInfoPortions(
  destination: LuaArray<IConfigCondition>,
  data: Optional<string | number>
): LuaArray<IConfigCondition> {
  if (data === null) {
    return destination;
  }

  for (const infoPortionRaw of string.gfind(data, "%s*([%-%+%~%=%!][^%-%+%~%=%!%s]+)%s*")) {
    const sign: string = string.sub(infoPortionRaw, 1, 1);

    let infoPortion: TInfoPortion = string.sub(infoPortionRaw, 2) as TInfoPortion;
    let params: Optional<LuaArray<string | number>> = null;

    const [at] = string.find(infoPortion, "%(");

    if (at !== null) {
      if (string.sub(infoPortion, -1) !== ")") {
        abort("Wrong condition list '%s'.", data);
      }

      if (at < string.len(infoPortion) - 1) {
        params = parseFunctionParams(string.sub(infoPortion, (at as TIndex) + 1, -2));
      } else {
        params = new LuaTable();
      }

      infoPortion = string.sub(infoPortion, 1, (at as TIndex) - 1) as TInfoPortion;
    }

    switch (sign) {
      case "+":
        table.insert(destination, {
          name: infoPortion,
          required: true,
        });
        break;

      case "-":
        table.insert(destination, {
          name: infoPortion,
          required: false,
        });
        break;

      case "~":
        table.insert(destination, { prob: tonumber(infoPortion) });
        break;

      case "=":
        table.insert(destination, {
          func: infoPortion,
          expected: true,
          params: params,
        });
        break;

      case "!":
        table.insert(destination, {
          func: infoPortion,
          expected: false,
          params: params,
        });
        break;

      default:
        abort("Syntax error in switch condition.");
    }
  }

  return destination;
}

/**
 * Parse part of condlist - function params.
 * Example: `1:zat_b42_mayron_walk:2` or `a:b:c:10:-10:10.5`.
 *
 * @param data - string to parse
 * @return list of parameters parsed as strings or numbers
 */
export function parseFunctionParams(data: string): LuaArray<string | number> {
  const list: LuaArray<string | number> = new LuaTable();

  for (const parameter of string.gfind(data, "%s*([^:]+)%s*")) {
    const parsed: Optional<number> = tonumber(parameter) as number;

    table.insert(list, parsed === null ? parameter : parsed);
  }

  return list;
}

/**
 * Parse waypoint data from string.
 *
 * @param patrolName - name of waypoint
 * @param patrolFlags - patrol flags32
 * @param pointName - patrol name, source of data to parse
 * @returns parsed waypoint data
 */
export function parseWaypointData(patrolName: TPath, patrolFlags: Flags32, pointName: TName): IWaypointData {
  const waypointData: IWaypointData = {
    sig: null,
    p: null,
    t: null,
    a: null,
    ret: null,
    flags: patrolFlags,
  };

  if (string.find(pointName, "|", undefined, true) === null) {
    return waypointData;
  }

  let index: TIndex = 1;

  for (const parameter of string.gfind(pointName, "([%w%+~_\\%=%{%}%s%!%-%,%*]+)|*")) {
    // Skip first iteration.
    if (index !== 1) {
      assert(parameter !== "", "path '%s': waypoint '%s': syntax error in waypoint name", patrolName, pointName);

      const [position] = string.find(parameter, "=", 1, true);

      assertDefined(position, "path '%s': waypoint '%s': syntax error in waypoint name", patrolName, pointName);

      const field: string = string.sub(parameter, 1, position - 1);
      let parsed: string = string.sub(parameter, position + 1);

      assert(
        field && field !== "",
        "path '%s': waypoint '%s': syntax error while parsing the param '%s': no field specified",
        patrolName,
        pointName,
        parameter
      );

      if (!parsed || parsed === "") {
        parsed = TRUE;
      }

      (waypointData as unknown as AnyObject)[field] = field === "a" ? parseConditionsList(parsed) : parsed;
    }

    index += 1;
  }

  return waypointData;
}

/**
 * Parse patrol waypoints data.
 * Collects all waypoints from patrol and maps to waypoint data.
 *
 * @param patrolName - name of patrol to parse
 * @returns list of waypoint descriptors
 */
export function parseWaypointsData(patrolName: null): null;
export function parseWaypointsData(patrolName: TPath): LuaTable<TIndex, IWaypointData>;
export function parseWaypointsData(patrolName: Optional<TPath>): Optional<LuaTable<TIndex, IWaypointData>> {
  if (!patrolName) {
    return null;
  }

  const waypointPatrol: Patrol = new patrol(patrolName);
  const count: TCount = waypointPatrol.count();
  const waypointsData: LuaArray<IWaypointData> = new LuaTable();

  for (const point of $range(0, count - 1)) {
    const data: Optional<IWaypointData> = parseWaypointData(
      patrolName,
      waypointPatrol.flags(point),
      waypointPatrol.name(point)
    );

    assert(data, "Error while parsing point '%d' of path '%s'.", point, patrolName);

    waypointsData.set(point, data);
  }

  return waypointsData;
}

/**
 * Parse waypoints data based on parameters overrides.
 * Same as parsing from path patrol, but requires variadic arguments with overrides of index/name.
 *
 * @param patrolName - name of patrol
 * @param pointsCount - count of points in patrol
 * @param args - variadic list of points overrides
 * @returns list of waypoint descriptors
 */
export function parseWaypointsDataFromList(
  patrolName: TName,
  pointsCount: TCount,
  ...args: Array<[TIndex, TName]>
): Optional<LuaTable<TIndex, IWaypointData>> {
  const waypointPatrol: Patrol = new patrol(patrolName);
  const count: TCount = waypointPatrol.count();
  const list: LuaArray<IWaypointData> = new LuaTable();

  assert(
    count === pointsCount,
    "Path '%s' has %d points, but %d points were expected.",
    patrolName,
    count,
    pointsCount
  );

  for (const point of $range(0, count - 1)) {
    const currentArgument = args[point];

    assertDefined(currentArgument, "script error [1] while processing point %d of path '%s'", point, patrolName);

    const flags: Flags32 = new flags32();

    flags.assign(currentArgument[0]);

    list.set(point, parseWaypointData(patrolName, flags, currentArgument[1]));
  }

  return list;
}

/**
 * Parse descriptors for bone index.
 * Matches bone index to related state condlist.
 *
 * @param data - input string to parse
 * @returns list of bone state descriptors
 */
export function parseBoneStateDescriptors(data: Optional<string>): LuaArray<IBoneStateDescriptor> {
  const target: LuaArray<IBoneStateDescriptor> = new LuaTable();

  if (data) {
    for (const name of string.gfind(data, "(%|*%d+%|[^%|]+)%p*")) {
      const [position] = string.find(name, "|", 1, true);
      const index: TIndex = tonumber(string.sub(name, 1, position - 1)) as TIndex;
      const state: Optional<TName> = string.sub(name, position + 1);

      target.set(index, {
        index: index,
        state: state !== null ? parseConditionsList(state) : null,
      });
    }
  }

  return target;
}

/**
 * Utility shortcut to handle string 'nil' values stored in net packets as string.
 *
 * @param value - value to check
 * @returns value or null in case of `nil` string
 */
export function parseStringOptional<T extends StringOptional>(value: Optional<T>): Optional<T> {
  return value === NIL ? null : value;
}

/**
 * Utility shortcut to handle number 'nil' values stored in net packets as string.
 *
 * @param value - value to check
 * @returns parsed number value or null in case of `nil` string
 */
export function parseNumberOptional<T extends StringOptional>(value: T): Optional<number> {
  return value === NIL ? null : (tonumber(value) as number);
}

/**
 * Get scheme name from full section name.
 *
 * @param section - full section name
 * @returns scheme name
 * @example some_name@parameter -> some_name
 */
export function getSchemeFromSection(section: TSection): Optional<EScheme> {
  let [scheme] = string.gsub(section, "%d", "");

  // No match.
  if (!scheme) {
    return null;
  }

  const [at, to] = string.find(scheme, "@", 1, true);

  if (at !== null && to !== null) {
    scheme = string.sub(scheme, 1, at - 1) as EScheme;
  }

  return scheme === "" || !scheme ? null : (scheme as EScheme);
}
