import type { ItemRarity } from '@/data/items';
import {
  ITEM_GAINED_CLEANUP_INTERVAL_MS,
  ITEM_GAINED_MAX,
  ITEM_GAINED_TTL_MS,
} from '@/engine/microAnimations/microAnimationsConstants';
import { createNotificationPoolStore } from '@/hooks/useNotificationPool';

export type ItemGainedEntry = {
  id: number;
  name: string;
  icon?: string;
  rarity?: ItemRarity;
  createdAt: number;
};

const POOL_OPTIONS = {
  ttlMs: ITEM_GAINED_TTL_MS,
  maxSize: ITEM_GAINED_MAX,
  cleanupIntervalMs: ITEM_GAINED_CLEANUP_INTERVAL_MS,
} as const;

export const itemGainedPool = createNotificationPoolStore<ItemGainedEntry>();

export function showItemGained(name: string, icon?: string, rarity?: ItemRarity): void {
  itemGainedPool.push({ name, icon, rarity }, POOL_OPTIONS);
}
