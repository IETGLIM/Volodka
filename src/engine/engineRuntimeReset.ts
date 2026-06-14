/**
 * Reset module-level engine runtime state on dispose / new game.
 * Does not touch persisted accessibility or localStorage settings.
 */

import { resetCameraShake } from '@/engine/camera/cameraShake';
import { resetGlobalTimeScale } from '@/engine/camera/cinematicCamera';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { cancelEncounterPresentation } from '@/engine/combat/encounterPresentation';
import { resetSceneTransitionGuard } from '@/engine/core/sceneTransitionGuard';
import { resetInteractionEndDedupState } from '@/engine/interaction/interactionEndDedup';
import { resetSceneTransitionDedupe } from '@/engine/scene/sceneTransition';

/** Idempotent — safe to call from disposeGameEngine and resetGame. */
export function resetEngineModuleRuntimeState(): void {
  resetCameraShake();
  resetGlobalTimeScale();
  resetCinematicPresentation();
  resetSceneTransitionGuard();
  resetSceneTransitionDedupe();
  resetInteractionEndDedupState();
  cancelEncounterPresentation();
}
