import type { LoreCategory } from '@/store/shared';
import type { LoreRarity } from '@/store/shared';

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
