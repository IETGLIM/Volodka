import { getItemDefinition } from '@/data/items';
import {
  getItemPreference,
  getAffinityChange,
  getNPCGiftPreference,
  type GiftPreference,
} from '@/data/npcGifts';
import type { InventoryItem } from '@/shared/types/game';

export type GiftableInventoryItem = InventoryItem & {
  preference: GiftPreference;
  affinityChange: number;
};

const PREFERENCE_SORT_ORDER: Record<GiftPreference, number> = {
  loved: 0,
  liked: 1,
  neutral: 2,
  disliked: 3,
  hated: 4,
};

export function isGiftableInventoryItem(itemId: string): boolean {
  const def = getItemDefinition(itemId);
  return def ? !def.questRelated : true;
}

export function countGiftableItems(inventory: readonly InventoryItem[]): number {
  return inventory.reduce(
    (count, item) => (isGiftableInventoryItem(item.id) ? count + 1 : count),
    0,
  );
}

export function buildGiftableItems(
  inventory: readonly InventoryItem[],
  npcId: string,
): GiftableInventoryItem[] {
  return inventory
    .filter((item) => isGiftableInventoryItem(item.id))
    .map((item) => {
      const preference = getItemPreference(npcId, item.id);
      return {
        ...item,
        preference,
        affinityChange: getAffinityChange(preference),
      };
    })
    .sort((a, b) => PREFERENCE_SORT_ORDER[a.preference] - PREFERENCE_SORT_ORDER[b.preference]);
}

export function getGiftPreferenceCounts(npcId: string): { loved: number; liked: number } | null {
  const giftPrefs = getNPCGiftPreference(npcId);
  if (!giftPrefs) return null;
  return {
    loved: giftPrefs.lovedItems.length,
    liked: giftPrefs.likedItems.length,
  };
}
