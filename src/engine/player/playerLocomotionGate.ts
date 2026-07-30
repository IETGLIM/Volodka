/**
 * Module-level gameplay overlay gates for player locomotion.
 * React orchestrator hooks set flags; frame ticks read them without store churn.
 *
 * Contract: `resolvePlayerMovementLocked` is the single source of truth for WASD freeze.
 * Store snapshot, gamepad, and camera read the same result via `createFrameGameSnapshot`.
 */

import { isExamineOverlayOpen } from '@/engine/assets/gltfPreloadOverlayGate';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import { isCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import { isStuckSoftLocomotionUnlockActive } from '@/engine/interaction/stuckSoftLocomotionUnlock';
import {
  createPlayerMovementLockContract,
  type PlayerMovementLockContract,
  type PlayerMovementLockReason,
} from '@/engine/player/playerMovementContract';

let panelStackBlocksLocomotion = false;
let minigameBlocksLocomotion = false;

export function setPanelStackLocomotionGate(blocked: boolean): void {
  panelStackBlocksLocomotion = blocked;
}

export function setMinigameLocomotionGate(blocked: boolean): void {
  minigameBlocksLocomotion = blocked;
}

/** True when a modal gameplay overlay should freeze WASD / stick locomotion. */
export function isGameplayOverlayLocomotionLocked(): boolean {
  return (
    isExamineOverlayOpen() ||
    panelStackBlocksLocomotion ||
    minigameBlocksLocomotion
  );
}

/** Single gate for per-frame locomotion lock (narrative + phase + overlays). */
export function resolvePlayerMovementLockContract(store: GameStoreSnapshot): PlayerMovementLockContract {
  const { showStoryOverlay, currentNodeId, mode: gamePhase } = store;
  const reasons: PlayerMovementLockReason[] = [];

  if (showStoryOverlay) {
    reasons.push(currentNodeId?.includes('dialogue') ? 'dialogue' : 'story_overlay');
  } else if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '')) {
    reasons.push('story_overlay');
  }

  if (store.diegeticNarrative) {
    reasons.push(store.diegeticNarrative.kind === 'dialogue' ? 'dialogue' : 'diegetic_narrative');
  }

  if (gamePhase === 'cutscene' || gamePhase === 'intro' || store.activeCutsceneId) {
    reasons.push('cutscene');
  }

  if (gamePhase === 'combat' || isEncounterPresentationActive()) {
    reasons.push('gameplay_overlay');
  }

  if (reasons.length > 0) {
    return createPlayerMovementLockContract(reasons);
  }

  // Soft unlock after stuck recovery: ignore residual cinematic/overlay gates briefly.
  if (isStuckSoftLocomotionUnlockActive()) {
    return createPlayerMovementLockContract([]);
  }

  if (isCinematicTimelineActive() || isCinematicHoldActive()) {
    reasons.push('cinematic_timeline');
  }

  if (isGameplayOverlayLocomotionLocked()) {
    reasons.push('gameplay_overlay');
  }

  return createPlayerMovementLockContract(reasons);
}

/** Single gate for per-frame locomotion lock (narrative + phase + overlays). */
export function resolvePlayerMovementLocked(store: GameStoreSnapshot): boolean {
  return resolvePlayerMovementLockContract(store).locked;
}

/** Test-only reset */
export function resetPlayerLocomotionGateForTests(): void {
  panelStackBlocksLocomotion = false;
  minigameBlocksLocomotion = false;
}
