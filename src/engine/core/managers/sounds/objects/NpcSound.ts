import { FS, game, get_hud, getFS, snd_type, sound_object, stalker_ids, time_global } from "xray16";

import { IRegistryObjectState, registry } from "@/engine/core/database";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { ENotificationType, ISoundNotification } from "@/engine/core/managers/notifications/notifications_types";
import { AbstractPlayableSound } from "@/engine/core/managers/sounds/objects/AbstractPlayableSound";
import { EPlayableSound, ESoundPlaylistType } from "@/engine/core/managers/sounds/sounds_types";
import { abort } from "@/engine/core/utils/assertion";
import { getObjectCommunity } from "@/engine/core/utils/community";
import {
  readIniBoolean,
  readIniNumber,
  readIniNumberList,
  readIniString,
  readIniStringSet,
} from "@/engine/core/utils/ini";
import { LuaLogger } from "@/engine/core/utils/logging";
import { communities, TCommunity } from "@/engine/lib/constants/communities";
import { roots } from "@/engine/lib/constants/roots";
import { ZERO_VECTOR } from "@/engine/lib/constants/vectors";
import { NIL } from "@/engine/lib/constants/words";
import {
  GameObject,
  IniFile,
  LuaArray,
  NetPacket,
  NetProcessor,
  Optional,
  SoundObject,
  TCount,
  TDuration,
  TIndex,
  TLabel,
  TName,
  TNumberId,
  TPath,
  TSection,
  TTimestamp,
} from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename);

export interface INpcSoundDescriptor {
  id: TNumberId;
  max: TCount;
}

/**
 * todo;
 */
export class NpcSound extends AbstractPlayableSound {
  public static readonly AVAILABLE_COMMUNITIES_ALL: string = string.format(
    "%s, %s, %s, %s, %s, %s, %s, %s, %s",
    communities.stalker,
    communities.ecolog,
    communities.bandit,
    communities.dolg,
    communities.freedom,
    communities.army,
    communities.zombied,
    communities.monolith,
    communities.killer
  );

  public static baseIndex: TIndex = stalker_ids.sound_script + 10_000;
  public static readonly type: EPlayableSound = EPlayableSound.NPC;

  /**
   * todo;
   */
  public static getNextId(): TIndex {
    NpcSound.baseIndex += 1;

    return NpcSound.baseIndex;
  }

  public override readonly type: EPlayableSound = NpcSound.type;

  public readonly prefix: boolean;
  public readonly isCombatSound: boolean;
  public readonly isGroupSound: boolean;

  public readonly canPlaySound: LuaTable<TNumberId, boolean> = new LuaTable();
  public readonly objects: LuaTable<TNumberId, INpcSoundDescriptor> = new LuaTable();
  public readonly availableCommunities: LuaTable<TCommunity, boolean> = new LuaTable();
  public readonly soundPaths: LuaTable<TNumberId, LuaArray<TPath>> = new LuaTable();

  public readonly shuffle: ESoundPlaylistType;
  public readonly faction: string;
  public readonly point: string;
  public readonly message: string;

  public canPlayGroupSound: boolean = true;
  public pdaSoundObject: Optional<SoundObject> = null;
  public playedSoundIndex: Optional<TIndex> = null;
  public playingStartedAt: Optional<TTimestamp> = null;
  public idleTime: Optional<TDuration> = null;

  public readonly minIdle: TDuration;
  public readonly maxIdle: TDuration;
  public readonly delay: TDuration;
  public readonly random: number;

  public constructor(ini: IniFile, section: TSection) {
    super(ini, section);

    this.prefix = readIniBoolean(ini, section, "npc_prefix", false, false);
    this.shuffle = readIniString(ini, section, "shuffle", false, null, ESoundPlaylistType.RANDOM) as ESoundPlaylistType;
    this.isGroupSound = readIniBoolean(ini, section, "group_snd", false, false);
    this.shouldPlayAlways = readIniBoolean(ini, section, "play_always", false, false);
    this.isCombatSound = readIniBoolean(ini, section, "is_combat_sound", false, false);
    this.delay = readIniNumber(ini, section, "delay_sound", false, 0);

    const idle: LuaArray<TDuration> = readIniNumberList(ini, section, "idle", false, "3,5,100");

    this.minIdle = idle.get(1);
    this.maxIdle = idle.get(2);
    this.random = idle.get(3);

    this.faction = readIniString(ini, section, "faction", false, null, "");
    this.point = readIniString(ini, section, "point", false, null, "");
    this.message = readIniString(ini, section, "message", false, null, "");

    this.availableCommunities = readIniStringSet(
      ini,
      section,
      "avail_communities",
      false,
      NpcSound.AVAILABLE_COMMUNITIES_ALL
    );
  }

  /**
   * todo;
   */
  public override reset(objectId: TNumberId): void {
    const object: Optional<GameObject> = registry.objects.get(objectId)?.object as Optional<GameObject>;

    this.playingStartedAt = null;
    this.playedSoundIndex = null;
    this.canPlayGroupSound = true;
    this.canPlaySound.set(objectId, true);

    if (object) {
      object.set_sound_mask(-1);
      object.set_sound_mask(0);
    }

    if (this.pdaSoundObject) {
      this.pdaSoundObject.stop();
      this.pdaSoundObject = null;
    }
  }

