/* Volodka RPG – facade over independent slice stores */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getGamePhase } from '@/shared/gamePhase';
import type { InventoryItem } from '@/shared/types/game';
export type { NotificationType, GameNotification, JournalTab, LoreEntry, LoreCategory, LoreRarity, ConversationLogEntry } from './shared';
export type { UnlockedAchievement } from './slices/worldSlice';
export { useGameSelector, useGamePrimitive } from './selectors/hooks';
export { usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore } from './stores';
import { wrapStoreSubscribe } from '@/engine/frame/frameProfilerCounters';
import { registerGameActionBridge, type GameSnapshotSubscribeOptions, type GameStoreSnapshot } from '@/engine/GameActionDispatcher';
import type { GameStoreState } from './types';
export type { GameStoreState, CrossSliceReads } from './types';
import { getCombinedGameState, subscribeAllStores } from './combinedState';
import { applyCombinedPatch } from './patchState';
import { reduceGameState } from './reduceGameState';

export const useGameStore = create<GameStoreState>()(subscribeWithSelector(() => getCombinedGameState()));
const facadeSetState = useGameStore.setState.bind(useGameStore);

let cachedBridgeSnapshot: GameStoreSnapshot | null = null;
function invalidateBridgeSnapshot(): void {
  cachedBridgeSnapshot = null;
}
function getBridgeSnapshot(): GameStoreSnapshot {
  if (cachedBridgeSnapshot) return cachedBridgeSnapshot;
  cachedBridgeSnapshot = buildGameSnapshot(getCombinedGameState());
  return cachedBridgeSnapshot;
}

subscribeAllStores(() => {
  invalidateBridgeSnapshot();
  facadeSetState(getCombinedGameState(), true);
});
useGameStore.setState = ((partial, replace) => {
  const patch = typeof partial === 'function' ? partial(getCombinedGameState()) : partial;
  applyCombinedPatch(patch as Partial<GameStoreState>);
}) as typeof useGameStore.setState;
if (import.meta.env?.DEV) {
  const baseSubscribe = useGameStore.subscribe.bind(useGameStore);
  useGameStore.subscribe = wrapStoreSubscribe(baseSubscribe) as typeof useGameStore.subscribe;
}
export function getGameStore(): GameStoreState { return getCombinedGameState(); }

const gameSnapshotCache = new WeakMap<GameStoreState, GameStoreSnapshot>();
function buildGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    mode: getGamePhase({ mainMenuOpen: state.mainMenuOpen, introActive: state.introActive, combatActive: state.combatActive, activeCutsceneId: state.activeCutsceneId }),
    currentNodeId: state.currentNodeId,
    showStoryOverlay: state.showStoryOverlay,
    exploration: { currentSceneId: state.exploration.currentSceneId, playerPosition: state.exploration.playerPosition, timeOfDay: state.exploration.timeOfDay, interactiveObjectStates: state.interactiveObjectStates },
    playerState: { flags: state.playerState.flags, inventory: state.playerState.inventory, skills: state.playerState.skills, energy: state.playerState.energy, karma: state.playerState.karma, stress: state.playerState.stress, visitedNodes: state.playerState.visitedNodes, progression: { level: state.playerState.progression?.level ?? 1, currentAct: state.playerState.progression?.currentAct ?? 1, skillPoints: state.playerState.progression?.skillPoints ?? 0, unlockedSkills: state.playerState.progression?.unlockedSkills ?? [] } },
    collectedPoems: state.collectedPoems, quests: state.quests, activeTTLFlags: state.activeTTLFlags ?? {}, poemPowers: state.poemPowers, npcRelations: state.npcRelations, unlockedAchievements: state.unlockedAchievements, achievementProgress: state.achievementProgress,
  };
}
function toGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  const cached = gameSnapshotCache.get(state);
  if (cached) return cached;
  const snapshot = buildGameSnapshot(state);
  gameSnapshotCache.set(state, snapshot);
  return snapshot;
}
function subscribeGameBridge(listener: (snapshot: GameStoreSnapshot) => void): () => void;
function subscribeGameBridge<T>(listener: (selected: T) => void, options: GameSnapshotSubscribeOptions<T>): () => void;
function subscribeGameBridge<T>(listener: ((snapshot: GameStoreSnapshot) => void) | ((selected: T) => void), options?: GameSnapshotSubscribeOptions<T>): () => void {
  if (!options) {
    const fullListener = listener as (snapshot: GameStoreSnapshot) => void;
    return subscribeAllStores(() => { fullListener(toGameSnapshot(getCombinedGameState())); });
  }
  const { selector, equalityFn } = options;
  const selectedListener = listener as (selected: T) => void;
  let prevSelected = selector(toGameSnapshot(getCombinedGameState()));
  return subscribeAllStores(() => {
    const selected = selector(toGameSnapshot(getCombinedGameState()));
    if (equalityFn(prevSelected, selected)) return;
    prevSelected = selected;
    selectedListener(selected);
  });
}
registerGameActionBridge({
  dispatch(action) {
    useGameStore.setState((state) => {
      reduceGameState(state, action);
      return {};
    });
  },
  getSnapshot() { return getBridgeSnapshot(); },
  subscribe: subscribeGameBridge,
  tryAddItem(item: InventoryItem) { return getCombinedGameState().addItem(item); },
  tryActivatePoemPower(poemId: string) { return getCombinedGameState().activatePoemPower(poemId); },
});
