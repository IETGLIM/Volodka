/**
 * Scene Transition Protocol — single imperative pipeline for exploration scene changes.
 *
 * Order:
 *  1. scene:unload + GlobalCleanupService (GPU/audio/timer teardown)
 *  2. store write (currentSceneId, spawn)
 *  3. scene:enter (audio, narrative, preload listeners)
 *  4. scene:loaded (post-commit; heavy assets may still stream via Suspense)
 */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { SceneId } from '@/shared/types/game';
import { syncNarrativeOnSceneEnter } from '@/shared/exploreHubNodes';
import { flushDeferredCombatStart } from './combatStartGate';
import { runGlobalSceneUnload } from './GlobalCleanupService';

export interface SceneTransitionPayload {
  targetScene: SceneId;
  spawnAt: [number, number, number];
}

let transitionInProgress = false;

/** True while unload → store → enter → loaded is running synchronously. */
export function isSceneTransitionInProgress(): boolean {
  return transitionInProgress;
}

/** Test harness — reset re-entrance guard between cases. */
export function resetSceneTransitionGuard(): void {
  transitionInProgress = false;
}

/**
 * Apply a scene transition. Call only from SceneTransitionHandler (EventBus listener)
 * or test harness — never mutate exploration.currentSceneId elsewhere.
 */
export function performSceneTransition(payload: SceneTransitionPayload): void {
  if (transitionInProgress) {
    if (import.meta.env.DEV) {
      console.warn(
        '[SceneTransitionManager] Dropped re-entrant transition to',
        payload.targetScene,
      );
    }
    return;
  }

  transitionInProgress = true;
  try {
    const fromSceneId = getGameSnapshot().exploration.currentSceneId;
    const { targetScene, spawnAt } = payload;

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

    eventBus.emit('scene:enter', {
      sceneId: targetScene,
      fromSceneId,
    });

    eventBus.emit('scene:loaded', {
      sceneId: targetScene,
      fromSceneId,
    });
  } finally {
    transitionInProgress = false;
    flushDeferredCombatStart();
  }
}
