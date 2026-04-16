// ============================================
// STORE INDEX — Единый экспорт доменных сторов
// ============================================
// Обеспечивает обратную совместимость с
// существующим useGameStore через фасад.

export { usePlayerStore, usePlayerStats, usePlayerSkills, useStress } from './playerStore';
export { useWorldStore, useExploration, useGameMode } from './worldStore';
export { useQuestStore } from './questStore';
export { useInventoryStore } from './inventoryStore';

// ============================================
// BACKWARD COMPATIBILITY FACADE
// ============================================
// Старый useGameStore делегирует к доменным сторам.
// Компоненты могут мигрировать постепенно.

import { usePlayerStore } from './playerStore';
import { useWorldStore } from './worldStore';
import { useQuestStore } from './questStore';
import { useInventoryStore } from './inventoryStore';
import type { InventoryItem } from '@/shared/types/game';

/**
 * Backward-compatible facade for the old monolithic store.
 * New code should import domain stores directly.
 * This facade exists to avoid breaking existing components.
 */
export const useGameStore = Object.assign(
  // Primary hook: returns player store state (most commonly used)
  usePlayerStore,
  {
    // Access to other domain stores
    world: useWorldStore,
    quest: useQuestStore,
    inventory: useInventoryStore,
  }
);

/** Direct store access for non-hook contexts */
export const getGameStore = () => usePlayerStore;
