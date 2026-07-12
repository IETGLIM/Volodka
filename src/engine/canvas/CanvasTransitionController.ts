import { eventBus } from '@/engine/EventBus';
import { ControllerSession } from '@/engine/controller/ControllerSession';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';
import {
  invalidateCanvasFirstFrame,
  isCanvasFirstFramePending,
} from '@/engine/canvas/canvasFirstFrameSession';
import {
  CANVAS_COMPOSITE_MODES,
  CANVAS_GAMEPLAY_MODES,
  canvasFadeOutMs,
  modeSwitchNeedsFreshCanvasFrame,
} from '@/engine/canvas/canvasTransitionPolicy';
import { devWarn } from '@/shared/utils/devLog';

export type CanvasTransitionSnapshot = {
  canvasReady: boolean;
  isTransitioning: boolean;
  fadeOutMs: number;
};

export const INITIAL_CANVAS_TRANSITION: CanvasTransitionSnapshot = {
  canvasReady: false,
  isTransitioning: false,
  fadeOutMs: CUTSCENE_TIMINGS.CANVAS_FADE_OUT_MS,
};

type Listener = (snapshot: CanvasTransitionSnapshot) => void;

/**
 * Imperative canvas transition state machine — one commit per phase change.
 * React hook subscribes via listener; timers use ControllerSession generation guards.
 */
export class CanvasTransitionController {
  private readonly session = new ControllerSession();
  private readonly listener: Listener;

  private snapshot: CanvasTransitionSnapshot = { ...INITIAL_CANVAS_TRANSITION };
  private mode = 'menu';
  private waitGen: number | null = null;
  private waitFrameGen: number | null = null;
  private warmFallback = false;
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private waitTimerId = 0;
  private completedWaitGens = new Set<number>();

  constructor(listener: Listener) {
    this.listener = listener;
  }

  getSnapshot(): CanvasTransitionSnapshot {
    return this.snapshot;
  }

  dispose(): void {
    this.invalidateWaitTimer();
    this.session.dispose();
    this.waitGen = null;
    this.waitFrameGen = null;
  }

  bindEvents(): () => void {
    const scope = eventBus.createScope();

    scope.on('canvas:first-frame', ({ generation }) => {
      this.onFirstFrame(generation);
    });

    scope.on('canvas:context-lost', () => {
      this.onContextLost();
    });

    scope.on('canvas:invalidate-first-frame', ({ generation }) => {
      this.onInvalidateFirstFrame(generation);
    });

    return () => scope.dispose();
  }

  setMode(nextMode: string): void {
    if (nextMode === this.mode) return;
    const prevMode = this.mode;
    this.mode = nextMode;
    this.onModeChange(prevMode, nextMode);
  }

  private commit(patch: Partial<CanvasTransitionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listener(this.snapshot);
  }

  private beginTransition(): number {
    this.invalidateWaitTimer();
    this.waitGen = null;
    this.waitFrameGen = null;
    this.completedWaitGens.clear();
    return this.session.begin();
  }

  private clearWaitTimer(): void {
    if (this.waitTimer) {
      clearTimeout(this.waitTimer);
      this.waitTimer = null;
    }
  }

  private invalidateWaitTimer(): void {
    this.waitTimerId += 1;
    this.clearWaitTimer();
  }

  private scheduleFadeOut(gen: number, delayMs: number): void {
    this.commit({ fadeOutMs: delayMs, isTransitioning: true });
    this.session.schedule(() => {
      if (!this.session.isCurrent(gen)) return;
      this.commit({ isTransitioning: false });
    }, delayMs);
  }

  private beginCanvasWait(gen: number, warmFallback: boolean): void {
    this.invalidateWaitTimer();
    this.waitGen = gen;
    this.warmFallback = warmFallback;
    const frameGen = invalidateCanvasFirstFrame();
    this.waitFrameGen = frameGen;

    this.commit({
      canvasReady: false,
      isTransitioning: true,
      fadeOutMs: canvasFadeOutMs(warmFallback),
    });

    const timerId = this.waitTimerId;
    this.waitTimer = setTimeout(() => {
      this.waitTimer = null;
      if (timerId !== this.waitTimerId) return;
      this.onWaitTimeout(gen, warmFallback);
    }, CUTSCENE_TIMINGS.CANVAS_TIMEOUT_MS);
  }

  private completeCanvasWait(gen: number, warmPath: boolean, frameGen: number): void {
    if (!this.session.isCurrent(gen)) return;
    if (this.waitGen !== gen) return;
    if (this.waitFrameGen !== frameGen) return;

    this.completedWaitGens.add(gen);
    this.invalidateWaitTimer();
    this.waitGen = null;
    this.waitFrameGen = null;
    this.commit({ canvasReady: true });
    this.scheduleFadeOut(gen, canvasFadeOutMs(warmPath));
  }

  private onWaitTimeout(gen: number, warmFallback: boolean): void {
    if (!this.session.isCurrent(gen)) return;
    if (this.completedWaitGens.has(gen)) return;
    if (this.waitGen !== gen) return;

    devWarn('[CanvasTransitionController] Canvas first-frame timeout — forcing transition overlay off');
    this.invalidateWaitTimer();
    this.waitGen = null;
    this.waitFrameGen = null;
    this.commit({ canvasReady: true });
    this.scheduleFadeOut(gen, canvasFadeOutMs(warmFallback));
  }

  private onFirstFrame(generation: number): void {
    const activeWait = this.waitGen;
    if (activeWait !== null && this.session.isCurrent(activeWait)) {
      if (generation !== this.waitFrameGen) return;
      this.completeCanvasWait(activeWait, this.warmFallback, generation);
      return;
    }

    if (this.waitGen !== null) return;

    if (this.mode === 'menu' || CANVAS_COMPOSITE_MODES.has(this.mode)) {
      this.commit({ canvasReady: true });
    }
  }

  private onContextLost(): void {
    this.commit({ canvasReady: false });
    if (!CANVAS_GAMEPLAY_MODES.has(this.mode)) return;

    const gen = this.beginTransition();
    this.beginCanvasWait(gen, false);
  }

  private onInvalidateFirstFrame(generation: number): void {
    if (this.waitGen === null) return;
    this.waitFrameGen = generation;
    this.commit({ canvasReady: false });
  }

  private onModeChange(prevMode: string, mode: string): void {
    const gen = this.beginTransition();
    const enteringNonComposite = !CANVAS_COMPOSITE_MODES.has(mode);

    if (enteringNonComposite) {
      if (this.snapshot.isTransitioning) {
        this.scheduleFadeOut(gen, canvasFadeOutMs(true));
      }
      return;
    }

    const needsFreshFrame = modeSwitchNeedsFreshCanvasFrame(prevMode, mode);

    if (needsFreshFrame) {
      const warmFallback = prevMode === 'menu';
      this.beginCanvasWait(gen, warmFallback);

      queueMicrotask(() => {
        if (!this.session.isCurrent(gen)) return;
        if (this.waitGen !== gen) return;
        if (isCanvasFirstFramePending()) return;
        const frameGen = this.waitFrameGen;
        if (frameGen === null) return;
        this.completeCanvasWait(gen, warmFallback, frameGen);
      });
      return;
    }

    if (CANVAS_GAMEPLAY_MODES.has(mode)) {
      this.commit({
        canvasReady: true,
        isTransitioning: true,
        fadeOutMs: canvasFadeOutMs(true),
      });
      this.scheduleFadeOut(gen, canvasFadeOutMs(true));
      return;
    }

    this.commit({ canvasReady: true, isTransitioning: false });
  }
}
