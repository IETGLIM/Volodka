import type { TrainablePlayerSkill } from '@/shared/types/game';
import {
  LOOT_NOTIFICATION_DISMISS_MS,
  LOOT_NOTIFICATION_MAX_VISIBLE,
} from '@/engine/loot/lootNotificationConstants';
import type {
  LootNotificationItem,
  LootNotificationPayload,
  LootNotificationType,
  LootRarity,
} from '@/engine/loot/lootNotificationTypes';

export { LOOT_NOTIFICATION_DISMISS_MS, LOOT_NOTIFICATION_MAX_VISIBLE };

export const SKILL_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Программирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

export type LootVisualConfig = {
  containerClass: string;
  icon: 'package' | 'trending' | 'sparkles';
  iconClass: string;
};

const RARITY_BORDER: Record<LootRarity, string> = {
  common: 'border-slate-500/40 shadow-slate-500/10',
  uncommon: 'border-emerald-500/50 shadow-emerald-500/20',
  rare: 'border-cyan-500/50 shadow-cyan-500/20',
  legendary: 'border-amber-500/50 shadow-amber-500/30',
};

const RARITY_LEFT_BORDER_ACCENT: Record<LootRarity, string> = {
  common: 'border-l-slate-500',
  uncommon: 'border-l-emerald-500',
  rare: 'border-l-cyan-400',
  legendary: 'border-l-amber-400',
};

const RARITY_GLOW: Record<LootRarity, string> = {
  common: '',
  uncommon: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
  rare: 'shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb)/0.2)]',
  legendary: 'shadow-[0_0_16px_rgba(245,158,11,0.3)]',
};

const TYPE_VISUAL: Record<LootNotificationType, LootVisualConfig> = {
  combat: {
    containerClass: 'bg-amber-950/80 border-amber-700/40',
    icon: 'sparkles',
    iconClass: 'text-amber-400',
  },
  xp: {
    containerClass: 'bg-purple-950/80 border-purple-700/40',
    icon: 'trending',
    iconClass: 'text-purple-400',
  },
  skill: {
    containerClass: 'bg-emerald-950/80 border-emerald-700/40',
    icon: 'trending',
    iconClass: 'text-emerald-400',
  },
  item: {
    containerClass: 'bg-cyan-950/80 border-cyan-700/40',
    icon: 'package',
    iconClass: 'text-cyan-400',
  },
  poem: {
    containerClass: 'bg-amber-950/80 border-amber-700/40',
    icon: 'sparkles',
    iconClass: 'text-amber-400',
  },
  karma: {
    containerClass: 'bg-slate-950/80 border-slate-700/40',
    icon: 'sparkles',
    iconClass: 'text-slate-300',
  },
};

export function getRarityLeftBorderAccent(rarity: LootRarity): string {
  return RARITY_LEFT_BORDER_ACCENT[rarity] ?? '';
}

export function getLootVisualConfig(notification: LootNotificationPayload): LootVisualConfig & {
  rarityBorder: string;
  rarityGlow: string;
  rarityLeftBorder: string;
} {
  const base = TYPE_VISUAL[notification.type];
  const rarityBorder = notification.rarity ? RARITY_BORDER[notification.rarity] : '';
  const rarityGlow = notification.rarity ? RARITY_GLOW[notification.rarity] : '';
  const rarityLeftBorder = notification.rarity ? RARITY_LEFT_BORDER_ACCENT[notification.rarity] : '';
  return { ...base, rarityBorder, rarityGlow, rarityLeftBorder };
}

export function getRarityBadgeLabel(rarity: LootRarity): string | null {
  switch (rarity) {
    case 'legendary':
      return '★ ЛЕГЕНДАРНЫЙ';
    case 'rare':
      return '◆ РЕДКИЙ';
    case 'uncommon':
      return '● НЕОБЫЧНЫЙ';
    case 'common':
      return null;
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

export function getRarityBadgeClass(rarity: LootRarity): string {
  switch (rarity) {
    case 'legendary':
      return 'text-amber-400';
    case 'rare':
      return 'text-cyan-400';
    case 'uncommon':
      return 'text-emerald-400';
    case 'common':
      return 'text-slate-400';
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

export function resolveLootToastSurfaceClass(notification: LootNotificationPayload): string {
  const { rarityBorder } = getLootVisualConfig(notification);
  switch (notification.type) {
    case 'combat':
      return `bg-amber-950/80 ${rarityBorder || 'border-amber-700/40'}`;
    case 'xp':
      return 'bg-purple-950/80 border-purple-700/40';
    case 'skill':
      return 'bg-emerald-950/80 border-emerald-700/40';
    case 'item':
      return `bg-cyan-950/80 ${rarityBorder || 'border-cyan-700/40'}`;
    case 'poem':
      return 'bg-amber-950/80 border-amber-700/40';
    case 'karma':
      return `bg-slate-950/80 ${rarityBorder || 'border-slate-700/40'}`;
    default: {
      const _exhaustive: never = notification.type;
      return _exhaustive;
    }
  }
}

export function buildLootAnnouncement(notification: LootNotificationPayload): string {
  const parts = [notification.label];
  if (notification.detail) parts.push(notification.detail);
  const badge = notification.rarity ? getRarityBadgeLabel(notification.rarity) : null;
  if (badge) parts.push(badge);
  return parts.join('. ');
}

export function trimLootNotifications(
  items: LootNotificationItem[],
  max = LOOT_NOTIFICATION_MAX_VISIBLE,
): LootNotificationItem[] {
  if (items.length <= max) return items;
  return items.slice(-max);
}

export function buildSkillUpPayload(skill: TrainablePlayerSkill, level: number): LootNotificationPayload {
  return {
    type: 'skill',
    label: SKILL_NAMES[skill],
    detail: `Уровень ${level}`,
  };
}

export function buildItemReceivedPayload(
  name: string,
  rarity?: LootRarity,
): LootNotificationPayload {
  return { type: 'item', label: name, rarity };
}

export function buildCombatLootPayload(
  name: string,
  rarity: LootRarity,
): LootNotificationPayload {
  return { type: 'combat', label: name, detail: 'Трофей', rarity };
}

export function buildXpGainedPayload(amount: number): LootNotificationPayload {
  return { type: 'xp', label: `+${amount} опыта` };
}

export function buildKarmaChangePayload(value: number): LootNotificationPayload {
  return {
    type: 'karma',
    label: value > 0 ? `Карма +${value}` : `Карма ${value}`,
  };
}

export function buildPoemCollectedPayload(title: string): LootNotificationPayload {
  return { type: 'poem', label: title, detail: 'Стихотворение найдено' };
}

export function getLootNotificationSfx(type: LootNotificationType): string | null {
  switch (type) {
    case 'skill':
      return 'quest_complete';
    case 'item':
      return 'notify';
    case 'poem':
      return 'confirm';
    case 'combat':
    case 'xp':
    case 'karma':
      return 'click';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
