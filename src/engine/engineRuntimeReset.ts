/**
 * Reset module-level engine runtime state on dispose / new game.
 * Does not touch persisted accessibility or localStorage settings.
 */

import { resetAchievementTracking } from '@/engine/AchievementEngine';
import { resetKeyboardInputState } from '@/engine/keyboardInputState';
import { resetSharedVirtualControlsState } from '@/engine/VirtualControlsState';
import { resetLoadingTimelineForSession } from '@/engine/performance/LoadingTimeline';
import { invalidateStoryGraphIndex } from '@/engine/story/storyGraphIndex';
import { resetCameraShake } from '@/engine/camera/cameraShake';
import { resetGlobalTimeScale } from '@/engine/camera/cinematicCamera';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { resetPoemRevealSession } from '@/engine/poemReveal/poemRevealOrchestrator';
import { resetPoemReadingSession } from '@/engine/poemReading/poemReadingOrchestrator';
import { cancelEncounterPresentation } from '@/engine/combat/encounterPresentation';
import { resetGltfPreloadOverlayGateForTests } from '@/engine/assets/gltfPreloadOverlayGate';
import { resetSceneTransitionGuard } from '@/engine/core/sceneTransitionGuard';
import { resetInteractionEndDedupState } from '@/engine/interaction/interactionEndDedup';
import { resetPendingEntryBeatFromZoneInteraction } from '@/engine/interaction/narrativeOpenHelpers';
import { resetSceneTransitionDedupe } from '@/engine/scene/sceneTransition';

/** Idempotent — safe to call from disposeGameEngine and resetGame. */
export function resetEngineModuleRuntimeState(): void {
  resetCameraShake();
  resetGlobalTimeScale();
  resetCinematicPresentation();
  resetPoemReadingSession();
  resetPoemRevealSession();
  resetSceneTransitionGuard();
  resetSceneTransitionDedupe();
  resetInteractionEndDedupState();
  resetPendingEntryBeatFromZoneInteraction();
  cancelEncounterPresentation();
  resetGltfPreloadOverlayGateForTests();
  resetAchievementTracking();
  invalidateStoryGraphIndex();
  resetKeyboardInputState();
  resetSharedVirtualControlsState();
  resetLoadingTimelineForSession();
}
