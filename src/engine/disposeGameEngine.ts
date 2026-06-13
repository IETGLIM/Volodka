/**
 * Ordered teardown of module-level game engine singletons on GameOrchestrator unmount.
 * Idempotent — safe when child hook cleanups and this central dispose overlap.
 *
 * Child React effects unmount before the orchestrator cleanup that calls this.
 * EventBus is cleared last so scoped listener disposes can still run.
 */

import { disposeEventBus, reviveEventBus } from '@/engine/EventBus';
import { disposeGuidedStoryManager, reviveGuidedStoryManager } from '@/engine/GuidedStoryManager';
import { disposeQuestTracker, reviveQuestTracker } from '@/engine/QuestTracker';
import { disposeCombatSystem, reviveCombatSystem } from '@/engine/CombatSystem';
import { disposeWorldEventDirector, reviveWorldEventDirector } from '@/engine/world/WorldEventDirector';
import { disposeNavMeshLayer, reviveNavMeshLayer } from '@/engine/world/NavMeshLayer';
import { disposeWorldStreamManager, reviveWorldStreamManager } from '@/engine/world/WorldStreamManager';
import { disposeSceneAudioController, getSceneAudioController } from '@/engine/audio/SceneAudioController';
import { disposeMusicEngine, reviveMusicEngine } from '@/engine/MusicEngine';
import { disposeAmbientEngine, reviveAmbientEngine } from '@/engine/audio/AmbientEngine';
import { disposeAudioEngine, reviveAudioEngine } from '@/engine/audio/AudioEngine';
import { disposeSharedAudioContext, reviveSharedAudioContext } from '@/engine/SharedAudioContext';
import { resetInteractionSession } from '@/engine/interaction/interactionSession';
import { resetInteractionEndDedupState } from '@/engine/interaction/interactionEndDedup';
import { clearAutoCloseTimers } from '@/store/slices/explorationSlice';
import {
  clearPlayerExternalVelocity,
  clearPlayerRigidBody,
} from '@/engine/PlayerRigidBodyState';
import { invalidateCanvasFirstFrame } from '@/engine/canvas/canvasFirstFrameSession';
import { disposeCombatTransientPools } from '@/engine/combat/combatTransientPool';
import { disposeWorldComputeWorker, reviveWorldComputeWorker } from '@/engine/workers/computeWorkerClient';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  resetGlobalCleanupRegistry,
  runGlobalUnmountCleanup,
} from '@/engine/core/GlobalCleanupService';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { bindPoemResetListener } from '@/engine/PoemPowerSystem';
import {
  disposeTransitionDirector,
  reviveTransitionDirector,
} from '@/engine/scene/TransitionDirector';
import { detachKeyboardListeners } from '@/engine/keyboardInputState';
import type { SceneId } from '@/shared/types/game';

let engineDisposed = false;

function getSceneIdForCleanup(): SceneId {
  try {
    return getGameSnapshot().exploration.currentSceneId;
  } catch {
    return 'volodka_room';
  }
}

export function isGameEngineDisposed(): boolean {
  return engineDisposed;
}

/** Tear down all engine singletons. Safe to call multiple times. */
export function disposeGameEngine(): void {
  if (engineDisposed) return;
  engineDisposed = true;

  try {
    detachKeyboardListeners();
    clearPlayerExternalVelocity();
    clearPlayerRigidBody();
    resetInteractionEndDedupState();
    resetInteractionSession();
    clearAutoCloseTimers();

    disposeCombatSystem();
    disposeQuestTracker();
    disposeGuidedStoryManager();
    disposeWorldEventDirector();
    disposeNavMeshLayer();
    disposeWorldStreamManager();
    disposeWorldComputeWorker();
    invalidateCanvasFirstFrame();
    disposeCombatTransientPools();

    disposeSceneAudioController();
    disposeMusicEngine();
    disposeAmbientEngine();
    disposeAudioEngine();
    disposeSharedAudioContext();

    runGlobalUnmountCleanup(getSceneIdForCleanup());
    resetGlobalCleanupRegistry();

    disposeTransitionDirector();
    disposeEventBus();
  } catch (err) {
    console.error('[disposeGameEngine] teardown error:', err);
  }
}

/**
 * Re-arm singletons after dispose so React StrictMode remount works.
 * Call at GameOrchestrator mount before sub-orchestrator hooks run.
 */
export function reviveGameEngine(): void {
  engineDisposed = false;

  reviveEventBus();
  bindPoemResetListener();

  reviveQuestTracker();
  reviveGuidedStoryManager();
  reviveCombatSystem();
  reviveWorldEventDirector();
  reviveNavMeshLayer();
  reviveWorldStreamManager();
  reviveWorldComputeWorker();

  reviveSharedAudioContext();
  reviveMusicEngine();
  reviveAudioEngine();
  reviveAmbientEngine();
  reviveTransitionDirector();
  getSceneAudioController().init();
}

registerHmrDispose(disposeGameEngine);
