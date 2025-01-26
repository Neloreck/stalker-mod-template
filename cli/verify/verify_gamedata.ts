import * as cp from "child_process";

import { blue } from "chalk";

import { default as config } from "#/config.json";
import { GAME_DATA_LTX_CONFIGS_DIR, RESOURCES_DIR, XRF_UTILS_PATH } from "#/globals";
import { getProjectAssetsRoots } from "#/utils/build";
import { NodeLogger } from "#/utils/logging";
import { TimeTracker } from "#/utils/timing";

const log: NodeLogger = new NodeLogger("VERIFY_GAMEDATA");

export interface IVerifyGamedataParameters {
  verbose?: boolean;
}

/**
 * Verify gamedata files integrity.
 * Check textures/sounds/assets/meshes/animations etc.
 * Allows ensuring validity before running game and crashing in runtime.
 */
export async function verifyGamedata(parameters: IVerifyGamedataParameters = {}): Promise<void> {
  NodeLogger.IS_VERBOSE = Boolean(parameters.verbose);

  log.info("Verifying gamedata files");

  const timeTracker: TimeTracker = new TimeTracker().start();

  const command: string = `${XRF_UTILS_PATH} verify-gamedata -r ${[
    ...getProjectAssetsRoots(config.locale),
    RESOURCES_DIR,
  ].join(",")} -c ${GAME_DATA_LTX_CONFIGS_DIR} ${parameters.verbose ? "-v " : ""}`;

  log.info("Execute:", blue(command));

  try {
    cp.execSync(command, { stdio: "inherit" });
    log.info("Successfully executed verify command, took:", timeTracker.end().getDuration() / 1000, "sec");
  } catch (error) {
    log.error("Gamedata verification command failed in:", timeTracker.end().getDuration() / 1000, "sec");
  }
}
