import type { LoreCategory, LoreRarity } from '@/store/shared';
import { LORE_CATEGORY_META } from '@/data/loreEntries';

export interface LoreToastVisualConfig {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  shadow: string;
  iconBg: string;
  textColor: string;
  countdownBg: string;
}

const LORE_TOAST_RARITY: Record<LoreRarity, LoreToastVisualConfig> = {
  common: {
    primary: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.30)',
    bg: 'rgba(15, 20, 30, 0.82)',
    shadow: '0 0 10px rgba(148, 163, 184, 0.10)',
    iconBg: 'rgba(148, 163, 184, 0.10)',
    textColor: '#94a3b8',
    countdownBg: '#94a3b8',
  },
  uncommon: {
    primary: '#34d399',
    glow: 'rgba(52, 211, 153, 0.18)',
    border: 'rgba(52, 211, 153, 0.35)',
    bg: 'rgba(8, 24, 18, 0.82)',
    shadow: '0 0 12px rgba(52, 211, 153, 0.12)',
    iconBg: 'rgba(52, 211, 153, 0.12)',
    textColor: '#34d399',
    countdownBg: '#34d399',
  },
  rare: {
    primary: 'var(--cyber-cyan)',
    glow: 'rgb(var(--cyber-cyan-rgb) / 0.20)',
    border: 'rgb(var(--cyber-cyan-rgb) / 0.40)',
    bg: 'rgba(8, 20, 30, 0.82)',
    shadow: '0 0 14px rgb(var(--cyber-cyan-rgb) / 0.14)',
    iconBg: 'rgb(var(--cyber-cyan-rgb) / 0.12)',
    textColor: 'var(--cyber-cyan)',
    countdownBg: 'var(--cyber-cyan)',
  },
  legendary: {
    primary: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.22)',
    border: 'rgba(251, 191, 36, 0.45)',
    bg: 'rgba(20, 16, 8, 0.82)',
    shadow: '0 0 16px rgba(251, 191, 36, 0.16)',
    iconBg: 'rgba(251, 191, 36, 0.12)',
    textColor: '#fbbf24',
    countdownBg: '#fbbf24',
  },
};

const LORE_RARITIES: readonly LoreRarity[] = ['common', 'uncommon', 'rare', 'legendary'];

/** Normalize event/store rarity strings to LoreRarity. */
export function parseLoreRarity(value: string): LoreRarity {
  if ((LORE_RARITIES as readonly string[]).includes(value)) {
    return value as LoreRarity;
  }
  return 'common';
}

export function getLoreToastVisual(rarity: LoreRarity): LoreToastVisualConfig {
  return LORE_TOAST_RARITY[rarity];
}

/** Longer display for higher rarity entries. */
export function getLoreToastDurationMs(rarity: LoreRarity): number {
  switch (rarity) {
    case 'legendary':
      return 5500;
    case 'rare':
      return 4500;
    case 'uncommon':
      return 4000;
    case 'common':
      return 3500;
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

export function getLoreToastSubtitle(rarity: LoreRarity, category?: LoreCategory): string {
  const categoryLabel = category ? LORE_CATEGORY_META[category]?.label : undefined;
  const reward = rarity === 'rare' || rarity === 'legendary'
    ? ' · +5 ОД · Письмо +1'
    : ' · +5 ОД';

  if (categoryLabel) {
    return `Кодекс: ${categoryLabel}${reward}`;
  }
  return `Новая запись в кодексе${reward}`;
}
