/**
 * [roadmap:ARCH-02] Engine subsystem registrations.
 *
 * This file imports all engine subsystems and registers their dispose/revive
 * callbacks with `EngineSubsystemRegistry`. Importing this module replaces
 * the hand-maintained list in `disposeGameEngine.ts`.
 *
 * Registration order does NOT matter — the registry sorts by priority.
 * Priorities mirror the original hand-maintained order in disposeGameEngine.ts
 * to preserve exact teardown/revive semantics.
 *
 * If you add a new engine subsystem:
 * 1. Add `dispose()` + `revive()` exports to its module
 * 2. Add a `registerEngineSubsystem(...)` call below
 * 3. Done — no need to edit `disposeGameEngine.ts`
 */

import { registerEngineSubsystem, ENGINE_SUBSYSTEM_PRIORITIES as P } from './EngineSubsystemRegistry';

// ── Input (dispose priority 100) ──
import { detachKeyboardListeners } from '@/engine/keyboardInputState';
registerEngineSubsystem({
  id: 'keyboard-input',
  dispose: detachKeyboardListeners,
  disposePriority: P.input.dispose,
});

// ── Runtime state (dispose priority 90) ──
import { resetEngineModuleRuntimeState } from '@/engine/engineRuntimeReset';
registerEngineSubsystem({
  id: 'engine-runtime-state',
  dispose: resetEngineModuleRuntimeState,
  disposePriority: P.runtimeState.dispose,
});

import { resetInteractionSession } from '@/engine/interaction/interactionSession';
registerEngineSubsystem({
  id: 'interaction-session',
  dispose: resetInteractionSession,
  disposePriority: P.runtimeState.dispose,
});

import { suspendAutoCloseTimers, resumeAutoCloseTimers } from '@/shared/explorationAutoCloseTimers';
registerEngineSubsystem({
  id: 'auto-close-timers',
  dispose: suspendAutoCloseTimers,
  revive: resumeAutoCloseTimers,
  disposePriority: P.runtimeState.dispose,
  revivePriority: P.runtimeState.revive,
});

import { resetPlayerXpBatchFromEngine } from '@/shared/gameBridge/storeLifecycleHost';
registerEngineSubsystem({
  id: 'player-xp-batch',
  dispose: resetPlayerXpBatchFromEngine,
  disposePriority: P.runtimeState.dispose,
});

import { clearPlayerExternalVelocity, clearPlayerRigidBody } from '@/engine/PlayerRigidBodyState';
registerEngineSubsystem({
  id: 'player-rigid-body',
  dispose: () => {
    clearPlayerExternalVelocity();
    clearPlayerRigidBody();
  },
  disposePriority: P.runtimeState.dispose,
});

import { invalidateCanvasFirstFrame } from '@/engine/canvas/canvasFirstFrameSession';
registerEngineSubsystem({
  id: 'canvas-first-frame',
  dispose: invalidateCanvasFirstFrame,
  disposePriority: P.runtimeState.dispose,
});

// ── Frame visibility (dispose 90, revive 90) ──
import { disposeFrameVisibility, reviveFrameVisibility } from '@/engine/frame/frameVisibility';
registerEngineSubsystem({
  id: 'frame-visibility',
  dispose: disposeFrameVisibility,
  revive: reviveFrameVisibility,
  disposePriority: P.runtimeState.dispose,
  revivePriority: P.runtimeState.revive,
});

