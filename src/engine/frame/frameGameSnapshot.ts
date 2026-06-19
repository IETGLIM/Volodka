import type { GamePhase } from '@/shared/gamePhase';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import { isCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import { isGameplayOverlayLocomotionLocked } from '@/engine/player/playerLocomotionGate';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';

/** Minimal game state read once per frame for tick callbacks. */
export interface FrameGameSnapshot {
  gamePhase: GamePhase;
  playerPosition: [number, number, number];
  showStoryOverlay: boolean;
  currentNodeId: string | null;
  /** Store-derived locomotion lock (narrative overlay + phase). */
  movementLocked: boolean;
}

export const DEFAULT_FRAME_GAME_SNAPSHOT: FrameGameSnapshot = {
  gamePhase: 'exploration',
  playerPosition: [0, 0, 0],
  showStoryOverlay: false,
  currentNodeId: null,
  movementLocked: false,
};

export function createFrameGameSnapshot(store: GameStoreSnapshot): FrameGameSnapshot {
  const gamePhase = store.mode;
  const { showStoryOverlay, currentNodeId, exploration } = store;
  const movementLocked =
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '') ||
    gamePhase === 'cutscene' ||
    gamePhase === 'intro' ||
    gamePhase === 'combat' ||
    isEncounterPresentationActive() ||
    isCinematicHoldActive() ||
    isGameplayOverlayLocomotionLocked();

  return {
    gamePhase,
    playerPosition: exploration.playerPosition,
    showStoryOverlay,
    currentNodeId,
    movementLocked,
  };
}

/** @deprecated Use createFrameGameSnapshot(getGameSnapshot()) — avoids @/store import. */
export function createFrameGameSnapshotFromStore(state: GameStoreSnapshot): FrameGameSnapshot {
  return createFrameGameSnapshot(state);
}
