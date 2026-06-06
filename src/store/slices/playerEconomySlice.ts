/* ─── Volodka RPG – Player Economy Slice ─── */
/* Crafting and merchant trading. */

import type { StateCreator } from 'zustand';
import { getItemDefinition, createInventoryItem } from '@/data/gameDataLoader';
import { getRecipeById } from '@/data/craftingRecipes';
import {
  getMerchantInventory,
  getBuyPrice,
  getSellPrice,
  getBasePriceByRarity,
  merchantBuysItem,
} from '@/data/tradingData';
import { pushNotification } from '../shared';
import {
  addInventoryItem,
  canAddInventoryItem,
  findInventoryItem,
  findInventoryItemIndex,
  removeInventoryItem,
} from '../inventoryHelpers';
import type { GameStoreState } from '../types';
import { readNpcRelationValue } from '../crossSliceReads';
import { eventBus } from '@/engine/EventBus';

/* ─── Slice types ─── */

export interface PlayerEconomySliceActions {
  /** Craft an item using a recipe. Checks requirements, removes inputs, adds output. */
  craftItem: (recipeId: string) => void;
  /** Check if a recipe can be crafted (has items + skill requirements) */
  canCraft: (recipeId: string) => boolean;
  /** Buy an item from a merchant NPC. Deducts credits, adds item to inventory. */
  buyItem: (npcId: string, itemId: string) => void;
  /** Sell an item to a merchant NPC. Removes item from inventory, adds credits. */
  sellItem: (npcId: string, itemId: string) => void;
  /** Check if the player can buy an item from a merchant */
  canBuyItem: (npcId: string, itemId: string) => boolean;
  /** Check if the player can sell an item to a merchant */
  canSellItem: (npcId: string, itemId: string) => boolean;
  /** Add credits to the player */
  addCredits: (amount: number) => void;
}

export type PlayerEconomySlice = PlayerEconomySliceActions;

/* ─── Slice creator ─── */

