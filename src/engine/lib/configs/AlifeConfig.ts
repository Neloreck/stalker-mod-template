import { ini_file } from "xray16";

import { readIniNumber } from "@/engine/core/utils/ini";
import { IniFile } from "@/engine/lib/types";

export const ALIFE_CONFIG_LTX: IniFile = new ini_file("alife.ltx");

// todo: Move to simulation?
export const alifeConfig = {
  OBJECT_CAPTURE_SCRIPT_NAME: "xrf",
  SWITCH_DISTANCE: readIniNumber(ALIFE_CONFIG_LTX, "alife", "switch_distance", true),
  SWITCH_DISTANCE_SQR: Math.pow(readIniNumber(ALIFE_CONFIG_LTX, "alife", "switch_distance", true), 2),
  OBJECT_INITIAL_SPAWN_BUFFER_TIME: readIniNumber(ALIFE_CONFIG_LTX, "alife", "object_initial_spawn_buffer_time", true),
  OBJECTS_PER_UPDATE: readIniNumber(ALIFE_CONFIG_LTX, "alife", "objects_per_update", true),
};
