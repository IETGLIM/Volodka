import { getRarityLabel, getItemDefinition, type ItemDefinition, type ItemRarity } from '@/data/items';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_SLOT_LABELS,
  INVENTORY_STAT_ICONS,
} from '@/components/game/inventory/inventoryConstants';
import type { TrainablePlayerSkill } from '@/shared/types/game';

import { devWarn } from '@/shared/utils/devLog';
const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: '🧠 Логика',
  coding: '💻 Кодирование',
  empathy: '💛 Эмпатия',
  persuasion: '🗣️ Убеждение',
  intuition: '👁️ Интуиция',
  writing: '✍️ Письмо',
  rhythm: '🎵 Ритм',
};

export interface TooltipComparisonDelta {
  stat: string;
  label: string;
  delta: number;
  /** Whether a higher value is beneficial for the player. */
  positiveIsGood: boolean;
}

/** v4.7.9: строка двухколоночного сравнения (Cyberpunk-стиль) — значение
 *  на новом предмете vs на надетом, с вердиктом «лучше/хуже/равно». */
export interface TooltipComparisonRow {
  stat: string;
  label: string;
  /** Значение на новом (наведённом) предмете. */
  newValue: number;
  /** Значение на надетом предмете. */
  equippedValue: number;
  delta: number;
  /** Whether a higher value is beneficial for the player. */
  positiveIsGood: boolean;
}

export interface TooltipComparison {
  equippedItemId: string;
  equippedName: string;
  equippedRarity: ItemRarity;
  slotLabel: string;
  deltas: TooltipComparisonDelta[];
  /** v4.7.9: полные строки side-by-side (включая нулевые дельты). */
  rows: TooltipComparisonRow[];
}

export type InventoryTooltipContent = {
  itemId: string;
  displayName: string;
  displayDescription: string;
  rarity: ItemRarity;
  rarityLabel: string;
  categoryLabel: string;
  isQuestItem: boolean;
  isEquipment: boolean;
  isConsumable: boolean;
  isBook: boolean;
  equipmentSlotLabel: string | null;
  effects: string[];
  effectsHeader: string;
  isUnknown: boolean;
  quantity: number;
  /** Comparison data when hovering an equipment item that has something equipped in the same slot. */
  comparison: TooltipComparison | null;
};

function buildEffectLines(def: ItemDefinition): string[] {
  const lines: string[] = [];
  for (const effect of def.effects) {
    if (effect.stat) {
      const icon = INVENTORY_STAT_ICONS[effect.stat] ?? '';
      const prefix = effect.value > 0 ? '+' : '';
      const statName = effect.stat === 'energy'
        ? 'Энергия'
        : effect.stat === 'stress'
          ? 'Стресс'
          : 'Карма';
      lines.push(`${icon} ${statName} ${prefix}${effect.value}`.trim());
    } else if (effect.skill && SKILL_LABELS[effect.skill]) {
      lines.push(`${SKILL_LABELS[effect.skill]} +${effect.value}`);
    }
  }
  return lines;
}

function resolveEffectsHeader(def: ItemDefinition): string {
  switch (def.category) {
    case 'equipment':
      return 'Бонусы';
    case 'consumable':
      return 'Эффект';
    case 'book':
    case 'poem_fragment':
      return 'При изучении';
    default:
      return 'Эффекты';
  }
}

function computeComparison(
  newDef: ItemDefinition,
  equippedItemId: string,
): TooltipComparison | null {
  const equippedDef = getItemDefinition(equippedItemId);
  if (!equippedDef) return null;

  const slotLabel = INVENTORY_SLOT_LABELS[equippedDef.equipmentSlot ?? ''] ?? equippedDef.equipmentSlot ?? '';

  // Collect stat deltas
  const newStats = new Map<string, number>();
  const oldStats = new Map<string, number>();

  for (const effect of newDef.effects) {
    if (effect.stat) {
      newStats.set(effect.stat, (newStats.get(effect.stat) ?? 0) + effect.value);
    } else if (effect.skill) {
      newStats.set(`skill:${effect.skill}`, (newStats.get(`skill:${effect.skill}`) ?? 0) + effect.value);
    }
  }

  for (const effect of equippedDef.effects) {
    if (effect.stat) {
      oldStats.set(effect.stat, (oldStats.get(effect.stat) ?? 0) + effect.value);
    } else if (effect.skill) {
      oldStats.set(`skill:${effect.skill}`, (oldStats.get(`skill:${effect.skill}`) ?? 0) + effect.value);
    }
  }

  // Build delta list: all keys from both items
  const allKeys = new Set([...newStats.keys(), ...oldStats.keys()]);
  const deltas: TooltipComparisonDelta[] = [];

  const STAT_LABELS: Record<string, string> = {
    energy: 'Энергия',
    stress: 'Стресс',
    karma: 'Карма',
  };

  const STAT_POSITIVE_IS_GOOD: Record<string, boolean> = {
    energy: true,
    stress: false,
    karma: true,
  };

  const SKILL_LABELS_LOCAL: Record<string, string> = {
    logic: 'Логика',
    coding: 'Кодирование',
    empathy: 'Эмпатия',
    persuasion: 'Убеждение',
    intuition: 'Интуиция',
    writing: 'Письмо',
    rhythm: 'Ритм',
  };

  for (const key of allKeys) {
    const newVal = newStats.get(key) ?? 0;
    const oldVal = oldStats.get(key) ?? 0;
    const delta = newVal - oldVal;
    if (delta === 0) continue;

    let label: string;
    let positiveIsGood: boolean;

    if (key.startsWith('skill:')) {
      const skillKey = key.slice(6);
      label = SKILL_LABELS_LOCAL[skillKey] ?? skillKey;
      positiveIsGood = true;
    } else {
      label = STAT_LABELS[key] ?? key;
      positiveIsGood = STAT_POSITIVE_IS_GOOD[key] ?? true;
    }

    deltas.push({ stat: key, label, delta, positiveIsGood });
  }

  // v4.7.9: полные строки side-by-side — все статы обоих предметов,
  // включая равные (Cyberpunk-стиль: пустых строк нет, честная картина).
  const rows: TooltipComparisonRow[] = [];
  for (const key of allKeys) {
    const newVal = newStats.get(key) ?? 0;
    const oldVal = oldStats.get(key) ?? 0;
    const delta = newVal - oldVal;

    let label: string;
    let positiveIsGood: boolean;
    if (key.startsWith('skill:')) {
      const skillKey = key.slice(6);
      label = SKILL_LABELS_LOCAL[skillKey] ?? skillKey;
      positiveIsGood = true;
    } else {
      label = STAT_LABELS[key] ?? key;
      positiveIsGood = STAT_POSITIVE_IS_GOOD[key] ?? true;
    }

    rows.push({ stat: key, label, newValue: newVal, equippedValue: oldVal, delta, positiveIsGood });
  }

  return {
    equippedItemId,
    equippedName: equippedDef.name,
    equippedRarity: equippedDef.rarity,
    slotLabel,
    deltas,
    rows,
  };
}

