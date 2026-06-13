
/* ─── Volodka RPG – main Zustand game store (composed from slices) ─── */
/* Each domain (player, exploration, world, UI, cutscene, save) lives in
 * its own slice file. This module composes them into a single Zustand
 * store with the SAME public API as the previous monolith, so all 51
 * consumer files continue to work without any changes. */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getGamePhase } from '@/shared/gamePhase';
import type {
  PlayerState,
  ExplorationState,
  QuestState,
  InventoryItem,
  NPCRelation,
  TrainablePlayerSkill,
  SceneId,
} from '@/shared/types/game';
import type { CameraWaypointData } from '@/engine/events';

// Re-export shared types that consumers currently import from gameStore
export type {
  NotificationType,
  GameNotification,
  JournalTab,
  LoreEntry,
  LoreCategory,
  LoreRarity,
  ConversationLogEntry,
} from './shared';

// Re-export achievement types from worldSlice
export type { UnlockedAchievement } from './slices/worldSlice';

/** Memoized React subscriptions — prefer over raw `useGameStore(selector)` in components. */
export { useGameSelector, useGamePrimitive } from './selectors/hooks';

// Slice creators
import { createPlayerSlice } from './slices/playerSlice';
import { createExplorationSlice } from './slices/explorationSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createUISlice } from './slices/uiSlice';
import { createCutsceneSlice } from './slices/cutsceneSlice';
import { createSaveSlice } from './slices/saveSlice';
import { wrapStoreSubscribe } from '@/engine/frame/frameProfilerCounters';
import {
  registerGameActionBridge,
  type GameAction,
  type GameSnapshotSubscribeOptions,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';

// Import and re-export composed store type (defined in types.ts — no slice imports in shared.ts)
import type { GameStoreState } from './types';
export type { GameStoreState, CrossSliceReads } from './types';
import { reduceGameState } from './reduceGameState';

/* ─── Composed store ─── */

export const useGameStore = create<GameStoreState>()(
  subscribeWithSelector((...a) => ({
  ...createPlayerSlice(...a),
  ...createExplorationSlice(...a),
  ...createWorldSlice(...a),
  ...createUISlice(...a),
  ...createCutsceneSlice(...a),
  ...createSaveSlice(...a),
  })),
);

if (import.meta.env?.DEV) {
  const baseSubscribe = useGameStore.subscribe.bind(useGameStore);
  useGameStore.subscribe = wrapStoreSubscribe(baseSubscribe) as typeof useGameStore.subscribe;
}

/** Convenience: get current store state outside React */
export function getGameStore() {
  return useGameStore.getState();
}

const gameSnapshotCache = new WeakMap<GameStoreState, GameStoreSnapshot>();

function buildGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    mode: getGamePhase({
      mainMenuOpen: state.mainMenuOpen,
      introActive: state.introActive,
      combatActive: state.combatActive,
      activeCutsceneId: state.activeCutsceneId,
    }),
    currentNodeId: state.currentNodeId,
    showStoryOverlay: state.showStoryOverlay,
    exploration: {
      currentSceneId: state.exploration.currentSceneId,
      playerPosition: state.exploration.playerPosition,
      timeOfDay: state.exploration.timeOfDay,
      interactiveObjectStates: state.interactiveObjectStates,
    },
    playerState: {
      flags: state.playerState.flags,
      inventory: state.playerState.inventory,
      skills: state.playerState.skills,
      energy: state.playerState.energy,
      karma: state.playerState.karma,
      stress: state.playerState.stress,
      visitedNodes: state.playerState.visitedNodes,
      progression: {
        level: state.playerState.progression?.level ?? 1,
        currentAct: state.playerState.progression?.currentAct ?? 1,
        skillPoints: state.playerState.progression?.skillPoints ?? 0,
        unlockedSkills: state.playerState.progression?.unlockedSkills ?? [],
      },
    },
    collectedPoems: state.collectedPoems,
    quests: state.quests,
    activeTTLFlags: state.activeTTLFlags ?? {},
    poemPowers: state.poemPowers,
    npcRelations: state.npcRelations,
    unlockedAchievements: state.unlockedAchievements,
    achievementProgress: state.achievementProgress,
  };
}

/** Memoized per zustand state reference — avoids rebuilding on every subscribe tick. */
function toGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  const cached = gameSnapshotCache.get(state);
  if (cached) return cached;
  const snapshot = buildGameSnapshot(state);
  gameSnapshotCache.set(state, snapshot);
  return snapshot;
}

/** Selector subscribe passes `selected` (not full snapshot); equality short-circuits before listener. */
function subscribeGameBridge(listener: (snapshot: GameStoreSnapshot) => void): () => void;
function subscribeGameBridge<T>(
  listener: (selected: T) => void,
  options: GameSnapshotSubscribeOptions<T>,
): () => void;
function subscribeGameBridge<T>(
  listener: ((snapshot: GameStoreSnapshot) => void) | ((selected: T) => void),
  options?: GameSnapshotSubscribeOptions<T>,
): () => void {
  if (!options) {
    // Full-snapshot path: fires on every store mutation; snapshot is memoized per state ref.
    const fullListener = listener as (snapshot: GameStoreSnapshot) => void;
    return useGameStore.subscribe((state) => {
      fullListener(toGameSnapshot(state));
    });
  }

  const { selector, equalityFn } = options;
  const selectedListener = listener as (selected: T) => void;
  let prevSelected = selector(toGameSnapshot(useGameStore.getState()));

  return useGameStore.subscribe((state) => {
    const selected = selector(toGameSnapshot(state));
    if (equalityFn(prevSelected, selected)) return;
    prevSelected = selected;
    selectedListener(selected);
  });
}

registerGameActionBridge({
  dispatch(action: GameAction) {
    useGameStore.setState((state) => reduceGameState(state, action));
  },
  getSnapshot() {
    return toGameSnapshot(useGameStore.getState());
  },
  subscribe: subscribeGameBridge,
  tryAddItem(item) {
    return useGameStore.getState().addItem(item);
  },
  tryActivatePoemPower(poemId) {
    return useGameStore.getState().activatePoemPower(poemId);
  },
});
