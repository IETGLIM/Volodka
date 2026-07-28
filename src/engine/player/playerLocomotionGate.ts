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
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import { isStuckSoftLocomotionUnlockActive } from '@/engine/interaction/stuckSoftLocomotionUnlock';

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
export function resolvePlayerMovementLocked(store: GameStoreSnapshot): boolean {
  const { showStoryOverlay, currentNodeId, mode: gamePhase } = store;
  const phaseLocked =
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '') ||
    gamePhase === 'cutscene' ||
    gamePhase === 'intro' ||
    gamePhase === 'combat' ||
    isEncounterPresentationActive();

  if (phaseLocked) return true;

  // Soft unlock after stuck recovery: ignore residual cinematic/overlay gates briefly.
  if (isStuckSoftLocomotionUnlockActive()) return false;

  return isCinematicHoldActive() || isGameplayOverlayLocomotionLocked();
}

/** Test-only reset */
export function resetPlayerLocomotionGateForTests(): void {
  panelStackBlocksLocomotion = false;
  minigameBlocksLocomotion = false;
}
