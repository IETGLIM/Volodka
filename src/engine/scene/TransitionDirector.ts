/**
 * Unified scene transition director — syncs overlay, progress bar, and canvas fade
 * from real EventBus milestones instead of fake timers.
 */

import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { TRANSITION_MILESTONES } from '@/shared/constants/transitionTimings';
import type { SceneId } from '@/shared/types/game';

export type TransitionDirectorPhase = 'idle' | 'loading' | 'complete';

export interface TransitionDirectorSnapshot {
  phase: TransitionDirectorPhase;
  progress: number;
  targetScene: SceneId | null;
  fromScene: SceneId | null;
  isCanvasFading: boolean;
}

type Listener = (snapshot: TransitionDirectorSnapshot) => void;

const IDLE: TransitionDirectorSnapshot = {
  phase: 'idle',
  progress: 0,
  targetScene: null,
  fromScene: null,
  isCanvasFading: false,
};

let snapshot: TransitionDirectorSnapshot = { ...IDLE };
const listeners = new Set<Listener>();
let completeTimer: ReturnType<typeof setTimeout> | null = null;
let canvasFadeTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
const busUnsubs: Array<() => void> = [];

function emit(): void {
  for (const fn of listeners) fn(snapshot);
}

function setSnapshot(partial: Partial<TransitionDirectorSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  emit();
}

function clearCompleteTimer(): void {
  if (completeTimer) {
    clearTimeout(completeTimer);
    completeTimer = null;
  }
}

function clearCanvasFadeTimer(): void {
  if (canvasFadeTimer) {
    clearTimeout(canvasFadeTimer);
    canvasFadeTimer = null;
  }
}

function abortTransition(): void {
  if (snapshot.phase === 'idle') return;
  clearCompleteTimer();
  clearCanvasFadeTimer();
  snapshot = { ...IDLE };
  emit();
}

function beginTransition(targetScene: SceneId, fromScene?: SceneId): void {
  clearCompleteTimer();
  clearCanvasFadeTimer();
  snapshot = {
    phase: 'loading',
    progress: TRANSITION_MILESTONES.started,
    targetScene,
    fromScene: fromScene ?? null,
    isCanvasFading: true,
  };
  emit();
}

function completeTransition(sceneId: SceneId): void {
  clearCompleteTimer();
  setSnapshot({
    phase: 'complete',
    progress: TRANSITION_MILESTONES.loaded,
    targetScene: sceneId,
    isCanvasFading: false,
  });
  completeTimer = setTimeout(() => {
    snapshot = { ...IDLE };
    emit();
  }, 500);
}

function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;

  busUnsubs.push(
    eventBus.on(
      'scene:transition',
      (payload) => {
        beginTransition(payload.targetScene);
      },
      EventBusPriority.Engine,
    ),
  );

  busUnsubs.push(
    eventBus.on('scene:transition_start', ({ fromSceneId, targetScene }) => {
      setSnapshot({
        progress: Math.max(snapshot.progress, TRANSITION_MILESTONES.unloading),
        targetScene,
        fromScene: fromSceneId,
        isCanvasFading: true,
      });
    }),
  );

  busUnsubs.push(
    eventBus.on('scene:unload', () => {
      setSnapshot({
        progress: Math.max(snapshot.progress, TRANSITION_MILESTONES.unloading),
      });
    }),
  );

  busUnsubs.push(
    eventBus.on('scene:enter', ({ sceneId }) => {
      setSnapshot({
        progress: Math.max(snapshot.progress, TRANSITION_MILESTONES.entered),
        targetScene: sceneId,
      });
    }),
  );

  busUnsubs.push(
    eventBus.on('scene:loaded', ({ sceneId }) => {
      completeTransition(sceneId);
    }),
  );

  busUnsubs.push(
    eventBus.on('canvas:first-frame', () => {
      if (snapshot.phase === 'loading') {
        setSnapshot({
          progress: Math.max(snapshot.progress, TRANSITION_MILESTONES.loaded - 5),
        });
      }
    }),
  );

  busUnsubs.push(
    eventBus.on('scene:transition_failed', () => {
      abortTransition();
    }),
  );

  busUnsubs.push(
    eventBus.on('canvas:context-lost', () => {
      if (snapshot.phase !== 'loading') return;
      eventBus.emit('scene:transition_failed', {
        reason: 'WebGL context lost',
        targetScene: snapshot.targetScene ?? undefined,
        fromScene: snapshot.fromScene ?? undefined,
      });
    }),
  );
}

export function getTransitionDirectorSnapshot(): TransitionDirectorSnapshot {
  ensureInitialized();
  return snapshot;
}

export function subscribeTransitionDirector(listener: Listener): () => void {
  ensureInitialized();
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

/** Test harness — reset director state between cases. */
export function resetTransitionDirector(): void {
  clearCompleteTimer();
  clearCanvasFadeTimer();
  snapshot = { ...IDLE };
  emit();
}

/** Tear down bus subscriptions (StrictMode / engine dispose). */
export function disposeTransitionDirector(): void {
  clearCompleteTimer();
  clearCanvasFadeTimer();
  for (const unsub of busUnsubs) unsub();
  busUnsubs.length = 0;
  initialized = false;
  snapshot = { ...IDLE };
  emit();
}

/** Re-arm after EventBus revive. */
export function reviveTransitionDirector(): void {
  ensureInitialized();
}

/** Cancel an in-flight transition and return the director to idle. */
export function cancelSceneTransitionDirector(
  reason: string,
  options?: { cancelled?: boolean; errorCode?: string },
): void {
  ensureInitialized();
  if (snapshot.phase === 'idle') return;
  eventBus.emit('scene:transition_failed', {
    reason,
    targetScene: snapshot.targetScene ?? undefined,
    fromScene: snapshot.fromScene ?? undefined,
    errorCode: options?.errorCode,
    cancelled: options?.cancelled,
  });
}
