import type { IBaseSchemeLogic } from "@/engine/core/database/database_types";
import { abort, assert } from "@/engine/core/utils/assertion";
import {
  parseConditionsList,
  parseNumbersList,
  parseParameters,
  parseStringsList,
  parseStringsSet,
} from "@/engine/core/utils/ini/ini_parse";
import { IniFile, LuaArray, Optional, TCount, TName, TSection } from "@/engine/lib/types";

/**
 * Read string field from provided ini file section.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param prefix - prefix for return values
 * @param defaultValue - value to use in case if ini field is missing
 * @returns value from ini file section or default value if section is not declared in ini
 */
export function readIniString<D = string>(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  prefix: Optional<string> = null,
  defaultValue: D = null as unknown as D
): D {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    // todo: Resolve prefix. Probably should change order of default value and prefix.
    if (prefix && prefix !== "") {
      return string.format("%s_%s", prefix, ini.r_string(section, field)) as D;
    } else {
      return ini.r_string(section, field) as D;
    }
  }

  if (required) {
    return abort("Attempt to read a non-existent string field '%s' in section '%s'.", field, section);
  }

  return defaultValue as D;
}

/**
 * Read string field from provided ini file section.
 * WB variants preserves spaces in read data and strips quotes from original data.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param prefix - prefix for return values
 * @param defaultValue - value to use in case if ini field is missing
 * @returns value from ini file section or default value if section is not declared in ini
 */
export function readIniStringWB<D = string>(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  prefix: Optional<string> = null,
  defaultValue: D = null as unknown as D
): D {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    // todo: Resolve prefix. Probably should change order of default value and prefix.
    if (prefix && prefix !== "") {
      return string.format("%s_%s", prefix, ini.r_string_wb(section, field)) as D;
    } else {
      return ini.r_string_wb(section, field) as D;
    }
  }

  if (required) {
    return abort("Attempt to read a non-existent string field '%s' in section '%s'.", field, section);
  }

  return defaultValue as D;
}

/**
 * Read string list field from provided ini file section and parse as comma separated array.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param defaultValue - value to use in case if ini field is missing
 * @returns list from ini file section or parsed default value if section is not declared in ini
 */
export function readIniStringList<D extends string = string>(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  defaultValue: Optional<string> = null
): LuaArray<D> {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    return parseStringsList(ini.r_string(section, field) as string);
  } else if (required) {
    return abort("Attempt to read a non-existent string field '%s' in section '%s'.", field, section);
  }

  if (defaultValue) {
    return parseStringsList(defaultValue);
  } else {
    return new LuaTable();
  }
}

/**
 * Read string list field from provided ini file section and parse as comma separated set.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param defaultValue - value to use in case if ini field is missing
 * @returns set from ini file section or parsed default value if section is not declared in ini
 */
export function readIniStringSet<D extends string = string>(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  defaultValue: Optional<string> = null
): LuaTable<D, boolean> {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    return parseStringsSet(ini.r_string(section, field) as string);
  } else if (required) {
    return abort("Attempt to read a non-existent string field '%s' in section '%s'.", field, section);
  }

  if (defaultValue) {
    return parseStringsSet(defaultValue);
  } else {
    return new LuaTable();
  }
}

/**
 * Read string field from provided ini file section.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param defaultValue - value to use in case if ini field is missing
 * @returns value from ini file section or default value if section is not declared in ini
 */
export function readIniNumber<D = number>(
  ini: IniFile,
  section: TSection,
  field: TName,
  required?: boolean,
  defaultValue: D = null as unknown as D
): number | D {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    return ini.r_float(section, field);
  }

  if (required) {
    return abort("Attempt to read a non-existent number field '%s' in section '%s'.", field, section);
  }

  return defaultValue as number;
}

/**
 * Read number list field from provided ini file section and parse as comma separated array.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param defaultValue - value to use in case if ini field is missing
 * @returns list from ini file section or parsed default value if section is not declared in ini
 */
