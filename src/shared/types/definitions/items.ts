/* ─── Inventory & equipment definitions ─── */

import type { ItemId } from '../brands';

export type EquipmentSlot = 'head' | 'body' | 'accessory';

/** Linked content for books that open poems/lore */
export interface LinkedContent {
  readonly type: 'poem' | 'lore';
  readonly id: string;
}

type InventoryItemCategory = 'key' | 'consumable' | 'misc' | 'quest' | 'equipment';

interface InventoryItemBase {
  readonly id: ItemId;
  readonly name: string;
  readonly description: string;
  readonly icon?: string;
  readonly category: InventoryItemCategory;
}

export interface NonStackableInventoryItem extends InventoryItemBase {
  readonly stackable: false;
  readonly quantity: 1;
}

export interface StackableInventoryItem extends InventoryItemBase {
  readonly stackable: true;
  readonly quantity: number;
}

export type InventoryItem = NonStackableInventoryItem | StackableInventoryItem;

/** Runtime inventory entries may omit strict quantity=1 on legacy saves — normalize at load. */
export type InventoryItemInput = Omit<InventoryItem, 'id'> & { readonly id: ItemId | string };
