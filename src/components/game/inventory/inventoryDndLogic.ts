/* ─── Volodka RPG – Drag & Drop инвентаря: чистая логика (v4.7.4) ───
 * Без React — юнит-тестируется (inventoryDnd.test.ts).
 */

import type { EquipmentSlot } from '@/shared/types/game';

/* ─── Чистые хелперы (юнит-тестируются) ─── */

export type DropTarget =
  | { kind: 'slot'; slot: EquipmentSlot }
  | { kind: 'inventory' }
  | null;

/** Найти зону дропа, поднимаясь по DOM от элемента под курсором. */
export function resolveDropTargetFromElement(
  el: Element | null,
  maxDepth = 8,
): DropTarget {
  let node: Element | null = el;
  for (let i = 0; node && i < maxDepth; i++) {
    const slot = node.getAttribute?.('data-dnd-slot');
    if (slot) return { kind: 'slot', slot: slot as EquipmentSlot };
    if (node.getAttribute?.('data-dnd-inventory') === 'true') {
      return { kind: 'inventory' };
    }
    node = node.parentElement;
  }
  return null;
}

/** Совместим ли предмет (по его equipmentSlot) со слотом-целью. */
export function isSlotDropCompatible(
  itemEquipmentSlot: string | undefined,
  targetSlot: EquipmentSlot,
): boolean {
  return itemEquipmentSlot === targetSlot;
}

/** Порог старта драга: мышь — 6px; тач — лонг-пресс 250мс без большого сдвига. */
export const DRAG_MOUSE_THRESHOLD_PX = 6;
export const DRAG_TOUCH_DELAY_MS = 250;
export const DRAG_TOUCH_SLOP_PX = 10;

export function shouldStartMouseDrag(movedPx: number): boolean {
  return movedPx >= DRAG_MOUSE_THRESHOLD_PX;
}

export function shouldStartTouchDrag(
  heldMs: number,
  movedPx: number,
): boolean {
  return heldMs >= DRAG_TOUCH_DELAY_MS && movedPx <= DRAG_TOUCH_SLOP_PX;
}

/** Данные перетаскиваемого предмета (ghost + решение о дропе). */
export interface DragPayload {
  /** Перетаскиваемый предмет (из сетки) — надеть при дропе на слот. */
  item?: import('@/shared/types/game').InventoryItem;
  /** Слот, с которого тянут надетый предмет — снять при дропе в инвентарь. */
  fromSlot?: EquipmentSlot;
  label: string;
  icon?: string;
  rarity: import('@/data/items').ItemRarity;
  /** Куда этот предмет можно дропнуть (для подсветки целей). */
  equipmentSlot?: string;
}

/** Отметить завершение драга (для гашения следующего click). */
export function markDragEnded(now = Date.now()): void {
  lastDragEndedAt = now;
}

/** Гасить ли клик после состоявшегося драга (click стреляет после pointerup). */
let lastDragEndedAt = 0;
export function wasDraggingRecently(now = Date.now()): boolean {
  return now - lastDragEndedAt < 250;
}