export function readIniNumberList<D extends number = number>(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  defaultValue: Optional<string> = null
): LuaArray<D> {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    return parseNumbersList(ini.r_string(section, field) as string);
  } else if (required) {
    return abort("Attempt to read a non-existent string field '%s' in section '%s'.", field, section);
  }

  if (defaultValue) {
    return parseNumbersList(defaultValue);
  } else {
    return new LuaTable();
  }
}

/**
 * Read string field from provided ini file section.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param required - whether field is required, throw exception if field is required and not present
 * @param defaultValue - value to use in case if ini field is missing
 * @returns value from ini file section or default value if section is not declared in ini
 */
export function readIniBoolean(
  ini: IniFile,
  section: Optional<TSection>,
  field: TName,
  required?: boolean,
  defaultValue: Optional<boolean> = null
): boolean {
  if (section && ini.section_exist(section) && ini.line_exist(section, field)) {
    return ini.r_bool(section, field);
  }

  if (required) {
    return abort("Attempt to read a non-existent boolean field '%s' in section '%s'", field, section);
  }

  if (defaultValue !== null) {
    return defaultValue;
  }

  return false;
}

/**
 * Get two numbers from ini line.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @param default1 - first default value if config is missing
 * @param default2 - second default value if config is missing
 * @returns two numbers as multi return
 */
export function readIniTwoNumbers(
  ini: IniFile,
  section: Optional<TName>,
  field: TName,
  default1: number,
  default2: number
): LuaMultiReturn<[number, number]> {
  if (ini.line_exist(section, field)) {
    const numbersList: LuaArray<number> = parseNumbersList(ini.r_string(section as TName, field));

    return $multi(numbersList.get(1) || default1, numbersList.get(2) || default2);
  } else {
    return $multi(default1, default2);
  }
}

/**
 * Read from ini config conditions list without additional parameters.
 * Sample data format: `condlist`
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @returns logics scheme object
 */
export function readIniConditionList(ini: IniFile, section: TSection, field: TName): Optional<IBaseSchemeLogic> {
  const data: Optional<string> = readIniString(ini, section, field);

  if (!data) {
    return null;
  }

  const parameters: LuaArray<string> = parseParameters(data);

  assert(parameters.get(1), "Invalid syntax in conditions list: '%s'.", data);

  return {
    name: field,
    condlist: parseConditionsList(parameters.get(1)),
    objectId: null,
    p1: null,
    p2: null,
  };
}

/**
 * Read from ini config string and following conditions list after it.
 * Sample data format: `string | condlist`
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @returns logics scheme object
 */
export function readIniStringAndCondList(ini: IniFile, section: TSection, field: TName): Optional<IBaseSchemeLogic> {
  const data: string = readIniString(ini, section, field);

  if (!data) {
    return null;
  }

  const parameters: LuaArray<string> = parseParameters(data);

  assert(parameters.get(1) && parameters.get(2), "Invalid syntax in condlist.");

  return {
    name: field,
    condlist: parseConditionsList(parameters.get(2)),
    objectId: null,
    p1: parameters.get(1),
    p2: null,
  };
}

/**
 * Read from ini config number and following conditions list after it.
 * Sample data format: `number | condlist`
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @returns logics scheme object
 */
export function readIniNumberAndConditionList(
  ini: IniFile,
  section: TSection,
  field: TName
): Optional<IBaseSchemeLogic> {
  const data: Optional<string> = readIniString(ini, section, field);

  if (!data) {
    return null;
  }

  const parameters: LuaArray<string> = parseParameters(data);

  assert(parameters.get(1) && parameters.get(2), "Invalid syntax in condlist.");

  return {
    name: field,
    condlist: parseConditionsList(parameters.get(2)),
    objectId: null,
    p1: tonumber(parameters.get(1))!,
    p2: null,
  };
}

/**
 * Read from ini config string and following conditions list after it.
 * Sample data format: `string | string | condlist`
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @param field - section field to read
 * @returns logics scheme object
 */
