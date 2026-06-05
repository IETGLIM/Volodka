/* ─── Volodka RPG – Player Inventory Slice ─── */
/* Inventory management and equipment. */

import type { StateCreator } from 'zustand';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';
import { getItemDefinition, getEquipmentSlot } from '@/data/items';
import { clamp, pushNotification } from '../shared';
import {
  addInventoryItem,
  findInventoryItemIndex,
  getInventoryFullMessage,
  removeInventoryItem,
} from '../inventoryHelpers';
import type { InventoryItem, TrainablePlayerSkill, EquipmentSlot } from '@/shared/types/game';
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
> = (set) => ({
  addItem: (item) => {
    let added = false;
    set((state) => {
      const result = addInventoryItem(state.playerState.inventory, item);
      if (result.ok) {
        added = true;
        return {
          playerState: { ...state.playerState, inventory: result.inventory },
        };
      }

      return {
        notifications: pushNotification(
          state.notifications,
          'stress',
          getInventoryFullMessage(result.itemName),
        ),
      };
    });
    return added;
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

      const skillChanges: Partial<Record<TrainablePlayerSkill, number>> = {};
      let energyChange = 0;
      let stressChange = 0;
      let karmaChange = 0;

      if (currentEquipped) {
        const prevDef = getItemDefinition(currentEquipped.id);
        if (prevDef) {
          for (const effect of prevDef.effects) {
            if (effect.skill) {
              skillChanges[effect.skill] = (skillChanges[effect.skill] ?? 0) - effect.value;
            } else if (effect.stat === 'energy') energyChange -= effect.value;
            else if (effect.stat === 'stress') stressChange -= effect.value;
            else if (effect.stat === 'karma') karmaChange -= effect.value;
          }
        }
      }

      for (const effect of def.effects) {
        if (effect.skill) {
          skillChanges[effect.skill] = (skillChanges[effect.skill] ?? 0) + effect.value;
        } else if (effect.stat === 'energy') energyChange += effect.value;
        else if (effect.stat === 'stress') stressChange += effect.value;
        else if (effect.stat === 'karma') karmaChange += effect.value;
      }

      const newSkills = { ...state.playerState.skills };
      for (const [skill, delta] of Object.entries(skillChanges)) {
        newSkills[skill as TrainablePlayerSkill] = Math.max(0, newSkills[skill as TrainablePlayerSkill] + (delta ?? 0));
      }

      return {
        playerState: {
          ...state.playerState,
          inventory: newInventory,
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: item,
          },
          skills: newSkills,
          energy: clamp(state.playerState.energy + energyChange, 0, 100),
          stress: clamp(state.playerState.stress + stressChange, 0, 100),
          karma: clamp(state.playerState.karma + karmaChange, 0, 100),
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
      const newSkills = { ...state.playerState.skills };
      let energyChange = 0;
      let stressChange = 0;
      let karmaChange = 0;

      if (def) {
        for (const effect of def.effects) {
          if (effect.skill) {
            newSkills[effect.skill] = Math.max(0, newSkills[effect.skill] - effect.value);
          } else if (effect.stat === 'energy') energyChange -= effect.value;
          else if (effect.stat === 'stress') stressChange -= effect.value;
          else if (effect.stat === 'karma') karmaChange -= effect.value;
        }
      }

      return {
        playerState: {
          ...state.playerState,
          inventory: [...state.playerState.inventory, equipped],
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: null,
          },
          skills: newSkills,
          energy: clamp(state.playerState.energy + energyChange, 0, 100),
          stress: clamp(state.playerState.stress + stressChange, 0, 100),
          karma: clamp(state.playerState.karma + karmaChange, 0, 100),
        },
        notifications: pushNotification(state.notifications, 'skill', `Снято: ${equipped.name}`),
      };
    }),
});
