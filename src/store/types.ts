/* ─── Volodka RPG – composed store types ─── */
/* GameStoreState lives here (not shared.ts) so shared utilities never
 * import slice modules. All imports are type-only — zero runtime cycles. */

import type { PlayerSliceState, PlayerSlice } from './slices/playerSlice';
import type { ExplorationSliceState, ExplorationSlice } from './slices/explorationSlice';
import type { WorldSliceState, WorldSlice } from './slices/worldSlice';
import type { UISliceState, UISlice } from './slices/uiSlice';
import type { CutsceneSliceState, CutsceneSlice } from './slices/cutsceneSlice';
import type { SaveSliceState, SaveSlice } from './slices/saveSlice';
import type { CombatSliceState, CombatSlice } from './slices/combatSlice';

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
  & CombatSlice
  & CutsceneSlice
  & SaveSlice;
