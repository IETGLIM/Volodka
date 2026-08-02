export { usePlayerStore, getPlayerStoreState } from './playerStore';
export { useExplorationStore, getExplorationStoreState, getLivePlayerPosition, getLiveCurrentSceneId } from './explorationStore';
export { useWorldStore, getWorldStoreState } from './worldStore';
export { useUIStore, getUIStoreState, getLiveGamePhase } from './uiStore';
export { useCutsceneStore, getCutsceneStoreState, getActiveCutsceneId } from './cutsceneStore';
export { useSaveStore, getSaveStoreState } from './saveStore';
export { useDialogueHistoryStore, getDialogueHistoryStoreState } from './dialogueHistoryStore';
export { useAchievementStore, getAchievementStoreState } from './achievementStore';
import { bindSliceStores } from '../storeBindings';
import { usePlayerStore } from './playerStore';
import { useExplorationStore } from './explorationStore';
import { useWorldStore } from './worldStore';
import { useUIStore } from './uiStore';
import { useCutsceneStore } from './cutsceneStore';
import { useSaveStore } from './saveStore';
import { useDialogueHistoryStore } from './dialogueHistoryStore';
import { useAchievementStore } from './achievementStore';
bindSliceStores({
  getPlayerStore: () => usePlayerStore.getState(),
  getExplorationStore: () => useExplorationStore.getState(),
  getWorldStore: () => useWorldStore.getState(),
  getUIStore: () => useUIStore.getState(),
  getCutsceneStore: () => useCutsceneStore.getState(),
  getSaveStore: () => useSaveStore.getState(),
  getDialogueHistoryStore: () => useDialogueHistoryStore.getState(),
  getAchievementStore: () => useAchievementStore.getState(),
});
