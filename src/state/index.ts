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
  saveGame,
  loadGame,
  resetGame,
  hydrateFromLocalStorage,
  type SaveGameOptions,
} from './saveManager';
export {
  useWorldStore,
  useExploration,
  useGameMode,
  type TravelToSceneResult,
  type TravelToSceneOptions,
} from './worldStore';
export { useQuestStore } from './questMetaStore';
export { useFactionStore } from './factionStore';
export { useInventoryStore } from './inventoryStore';
export { useAppStore, type AppPhase } from './appStore';
export { applyQuestCompletionRewards } from '@/lib/questRewards';

// ============================================
// BACKWARD COMPATIBILITY FACADE
// ============================================
// Старый useGameStore делегирует к доменным сторам.
// Компоненты могут мигрировать постепенно.

import { usePlayerStore } from './playerStore';
import { useWorldStore } from './worldStore';
import { useQuestStore } from './questMetaStore';
import { useFactionStore } from './factionStore';
import { useInventoryStore } from './inventoryStore';
import { useStore } from 'zustand';
import { saveGame, loadGame, resetGame, hydrateFromLocalStorage } from './saveManager';

type CombinedState = ReturnType<typeof usePlayerStore.getState> &
  ReturnType<typeof useWorldStore.getState> &
  ReturnType<typeof useQuestStore.getState> &
  ReturnType<typeof useFactionStore.getState> &
  ReturnType<typeof useInventoryStore.getState> & {
    saveGame: typeof saveGame;
    loadGame: typeof loadGame;
    resetGame: typeof resetGame;
    hydrateFromLocalStorage: typeof hydrateFromLocalStorage;
  };

const combinedStoreApi = {
  getState: (): CombinedState => ({
    ...usePlayerStore.getState(),
    ...useWorldStore.getState(),
    ...useQuestStore.getState(),
    ...useFactionStore.getState(),
    ...useInventoryStore.getState(),
    saveGame,
    loadGame,
    resetGame,
    hydrateFromLocalStorage,
  }),
  subscribe: (listener: (state: CombinedState, prevState: CombinedState) => void) => {
    let prevState = combinedStoreApi.getState();
    const handleUpdate = () => {
      const nextState = combinedStoreApi.getState();
      listener(nextState, prevState);
      prevState = nextState;
    };
    const unsubs = [
      usePlayerStore.subscribe(handleUpdate),
      useWorldStore.subscribe(handleUpdate),
      useQuestStore.subscribe(handleUpdate),
      useFactionStore.subscribe(handleUpdate),
      useInventoryStore.subscribe(handleUpdate),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  },
  setState: (partial: Partial<CombinedState> | ((state: CombinedState) => Partial<CombinedState>)) => {
    const state = typeof partial === 'function' ? partial(combinedStoreApi.getState()) : partial;
    // Route partial updates to the appropriate store
    if ('playerState' in state || 'currentNodeId' in state || 'choiceLog' in state) usePlayerStore.setState(state as any);
    if ('exploration' in state || 'gameMode' in state || 'npcRelations' in state || 'unlockedLocations' in state) useWorldStore.setState(state as any);
    if ('activeQuestIds' in state || 'questProgress' in state || 'completedQuestIds' in state) useQuestStore.setState(state as any);
    if ('factionReputations' in state) useFactionStore.setState(state as any);
    if ('inventory' in state || 'collectedPoemIds' in state || 'unlockedAchievementIds' in state) useInventoryStore.setState(state as any);
  },
  getInitialState: () => combinedStoreApi.getState(),
  destroy: () => {},
};

/**
 * Backward-compatible facade for the old monolithic store.
 * New code should import domain stores directly.
 * This facade exists to avoid breaking existing components.
 */
export const useGameStore = Object.assign(
  (function <T>(selector?: (state: CombinedState) => T) {
    return useStore(combinedStoreApi, selector as any);
  }) as {
    (): CombinedState;
    <T>(selector: (state: CombinedState) => T): T;
  },
  {
    ...combinedStoreApi,
    // Access to other domain stores explicitly
    world: useWorldStore,
    quest: useQuestStore,
    faction: useFactionStore,
    inventory: useInventoryStore,
  }
);

/** Direct store access for non-hook contexts (Zustand vanilla API). */
export const getGameStore = () => combinedStoreApi.getState();