export const createPlayerEconomySlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerEconomySlice
> = (set, get) => ({
  canCraft: (recipeId) => {
    const state = get();
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;

    for (const req of recipe.skillRequirements) {
      if ((state.playerState.skills[req.skill] ?? 0) < req.level) return false;
    }

    for (const input of recipe.inputs) {
      const invItem = findInventoryItem(state.playerState.inventory, input.itemId);
      if (!invItem || invItem.quantity < input.quantity) return false;
    }

    const outputDef = getItemDefinition(recipe.output.itemId);
    const existingOutput = findInventoryItem(state.playerState.inventory, recipe.output.itemId);
    if (!existingOutput && !canAddInventoryItem(
      state.playerState.inventory,
      outputDef ?? { id: recipe.output.itemId, stackable: false },
    )) {
      return false;
    }

    return true;
  },

  craftItem: (recipeId) =>
    set((state) => {
      const recipe = getRecipeById(recipeId);
      if (!recipe) return state;

      for (const req of recipe.skillRequirements) {
        if ((state.playerState.skills[req.skill] ?? 0) < req.level) {
          return {
            notifications: pushNotification(state.notifications, 'stress', `Недостаточный уровень навыка: ${req.skill} (нужно ${req.level})`),
          };
        }
      }

      let newInventory = [...state.playerState.inventory];
      for (const input of recipe.inputs) {
        const invItem = findInventoryItem(newInventory, input.itemId);
        if (!invItem || invItem.quantity < input.quantity) {
          return {
            notifications: pushNotification(state.notifications, 'stress', `Не хватает ингредиентов для: ${recipe.name}`),
          };
        }
        const removed = removeInventoryItem(newInventory, input.itemId, input.quantity);
        newInventory = removed.inventory;
      }

      const outputItem = createInventoryItem(recipe.output.itemId, recipe.output.quantity);
      const addResult = addInventoryItem(newInventory, outputItem);
      if (!addResult.ok) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — крафт невозможен'),
        };
      }
      newInventory = addResult.inventory;

      queueMicrotask(() => {
        eventBus.emit('crafting:discovered', {
          recipeId,
          recipeName: recipe.name,
          rarity: recipe.outputRarity,
        });

        eventBus.emit('item:crafted', {
          recipeId,
          recipeName: recipe.name,
          category: recipe.category,
        });
      });

      return {
        playerState: {
          ...state.playerState,
          inventory: newInventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Скрафчено: ${recipe.name}!`),
      };
    }),

  buyItem: (npcId, itemId) =>
    set((state) => {
      const merchant = getMerchantInventory(npcId);
      if (!merchant) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот персонаж не торгует'),
        };
      }

      const relationValue = readNpcRelationValue(get(), npcId);

      const price = getBuyPrice(merchant, itemId, relationValue);

      if (state.playerState.credits < price) {
        return {
          notifications: pushNotification(state.notifications, 'stress', `Недостаточно кредитов (нужно ${price}₴)`),
        };
      }

      const sellEntry = merchant.sells.find((s) => s.itemId === itemId);
      if (!sellEntry) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У торговца нет этого товара'),
        };
      }

      if (sellEntry.minRelation && relationValue < sellEntry.minRelation) {
        return {
          notifications: pushNotification(state.notifications, 'stress', `Недостаточный уровень отношений (нужно ${sellEntry.minRelation})`),
        };
      }

      const itemDef = getItemDefinition(itemId);
      const addResult = addInventoryItem(state.playerState.inventory, createInventoryItem(itemId, 1));
      if (!addResult.ok) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — покупка невозможна'),
        };
      }

      const itemName = itemDef?.name ?? itemId;

      return {
        playerState: {
          ...state.playerState,
          credits: state.playerState.credits - price,
          inventory: addResult.inventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Куплено: ${itemName} (-${price}₴)`),
      };
    }),

  sellItem: (npcId, itemId) =>
    set((state) => {
      const merchant = getMerchantInventory(npcId);
      if (!merchant) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот персонаж не торгует'),
        };
      }

      const relationValue = readNpcRelationValue(get(), npcId);

      if (!merchantBuysItem(npcId, itemId, relationValue)) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот торговец не покупает данный предмет'),
        };
      }

      const invIdx = findInventoryItemIndex(state.playerState.inventory, itemId);
      if (invIdx < 0) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У вас нет этого предмета'),
        };
      }

      const itemDef = getItemDefinition(itemId);
      if (itemDef?.questRelated) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Нельзя продать сюжетный предмет'),
        };
      }

      const basePrice = itemDef
        ? getBasePriceByRarity(itemDef.rarity)
        : 5;
      const merchantSellEntry = merchant.sells.find((s) => s.itemId === itemId);
      const effectiveBasePrice = merchantSellEntry?.basePrice ?? basePrice;
      const price = getSellPrice(merchant, itemId, effectiveBasePrice, relationValue);

      const { inventory, removed } = removeInventoryItem(state.playerState.inventory, itemId, 1);
      if (!removed) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У вас нет этого предмета'),
        };
      }

      const itemName = itemDef?.name ?? itemId;

      return {
        playerState: {
          ...state.playerState,
          credits: state.playerState.credits + price,
          inventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Продано: ${itemName} (+${price}₴)`),
      };
    }),

  canBuyItem: (npcId, itemId) => {
    const state = get();
    const merchant = getMerchantInventory(npcId);
    if (!merchant) return false;

    const relationValue = readNpcRelationValue(state, npcId);
    const price = getBuyPrice(merchant, itemId, relationValue);

    if (state.playerState.credits < price) return false;

    const sellEntry = merchant.sells.find((s) => s.itemId === itemId);
    if (!sellEntry) return false;
    if (sellEntry.minRelation && relationValue < sellEntry.minRelation) return false;

    const existingItem = findInventoryItem(state.playerState.inventory, itemId);
    const itemDef = getItemDefinition(itemId);
    if (!existingItem && !canAddInventoryItem(
      state.playerState.inventory,
      itemDef ?? { id: itemId, stackable: false },
    )) {
      return false;
    }

    return true;
  },

  canSellItem: (npcId, itemId) => {
    const state = get();
    const merchant = getMerchantInventory(npcId);
    if (!merchant) return false;

    const relationValue = readNpcRelationValue(state, npcId);

    if (!merchantBuysItem(npcId, itemId, relationValue)) return false;

    const hasItem = state.playerState.inventory.some((i) => i.id === itemId);
    if (!hasItem) return false;

    const itemDef = getItemDefinition(itemId);
    if (itemDef?.questRelated) return false;

    return true;
  },

  addCredits: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        credits: Math.max(0, state.playerState.credits + amount),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'skill', `${amount > 0 ? '+' : ''}${amount} кредитов`)
        : state.notifications,
    })),
});
