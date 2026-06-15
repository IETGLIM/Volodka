/**
 * Scene Transition Protocol — single imperative pipeline for exploration scene changes.
 *
 * Order:
 *  1. scene:unload + GlobalCleanupService (GPU/audio/timer teardown)
 *  2. store write (currentSceneId, spawn)
 *  3. scene:enter (audio, narrative, preload listeners)
 *  4. scene:loaded (deferred — first canvas frame after enter; Suspense chunks may still stream)
 */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { SceneId } from '@/shared/types/game';
import { syncNarrativeOnSceneEnter } from '@/shared/exploreHubNodes';
import { triggerSceneEntryStoryIfNeeded } from '@/engine/interaction/narrativeOpenHelpers';
import { flushDeferredCombatStart } from './combatStartGate';
import { runGlobalSceneUnload } from './GlobalCleanupService';
import { ensureSceneLoadedBridge, scheduleSceneLoaded } from './sceneLoadedGate';
import {
  isSceneTransitionInProgress,
  resetSceneTransitionGuard,
  setSceneTransitionInProgress,
} from './sceneTransitionGuard';

export { isSceneTransitionInProgress, resetSceneTransitionGuard };

let unsubDeferredCombatStart: (() => void) | null = null;
let unsubTransitionGuardComplete: (() => void) | null = null;

/** Clear re-entrance guard after scene:loaded or failed transition (async pipeline tail). */
export function bindSceneTransitionGuardListeners(): void {
  unsubTransitionGuardComplete?.();
  const clearGuard = () => setSceneTransitionInProgress(false);
  const unsubLoaded = eventBus.on('scene:loaded', clearGuard);
  const unsubFailed = eventBus.on('scene:transition_failed', clearGuard);
  unsubTransitionGuardComplete = () => {
    unsubLoaded();
    unsubFailed();
  };
}

/** (Re)bind scene:loaded → deferred combat flush after EventBus dispose/revive. */
export function bindDeferredCombatStartListener(): void {
  unsubDeferredCombatStart?.();
  unsubDeferredCombatStart = eventBus.on('scene:loaded', () => {
    queueMicrotask(() => flushDeferredCombatStart());
  });
}

ensureSceneLoadedBridge();
bindSceneTransitionGuardListeners();
bindDeferredCombatStartListener();

export interface SceneTransitionPayload {
  targetScene: SceneId;
  spawnAt: [number, number, number];
}

/**
 * Apply a scene transition. Call only from SceneTransitionHandler (EventBus listener)
 * or test harness — never mutate exploration.currentSceneId elsewhere.
 */
export function performSceneTransition(payload: SceneTransitionPayload): void {
  if (isSceneTransitionInProgress()) {
    if (import.meta.env.DEV) {
      console.warn(
        '[SceneTransitionManager] Dropped re-entrant transition to',
        payload.targetScene,
      );
    }
    return;
  }

  setSceneTransitionInProgress(true);
  try {
    const fromSceneId = getGameSnapshot().exploration.currentSceneId;
    const { targetScene, spawnAt } = payload;

    eventBus.emit('scene:transition_start', {
      fromSceneId,
      targetScene,
      spawnAt,
    });

    if (fromSceneId !== targetScene) {
      eventBus.emit('scene:unload', {
        sceneId: fromSceneId,
        nextSceneId: targetScene,
      });
      runGlobalSceneUnload(fromSceneId, targetScene);
    }

    dispatchGameAction({
      type: 'exploration/applySceneTransition',
      targetScene,
      spawnAt,
    });
    syncNarrativeOnSceneEnter(targetScene);
    triggerSceneEntryStoryIfNeeded(targetScene, fromSceneId);

    eventBus.emit('scene:enter', {
      sceneId: targetScene,
      fromSceneId,
    });

    // scene:enter = store committed; scene:loaded = first composited frame (see sceneLoadedGate).
    scheduleSceneLoaded({
      sceneId: targetScene,
      fromSceneId,
    });
  } catch (error) {
    setSceneTransitionInProgress(false);
    throw error;
  }
}
