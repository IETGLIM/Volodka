/**
 * After stuck-recovery — briefly soft-unlock locomotion overlays so the player
 * can reapproach the NPC even if a residual cinematic/panel gate lingered.
 */

import { setCinematicHoldActive } from '@/engine/camera/cinematicPresentation';
import {
  setMinigameLocomotionGate,
  setPanelStackLocomotionGate,
} from '@/engine/player/playerLocomotionGate';

const DEFAULT_SOFT_UNLOCK_MS = 2800;

let softUnlockUntilMs = 0;

/** Clear residual overlay locks and start a soft-unlock window. */
export function triggerStuckSoftLocomotionUnlock(
  durationMs = DEFAULT_SOFT_UNLOCK_MS,
): void {
  setCinematicHoldActive(false);
  setPanelStackLocomotionGate(false);
  setMinigameLocomotionGate(false);
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  softUnlockUntilMs = now + Math.max(0, durationMs);
}

/** True while soft-unlock window is active (overlays ignored for movement). */
export function isStuckSoftLocomotionUnlockActive(): boolean {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return now < softUnlockUntilMs;
}

/** Test-only reset. */
export function resetStuckSoftLocomotionUnlockForTests(): void {
  softUnlockUntilMs = 0;
}
