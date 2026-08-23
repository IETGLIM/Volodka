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
import { resetPlayerStaminaForNewSession } from '@/engine/player/playerStamina';
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
import { resetTransitionDirector } from '@/engine/scene/TransitionDirector';
import { clearAllSessionQualityOverrides } from '@/engine/graphics/autoQualitySession';

/** Idempotent — safe to call from disposeGameEngine and resetGame. */
export function resetEngineModuleRuntimeState(): void {
  resetCameraShake();
  resetGlobalTimeScale();
  resetCinematicPresentation();
  resetPoemReadingSession();
  resetPoemRevealSession();
  resetSceneTransitionGuard();
  resetSceneTransitionDedupe();
  // Silent abort of wipe/hold black overlay — do not emit transition_failed
  // (that surfaces the «Не удалось загрузить сцену» banner on New Game).
  resetTransitionDirector();
  resetInteractionEndDedupState();
  resetPendingEntryBeatFromZoneInteraction();
  cancelEncounterPresentation();
  resetGltfPreloadOverlayGateForTests();
  resetAchievementTracking();
  invalidateStoryGraphIndex();
  resetKeyboardInputState();
  resetSharedVirtualControlsState();
  resetPlayerStaminaForNewSession();
  resetLoadingTimelineForSession();
  clearAllSessionQualityOverrides();
}
