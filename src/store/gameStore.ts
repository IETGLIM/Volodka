
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
  CameraWaypointData,
} from '@/shared/types/game';

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

// Import and re-export composed store type (defined in shared.ts to avoid circular imports with slices)
import type { GameStoreState } from './shared';
export type { GameStoreState };

/* ─── Composed store type is now defined in shared.ts ─── */

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
