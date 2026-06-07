import { eventBus } from '@/engine/EventBus';

/** Per-canvas first-frame session — keyed by WebGL canvas element. */
export type CanvasFirstFrameSession = { emitted: boolean; contextLost: boolean };

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
    session = { emitted: false, contextLost: false };
    canvasFirstFrameSessions.set(canvas, session);
  }
  return session;
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
}

/**
 * Atomically claim the right to emit canvas:first-frame for this canvas.
 * Returns the current generation, or null when the latch is already closed.
 */
export function claimCanvasFirstFrameEmit(canvas: HTMLCanvasElement): number | null {
  const session = getCanvasFirstFrameSession(canvas);
  if (session.emitted) return null;
  session.emitted = true;
  session.contextLost = false;
  return firstFrameGeneration;
}

/** @deprecated Prefer claimCanvasFirstFrameEmit for atomic latch + generation pairing. */
export function markCanvasFirstFrameEmitted(canvas: HTMLCanvasElement): void {
  const session = getCanvasFirstFrameSession(canvas);
  session.emitted = true;
  session.contextLost = false;
}

/** Test-only reset — not for production. */
export function resetCanvasFirstFrameSessionForTests(): void {
  firstFrameGeneration = 0;
  registeredCanvas = null;
}
