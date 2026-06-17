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
import {
  resumeAutoCloseTimers,
  suspendAutoCloseTimers,
} from '@/shared/explorationAutoCloseTimers';
import { resetPlayerXpBatchFromEngine } from '@/shared/gameBridge/storeLifecycleHost';
import { resetEngineModuleRuntimeState } from '@/engine/engineRuntimeReset';
import {
  disposeFrameVisibility,
  reviveFrameVisibility,
} from '@/engine/frame/frameVisibility';
import {
  clearPlayerExternalVelocity,
  clearPlayerRigidBody,
} from '@/engine/PlayerRigidBodyState';
import { invalidateCanvasFirstFrame } from '@/engine/canvas/canvasFirstFrameSession';
import { disposeAllEngineGpuResources } from '@/engine/three/gpuResourceLifecycle';
import { disposeWorldComputeWorker, reviveWorldComputeWorker } from '@/engine/workers/computeWorkerClient';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  resetGlobalCleanupRegistry,
  reviveModuleGlobalCleanupBindings,
  runGlobalUnmountCleanup,
} from '@/engine/core/GlobalCleanupService';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { bindPoemResetListener } from '@/engine/PoemPowerSystem';
import { bindPoemReadingCutsceneLifecycleListeners } from '@/engine/poemReading/poemReadingOrchestrator';
import {
  bindAdaptiveQualityBridge,
  unbindAdaptiveQualityBridge,
} from '@/engine/graphics/adaptiveQualityBridge';
import { clearSessionAutoResolvedTier } from '@/engine/graphics/autoQualitySession';
import {
  bindPoemWorldEventBridge,
  unbindPoemWorldEventBridge,
} from '@/engine/poemWorld/poemWorldEventBridge';
import { bindDeferredCombatStartListener, bindSceneTransitionGuardListeners } from '@/engine/core/SceneTransitionManager';
import { bindSceneLoadedBridge } from '@/engine/core/sceneLoadedGate';
import {
  bindGpuResourceBaselineBridge,
  unbindGpuResourceBaselineBridge,
} from '@/engine/performance/gpuResourceBaselineBridge';
import {
  bindSceneChunkGpuLifecycle,
  unbindSceneChunkGpuLifecycle,
} from '@/components/3d/sceneChunks/sceneChunkGpuLifecycle';
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
    resetEngineModuleRuntimeState();
    disposeFrameVisibility();
    clearPlayerExternalVelocity();
    clearPlayerRigidBody();
    resetInteractionSession();
    suspendAutoCloseTimers();
    resetPlayerXpBatchFromEngine();

    disposeCombatSystem();
    disposeQuestTracker();
    disposeGuidedStoryManager();
    disposeWorldEventDirector();
    disposeNavMeshLayer();
    disposeWorldStreamManager();
    disposeWorldComputeWorker();
    invalidateCanvasFirstFrame();
    disposeAllEngineGpuResources('engine');

    disposeSceneAudioController();
    disposeMusicEngine();
    disposeAmbientEngine();
    disposeAudioEngine();
    disposeSharedAudioContext();

    runGlobalUnmountCleanup(getSceneIdForCleanup());
    resetGlobalCleanupRegistry();

    unbindAdaptiveQualityBridge();
    clearSessionAutoResolvedTier();
    unbindPoemWorldEventBridge();
    unbindGpuResourceBaselineBridge();
    unbindSceneChunkGpuLifecycle();
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
  resumeAutoCloseTimers();
  reviveModuleGlobalCleanupBindings();

  reviveFrameVisibility();
  reviveEventBus();
  bindSceneLoadedBridge();
  bindGpuResourceBaselineBridge();
  bindSceneChunkGpuLifecycle();
  bindSceneTransitionGuardListeners();
  bindDeferredCombatStartListener();
  bindPoemResetListener();
  bindPoemReadingCutsceneLifecycleListeners();
  bindPoemWorldEventBridge();
  bindAdaptiveQualityBridge();

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
