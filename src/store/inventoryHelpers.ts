/* ─── Volodka RPG – pure inventory mutation helpers ─── */

import type {
  InventoryItem,
  NonStackableInventoryItem,
  StackableInventoryItem,
} from '@/shared/types/game';
import { asItemId } from '@/shared/types/brands';
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
  item: { id: string; stackable: boolean },
): boolean {
  const existingIdx = findInventoryItemIndex(inventory, item.id);
  if (existingIdx >= 0 && inventory[existingIdx].stackable) return true;
  return inventory.length < MAX_INVENTORY_SLOTS;
}

export type AddInventoryItemResult =
  | { ok: true; inventory: InventoryItem[] }
  | { ok: false; reason: 'full'; itemName: string };

type InventoryItemLike = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: NonStackableInventoryItem['category'];
  stackable: boolean;
  quantity: number;
};

/** Normalize legacy save rows to the stackable discriminated union. */
export function normalizeInventoryItem(item: InventoryItemLike): InventoryItem {
  const id = asItemId(item.id);
  if (item.stackable) {
    return { ...item, id, stackable: true, quantity: Math.max(1, item.quantity) };
  }
  return { ...item, id, stackable: false, quantity: 1 };
}

/** Stack or append an item. Returns false when inventory is full.
 * v4.7.2: honours the catalog maxStack — the existing stack fills to the
 * limit and the remainder spills into a fresh stack (when there is room). */
export function addInventoryItem(
  inventory: InventoryItem[],
  item: InventoryItem,
  options?: { maxStack?: number },
): AddInventoryItemResult {
  const next = [...inventory];
  const normalized = normalizeInventoryItem(item);
  const existingIdx = findInventoryItemIndex(next, normalized.id);
  const maxStack = options?.maxStack && options.maxStack > 0 ? options.maxStack : Infinity;

  if (existingIdx >= 0 && next[existingIdx].stackable) {
    const existing = next[existingIdx];
    if (!existing.stackable) {
      return { ok: false, reason: 'full', itemName: normalized.name };
    }
    const addQty = normalized.stackable ? normalized.quantity : 1;
    // v4.7.2 FIX: the stack used to grow past the catalog maxStack
    // (e.g. 30× coffee in one slot at maxStack 10). Fill to the limit and
    // spill the remainder into new stacks while there is room.
    const roomInStack = Math.max(0, maxStack - existing.quantity);
    const intoStack = Math.min(addQty, roomInStack);
    let remainder = addQty - intoStack;

    if (intoStack > 0) {
      next[existingIdx] = {
        ...existing,
        quantity: existing.quantity + intoStack,
      } satisfies StackableInventoryItem;
    }

    while (remainder > 0) {
      if (next.length >= MAX_INVENTORY_SLOTS) {
        // No room for the overflow — the whole call fails (atomic), the
        // caller shows the «inventory full» toast.
        return { ok: false, reason: 'full', itemName: normalized.name };
      }
      const chunk = Math.min(remainder, maxStack);
      next.push({ ...normalized, stackable: true, quantity: chunk } as StackableInventoryItem);
      remainder -= chunk;
    }
    return { ok: true, inventory: next };
  }

  if (next.length < MAX_INVENTORY_SLOTS) {
    if (normalized.stackable && normalized.quantity > maxStack) {
      // Fresh oversized stack — clamp to the limit and spill the rest.
      let remainder = normalized.quantity;
      while (remainder > 0) {
        if (next.length >= MAX_INVENTORY_SLOTS) {
          return { ok: false, reason: 'full', itemName: normalized.name };
        }
        const chunk = Math.min(remainder, maxStack);
        next.push({ ...normalized, stackable: true, quantity: chunk } as StackableInventoryItem);
        remainder -= chunk;
      }
      return { ok: true, inventory: next };
    }
    next.push(normalized);
    return { ok: true, inventory: next };
  }

  return { ok: false, reason: 'full', itemName: normalized.name };
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

  const existing = next[idx];
  if (!existing.stackable) {
    next.splice(idx, 1);
    return { inventory: next, removed: true };
  }

  const updated: StackableInventoryItem = {
    ...existing,
    quantity: existing.quantity - quantity,
  };

  if (updated.quantity <= 0) {
    next.splice(idx, 1);
  } else {
    next[idx] = updated;
  }

  return { inventory: next, removed: true };
}
