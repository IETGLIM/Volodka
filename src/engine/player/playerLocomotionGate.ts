/**
 * Module-level gameplay overlay gates for player locomotion.
 * React orchestrator hooks set flags; frame ticks read them without store churn.
 */

import { isExamineOverlayOpen } from '@/engine/assets/gltfPreloadOverlayGate';

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

/** Test-only reset */
export function resetPlayerLocomotionGateForTests(): void {
  panelStackBlocksLocomotion = false;
  minigameBlocksLocomotion = false;
}
