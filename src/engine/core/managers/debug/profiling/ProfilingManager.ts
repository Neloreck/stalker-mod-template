import { profile_timer } from "xray16";

import { AbstractManager } from "@/engine/core/managers/abstract";
import { IProfileSnapshotDescriptor } from "@/engine/core/managers/debug/debug_types";
import { abort } from "@/engine/core/utils/assertion";
import { executeConsoleCommand } from "@/engine/core/utils/console";
import { ELuaLoggerMode, LuaLogger } from "@/engine/core/utils/logging";
import { forgeConfig } from "@/engine/lib/configs/ForgeConfig";
import { consoleCommands } from "@/engine/lib/constants/console_commands";
import { AnyCallable, LuaArray, Optional, ProfileTimer, TCount, TDuration, TName } from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename, { mode: ELuaLoggerMode.DUAL, file: "profiling" });

/**
 * Manager to profile lua methods frequency calls and measure duration of functions execution.
 */
export class ProfilingManager extends AbstractManager {
  // Store of manually created profiling portion durations. Stores time in `microseconds`.
  public profilingPortions: LuaTable<AnyCallable | TName, LuaArray<TDuration>> = new LuaTable();

  public countersMap: LuaTable<AnyCallable, IProfileSnapshotDescriptor> = new LuaTable();
  public namesMap: LuaTable<AnyCallable, debug.FunctionInfo> = new LuaTable();
  public callsCountMap: LuaTable<AnyCallable, { info: debug.FunctionInfo; count: TCount }> = new LuaTable();

  public profilingTimer: ProfileTimer = new profile_timer();
  public isProfilingStarted: boolean = false;

  /**
   * c - call statements profiling.
   * r - return statements profiling to count function returns.
   */
  public mode: string = "r";

  /**
   * Initialize profiling manager automatically based on current preferences.
   * Hook up automatic profiling instantly if needed.
   */
  public override initialize(): void {
    if (forgeConfig.DEBUG.IS_PROFILING_ENABLED) {
      this.start();
    }
  }

  /**
   * Destroy manager - clear data and bound hooks.
   */
  public override destroy(): void {
    this.stop();
  }

  /**
   * Force collection of lua garbage.
   * Finds all not reachable objects and disposes them.
   */
  public collectLuaGarbage(): void {
    collectgarbage("collect");
  }

  /**
   * Get currently used RAM volume by lua VM.
   *
   * @returns count of used RAM in kilobytes
   */
  public getLuaMemoryUsed(): TCount {
    return collectgarbage("count");
  }

  /**
   * Get string descriptor of any function in lua by debug information.
   *
   * @param info - debug information describing function state in stack
   * @returns function name descriptor based on debug information
   */
  public getFunctionName(info: debug.FunctionInfo): string {
    if (info === null) {
      return "[unknown]";
    }

    return string.format(
      "[%s]:%s-%s (%s:%s)",
      info.short_src,
      info.linedefined,
      info.lastlinedefined,
      info.what,
      info.name ?? "???"
    );
  }

  /**
   * Start profiling of lua execution - attach hooks and start measuring time/counts of executions.
   */
  public start(): void {
    logger.info("Start profiling manager in mode: %s", this.mode);

    if (jit !== null) {
      logger.info("Take care, jit is enabled so profiling stats may be incorrect");
      logger.info("For correct profiling run game with '-nojit' flag");
    }

    // Ensure all conditions for profiling start are met
    if (debug !== null) {
      logger.info("Profiling enabled, going to setup hook");
      this.setupHook();
    } else {
      logger.info("Debug is not enabled, skip profiling");
    }
  }

  /**
   * Reset stats and clear hook if it is attached.
   */
  public stop(): void {
    if (this.isProfilingStarted) {
      this.clearHook();
    }

    this.callsCountMap = new LuaTable();
    this.countersMap = new LuaTable();
    this.namesMap = new LuaTable();
    this.profilingTimer = new profile_timer();
  }

