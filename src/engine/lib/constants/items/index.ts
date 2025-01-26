import { TAmmoItem } from "@/engine/lib/constants/items/ammo";
import { TArtefact } from "@/engine/lib/constants/items/artefacts";
import { TDetector } from "@/engine/lib/constants/items/detectors";
import { TDrugItem } from "@/engine/lib/constants/items/drugs";
import { TFoodItem } from "@/engine/lib/constants/items/food";
import { THelmet } from "@/engine/lib/constants/items/helmets";
import { TOutfit } from "@/engine/lib/constants/items/outfits";
import { TQuestItem } from "@/engine/lib/constants/items/quest_items";
import { TWeapon, TWeaponAddon } from "@/engine/lib/constants/items/weapons";

/**
 * Type definition of possible item section.
 */
export type TInventoryItem =
  | TAmmoItem
  | TArtefact
  | TDetector
  | TDrugItem
  | TFoodItem
  | THelmet
  | TOutfit
  | TWeaponAddon
  | TWeapon
  | TQuestItem;