export function buildInventoryTooltipContent(
  view: InventoryItemView,
  equippedItemIdForSlot?: string | null,
): InventoryTooltipContent {
  const { item, def, isUnknown, rarity, displayName, displayDescription } = view;

  if (isUnknown && import.meta.env.DEV) {
    devWarn('[InventoryTooltip] Missing item definition:', item.id);
  }

  const categoryKey = def?.category ?? 'misc';
  const isQuestItem = def?.questRelated ?? false;
  const isEquipment = def?.category === 'equipment';
  const isConsumable = def?.category === 'consumable';
  const isBook = def?.category === 'book' || def?.category === 'poem_fragment';

  // Build comparison only for equipment items that have something equipped in the same slot
  let comparison: TooltipComparison | null = null;
  if (isEquipment && def?.equipmentSlot && equippedItemIdForSlot && equippedItemIdForSlot !== item.id) {
    comparison = computeComparison(def, equippedItemIdForSlot);
  }

  return {
    itemId: item.id,
    displayName,
    displayDescription: displayDescription || 'Нет описания',
    rarity,
    rarityLabel: getRarityLabel(rarity),
    categoryLabel: INVENTORY_CATEGORY_LABELS[categoryKey] ?? categoryKey,
    isQuestItem,
    isEquipment,
    isConsumable,
    isBook,
    equipmentSlotLabel: def?.equipmentSlot
      ? (INVENTORY_SLOT_LABELS[def.equipmentSlot] ?? def.equipmentSlot)
      : null,
    effects: def ? buildEffectLines(def) : [],
    effectsHeader: def ? resolveEffectsHeader(def) : 'Эффекты',
    isUnknown,
    quantity: item.quantity,
    comparison,
  };
}

export type TooltipPlacement = 'above' | 'below' | 'right';

export type TooltipCoords = {
  top: number;
  left: number;
  placement: TooltipPlacement;
};

const VIEWPORT_PADDING = 8;
const TOOLTIP_GAP = 8;
const DEFAULT_TOOLTIP_WIDTH = 256;
const DEFAULT_TOOLTIP_HEIGHT = 180;

export type AnchorRect = Pick<DOMRect, 'top' | 'left' | 'right' | 'bottom' | 'width' | 'height'>;

export type ViewportSize = { width: number; height: number };

export function computeTooltipCoords(
  anchorRect: AnchorRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferred: TooltipPlacement = 'above',
  viewport: ViewportSize = {
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  },
): TooltipCoords {
  const vw = viewport.width;
  const vh = viewport.height;

  let placement = preferred;
  let top = 0;
  let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;

  const fitsAbove = anchorRect.top - tooltipHeight - TOOLTIP_GAP >= VIEWPORT_PADDING;
  const fitsBelow = anchorRect.bottom + tooltipHeight + TOOLTIP_GAP <= vh - VIEWPORT_PADDING;
  const fitsRight = anchorRect.right + tooltipWidth + TOOLTIP_GAP <= vw - VIEWPORT_PADDING;

  if (preferred === 'above' && !fitsAbove && fitsBelow) placement = 'below';
  else if (preferred === 'below' && !fitsBelow && fitsAbove) placement = 'above';
  else if (preferred === 'right' && !fitsRight && fitsAbove) placement = 'above';
  else if (preferred === 'right' && !fitsRight && fitsBelow) placement = 'below';

  switch (placement) {
    case 'above':
      top = anchorRect.top - tooltipHeight - TOOLTIP_GAP;
      left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
      break;
    case 'below':
      top = anchorRect.bottom + TOOLTIP_GAP;
      left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
      break;
    case 'right':
      top = anchorRect.top + anchorRect.height / 2 - tooltipHeight / 2;
      left = anchorRect.right + TOOLTIP_GAP;
      break;
    default: {
      const _exhaustive: never = placement;
      return _exhaustive;
    }
  }

  left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - tooltipWidth - VIEWPORT_PADDING));
  top = Math.max(VIEWPORT_PADDING, Math.min(top, vh - tooltipHeight - VIEWPORT_PADDING));

  return { top, left, placement };
}

export function getDefaultTooltipSize(): { width: number; height: number } {
  return { width: DEFAULT_TOOLTIP_WIDTH, height: DEFAULT_TOOLTIP_HEIGHT };
}
