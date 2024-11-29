import { hit, level } from "xray16";

import { getManagerByName, isStoryObject, registry } from "@/engine/core/database";
import type { ActorInputManager } from "@/engine/core/managers/actor/ActorInputManager";
import { EGameEvent, EventsManager } from "@/engine/core/managers/events";
import { getSimulationSquads } from "@/engine/core/managers/simulation/utils";
import { surgeConfig } from "@/engine/core/managers/surge/SurgeConfig";
import {
  canSurgeKillSquad,
  getNearestAvailableSurgeCover,
  getOnlineSurgeCoversList,
} from "@/engine/core/managers/surge/utils/surge_cover";
import { isImmuneToSurgeSquad } from "@/engine/core/managers/surge/utils/surge_generic";
import { hasInfoPortion } from "@/engine/core/utils/info_portion";
import { pickSectionFromCondList } from "@/engine/core/utils/ini";
import { LuaLogger } from "@/engine/core/utils/logging";
import { isObjectOnLevel } from "@/engine/core/utils/position";
import { animations, postProcessors } from "@/engine/lib/constants/animation";
import { infoPortions } from "@/engine/lib/constants/info_portions";
import { TLevel } from "@/engine/lib/constants/levels";
import { Z_VECTOR } from "@/engine/lib/constants/vectors";
import { TRUE } from "@/engine/lib/constants/words";
import { GameObject, Hit, LuaArray, Optional } from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename);

/**
 * todo: Description.
 */
export function killAllSurgeUnhiddenAfterActorDeath(): void {
  const surgeCovers: LuaArray<GameObject> = getOnlineSurgeCoversList();
  const levelName: TLevel = level.name();

  for (const [, squad] of getSimulationSquads()) {
    if (isObjectOnLevel(squad, levelName) && !isImmuneToSurgeSquad(squad)) {
      for (const member of squad.squad_members()) {
        let isInSurgeCover: boolean = false;

        for (const [, coverObject] of surgeCovers) {
          if (coverObject.inside(member.object.position)) {
            isInSurgeCover = true;
            break;
          }
        }

        if (!isInSurgeCover) {
          logger.info(
            "Releasing object from squad after actors death because of surge: %s %s",
            member.object.name(),
            squad.name()
          );

          const object: Optional<GameObject> = registry.objects.get(member.object.id)?.object;

          // todo: What is the difference here?
          if (object === null) {
            member.object.kill();
          } else {
            object.kill(object);
          }
        }
      }
    }
  }
}

/**
 * todo: Description.
 */
export function killAllSurgeUnhidden(): void {
  logger.info("Kill all surge not unhidden");

  const actor: GameObject = registry.actor;
  const surgeHit: Hit = new hit();

  surgeHit.type = hit.fire_wound;
  surgeHit.power = 0.9;
  surgeHit.impulse = 0.0;
  surgeHit.direction = Z_VECTOR;
  surgeHit.draftsman = actor;

  logger.info("Kill crows");

  for (const [, id] of registry.crows.storage) {
    const object: Optional<GameObject> = registry.objects.get(id)?.object;

    if (object.alive()) {
      object.hit(surgeHit);
    }
  }

  const surgeCovers: LuaArray<GameObject> = getOnlineSurgeCoversList();
  const levelName: TLevel = level.name();

  logger.info("Killing squads");

  for (const [, squad] of getSimulationSquads()) {
    if (isObjectOnLevel(squad, levelName) && !isImmuneToSurgeSquad(squad) && !isStoryObject(squad)) {
      for (const member of squad.squad_members()) {
        if (!isStoryObject(member.object)) {
          if (canSurgeKillSquad(squad)) {
            logger.info("Releasing object from squad because of surge: %s %s", member.object.name(), squad.name());

            const object: Optional<GameObject> = registry.objects.get(member.object.id)?.object;

            if (object === null) {
              member.object.kill();
            } else {
              object.kill(object);
            }
          } else {
            let release = true;

            // Check if is in cover.
            for (const [, coverObject] of surgeCovers) {
              if (coverObject.inside(member.object.position)) {
                release = false;
                break;
              }
            }

            if (release) {
              logger.info("Releasing object from squad because of surge: %s %s", member.object.name(), squad.name());

              const object: Optional<GameObject> = registry.objects.get(member.object.id)?.object;

              if (object !== null) {
                object.kill(object);
              } else {
                member.object.kill();
              }
            }
          }
        }
      }
    }
  }

  if (actor.alive()) {
    const surgeCoverObject: Optional<GameObject> = getNearestAvailableSurgeCover(actor);

    if (!surgeCoverObject?.inside(actor.position())) {
      if (hasInfoPortion(infoPortions.anabiotic_in_process)) {
        EventsManager.emitEvent(EGameEvent.SURGE_SURVIVED_WITH_ANABIOTIC);
      }

      getManagerByName<ActorInputManager>("ActorInputManager")?.disableGameUiOnly();

      /**
       * Whether actor should survive surge.
       */
      if (pickSectionFromCondList(actor, null, surgeConfig.CAN_SURVIVE_SURGE) === TRUE) {
        level.add_cam_effector(
          animations.camera_effects_surge_02,
          surgeConfig.SLEEP_CAM_EFFECTOR_ID,
          false,
          "engine.surge_survive_start"
        );
        level.add_pp_effector(postProcessors.surge_fade, surgeConfig.SLEEP_FADE_PP_EFFECTOR_ID, false);
        actor.health -= 0.05;
      } else {
        actor.kill(actor);
        killAllSurgeUnhiddenAfterActorDeath();
      }
    }
  }
}
