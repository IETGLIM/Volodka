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
  return (
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '') ||
    gamePhase === 'cutscene' ||
    gamePhase === 'intro' ||
    gamePhase === 'combat' ||
    isEncounterPresentationActive() ||
    isCinematicHoldActive() ||
    isGameplayOverlayLocomotionLocked()
  );
}

/** Test-only reset */
export function resetPlayerLocomotionGateForTests(): void {
  panelStackBlocksLocomotion = false;
  minigameBlocksLocomotion = false;
}
