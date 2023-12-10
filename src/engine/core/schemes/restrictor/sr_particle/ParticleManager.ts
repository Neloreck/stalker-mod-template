import { particles_object, patrol, time_global } from "xray16";

import { AbstractSchemeManager } from "@/engine/core/ai/scheme";
import { particleConfig } from "@/engine/core/schemes/restrictor/sr_particle/ParticleConfig";
import {
  EParticleBehaviour,
  IParticleDescriptor,
  ISchemeParticleState,
} from "@/engine/core/schemes/restrictor/sr_particle/sr_particale_types";
import { abort } from "@/engine/core/utils/assertion";
import { IWaypointData, parseWaypointsData } from "@/engine/core/utils/ini";
import { trySwitchToAnotherSection } from "@/engine/core/utils/scheme/scheme_switch";
import { LuaArray, Optional, ParticlesObject, Patrol, TCount, TName, TTimestamp, Vector } from "@/engine/lib/types";

/**
 * todo;
 * todo: Should be table insert + ipairs where possible instead of $range loops.
 */
export class ParticleManager extends AbstractSchemeManager<ISchemeParticleState> {
  public nextUpdateAt: TTimestamp = 0;

  public isStarted: boolean = false;
  public isFirstPlayed: boolean = false;
  public particles: LuaArray<IParticleDescriptor> = new LuaTable();
  public path: Optional<Patrol> = null;

  public override activate(): void {
    const now: TTimestamp = time_global();

    if (this.state.mode === EParticleBehaviour.COMPLEX) {
      const path: Patrol = new patrol(this.state.path);
      const flags: LuaArray<IWaypointData> = parseWaypointsData(this.state.path)!;

      this.path = path;

      // Make sure order is maintained with range loop.
      for (const it of $range(1, path.count())) {
        const waypointData: IWaypointData = flags.get(it - 1);
        const soundName: Optional<TName> = waypointData.s as Optional<TName>;
        const delay: TCount = waypointData["d"] ? tonumber(waypointData["d"]) ?? 0 : 0;

        /**
         *     local sound_name = nil
         *            if flags[a - 1]["s"] ~= nil then
         *               sound_name = flags[a - 1]["s"]
         *            end
         *            local snd_obj = nil
         *            if sound_name ~= nil and sound_name ~= "" then
         *               snd_obj = xr_sound.get_sound_object(sound_name, "random")
         *            end
         */

        if (soundName) {
          abort("Dev trap: waypoint with sound for particles manager '%s' - '%s'.", soundName, this.state.path);
        }

        this.particles.set(it, {
          particle: new particles_object(this.state.name),
          sound: null,
          delay,
          time: now,
          played: false,
        });
      }
    } else {
      this.path = null;

      this.particles.set(1, {
        particle: new particles_object(this.state.name),
        sound: null,
        delay: 0,
        time: now,
        played: false,
      });
    }

    this.nextUpdateAt = 0;
    this.isStarted = false;
    this.isFirstPlayed = false;
    this.state.signals = new LuaTable();
  }

  public override deactivate(): void {
    // Make sure order is maintained with range loop.
    for (const it of $range(1, this.particles.length())) {
      const descriptor: IParticleDescriptor = this.particles.get(it);

      if (descriptor.particle.playing()) {
        descriptor.particle.stop();
      }

      descriptor.particle = null as unknown as ParticlesObject;

      if (descriptor.sound?.playing()) {
        descriptor.sound.stop();
      }

      descriptor.sound = null;
    }
  }

  public update(): void {
    const now: TTimestamp = time_global();

    if (this.nextUpdateAt < now) {
      this.nextUpdateAt = now + particleConfig.UPDATE_PERIOD_THROTTLE;
    } else {
      return;
    }

    if (this.isStarted) {
      if (this.state.mode === EParticleBehaviour.SIMPLE) {
        this.updateSimple();
      } else {
        this.updateComplex();
      }

      this.isEnded();

      trySwitchToAnotherSection(this.object, this.state);
    } else {
      this.isStarted = true;

      // todo: probably call separate update methods based on first played flag and simplify update loop.
      if (this.state.mode === EParticleBehaviour.SIMPLE) {
        this.startSimple();
      }

      return;
    }
  }

  /**
   * Handle first update as `start` in simple mode.
   */
  public startSimple(): void {
    const descriptor: IParticleDescriptor = this.particles.get(1);

    descriptor.particle.load_path(this.state.path);
    descriptor.particle.start_path(this.state.looped);
    descriptor.particle.play();
    descriptor.played = true;

    this.isFirstPlayed = true;
  }

  /**
   * Handle simple playback scenario.
   * Restarts particle playback if `loop` is enabled.
   */
  public updateSimple(): void {
    if (this.state.looped) {
      const particle: ParticlesObject = this.particles.get(1).particle;

      if (!particle.playing()) {
        particle.play();
      }
    }
  }

  /**
   * Handle complex playback scenario.
   */
  public updateComplex(): void {
    const now: TTimestamp = time_global();

    // Make sure order is maintained with range loop.
    for (const it of $range(1, this.particles.length())) {
      const descriptor: IParticleDescriptor = this.particles.get(it);

      if (now - descriptor.time >= descriptor.delay && !descriptor.particle.playing()) {
        const position: Vector = this.path!.point(it - 1);

        // todo: Probably just one simple `or` check.
        if (!descriptor.played) {
          descriptor.particle.play_at_pos(position);

          if (descriptor.sound) {
            descriptor.sound.play_at_pos(this.object, position, 0);
          }

          descriptor.played = true;

          this.isFirstPlayed = true;
        } else if (this.state.looped) {
          descriptor.particle.play_at_pos(position);

          if (descriptor.sound) {
            descriptor.sound.play_at_pos(this.object, position, 0);
          }
        }
      }
    }
  }

  /**
   * Note: has side effect with set signal.
   *
   * @returns whether particle playback is ended
   */
  public isEnded(): boolean {
    if (this.state.looped || !this.isFirstPlayed) {
      return false;
    }

    const count: TCount = this.particles.length();

    if (count === 0) {
      return true;
    }

    // Make sure order is maintained with range loop.
    for (const it of $range(1, count)) {
      if (this.particles.get(it).particle.playing()) {
        return false;
      }
    }

    this.state.signals!.set("particle_end", true);

    return true;
  }
}