  /**
   * todo;
   */
  public override isPlaying(objectId: TNumberId): boolean {
    const object: Optional<GameObject> = registry.objects.get(objectId) && registry.objects.get(objectId).object!;

    if (object === null) {
      return false;
    }

    return object.active_sound_count() !== 0 || this.pdaSoundObject?.playing() === true;
  }

  /**
   * todo: Description.
   */
  public play(objectId: TNumberId, faction: string, point: Optional<string>, message: TLabel): boolean {
    const object: Optional<GameObject> = registry.objects.get(objectId)?.object;

    if (object === null) {
      return false;
    }

    if (this.isGroupSound) {
      if (!this.canPlayGroupSound) {
        return false;
      }
    } else {
      if (!this.canPlaySound.get(objectId)) {
        return false;
      }
    }

    // Wait for previous sound finish
    if (this.playingStartedAt !== null && time_global() - this.playingStartedAt < this.idleTime!) {
      return false;
    }

    logger.info("Play NPC sound for: '%s', '%s', '%s', '%s'", object.name(), faction, point, message);

    this.playingStartedAt = null;

    const objectDescriptor: Optional<INpcSoundDescriptor> = this.objects.get(objectId);

    if (objectDescriptor === null) {
      return false;
    }

    this.playedSoundIndex = this.selectNextSound(objectId);

    if (this.playedSoundIndex === -1) {
      return false;
    }

    object.play_sound(objectDescriptor.id, this.delay + 0.06, this.delay + 0.05, 1, 0, this.playedSoundIndex);

    const nextIndex: TIndex = this.playedSoundIndex + 1;
    const soundPath: TPath = this.soundPaths.get(objectId).get(nextIndex);
    const fs: FS = getFS();

    if (
      soundPath &&
      fs.exist(roots.gameSounds, soundPath + "_pda.ogg") !== null &&
      object.position().distance_to_sqr(registry.actor.position()) >= 100
    ) {
      if (this.pdaSoundObject !== null && this.pdaSoundObject.playing()) {
        this.pdaSoundObject.stop();
      }

      this.pdaSoundObject = new sound_object(soundPath + "_pda");
      this.pdaSoundObject.play_at_pos(registry.actor, ZERO_VECTOR, this.delay, sound_object.s2d);
      this.pdaSoundObject.volume = 0.8;
    }

    const [soundCaption] = string.gsub(soundPath, "\\", "_");

    if (this.isGroupSound) {
      this.canPlayGroupSound = false;
    } else {
      this.canPlaySound.set(objectId, false);
    }

    if (game.translate_string(soundCaption) !== soundCaption) {
      if (!faction) {
        faction = getObjectCommunity(object);
      }

      // Attempt to auto-translate object goal.
      if (!point) {
        point = object.profile_name() + "_name";
        if (game.translate_string(point) === point) {
          point = null;
        }
      }

      EventsManager.emitEvent<ISoundNotification>(EGameEvent.NOTIFICATION, {
        type: ENotificationType.SOUND,
        object,
        faction,
        point,
        soundPath,
        soundCaption,
        delay: this.delay,
      });
    } else {
      EventsManager.emitEvent<ISoundNotification>(EGameEvent.NOTIFICATION, {
        type: ENotificationType.SOUND,
        object,
        faction,
        point,
        soundPath,
        delay: this.delay,
      });
    }

    return true;
  }

  /**
   * todo;
   */
  public override stop(objectId: TNumberId): void {
    const object: Optional<GameObject> = registry.objects.get(objectId)?.object;

    if (object && object.alive()) {
      object.set_sound_mask(-1);
      object.set_sound_mask(0);
    }

    if (this.pdaSoundObject && this.pdaSoundObject.playing()) {
      this.pdaSoundObject.stop();
      this.pdaSoundObject = null;
    }
  }

  /**
   * todo: Description.
   */
  public override onSoundPlayEnded(objectId: TNumberId): void {
    logger.info(
      "Sound play ended: %s %s %s",
      objectId,
      this.playedSoundIndex,
      this.soundPaths.get(this.playedSoundIndex as TIndex)
    );

    this.playingStartedAt = time_global();
    this.idleTime = math.random(this.minIdle, this.maxIdle) * 1000;

    get_hud().RemoveCustomStatic("cs_subtitles_npc");

    if (this.isGroupSound) {
      this.canPlayGroupSound = true;
    } else {
      this.canPlaySound.set(objectId, true);
    }

    const state: IRegistryObjectState = registry.objects.get(objectId);

    if (state.activeScheme === null) {
      return;
    }

    const signals: Optional<LuaTable<TName, boolean>> = state[state.activeScheme]!.signals;

    if (signals === null || this.objects.get(objectId) === null) {
      return;
    }

    // Fire scheme signals.
    if (this.playedSoundIndex === this.objects.get(objectId).max && this.shuffle !== "rnd") {
      logger.info("Emit sound end signal: %s", state.object.name());
      signals.set("theme_end", true);
      signals.set("sound_end", true);
    } else {
      logger.info("Emit sound end signal: %s", state.object.name());
      signals.set("sound_end", true);
    }
  }