export function readIniTwoStringsAndConditionsList(
  ini: IniFile,
  section: TSection,
  field: TName
): Optional<IBaseSchemeLogic> {
  const data: string = readIniString(ini, section, field);

  if (!data) {
    return null;
  }

  const parameters: LuaArray<string> = parseParameters(data);

  assert(parameters.get(1) && parameters.get(2) && parameters.get(3), "Invalid syntax in condlist: '%s'.", data);

  return {
    name: field,
    condlist: parseConditionsList(parameters.get(3)),
    objectId: null,
    p1: parameters.get(1),
    p2: parameters.get(2),
  };
}

/**
 * Read section fields and transform to set.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @returns set transformed from ini section
 */
export function readIniSectionAsSet<T extends string = string>(ini: IniFile, section: TSection): LuaTable<T, boolean> {
  const set: LuaTable<T, boolean> = new LuaTable();

  if (ini.section_exist(section)) {
    const count: TCount = ini.line_count(section);

    for (const index of $range(0, count - 1)) {
      const [, field] = ini.r_line(section, index, "", "");

      set.set(field as T, true);
    }
  }

  return set;
}

/**
 * Read sections list from ini file.
 *
 * @param ini - config file to read
 * @returns list of sections from ini file
 */
export function readIniSectionsAsList<T extends TSection = TSection>(ini: IniFile): LuaArray<T> {
  const list: LuaArray<T> = new LuaTable();

  ini.section_for_each((it) => table.insert(list, it as T));

  return list;
}

/**
 * Read section fields list from ini file.
 *
 * @param ini - config file to read data from
 * @param section - section to read fields from
 * @returns list of section fields from ini file
 */
export function readIniFieldsAsList<T extends string = string>(ini: IniFile, section: TSection): LuaArray<T> {
  const list: LuaArray<T> = new LuaTable();
  const count: TCount = ini.line_count(section);

  for (const it of $range(0, count - 1)) {
    const [, field] = ini.r_line(section, it, "", "");

    table.insert(list, field as T);
  }

  return list;
}

/**
 * Read section fields list from ini file.
 *
 * @param ini - config file to read data from
 * @param section - section to read fields from
 * @returns set of section fields from ini file
 */
export function readIniFieldsAsSet<T extends string = string>(ini: IniFile, section: TSection): LuaTable<T, boolean> {
  const list: LuaTable<T, boolean> = new LuaTable();
  const count: TCount = ini.line_count(section);

  for (const it of $range(0, count - 1)) {
    const [, field] = ini.r_line(section, it, "", "");

    list.set(field as T, true);
  }

  return list;
}

/**
 * Read sections set from ini file.
 *
 * @param ini - config file to read
 * @returns set of sections from ini file
 */
export function readIniSectionsAsSet<T extends TSection = TSection>(ini: IniFile): LuaTable<T, boolean> {
  const list: LuaTable<T, boolean> = new LuaTable();

  ini.section_for_each((it) => list.set(it as T, true));

  return list;
}

/**
 * Read section fields and transform to string based map.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @returns map transformed from ini section
 */
export function readIniSectionAsStringMap<K extends string = string, V extends string = string>(
  ini: IniFile,
  section: TSection
): LuaTable<K, V> {
  const list: LuaTable<K, V> = new LuaTable();

  if (ini.section_exist(section)) {
    const count: TCount = ini.line_count(section);

    for (const index of $range(0, count - 1)) {
      const [, key, value] = ini.r_line(section, index, "", "");

      list.set(key as K, value as V);
    }
  }

  return list;
}

/**
 * Read section fields and transform to string based map with number values.
 *
 * @param ini - config file to read
 * @param section - config section to read
 * @returns map transformed from ini section
 */
export function readIniSectionAsNumberMap<K extends string = string, V extends number = number>(
  ini: IniFile,
  section: TSection
): LuaTable<K, V> {
  const list: LuaTable<K, V> = new LuaTable();

  if (ini.section_exist(section)) {
    const count: TCount = ini.line_count(section);

    for (const index of $range(0, count - 1)) {
      const [, key, value] = ini.r_line(section, index, "", "");

      list.set(key as K, tonumber(value) as V);
    }
  }

  return list;
}
