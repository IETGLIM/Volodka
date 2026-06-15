import type { LoreCategory, LoreRarity } from '@/shared/types/lore';

export type LoreToastPayload = {
  loreId: string;
  title: string;
  rarity: LoreRarity;
  category?: LoreCategory;
};

export type LoreToastItem = LoreToastPayload & {
  id: string;
  createdAt: number;
};