  /**
   * todo;
   */
  public override save(packet: NetPacket): void {
    packet.w_stringZ(tostring(this.playedSoundIndex));

    if (this.isGroupSound) {
      packet.w_bool(this.canPlayGroupSound);
    }
  }

  /**
   * todo;
   */
  public override load(reader: NetProcessor): void {
    const id: string = reader.r_stringZ();

    this.playedSoundIndex = id === NIL ? null : tonumber(id)!;

    if (this.isGroupSound) {
      this.canPlayGroupSound = reader.r_bool();
    }
  }

  /**
   * todo;
   */
  public override saveObject(packet: NetPacket, object: GameObject): void {
    if (!this.isGroupSound) {
      packet.w_bool(this.canPlaySound.get(object.id()) === true);
    }
  }

  /**
   * todo;
   */
  public override loadObject(reader: NetProcessor, object: GameObject): void {
    if (!this.isGroupSound) {
      this.canPlaySound.set(object.id(), reader.r_bool());
    }
  }

  /**
   * todo;
   * Note: Performance heavy method, especially when sound files are not cached yet.
   */
  public initializeObject(object: GameObject): void {
    const objectId: TNumberId = object.id();
    const objectDescriptor = {
      id: NpcSound.getNextId(),
      max: 0,
    };
    const objectPathsDescriptor: LuaArray<TPath> = new LuaTable();

    this.objects.set(objectId, objectDescriptor);
    this.soundPaths.set(objectId, objectPathsDescriptor);

    let characterPrefix: string = "";

    if (!this.prefix) {
      characterPrefix = object.sound_prefix();
      object.sound_prefix("characters_voice\\");
    }

    // Register current sounds object as combat/regular sound for target game object.
    objectDescriptor.max = this.isCombatSound
      ? object.add_combat_sound(this.path, 64, snd_type.talk, 2, 1, objectDescriptor.id, "bip01_head") - 1
      : object.add_sound(this.path, 64, snd_type.talk, 2, 1, objectDescriptor.id) - 1;

    const fs: FS = getFS();
    const objectSoundPrefix: TLabel = object.sound_prefix();

    if (fs.exist(roots.gameSounds, `${objectSoundPrefix}${this.path}.ogg`) !== null) {
      objectPathsDescriptor.set(1, objectSoundPrefix + this.path);
    } else {
      let index: TIndex = 1;

      while (fs.exist(roots.gameSounds, `${objectSoundPrefix}${this.path}${index}.ogg`)) {
        objectPathsDescriptor.set(index, objectSoundPrefix + this.path + index);
        index += 1;
      }
    }

    if (this.objects.get(objectId).max < 0) {
      abort(
        "Could not find sounds '%s' with prefix '%s', name '%s', path '%s', index '%s', at '%s' - '%s'",
        tostring(this.path),
        objectSoundPrefix,
        object.name(),
        this.path,
        this.objects.get(objectId).id,
        this.objects.get(objectId).max
      );
    }

    if (!this.prefix) {
      object.sound_prefix(characterPrefix);
    }

    if (this.isGroupSound) {
      this.canPlayGroupSound = true;
    } else {
      if (this.canPlaySound.get(objectId) !== false) {
        this.canPlaySound.set(objectId, true);
      }
    }
  }

  /**
   * todo;
   */
  public selectNextSound(objectId: TNumberId): TNumberId {
    const objectDescriptor: Optional<INpcSoundDescriptor> = this.objects.get(objectId);

    // Play random
    if (this.shuffle === ESoundPlaylistType.RANDOM) {
      if (objectDescriptor.max === 0) {
        return 0;
      } else if (this.playedSoundIndex !== null) {
        const nextPlayIndex: TIndex = math.random(0, objectDescriptor.max - 1);

        if (nextPlayIndex === this.playedSoundIndex) {
          return nextPlayIndex + 1;
        }

        return nextPlayIndex;
      }

      return math.random(0, objectDescriptor.max);
    }

    // Play in sequence.
    if (this.shuffle === ESoundPlaylistType.SEQUENCE) {
      if (this.playedSoundIndex === -1) {
        return -1;
      } else if (this.playedSoundIndex === null) {
        return 0;
      } else if (this.playedSoundIndex < objectDescriptor.max) {
        return this.playedSoundIndex + 1;
      } else {
        return -1;
      }
    }

    // Play in loop.
    if (this.shuffle === ESoundPlaylistType.LOOP) {
      if (this.playedSoundIndex === null) {
        return 0;
      } else if (this.playedSoundIndex < objectDescriptor.max) {
        return this.playedSoundIndex + 1;
      } else {
        return 0;
      }
    }

    abort("Unexpected shuffle type provided: '%s'.", this.shuffle);
  }
}
