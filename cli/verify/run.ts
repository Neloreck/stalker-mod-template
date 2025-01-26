import { Command, Option } from "commander";

import { verifyGamedata } from "#/verify/verify_gamedata";
import { verifyLtx } from "#/verify/verify_ltx";
import { verifyParticlesPacked } from "#/verify/verify_particles_packed";
import { verifyParticlesUnpacked } from "#/verify/verify_particles_unpacked";
import { verifyProject } from "#/verify/verify_project";

/**
 * Setup verify commands.
 */
export function setupVerifyCommands(command: Command): void {
  const verifyCommand: Command = command.command("verify").description("custom verification commands");

  verifyCommand.command("project").description("verify state of ltx project").action(verifyProject);

  verifyCommand
    .command("gamedata")
    .description("verify gamedata integrity")
    .addOption(new Option("-v, --verbose", "Whether verbose logging mode is enabled").default(false))
    .action(verifyGamedata);

  verifyCommand
    .command("ltx")
    .description("verify ltx projects integrity and types")
    .addOption(new Option("-s, --strict", "Run ltx checker in strict mode").default(false))
    .addOption(new Option("-v, --verbose", "Whether verbose logging mode is enabled").default(false))
    .action(verifyLtx);

  verifyCommand
    .command("particles-packed")
    .description("verify packed particles")
    .addOption(new Option("-v, --verbose", "Whether verbose logging mode is enabled").default(false))
    .action(verifyParticlesPacked);

  verifyCommand
    .command("particles-unpacked")
    .description("verify unpacked particles")
    .addOption(new Option("-v, --verbose", "Whether verbose logging mode is enabled").default(false))
    .action(verifyParticlesUnpacked);
}
