
/* ─── Volodka RPG – main Zustand game store (composed from slices) ─── */
/* Each domain (player, exploration, world, UI, cutscene, save) lives in
 * its own slice file. This module composes them into a single Zustand
 * store with the SAME public API as the previous monolith, so all 51
 * consumer files continue to work without any changes. */

import { create } from 'zustand';
import type {
  GameMode,
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

// Slice creators
import { createPlayerSlice } from './slices/playerSlice';
import { createExplorationSlice } from './slices/explorationSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createUISlice } from './slices/uiSlice';
import { createCutsceneSlice } from './slices/cutsceneSlice';
import { createSaveSlice } from './slices/saveSlice';
import {
  registerGameActionBridge,
  type GameAction,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';

// Import and re-export composed store type (defined in types.ts — no slice imports in shared.ts)
import type { GameStoreState } from './types';
export type { GameStoreState, CrossSliceReads } from './types';

/* ─── Composed store ─── */

export const useGameStore = create<GameStoreState>()((...a) => ({
  ...createPlayerSlice(...a),
  ...createExplorationSlice(...a),
  ...createWorldSlice(...a),
  ...createUISlice(...a),
  ...createCutsceneSlice(...a),
  ...createSaveSlice(...a),
}));

/** Convenience: get current store state outside React */
export function getGameStore() {
  return useGameStore.getState();
}

function toGameSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    exploration: {
      currentSceneId: state.exploration.currentSceneId,
      timeOfDay: state.exploration.timeOfDay,
    },
    playerState: {
      flags: state.playerState.flags,
      inventory: state.playerState.inventory,
    },
    collectedPoems: state.collectedPoems,
    quests: state.quests,
    activeTTLFlags: state.activeTTLFlags,
  };
}

registerGameActionBridge({
  dispatch(action: GameAction) {
    const store = useGameStore.getState();
    switch (action.type) {
      case 'quest/completeObjective':
        store.completeQuestObjective(action.questId, action.objectiveId);
        break;
      case 'quest/complete':
        store.completeQuest(action.questId);
        break;
      case 'quest/fail':
        store.failQuest(action.questId);
        break;
    }
  },
  getSnapshot() {
    return toGameSnapshot(useGameStore.getState());
  },
  subscribe(listener) {
    return useGameStore.subscribe((state) => {
      listener(toGameSnapshot(state));
    });
  },
});
