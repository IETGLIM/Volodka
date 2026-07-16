import { eventBus } from '@/engine/EventBus';

/** Per-canvas first-frame session — keyed by WebGL canvas element. */
export type CanvasFirstFrameSession = {
  emitted: boolean;
  contextLost: boolean;
  /** The firstFrameGeneration this canvas last emitted canvas:first-frame for.
   *  Used to unstick a latch that was never reset (e.g. when `invalidateCanvasFirstFrame`
   *  resets the session for `registeredCanvas` but the post-frame tick runs against a
   *  different canvas reference after a remount/race). A new generation always re-opens
   *  the right to emit, so scene loads never stall on a stale `emitted=true`. */
  lastClaimedGeneration: number;
};

const canvasFirstFrameSessions = new WeakMap<HTMLCanvasElement, CanvasFirstFrameSession>();

let registeredCanvas: HTMLCanvasElement | null = null;

/** Monotonic generation — bumps on every invalidate so listeners can ignore stale emits. */
let firstFrameGeneration = 0;

export function getCanvasFirstFrameGeneration(): number {
  return firstFrameGeneration;
}

export function getCanvasFirstFrameSession(canvas: HTMLCanvasElement): CanvasFirstFrameSession {
  let session = canvasFirstFrameSessions.get(canvas);
  if (!session) {
    session = { emitted: false, contextLost: false, lastClaimedGeneration: -1 };
    canvasFirstFrameSessions.set(canvas, session);
  }
  return session;
}

export function hasRegisteredCanvas(): boolean {
  return registeredCanvas !== null;
}

export function registerCanvasForFirstFrame(canvas: HTMLCanvasElement): void {
  registeredCanvas = canvas;
}

export function unregisterCanvasForFirstFrame(canvas: HTMLCanvasElement): void {
  if (registeredCanvas === canvas) {
    registeredCanvas = null;
  }
}

/**
 * Reset first-frame latch so the next rendered frame re-emits canvas:first-frame.
 * Call when the canvas becomes visible after being hidden (menu → game) or when
 * a mode transition needs to wait for a freshly composited frame.
 */
export function invalidateCanvasFirstFrame(): number {
  firstFrameGeneration += 1;
  if (registeredCanvas) {
    const session = canvasFirstFrameSessions.get(registeredCanvas);
    if (session) {
      session.emitted = false;
    }
  }
  const generation = firstFrameGeneration;
  eventBus.emit('canvas:invalidate-first-frame', { generation });
  return generation;
}

/** Whether the session latch is open (no first-frame emitted yet). */
export function isCanvasFirstFramePending(): boolean {
  if (!registeredCanvas) return true;
  const session = canvasFirstFrameSessions.get(registeredCanvas);
  return !session?.emitted;
}

export function markCanvasFirstFrameSessionLost(canvas: HTMLCanvasElement): void {
  const session = getCanvasFirstFrameSession(canvas);
  session.emitted = false;
  session.contextLost = true;
  // Reset so the post-restore first frame is always treated as a fresh signal.
  session.lastClaimedGeneration = -1;
}

/**
 * Atomically claim the right to emit canvas:first-frame for this canvas.
 * Returns the current generation, or null when the latch is already closed for the
 * current generation.
 *
 * A claim succeeds when EITHER:
 *  - the latch is open (`emitted === false`), OR
 *  - the global `firstFrameGeneration` has advanced since this canvas last emitted
 *    (a new invalidate happened — e.g. a scene transition — which must always be
 *    allowed to signal a fresh first-frame, even if a stale `emitted=true` survived
 *    a canvas remount / registeredCanvas mismatch).
 *
 * This keeps the original latch semantics (one emit per invalidate) while making
 * scene loads resilient to latch-desync bugs that previously caused the
 * `canvas:first-frame watchdog timeout` → «Не удалось загрузить сцену» failure.
 */
export function claimCanvasFirstFrameEmit(canvas: HTMLCanvasElement): number | null {
  const session = getCanvasFirstFrameSession(canvas);
  const generationAdvanced = firstFrameGeneration !== session.lastClaimedGeneration;
  if (session.emitted && !generationAdvanced) return null;
  session.emitted = true;
  session.contextLost = false;
  session.lastClaimedGeneration = firstFrameGeneration;
  return firstFrameGeneration;
}

/** @deprecated Prefer claimCanvasFirstFrameEmit for atomic latch + generation pairing. */
export function markCanvasFirstFrameEmitted(canvas: HTMLCanvasElement): void {
  const session = getCanvasFirstFrameSession(canvas);
  session.emitted = true;
  session.contextLost = false;
  session.lastClaimedGeneration = firstFrameGeneration;
}

/** Test-only reset — not for production. */
export function resetCanvasFirstFrameSessionForTests(): void {
  firstFrameGeneration = 0;
  registeredCanvas = null;
}
