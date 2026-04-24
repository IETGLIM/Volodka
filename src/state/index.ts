// ============================================
// STORE INDEX — Единый экспорт доменных сторов
// ============================================
// Обеспечивает обратную совместимость с
// существующим useGameStore через фасад.

export {
  selectEnergyFraction,
  selectEnergyPercentage,
  selectEnergyPercentageFromPlayer,
} from './playerStoreSelectors';
export {
  usePlayerStore,
  usePlayerStats,
  usePlayerSkills,
  useStress,
  useEnergyPercentage,
  type PlayerCoreStatsBatch,
} from './playerStore';
export {
  useWorldStore,
  useExploration,
  useGameMode,
  type TravelToSceneResult,
  type TravelToSceneOptions,
} from './worldStore';
export { useQuestStore } from './questMetaStore';
export { useInventoryStore } from './inventoryStore';

// ============================================
// BACKWARD COMPATIBILITY FACADE
// ============================================
// Старый useGameStore делегирует к доменным сторам.
// Компоненты могут мигрировать постепенно.

import { usePlayerStore } from './playerStore';
import { useWorldStore } from './worldStore';
import { useQuestStore } from './questMetaStore';
import { useInventoryStore } from './inventoryStore';
import type { InventoryItem } from '@/data/types';

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

/** Direct store access for non-hook contexts (Zustand vanilla API). */
export const getGameStore = () => usePlayerStore.getState();