// ── Core subsystems (dispose 80, revive 80) ──
import { disposeCombatSystem, reviveCombatSystem } from '@/engine/CombatSystem';
registerEngineSubsystem({
  id: 'combat-system',
  dispose: disposeCombatSystem,
  revive: reviveCombatSystem,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeQuestTracker, reviveQuestTracker } from '@/engine/QuestTracker';
registerEngineSubsystem({
  id: 'quest-tracker',
  dispose: disposeQuestTracker,
  revive: reviveQuestTracker,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeGuidedStoryManager, reviveGuidedStoryManager } from '@/engine/GuidedStoryManager';
registerEngineSubsystem({
  id: 'guided-story-manager',
  dispose: disposeGuidedStoryManager,
  revive: reviveGuidedStoryManager,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeWorldEventDirector, reviveWorldEventDirector } from '@/engine/world/WorldEventDirector';
registerEngineSubsystem({
  id: 'world-event-director',
  dispose: disposeWorldEventDirector,
  revive: reviveWorldEventDirector,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeNavMeshLayer, reviveNavMeshLayer } from '@/engine/world/NavMeshLayer';
registerEngineSubsystem({
  id: 'nav-mesh-layer',
  dispose: disposeNavMeshLayer,
  revive: reviveNavMeshLayer,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeWorldStreamManager, reviveWorldStreamManager } from '@/engine/world/WorldStreamManager';
registerEngineSubsystem({
  id: 'world-stream-manager',
  dispose: disposeWorldStreamManager,
  revive: reviveWorldStreamManager,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

import { disposeWorldComputeWorker, reviveWorldComputeWorker } from '@/engine/workers/computeWorkerClient';
registerEngineSubsystem({
  id: 'world-compute-worker',
  dispose: disposeWorldComputeWorker,
  revive: reviveWorldComputeWorker,
  disposePriority: P.subsystem.dispose,
  revivePriority: P.subsystem.revive,
});

// ── GPU (dispose 60) ──
import { disposeAllEngineGpuResources } from '@/engine/three/gpuResourceLifecycle';
registerEngineSubsystem({
  id: 'gpu-resources',
  dispose: () => disposeAllEngineGpuResources('engine'),
  disposePriority: P.gpu.dispose,
});

// ── Audio (dispose 70, revive 70) ──
import { disposeSceneAudioController, getSceneAudioController } from '@/engine/audio/SceneAudioController';
registerEngineSubsystem({
  id: 'scene-audio-controller',
  dispose: disposeSceneAudioController,
  revive: () => getSceneAudioController().init(),
  disposePriority: P.audio.dispose,
  revivePriority: P.audio.revive,
});

import { disposeMusicEngine, reviveMusicEngine } from '@/engine/MusicEngine';
registerEngineSubsystem({
  id: 'music-engine',
  dispose: disposeMusicEngine,
  revive: reviveMusicEngine,
  disposePriority: P.audio.dispose,
  revivePriority: P.audio.revive,
});

import { disposeAmbientEngine, reviveAmbientEngine } from '@/engine/audio/AmbientEngine';
registerEngineSubsystem({
  id: 'ambient-engine',
  dispose: disposeAmbientEngine,
  revive: reviveAmbientEngine,
  disposePriority: P.audio.dispose,
  revivePriority: P.audio.revive,
});

import { disposeAudioEngine, reviveAudioEngine } from '@/engine/audio/AudioEngine';
registerEngineSubsystem({
  id: 'audio-engine',
  dispose: disposeAudioEngine,
  revive: reviveAudioEngine,
  disposePriority: P.audio.dispose,
  revivePriority: P.audio.revive,
});

import { disposeSharedAudioContext, reviveSharedAudioContext } from '@/engine/SharedAudioContext';
registerEngineSubsystem({
  id: 'shared-audio-context',
  dispose: disposeSharedAudioContext,
  revive: reviveSharedAudioContext,
  disposePriority: P.audio.dispose,
  revivePriority: P.audio.revive,
});

// ── Global cleanup service (dispose 50, revive 50) ──
import {
  runGlobalUnmountCleanup,
  resetGlobalCleanupRegistry,
  reviveModuleGlobalCleanupBindings,
} from '@/engine/core/GlobalCleanupService';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { SceneId } from '@/shared/types/game';

function getSceneIdForCleanup(): SceneId {
  try {
    return getGameSnapshot().exploration.currentSceneId;
  } catch {
    return 'volodka_room';
  }
}

registerEngineSubsystem({
  id: 'global-cleanup-service',
  dispose: () => {
    runGlobalUnmountCleanup(getSceneIdForCleanup());
    resetGlobalCleanupRegistry();
  },
  revive: reviveModuleGlobalCleanupBindings,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

// ── Bridges (dispose 50, revive 50) ──
import { bindAdaptiveQualityBridge, unbindAdaptiveQualityBridge } from '@/engine/graphics/adaptiveQualityBridge';
registerEngineSubsystem({
  id: 'adaptive-quality-bridge',
  dispose: unbindAdaptiveQualityBridge,
  revive: bindAdaptiveQualityBridge,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

import { clearSessionAutoResolvedTier } from '@/engine/graphics/autoQualitySession';
registerEngineSubsystem({
  id: 'auto-quality-session',
  dispose: clearSessionAutoResolvedTier,
  disposePriority: P.bridge.dispose,
});

import { bindPoemWorldEventBridge, unbindPoemWorldEventBridge } from '@/engine/poemWorld/poemWorldEventBridge';
registerEngineSubsystem({
  id: 'poem-world-event-bridge',
  dispose: unbindPoemWorldEventBridge,
  revive: bindPoemWorldEventBridge,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

import { bindGpuResourceBaselineBridge, unbindGpuResourceBaselineBridge } from '@/engine/performance/gpuResourceBaselineBridge';
registerEngineSubsystem({
  id: 'gpu-resource-baseline-bridge',
  dispose: unbindGpuResourceBaselineBridge,
  revive: bindGpuResourceBaselineBridge,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

import { bindSceneChunkGpuLifecycle, unbindSceneChunkGpuLifecycle } from '@/components/3d/sceneChunks/sceneChunkGpuLifecycle';
registerEngineSubsystem({
  id: 'scene-chunk-gpu-lifecycle',
  dispose: unbindSceneChunkGpuLifecycle,
  revive: bindSceneChunkGpuLifecycle,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

import { disposeTransitionDirector, reviveTransitionDirector } from '@/engine/scene/TransitionDirector';
registerEngineSubsystem({
  id: 'transition-director',
  dispose: disposeTransitionDirector,
  revive: reviveTransitionDirector,
  disposePriority: P.bridge.dispose,
  revivePriority: P.bridge.revive,
});

// ── Scene transition bridges (revive only — dispose handled by EventBus dispose) ──
import {
  bindSceneTransitionGuardListeners,
  bindDeferredCombatStartListener,
  bindCombatStartGateTimeout,
} from '@/engine/core/SceneTransitionManager';
import { bindSceneLoadedBridge } from '@/engine/core/sceneLoadedGate';
import { bindPoemResetListener } from '@/engine/PoemPowerSystem';
import { bindPoemReadingCutsceneLifecycleListeners } from '@/engine/poemReading/poemReadingOrchestrator';

registerEngineSubsystem({
  id: 'scene-transition-bridges',
  revive: () => {
    bindSceneLoadedBridge();
    bindSceneTransitionGuardListeners();
    bindDeferredCombatStartListener();
    bindCombatStartGateTimeout();
  },
  revivePriority: P.bridge.revive,
});

registerEngineSubsystem({
  id: 'poem-bridges',
  revive: () => {
    bindPoemResetListener();
    bindPoemReadingCutsceneLifecycleListeners();
  },
  revivePriority: P.bridge.revive,
});

// ── EventBus (dispose 10, revive 10) — LAST to dispose, FIRST to revive ──
import { disposeEventBus, reviveEventBus } from '@/engine/EventBus';
registerEngineSubsystem({
  id: 'event-bus',
  dispose: disposeEventBus,
  revive: reviveEventBus,
  disposePriority: P.eventBus.dispose,
  revivePriority: P.eventBus.revive,
});
