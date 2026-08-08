/* ─── Volodka RPG – composed store types ─── */
/* GameStoreState lives here (not shared.ts) so shared utilities never
 * import slice modules. All imports are type-only — zero runtime cycles. */

import type { PlayerSlice } from './slices/playerSlice';
import type { ExplorationSlice } from './slices/explorationSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { UISlice } from './slices/uiSlice';
import type { CutsceneSlice } from './slices/cutsceneSlice';
import type { SaveSlice } from './slices/saveSlice';
import type { DialogueHistorySlice } from './slices/dialogueHistorySlice';
import type { AchievementSlice } from './slices/achievementSlice';
import type { DifficultySlice } from './slices/difficultySlice';

/** @deprecated God-type removed — use per-slice contracts in ./crossSliceReads.ts */
export type CrossSliceReads = never;

export type {
  PlayerReadsFromExploration,
  PlayerReadsFromWorld,
  WorldReadsFromExploration,
  WorldReadsFromPlayer,
  UIReadsFromExploration,
  ExplorationReadsFromPlayer,
  SaveReadsSnapshot,
} from './crossSliceReads';

/** Full composed game store — intersection of all slice state + actions. */
export type GameStoreState =
  & PlayerSlice
  & ExplorationSlice
  & WorldSlice
  & UISlice
  & CutsceneSlice
  & SaveSlice
  & DialogueHistorySlice
  & AchievementSlice
  & DifficultySlice;
