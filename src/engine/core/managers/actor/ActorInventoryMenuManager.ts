import { SYSTEM_INI } from "@/engine/core/database";
import { AbstractManager } from "@/engine/core/managers/abstract";
import { actorConfig } from "@/engine/core/managers/actor/ActorConfig";
import { executeConsoleCommand } from "@/engine/core/utils/console";
import { readIniString } from "@/engine/core/utils/ini";
import { LuaLogger } from "@/engine/core/utils/logging";
import { consoleCommands } from "@/engine/lib/constants/console_commands";
import { ACTOR } from "@/engine/lib/constants/words";
import { EActorMenuMode, EActorMenuType, GameObject, IniFile } from "@/engine/lib/types";

const logger: LuaLogger = new LuaLogger($filename);

/**
 * Manager to synchronize and handle actor inventory events.
 */
export class ActorInventoryMenuManager extends AbstractManager {
  public override initialize(): void {
    const ini: IniFile = SYSTEM_INI;

    executeConsoleCommand(consoleCommands.slot_0, readIniString(ini, ACTOR, "quick_item_1") ?? "");
    executeConsoleCommand(consoleCommands.slot_1, readIniString(ini, ACTOR, "quick_item_2") ?? "");
    executeConsoleCommand(consoleCommands.slot_2, readIniString(ini, ACTOR, "quick_item_3") ?? "");
    executeConsoleCommand(consoleCommands.slot_3, readIniString(ini, ACTOR, "quick_item_4") ?? "");
  }

  /**
   * @param mode - type of inventory to check
   * @returns whether current inventory mode matches provided type
   */
  public isActiveMode(mode: EActorMenuMode): boolean {
    return actorConfig.ACTOR_MENU_MODE === mode;
  }

  /**
   * @param nextMode - mode to set in inventory
   */
  public setActiveMode(nextMode: EActorMenuMode): void {
    if (nextMode === EActorMenuMode.UNDEFINED || nextMode === EActorMenuMode.TALK_DIALOG_HIDE) {
      this.closeActorMenu();
    } else {
      this.openActorMenu(nextMode);
    }
  }

  /**
   * Open in-game hud menu.
   *
   * @param mode - menu mode to show
   */
  public openActorMenu(mode: EActorMenuMode): void {
    switch (mode) {
      case EActorMenuMode.INVENTORY:
      case EActorMenuMode.TRADE:
      case EActorMenuMode.UPGRADE:
      case EActorMenuMode.DEAD_BODY_SEARCH:
        actorConfig.ACTOR_MENU_MODE = mode;

        return this.onWindowOpen(mode);

      case EActorMenuMode.TALK_DIALOG_SHOW:
        actorConfig.ACTOR_MENU_MODE = EActorMenuMode.TALK_DIALOG;

        return this.onWindowOpen(mode);
    }
  }

  /**
   * Close currently active in-game menu.
   */
  public closeActorMenu(): void {
    switch (actorConfig.ACTOR_MENU_MODE) {
      case EActorMenuMode.INVENTORY:
      case EActorMenuMode.TRADE:
      case EActorMenuMode.UPGRADE:
      case EActorMenuMode.DEAD_BODY_SEARCH:
        this.onWindowClosed(actorConfig.ACTOR_MENU_MODE);
        break;

      case EActorMenuMode.TALK_DIALOG_HIDE:
        this.onWindowClosed(EActorMenuMode.TALK_DIALOG);
        break;
    }

    actorConfig.ACTOR_MENU_MODE = EActorMenuMode.UNDEFINED;
  }

  /**
   * @param item - item game object receiving UI focus
   */
  public onItemFocusReceived(item: GameObject): void {
    // logger.info("Actor item focus received: %s", item?.name());
  }

  /**
   * @param item - item game object losing UI focus
   */
  public onItemFocusLost(item: GameObject): void {
    // logger.info("Actor item focus lost: %s", item?.name());
  }

  /**
   * @param from - game object owner of previous list
   * @param to - game object owner of next list
   * @param oldList - type of previous list
   * @param newList - type of next list
   */
  public onItemDropped(from: GameObject, to: GameObject, oldList: EActorMenuType, newList: EActorMenuType): void {
    logger.info("Actor menu inventory item dropped: %s %s %s %s", from?.name(), to?.name(), oldList, newList);
  }

  /**
   * @param mode - type of actor menu open
   */
  public onWindowOpen(mode: EActorMenuMode): void {
    logger.info("Actor menu open: %s", EActorMenuMode[mode]);
  }

  /**
   * @param mode - type of actor menu closed
   */
  public onWindowClosed(mode: EActorMenuMode): void {
    logger.info("Actor menu close: %s", EActorMenuMode[mode]);
  }
}
