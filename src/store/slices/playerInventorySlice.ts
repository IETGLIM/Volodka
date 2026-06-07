/* ─── Volodka RPG – Player Inventory Slice ─── */
/* Inventory management and equipment. */

import type { StateCreator } from 'zustand';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';
import { getItemDefinition, getEquipmentSlot } from '@/data/gameDataLoader';
import { pushNotification } from '../shared';
import {
  addInventoryItem,
  findInventoryItemIndex,
  getInventoryFullMessage,
  removeInventoryItem,
} from '../inventoryHelpers';
import { applyEquipmentEffects } from '../equipmentHelpers';
import type { InventoryItem, EquipmentSlot } from '@/shared/types/game';
import type { GameStoreState } from '../types';

/* ─── Slice types ─── */

export interface PlayerInventorySliceActions {
  /** Returns false when inventory is full and the item could not be added. */
  addItem: (item: InventoryItem) => boolean;
  removeItem: (itemId: string, quantity: number) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
}

export type PlayerInventorySlice = PlayerInventorySliceActions;

/* ─── Slice creator ─── */

export const createPlayerInventorySlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerInventorySlice
> = (set, get) => ({
  addItem: (item) => {
    const state = get();
    const result = addInventoryItem(state.playerState.inventory, item);

    if (result.ok) {
      set({
        playerState: { ...state.playerState, inventory: result.inventory },
      });
      return true;
    }

    set({
      notifications: pushNotification(
        state.notifications,
        'stress',
        getInventoryFullMessage(result.itemName),
      ),
    });
    return false;
  },

  removeItem: (itemId, quantity) =>
    set((state) => {
      const { inventory, removed } = removeInventoryItem(state.playerState.inventory, itemId, quantity);
      if (!removed) return state;

      return {
        playerState: { ...state.playerState, inventory },
      };
    }),

  equipItem: (itemId) =>
    set((state) => {
      const invIdx = findInventoryItemIndex(state.playerState.inventory, itemId);
      if (invIdx < 0) return state;

      const slot = getEquipmentSlot(itemId) as EquipmentSlot | undefined;
      if (!slot) return state;

      const item = state.playerState.inventory[invIdx];
      const def = getItemDefinition(itemId);
      if (!def || def.category !== 'equipment') return state;

      const currentEquipped = state.playerState.equippedItems[slot];
      const newInventory = [...state.playerState.inventory];

      newInventory.splice(invIdx, 1);

      if (currentEquipped) {
        newInventory.push(currentEquipped);
      }

      const prevDef = currentEquipped ? getItemDefinition(currentEquipped.id) : null;
      const effectStats = applyEquipmentEffects(
        {
          skills: state.playerState.skills,
          energy: state.playerState.energy,
          stress: state.playerState.stress,
          karma: state.playerState.karma,
        },
        { unequip: prevDef, equip: def },
      );

      return {
        playerState: {
          ...state.playerState,
          inventory: newInventory,
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: item,
          },
          ...effectStats,
        },
        notifications: pushNotification(state.notifications, 'skill', `Экипировано: ${item.name}`),
      };
    }),

  unequipItem: (slot) =>
    set((state) => {
      const equipped = state.playerState.equippedItems[slot];
      if (!equipped) return state;

      if (state.playerState.inventory.length >= MAX_INVENTORY_SLOTS) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — нельзя снять экипировку'),
        };
      }

      const def = getItemDefinition(equipped.id);
      const effectStats = applyEquipmentEffects(
        {
          skills: state.playerState.skills,
          energy: state.playerState.energy,
          stress: state.playerState.stress,
          karma: state.playerState.karma,
        },
        { unequip: def ?? null },
      );

      return {
        playerState: {
          ...state.playerState,
          inventory: [...state.playerState.inventory, equipped],
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: null,
          },
          ...effectStats,
        },
        notifications: pushNotification(state.notifications, 'skill', `Снято: ${equipped.name}`),
      };
    }),
});
