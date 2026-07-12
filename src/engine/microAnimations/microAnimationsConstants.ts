import type { ItemRarity } from '@/data/items';

export const STAT_CHANGE_TTL_MS = 1800;
export const STAT_CHANGE_MAX = 8;
export const STAT_CHANGE_CLEANUP_INTERVAL_MS = 200;

export const ITEM_GAINED_TTL_MS = 2500;
export const ITEM_GAINED_MAX = 3;
export const ITEM_GAINED_CLEANUP_INTERVAL_MS = 250;

export const LEVEL_UP_BANNER_DURATION_MS = 3000;

export const RARITY_COLORS: Record<ItemRarity | 'epic', string> = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

export const LEVEL_UP_PARTICLE_COUNTS = {
  low: 0,
  medium: 8,
  high: 16,
} as const;

export const ITEM_GAINED_LABEL = 'получено';
export const LEVEL_UP_SUBTITLE = 'Новый уровень';
export const LEVEL_UP_FOOTER = 'УРОВЕНЬ ДОСТИГНУТ';
