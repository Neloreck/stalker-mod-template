import { EPlayableSound } from "@/engine/core/managers/sounds/sounds_types";
import { readIniString } from "@/engine/core/utils/ini";
import {
  AnyArgs,
  GameObject,
  IniFile,
  NetPacket,
  NetProcessor,
  Optional,
  SoundObject,
  TNumberId,
  TPath,
  TRate,
} from "@/engine/lib/types";
import { TSection } from "@/engine/lib/types/scheme";

/**
 * todo;
 */
export abstract class AbstractPlayableSound {
  public abstract readonly type: EPlayableSound;

  public readonly section: TSection;
  public path: TPath;
  public soundObject: Optional<SoundObject> = null;
  public shouldPlayAlways: boolean = false;

  protected constructor(ini: IniFile, section: TSection) {
    this.section = section;
    this.path = readIniString(ini, section, "path", true);
  }

  /**
   * todo: Description.
   */
  public isPlaying(...args: AnyArgs): boolean {
    return this.soundObject === null ? false : this.soundObject.playing();
  }

  /**
   * todo: Description.
   */
  public stop(...args: AnyArgs): void {
    if (this.soundObject) {
      this.soundObject.stop();
    }
  }

  /**
   * todo: Description.
   */
  public setVolume(level: TRate): void {
    if (this.soundObject) {
      this.soundObject.volume = level;
    }
  }

  /**
   * todo: Description.
   */
  public abstract play(...args: AnyArgs): boolean;

  /**
   * todo: Description.
   */
  public reset(...args: AnyArgs): void {}

  /**
   * todo: Description.
   */
  public onSoundPlayEnded(objectId: TNumberId): void {}

  /**
   * todo: Description.
   */
  public save(packet: NetPacket): void {}

  /**
   * todo: Description.
   */
  public load(reader: NetProcessor): void {}

  /**
   * todo: Description.
   */
  public saveObject(packet: NetPacket, object: GameObject): void {}

  /**
   * todo: Description.
   */
  public loadObject(processor: NetProcessor, object: GameObject): void {}
}