  /**
   * Setups lua debug/profile hook based on provided mode.
   *
   * @param mode - mode mask to run hook in
   * @param skipLogs - whether information about hook setup should be logged (usually turned off for restart)
   */
  public setupHook(mode: string = this.mode, skipLogs?: boolean): void {
    this.mode = mode;

    if (this.isProfilingStarted) {
      logger.info("Skip setup, already started");

      return;
    } else if (!debug) {
      logger.info("Tried to setup hook, but debug is not enabled");
      abort("Tried to setup hook when debug is not enabled, got 'null' at debug place.");
    }

    this.profilingTimer.start();

    debug.sethook();
    debug.sethook((context) => this.hook(context), this.mode);

    this.isProfilingStarted = true;

    if (!skipLogs) {
      logger.info("Profiler is activated");
    }
  }

  /**
   * Detach profiling hook from debugging context.
   */
  public clearHook(): void {
    if (!this.isProfilingStarted) {
      logger.info("Profiler hook wasn't setup!");

      return;
    }

    debug.sethook();

    this.profilingTimer.stop();
    this.isProfilingStarted = false;
  }

  /**
   * Hook function that is called by debug module every time function executes/returns/line changes.
   * Based on debug mask provided for hook setup.
   *
   * @param context - context of hook call based on call case
   */
  protected hook(context: string): void {
    logger.info("Skip setup, already started");

    const caller = debug.getinfo(3, "f")!;
    const functionInfo: debug.FunctionInfo = debug.getinfo(2)!;
    const functionRef: AnyCallable = functionInfo.func as AnyCallable;
    const callerRef: Optional<AnyCallable> = caller === null ? null : (caller.func as AnyCallable);

    switch (context) {
      case "return": {
        const countersRecord: IProfileSnapshotDescriptor = this.countersMap.get(functionRef);

        if (countersRecord !== null) {
          countersRecord.currentTimer.stop();
          countersRecord.childTimer.stop();

          if (callerRef !== null) {
            const object: IProfileSnapshotDescriptor = this.countersMap.get(callerRef);

            if (object !== null) {
              object.currentTimer.start();
            }
          }
        }

        // Count number of returns from function.
        const record = this.callsCountMap.get(functionRef) || { count: 0, info: functionInfo };

        record.count += 1;
        this.callsCountMap.set(functionRef, record);

        return;
      }

      case "tail return": {
        if (callerRef !== null) {
          const object: IProfileSnapshotDescriptor = this.countersMap.get(callerRef);

          if (object !== null) {
            object.currentTimer.start();
          }
        }

        // Count number of returns from function.
        const record = this.callsCountMap.get(functionRef) || { count: 0, info: functionInfo };

        record.count += 1;
        this.callsCountMap.set(functionRef, record);

        return;
      }

      case "call": {
        if (callerRef !== null) {
          const object: IProfileSnapshotDescriptor = this.countersMap.get(callerRef);

          if (object !== null) {
            object.currentTimer.stop();
          }
        }

        if (this.countersMap.get(functionRef) === null) {
          this.countersMap.set(functionRef, {
            count: 1,
            currentTimer: new profile_timer(),
            childTimer: new profile_timer(),
          });

          const object: IProfileSnapshotDescriptor = this.countersMap.get(functionRef);

          object.childTimer.start();
          object.currentTimer.start();
          this.namesMap.set(functionRef, debug.getinfo(2, "Sn") as debug.FunctionInfo);
        } else {
          const object: IProfileSnapshotDescriptor = this.countersMap.get(functionRef);

          object.count = object.count + 1;
          object.childTimer.start();
          object.currentTimer.start();
        }

        return;
      }
    }
  }

