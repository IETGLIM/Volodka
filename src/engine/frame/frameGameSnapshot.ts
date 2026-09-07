import type { GamePhase } from '@/shared/gamePhase';
import { resolvePlayerMovementLockContract } from '@/engine/player/playerLocomotionGate';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { PlayerMovementLockContract } from '@/engine/player/playerMovementContract';
import { createPlayerMovementLockContract } from '@/engine/player/playerMovementContract';

/** Minimal game state read once per frame for tick callbacks. */
export interface FrameGameSnapshot {
  gamePhase: GamePhase;
  playerPosition: [number, number, number];
  showStoryOverlay: boolean;
  /** True while a diegetic (in-world) narrative panel is open. Diegetic
   *  panels don't set showStoryOverlay, so consumers that need to suppress
   *  timeouts / stuck-lock recovery during in-world dialogue must check this. */
  diegeticNarrative: boolean;
  currentNodeId: string | null;
  /** Store-derived locomotion lock (narrative overlay + phase). */
  movementLocked: boolean;
  movementLock: PlayerMovementLockContract;
}

export const DEFAULT_FRAME_GAME_SNAPSHOT: FrameGameSnapshot = {
  gamePhase: 'exploration',
  playerPosition: [0, 0, 0],
  showStoryOverlay: false,
  diegeticNarrative: false,
  currentNodeId: null,
  movementLocked: false,
  movementLock: createPlayerMovementLockContract([]),
};

export function createFrameGameSnapshot(store: GameStoreSnapshot): FrameGameSnapshot {
  const gamePhase = store.mode;
  const { showStoryOverlay, currentNodeId, exploration } = store;
  const movementLock = resolvePlayerMovementLockContract(store);

  return {
    gamePhase,
    playerPosition: exploration.playerPosition,
    showStoryOverlay,
    diegeticNarrative: store.diegeticNarrative != null,
    currentNodeId,
    movementLocked: movementLock.locked,
    movementLock,
  };
}

/* ─── FIX (perf GC): снапшот кадра создаётся ОДИН раз в pre_physics ───
 * (FrameBudgetRunner) и переиспользуется пост-фазами того же кадра
 * (PostFrameBudgetRunner) — раньше пост-фаза пересоздавала объект и
 * пересчитывала locomotion-lock каждый кадр. */
let latestFrameSnapshot: FrameGameSnapshot = DEFAULT_FRAME_GAME_SNAPSHOT;

export function setLatestFrameGameSnapshot(snapshot: FrameGameSnapshot): void {
  latestFrameSnapshot = snapshot;
}

/** Снапшот, созданный pre_physics-фазой текущего кадра. */
export function getLatestFrameGameSnapshot(): FrameGameSnapshot {
  return latestFrameSnapshot;
}

/** @deprecated Use createFrameGameSnapshot(getGameSnapshot()) — avoids @/store import. */
export function createFrameGameSnapshotFromStore(state: GameStoreSnapshot): FrameGameSnapshot {
  return createFrameGameSnapshot(state);
}
