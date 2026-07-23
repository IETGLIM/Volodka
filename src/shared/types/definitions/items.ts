/* ─── Inventory & equipment definitions ─── */

import type { ItemId } from '../brands';

export type EquipmentSlot = 'head' | 'body' | 'legs' | 'feet' | 'hands' | 'accessory';

/** Clothing/appearance modifiers that affect dialogue skill checks. */
export interface DialogueModifier {
  /** Skill check DC modifier (negative = easier, positive = harder) */
  dcAdjustment?: number;
  /** Which skills get bonuses from this outfit in dialogue */
  skillBonus?: Partial<Record<import('./skills').TrainablePlayerSkill, number>>;
  /** Tags that unlock specific dialogue branches */
  unlockTag?: string;
  /** Tags that lock specific dialogue branches */
  lockTag?: string;
}

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
