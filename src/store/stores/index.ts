export { usePlayerStore, getPlayerStoreState } from './playerStore';
export { useExplorationStore, getExplorationStoreState } from './explorationStore';
export { useWorldStore, getWorldStoreState } from './worldStore';
export { useUIStore, getUIStoreState } from './uiStore';
export { useCutsceneStore, getCutsceneStoreState } from './cutsceneStore';
export { useSaveStore, getSaveStoreState } from './saveStore';
import { bindSliceStores } from '../storeBindings';
import { usePlayerStore } from './playerStore';
import { useExplorationStore } from './explorationStore';
import { useWorldStore } from './worldStore';
import { useUIStore } from './uiStore';
import { useCutsceneStore } from './cutsceneStore';
import { useSaveStore } from './saveStore';
bindSliceStores({
  getPlayerStore: () => usePlayerStore.getState(),
  getExplorationStore: () => useExplorationStore.getState(),
  getWorldStore: () => useWorldStore.getState(),
  getUIStore: () => useUIStore.getState(),
  getCutsceneStore: () => useCutsceneStore.getState(),
  getSaveStore: () => useSaveStore.getState(),
});
