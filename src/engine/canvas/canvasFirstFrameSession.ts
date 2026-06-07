import { eventBus } from '@/engine/EventBus';

/** Per-canvas first-frame session — keyed by WebGL canvas element. */
export type CanvasFirstFrameSession = { emitted: boolean; contextLost: boolean };

const canvasFirstFrameSessions = new WeakMap<HTMLCanvasElement, CanvasFirstFrameSession>();

let registeredCanvas: HTMLCanvasElement | null = null;

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
export function invalidateCanvasFirstFrame(): void {
  if (registeredCanvas) {
    const session = canvasFirstFrameSessions.get(registeredCanvas);
    if (session) {
      session.emitted = false;
    }
  }
  eventBus.emit('canvas:invalidate-first-frame', {});
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

export function markCanvasFirstFrameEmitted(canvas: HTMLCanvasElement): void {
  const session = getCanvasFirstFrameSession(canvas);
  session.emitted = true;
  session.contextLost = false;
}
