import { get_hud, level } from "xray16";

import { AbstractSchemeManager } from "@/engine/core/ai/scheme";
import { getPortableStoreValue, registry, setPortableStoreValue } from "@/engine/core/database";
import { PsyAntennaManager } from "@/engine/core/managers/psy/PsyAntennaManager";
import {
  EAntennaState,
  ISchemePsyAntennaState,
} from "@/engine/core/schemes/restrictor/sr_psy_antenna/sr_psy_antenna_types";
import { LuaLogger } from "@/engine/core/utils/logging";
import { trySwitchToAnotherSection } from "@/engine/core/utils/scheme/scheme_switch";
import { NIL } from "@/engine/lib/constants/words";
import { GameObject } from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename, { file: "psy" });

/**
 * todo;
 */
export class PsyAntennaSchemaManager extends AbstractSchemeManager<ISchemePsyAntennaState> {
  public antennaState: EAntennaState = EAntennaState.VOID;
  public antennaManager: PsyAntennaManager = PsyAntennaManager.getInstance();

  public override activate(object: GameObject, loading?: boolean): void {
    logger.info("Activate antenna manager");

    if (loading) {
      this.antennaState = getPortableStoreValue(this.object.id(), "inside")!;
    }

    if (this.antennaState === EAntennaState.INSIDE) {
      this.onZoneLeave();
    }

    this.antennaState = EAntennaState.VOID;

    this.switchState(registry.actor);
  }

  public override deactivate(): void {
    logger.info("Deactivate antenna manager");

    if (this.antennaState === EAntennaState.INSIDE) {
      this.onZoneLeave();
    }
  }

  public update(): void {
    if (trySwitchToAnotherSection(this.object, this.state)) {
      return;
    }

    this.switchState(registry.actor);
  }

  /**
   * todo: Description.
   */
  public switchState(actor: GameObject): void {
    if (this.antennaState !== EAntennaState.INSIDE) {
      if (this.object.inside(actor.position())) {
        return this.onZoneEnter();
      }
    } else {
      if (!this.object.inside(actor.position())) {
        return this.onZoneLeave();
      }
    }
  }

  /**
   * todo: Description.
   */
  public onZoneEnter(): void {
    logger.info("Enter psy antenna zone");

    this.antennaState = EAntennaState.INSIDE;

    get_hud().enable_fake_indicators(true);

    this.antennaManager.soundIntensityBase = this.antennaManager.soundIntensityBase + this.state.intensity;
    this.antennaManager.muteSoundThreshold = this.antennaManager.muteSoundThreshold + this.state.muteSoundThreshold;
    this.antennaManager.hitIntensity = this.antennaManager.hitIntensity + this.state.hitIntensity;
    this.antennaManager.phantomSpawnProbability = this.antennaManager.phantomSpawnProbability + this.state.phantomProb;

    this.antennaManager.noStatic = this.state.noStatic;
    this.antennaManager.noMumble = this.state.noMumble;
    this.antennaManager.hitType = this.state.hitType;
    this.antennaManager.hitFreq = this.state.hitFreq;

    if (this.state.postprocess === NIL) {
      return;
    }

    if (!this.antennaManager.postprocess.has(this.state.postprocess)) {
      this.antennaManager.postprocessCount += 1;
      this.antennaManager.postprocess.set(this.state.postprocess, {
        intensityBase: 0,
        intensity: 0,
        idx: 1500 + this.antennaManager.postprocessCount,
      });

      level.add_pp_effector(
        this.state.postprocess,
        this.antennaManager.postprocess.get(this.state.postprocess).idx,
        true
      );
      level.set_pp_effector_factor(this.antennaManager.postprocess.get(this.state.postprocess).idx, 0.01);
    }

    this.antennaManager.postprocess.get(this.state.postprocess).intensityBase =
      this.antennaManager.postprocess.get(this.state.postprocess).intensityBase + this.state.intensity;
  }

  /**
   * todo: Description.
   */
  public onZoneLeave(): void {
    logger.info("Leave psy antenna zone");

    this.antennaState = EAntennaState.OUTSIDE;

    get_hud().enable_fake_indicators(false);

    this.antennaManager.soundIntensityBase -= this.state.intensity;
    this.antennaManager.muteSoundThreshold -= this.state.muteSoundThreshold;
    this.antennaManager.hitIntensity -= this.state.hitIntensity;

    this.antennaManager.phantomSpawnProbability -= this.state.phantomProb;

    if (this.state.postprocess === NIL) {
      return;
    }

    if (this.antennaManager.postprocess.has(this.state.postprocess)) {
      this.antennaManager.postprocess.get(this.state.postprocess).intensityBase -= this.state.intensity;
    }
  }

  public save(): void {
    setPortableStoreValue(this.object.id(), "inside", this.antennaState);
  }
}
