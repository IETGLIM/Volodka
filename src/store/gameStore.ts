/* Volodka RPG – facade over independent slice stores */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getGamePhase } from '@/shared/gamePhase';
import type { InventoryItem } from '@/shared/types/game';
export type { NotificationType, GameNotification, JournalTab, LoreEntry, LoreCategory, LoreRarity, ConversationLogEntry } from './shared';
export type { UnlockedAchievement } from './slices/worldSlice';
export { useGameSelector, useGamePrimitive } from './selectors/hooks';
export { usePlayerStore, useExplorationStore, useWorldStore, useUIStore, useCutsceneStore, useSaveStore } from './stores';
import { wrapStoreSubscribeIfDev } from './dev/storeSubscribeProfiler';
import { registerGameActionBridge, type GameSnapshotSubscribeOptions, type GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { GameStoreState } from './types';
export type { GameStoreState, CrossSliceReads } from './types';
import { getCombinedGameState, subscribeAllStores, invalidateCombinedGameStateCache, scheduleAfterSliceStoresSettle } from './combinedState';
import { usePlayerStore } from './stores/playerStore';
import { useWorldStore } from './stores/worldStore';
import { getCachedGameSnapshot } from './gameSnapshotCache';
import { applyCombinedPatch } from './patchState';
import { applyGameAction } from './applyGameAction';

export const useGameStore = create<GameStoreState>()(subscribeWithSelector(() => getCombinedGameState()));
const facadeSetState = useGameStore.setState.bind(useGameStore);
const baseGetState = useGameStore.getState.bind(useGameStore);

let facadeDirty = false;
let facadeFlushQueued = false;

function flushFacadeState(): void {
  facadeDirty = false;
  const next = getCombinedGameState();
  if (next === baseGetState()) return;
  facadeSetState(next, true);
}

function syncMarkFacadeDirty(): void {
  // Always invalidate — slice store internal state changed even though the
  // store object refs are stable. The "stale" check compared refs (which
  // never change), so it never invalidated, breaking state propagation and
  // freezing the UI (black screen after quest accept, etc.).
  invalidateCombinedGameStateCache();
  facadeDirty = true;
}

function scheduleFacadeFlush(): void {
  if (facadeFlushQueued) return;
  facadeFlushQueued = true;
  scheduleAfterSliceStoresSettle(() => {
    facadeFlushQueued = false;
    if (facadeDirty) flushFacadeState();
  });
}

function getBridgeSnapshot(): GameStoreSnapshot {
  return toGameSnapshot(getCombinedGameState());
}

subscribeAllStores(() => {
  syncMarkFacadeDirty();
  scheduleFacadeFlush();
});

useGameStore.getState = () => {
  if (facadeDirty) flushFacadeState();
  return baseGetState();
};
useGameStore.setState = ((partial, _replace) => {
  const patch = typeof partial === 'function' ? partial(getCombinedGameState()) : partial;
  if (patch !== undefined) {
    applyCombinedPatch(patch);
  }
  flushFacadeState();
}) as typeof useGameStore.setState;
if (import.meta.env?.DEV) {
  const baseSubscribe = useGameStore.subscribe.bind(useGameStore);
  useGameStore.subscribe = wrapStoreSubscribeIfDev(baseSubscribe) as typeof useGameStore.subscribe;
}
export function getGameStore(): GameStoreState { return useGameStore.getState(); }

function buildGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    mode: getGamePhase({ mainMenuOpen: state.mainMenuOpen, introActive: state.introActive, combatActive: state.combatActive, activeCutsceneId: state.activeCutsceneId }),
    currentNodeId: state.currentNodeId,
    showStoryOverlay: state.showStoryOverlay,
    exploration: { currentSceneId: state.exploration.currentSceneId, playerPosition: state.exploration.playerPosition, timeOfDay: state.exploration.timeOfDay, interactiveObjectStates: state.interactiveObjectStates },
    playerState: { flags: state.playerState.flags, inventory: state.playerState.inventory, skills: state.playerState.skills, energy: state.playerState.energy, karma: state.playerState.karma, stress: state.playerState.stress, visitedNodes: state.playerState.visitedNodes, equippedThoughtIds: state.equippedThoughtIds ?? [], progression: { level: state.playerState.progression?.level ?? 1, currentAct: state.playerState.progression?.currentAct ?? 1, skillPoints: state.playerState.progression?.skillPoints ?? 0, unlockedSkills: state.playerState.progression?.unlockedSkills ?? [], unlockedPerks: state.playerState.progression?.unlockedPerks ?? [], perkPoints: state.playerState.progression?.perkPoints ?? 0 }, choiceLog: state.playerState.choiceLog ?? [], moralChoices: state.playerState.moralChoices ?? [] },
    collectedPoems: state.collectedPoems, quests: state.quests, activeTTLFlags: state.activeTTLFlags ?? {}, poemPowers: state.poemPowers, npcRelations: state.npcRelations,     unlockedAchievements: state.unlockedAchievements, achievementProgress: state.achievementProgress,
    diegeticNarrative: state.diegeticNarrative
      ? { nodeId: state.diegeticNarrative.nodeId, kind: state.diegeticNarrative.kind }
      : null,
    activeCutsceneId: state.activeCutsceneId,
    triggeredCutscenes: state.triggeredCutscenes,
    lastUsedPoemId: state.lastUsedPoemId ?? null,
    lastUsedPoemTimestamp: state.lastUsedPoemTimestamp ?? null,
    pendingPoemReadingId: state.pendingPoemReadingId ?? null,
    weatherEnabled: state.weatherEnabled ?? true,
    rainIntensity: state.rainIntensity ?? 0,
    acquiredThoughtIds: state.acquiredThoughtIds ?? [],
    equippedItems: (state.playerState.equippedItems
      ? Object.fromEntries(
          Object.entries(state.playerState.equippedItems).map(([slot, item]) => [
            slot,
            item ? { id: item.id } : null,
          ]),
        )
      : {}) as GameStoreSnapshot['equippedItems'],
    dialogueHistory: state.dialogueHistory,
    trophyTracking: state.trophyTracking,
    difficultySettings: state.difficultySettings,
  };
}
function toGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return getCachedGameSnapshot(state, buildGameSnapshot);
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
      applyGameAction(state, action);
      return {};
    });
  },
  getSnapshot() { return getBridgeSnapshot(); },
  subscribe: subscribeGameBridge,
  tryAddItem(item: InventoryItem) { return usePlayerStore.getState().addItem(item); },
  tryActivatePoemPower(poemId: string) { return useWorldStore.getState().activatePoemPower(poemId); },
});