  /**
   * Print calls measurement stats based on automated hook profiling observation.
   *
   * @param limit - count of captured call stats to print
   */
  public logHookedCallsCountStats(limit: TCount = 128): void {
    if (!this.isProfilingStarted) {
      return logger.info("Profiler hook wasn't setup, no stats found");
    }

    this.clearHook();

    const sortedStats: LuaTable<TName, TCount> = new LuaTable();

    for (const [func, funcDetails] of this.callsCountMap) {
      const name: TName = this.getFunctionName(funcDetails.info);
      const count: Optional<TCount> = sortedStats.get(name);

      sortedStats.set(name, count === null ? funcDetails.count : count + funcDetails.count);
    }

    let totalCallsCount: number = 0;
    const outStats: LuaTable<number, { name: TName; count: TCount }> = new LuaTable();

    for (const [name, count] of sortedStats) {
      table.insert(outStats, { name: name === "[[C]]:-1" ? "#uncrecognized C/C++ stuff" : name, count: count });
      totalCallsCount = totalCallsCount + count;
    }

    table.sort(outStats, (left, right) => left.count > right.count);

    /**
     * Print summary of profiled calls count data:
     */

    logger.pushEmptyLine();
    logger.info("==================================================================================================");
    logger.info("Total calls stat, limit: %s JIT: %s", limit, jit !== null);
    logger.info("==================================================================================================");

    let printedCount: TCount = 0;

    // Print top stats from list (controlled by limit)
    for (const [idx, stat] of outStats) {
      if (printedCount < limit) {
        logger.info(
          string.format("[%2d] %6d (%5.2f) : %s", idx, stat.count, (stat.count * 100) / totalCallsCount, stat.name)
        );
        printedCount++;
      } else {
        break;
      }
    }

    logger.info("==================================================================================================");
    logger.info("Total function calls count: %s", totalCallsCount);
    logger.info("Total function calls / sec: %s", totalCallsCount / (this.profilingTimer.time() / 1000 / 1000));
    logger.info("Total unique LUA functions called: %s", outStats.length());
    logger.info("Profiling time: %s", this.profilingTimer.time() / 1000);
    logger.info("RAM used: %s MB", this.getLuaMemoryUsed() / 1024);
    logger.info("==================================================================================================");
    logger.pushEmptyLine();

    executeConsoleCommand(consoleCommands.flush);

    this.setupHook(this.mode, true);
  }

  /**
   * Print manual measurement stats based on pushed profiling portions.
   *
   * @param limit - count of captured call stats to print
   */
  public logProfilingPortionsStats(limit: TCount = 128): void {
    let totalCalls: TCount = 0;
    let totalDuration: TDuration = 0;

    const stats: LuaArray<{
      min: TDuration;
      max: TDuration;
      avg: TDuration;
      sum: TDuration;
      count: TCount;
      src: TName;
    }> = new LuaTable();

    for (const [func, calls] of this.profilingPortions) {
      const summary = {
        src: typeof func === "string" ? func : this.getFunctionName(debug.getinfo(func)),
        count: 0,
        avg: 0,
        min: Infinity,
        max: -Infinity,
        sum: 0,
      };

      for (const [, duration] of calls) {
        summary.count += 1;
        summary.sum += duration;

        if (summary.min > duration) {
          summary.min = duration;
        }

        if (summary.max < duration) {
          summary.max = duration;
        }
      }

      summary.avg = summary.sum / summary.count;

      totalCalls += summary.count;
      totalDuration += summary.sum;

      table.insert(stats, summary);
    }

    table.sort(stats, (left, right) => left.sum > right.sum);

    if (table.size(stats) === 0) {
      logger.pushEmptyLine();
      logger.info("==================================================================================================");
      logger.info("No custom profiling portions captured yet");
      logger.info("==================================================================================================");

      return;
    }

    /**
     * Print summary of profiled calls count data:
     */

    logger.pushEmptyLine();
    logger.info("==================================================================================================");
    logger.info("Total portions calls stat, limit: %s JIT: %s", limit, jit !== null);
    logger.info("==================================================================================================");

    let printedCount: TCount = 0;

    // Print top stats from list (controlled by limit)
    for (const [, stat] of stats) {
      if (printedCount < limit) {
        logger.info(
          string.format(
            "[%3d] [%5.f | %8.3f | %10.f] %12d (%5.2f%%) %8d (%5.2f%%): %s",
            printedCount + 1,
            stat.min,
            stat.avg,
            stat.max,
            stat.sum,
            (stat.sum * 100) / totalDuration,
            stat.count,
            (stat.count * 100) / totalCalls,
            stat.src
          )
        );
        printedCount++;
      } else {
        break;
      }
    }

    logger.info("==================================================================================================");
    logger.info("Total function calls count: %s", totalCalls);
    logger.info("RAM used: %s MB", this.getLuaMemoryUsed() / 1024);
    logger.info("==================================================================================================");
    logger.pushEmptyLine();

    executeConsoleCommand(consoleCommands.flush);
  }
}
