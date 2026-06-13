import type { GamePhase } from '@/shared/gamePhase';
import { getGamePhase } from '@/shared/gamePhase';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import { isCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import type { GameStoreSnapshot } from '@/engine/GameActionDispatcher';
import type { GameStoreState } from '@/store/types';

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
    isCinematicHoldActive();

  return {
    gamePhase,
    playerPosition: exploration.playerPosition,
    showStoryOverlay,
    currentNodeId,
    movementLocked,
  };
}

/** Lightweight per-frame snapshot — avoids full GameStoreSnapshot on the hot path. */
export function createFrameGameSnapshotFromStore(state: GameStoreState): FrameGameSnapshot {
  const gamePhase = getGamePhase({
    mainMenuOpen: state.mainMenuOpen,
    introActive: state.introActive,
    combatActive: state.combatActive,
    activeCutsceneId: state.activeCutsceneId,
  });
  const movementLocked =
    isNarrativeMovementLocked(state.showStoryOverlay, state.currentNodeId ?? '') ||
    gamePhase === 'cutscene' ||
    gamePhase === 'intro' ||
    gamePhase === 'combat' ||
    isEncounterPresentationActive() ||
    isCinematicHoldActive();

  return {
    gamePhase,
    playerPosition: state.exploration.playerPosition,
    showStoryOverlay: state.showStoryOverlay,
    currentNodeId: state.currentNodeId,
    movementLocked,
  };
}
