import * as cp from "child_process";

import { blue } from "chalk";

import { RESOURCES_PARTICLES_UNPACKED_DIR, XRF_UTILS_PATH } from "#/globals";
import { NodeLogger } from "#/utils/logging";
import { TimeTracker } from "#/utils/timing";

const log: NodeLogger = new NodeLogger("VERIFY_PARTICLES_UNPACKED");

export interface IFormatParticlesUnpackedParameters {
  verbose?: boolean;
}

/**
 * Verify game particles files (packed and unpacked).
 */
export async function verifyParticlesUnpacked(parameters: IFormatParticlesUnpackedParameters = {}): Promise<void> {
  NodeLogger.IS_VERBOSE = Boolean(parameters.verbose);

  log.info("Verifying unpacked particles files");

  const timeTracker: TimeTracker = new TimeTracker().start();

  const command: string = `${XRF_UTILS_PATH} verify-particles -p ${RESOURCES_PARTICLES_UNPACKED_DIR} -u`;

  log.info("Execute:", blue(command));
  cp.execSync(command, { stdio: "inherit" });
  log.info("Verified unpacked particles");

  log.info("Successfully executed verify command, took:", timeTracker.end().getDuration() / 1000, "sec");
}
