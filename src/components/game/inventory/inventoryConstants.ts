import type { ItemRarity } from '@/data/items';

export type InventorySortOption = 'name' | 'rarity' | 'type' | 'quantity';

export const INVENTORY_CATEGORY_ICONS: Record<string, string> = {
  consumable: '💊',
  equipment: '⚔️',
  key_item: '🔑',
  quest_item: '📜',
  book: '📖',
  misc: '🔧',
  poem_fragment: '📖',
};

export const INVENTORY_RARITY_TEXT_CLASS: Record<ItemRarity, string> = {
  common: 'text-slate-200',
  uncommon: 'text-emerald-300 inv-glow-uncommon',
  rare: 'text-cyan-300 inv-glow-rare',
  legendary: 'text-amber-300 inv-glow-legendary',
};

export const INVENTORY_RARITY_BORDER_CLASS: Record<ItemRarity, string> = {
  common: 'border-slate-600/40',
  uncommon: 'border-emerald-500/40 inv-border-glow-uncommon',
  rare: 'border-cyan-500/40 inv-border-glow-rare',
  legendary: 'border-amber-500/40 inv-border-glow-legendary',
};

export const INVENTORY_RARITY_ICON_SHADOW: Record<ItemRarity, string> = {
  common: '0 0 8px rgba(148, 163, 184, 0.15)',
  uncommon: '0 0 12px rgba(52, 211, 153, 0.3), 0 0 24px rgba(52, 211, 153, 0.1)',
  rare: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.1)',
  legendary: '0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.15)',
};

export const INVENTORY_RARITY_DETAIL_BG: Record<ItemRarity, string> = {
  common: 'inv-detail-common',
  uncommon: 'inv-detail-uncommon',
  rare: 'inv-detail-rare',
  legendary: 'inv-detail-legendary',
};

export const INVENTORY_RARITY_WEIGHT: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

export const INVENTORY_STAT_ICONS: Record<string, string> = {
  energy: '⚡',
  stress: '😰',
  karma: '☯',
};

export const INVENTORY_CATEGORY_LABELS: Record<string, string> = {
  key_item: 'Ключевой',
  consumable: 'Расходуемый',
  misc: 'Разное',
  quest_item: 'Задание',
  equipment: 'Экипировка',
  book: 'Книга',
  poem_fragment: 'Фрагмент',
};

export const INVENTORY_SLOT_LABELS: Record<string, string> = {
  head: 'Голова',
  body: 'Тело',
  accessory: 'Аксессуар',
};

export const INVENTORY_SLOT_ICONS: Record<string, string> = {
  head: '🧠',
  body: '🛡️',
  accessory: '💍',
};

export const INVENTORY_SLOT_BORDER_COLORS: Record<string, string> = {
  head: 'border-cyan-500/40',
  body: 'border-emerald-500/40',
  accessory: 'border-amber-500/40',
};

export const INVENTORY_SORT_OPTIONS: { value: InventorySortOption; label: string }[] = [
  { value: 'name', label: 'По имени' },
  { value: 'rarity', label: 'По редкости' },
  { value: 'type', label: 'По типу' },
  { value: 'quantity', label: 'По количеству' },
];

export const INVENTORY_CATEGORY_FILTER_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'Все', icon: '📦' },
  { value: 'equipment', label: 'Оружие', icon: '⚔️' },
  { value: 'consumable', label: 'Расходуемые', icon: '💊' },
  { value: 'misc', label: 'Материалы', icon: '🔧' },
  { value: 'book', label: 'Книги', icon: '📖' },
  { value: 'key', label: 'Инструменты', icon: '🔑' },
  { value: 'quest', label: 'Задания', icon: '📜' },
];

export function getInventoryRarityHoverShadow(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return '0 0 10px rgba(148, 163, 184, 0.15), 0 4px 12px rgba(0,0,0,0.3)';
    case 'uncommon':
      return '0 0 12px rgba(52, 211, 153, 0.3), 0 0 24px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(0,0,0,0.3)';
    case 'rare':
      return '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.35), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.12), 0 4px 12px rgba(0,0,0,0.3)';
    case 'legendary':
      return '0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.15), 0 4px 12px rgba(0,0,0,0.3)';
    default: {
      const _exhaustive: never = rarity;
      return _exhaustive;
    }
  }
}

/** Grid row height for virtualization (px). */
export const INVENTORY_GRID_ROW_HEIGHT = 96;

/** Minimum items before enabling virtual scroll. */
export const INVENTORY_VIRTUALIZE_THRESHOLD = 48;
