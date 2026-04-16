// ============================================
// INVENTORY STORE — Доменный стор: инвентарь
// ============================================
// Отвечает за: предметы, поэмы, достижения.
// Отдельный от playerStore — инвентарь меняется
// независимо от статов.

import { create } from 'zustand';
import type { InventoryItem } from '@/shared/types/game';
import { getItemById } from '@/data/items';

// ============================================
// TYPES
// ============================================

interface InventoryStoreState {
  inventory: InventoryItem[];
  collectedPoemIds: string[];
  revealedPoemId: string | null;
  unlockedAchievementIds: string[];
}

interface InventoryStoreActions {
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  hasItem: (itemId: string) => boolean;
  collectPoem: (poemId: string) => void;
  revealPoem: (poemId: string | null) => void;
  unlockAchievement: (achievementId: string) => void;
  resetInventory: () => void;
}

type InventoryStore = InventoryStoreState & InventoryStoreActions;

// ============================================
// STORE
// ============================================

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  inventory: [],
  collectedPoemIds: [],
  revealedPoemId: null,
  unlockedAchievementIds: [],

  addItem: (itemId, quantity = 1) => {
    const { inventory } = get();
    const itemData = getItemById(itemId);

    const item = itemData || {
      id: itemId,
      name: itemId,
      description: '',
      type: 'artifact' as const,
      rarity: 'common' as const,
      icon: '📦',
      droppable: true,
      stackable: true,
      maxStack: 99,
    };

    const existing = inventory.find((i) => i.item.id === itemId);
    if (existing) {
      const maxStack = item.maxStack || 99;
      const newQuantity = Math.min(existing.quantity + quantity, maxStack);
      set({
        inventory: inventory.map((i) =>
          i.item.id === itemId ? { ...i, quantity: newQuantity } : i
        ),
      });
    } else {
      set({
        inventory: [
          ...inventory,
          { item, quantity: Math.min(quantity, item.maxStack || 99), obtainedAt: Date.now() },
        ],
      });
    }
  },

  removeItem: (itemId, quantity = 1) => {
    const { inventory } = get();
    const existing = inventory.find((i) => i.item.id === itemId);
    if (existing && existing.quantity > quantity) {
      set({
        inventory: inventory.map((i) =>
          i.item.id === itemId ? { ...i, quantity: i.quantity - quantity } : i
        ),
      });
    } else {
      set({ inventory: inventory.filter((i) => i.item.id !== itemId) });
    }
  },

  hasItem: (itemId) => get().inventory.some((i) => i.item.id === itemId),

  collectPoem: (poemId) => {
    const { collectedPoemIds } = get();
    if (!collectedPoemIds.includes(poemId)) {
      set({ collectedPoemIds: [...collectedPoemIds, poemId] });
    }
  },

  revealPoem: (poemId) => set({ revealedPoemId: poemId }),

  unlockAchievement: (achievementId) => {
    const { unlockedAchievementIds } = get();
    if (!unlockedAchievementIds.includes(achievementId)) {
      set({ unlockedAchievementIds: [...unlockedAchievementIds, achievementId] });
    }
  },

  resetInventory: () =>
    set({
      inventory: [],
      collectedPoemIds: [],
      revealedPoemId: null,
      unlockedAchievementIds: [],
    }),
}));
