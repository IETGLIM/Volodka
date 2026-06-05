/* ─── Volodka RPG – pure inventory mutation helpers ─── */

import type { InventoryItem } from '@/shared/types/game';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';

export function findInventoryItemIndex(inventory: InventoryItem[], itemId: string): number {
  return inventory.findIndex((i) => i.id === itemId);
}

export function findInventoryItem(inventory: InventoryItem[], itemId: string): InventoryItem | undefined {
  const idx = findInventoryItemIndex(inventory, itemId);
  return idx >= 0 ? inventory[idx] : undefined;
}

export function getInventoryFullMessage(itemName: string): string {
  return `Инвентарь полон — предмет «${itemName}» не помещается (${MAX_INVENTORY_SLOTS}/${MAX_INVENTORY_SLOTS})`;
}

export function canAddInventoryItem(
  inventory: InventoryItem[],
  item: Pick<InventoryItem, 'id' | 'stackable'>,
): boolean {
  const existingIdx = findInventoryItemIndex(inventory, item.id);
  if (existingIdx >= 0 && inventory[existingIdx].stackable) return true;
  return inventory.length < MAX_INVENTORY_SLOTS;
}

export type AddInventoryItemResult =
  | { ok: true; inventory: InventoryItem[] }
  | { ok: false; reason: 'full'; itemName: string };

/** Stack or append an item. Returns false when inventory is full. */
export function addInventoryItem(inventory: InventoryItem[], item: InventoryItem): AddInventoryItemResult {
  const next = [...inventory];
  const existingIdx = findInventoryItemIndex(next, item.id);

  if (existingIdx >= 0 && next[existingIdx].stackable) {
    const updated = { ...next[existingIdx] };
    updated.quantity = updated.quantity + (item.quantity ?? 1);
    next[existingIdx] = updated;
    return { ok: true, inventory: next };
  }

  if (next.length < MAX_INVENTORY_SLOTS) {
    next.push({ ...item, quantity: item.quantity ?? 1 });
    return { ok: true, inventory: next };
  }

  return { ok: false, reason: 'full', itemName: item.name };
}

export interface RemoveInventoryItemResult {
  inventory: InventoryItem[];
  removed: boolean;
}

/** Decrement quantity or remove the stack entirely. */
export function removeInventoryItem(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number,
): RemoveInventoryItemResult {
  const next = [...inventory];
  const idx = findInventoryItemIndex(next, itemId);
  if (idx < 0) return { inventory: next, removed: false };

  const item = { ...next[idx] };
  item.quantity -= quantity;

  if (item.quantity <= 0) {
    next.splice(idx, 1);
  } else {
    next[idx] = item;
  }

  return { inventory: next, removed: true };
}
