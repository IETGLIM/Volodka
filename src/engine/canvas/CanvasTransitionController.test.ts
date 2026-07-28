import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  claimCanvasFirstFrameEmit,
  getCanvasFirstFrameGeneration,
  registerCanvasForFirstFrame,
  resetCanvasFirstFrameSessionForTests,
} from '@/engine/canvas/canvasFirstFrameSession';
import {
  CanvasTransitionController,
  INITIAL_CANVAS_TRANSITION,
} from '@/engine/canvas/CanvasTransitionController';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';

describe('CanvasTransitionController', () => {
  let snapshots: ReturnType<CanvasTransitionController['getSnapshot']>[] = [];
  let controller: CanvasTransitionController;
  let unbind: (() => void) | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
    resetCanvasFirstFrameSessionForTests();
    registerCanvasForFirstFrame({} as HTMLCanvasElement);
    snapshots = [];
    controller = new CanvasTransitionController((snapshot) => {
      snapshots.push({ ...snapshot });
    });
    unbind = controller.bindEvents();
  });

  afterEach(() => {
    unbind?.();
    controller.dispose();
    vi.useRealTimers();
  });

  it('starts with initial snapshot', () => {
    expect(controller.getSnapshot()).toEqual(INITIAL_CANVAS_TRANSITION);
  });

  it('waits for first frame on menu → exploration', () => {
    controller.setMode('exploration');

    expect(snapshots.at(-1)).toMatchObject({
      canvasReady: false,
      isTransitioning: true,
    });

    const frameGen = getCanvasFirstFrameGeneration();
    claimCanvasFirstFrameEmit({} as HTMLCanvasElement);
    eventBus.emit('canvas:first-frame', { generation: frameGen });

    expect(snapshots.at(-1)?.canvasReady).toBe(true);
    expect(snapshots.at(-1)?.isTransitioning).toBe(true);

    vi.advanceTimersByTime(CUTSCENE_TIMINGS.CANVAS_FADE_OUT_MS);
    expect(snapshots.at(-1)?.isTransitioning).toBe(false);
  });

  it('ignores stale first-frame generation after mode churn', () => {
    controller.setMode('exploration');
    const staleGen = getCanvasFirstFrameGeneration();

    controller.setMode('menu');
    controller.setMode('exploration');

    eventBus.emit('canvas:first-frame', { generation: staleGen });

    expect(snapshots.at(-1)).toMatchObject({
      canvasReady: false,
      isTransitioning: true,
    });
  });

  it('uses warm fade for exploration ↔ combat without fresh frame wait', () => {
    controller.setMode('exploration');
    const frameGen = getCanvasFirstFrameGeneration();
    claimCanvasFirstFrameEmit({} as HTMLCanvasElement);
    eventBus.emit('canvas:first-frame', { generation: frameGen });
    vi.advanceTimersByTime(CUTSCENE_TIMINGS.CANVAS_FADE_OUT_WARM_MS);

    controller.setMode('combat');

    expect(snapshots.at(-1)).toMatchObject({
      canvasReady: true,
      isTransitioning: true,
      fadeOutMs: CUTSCENE_TIMINGS.CANVAS_FADE_OUT_WARM_MS,
    });
  });

  it('updates wait frame generation on invalidate during active wait', () => {
    controller.setMode('exploration');
    const beforeGen = getCanvasFirstFrameGeneration();

    eventBus.emit('canvas:invalidate-first-frame', { generation: beforeGen + 5 });

    getCanvasFirstFrameGeneration();
    claimCanvasFirstFrameEmit({} as HTMLCanvasElement);
    eventBus.emit('canvas:first-frame', { generation: beforeGen + 5 });

    expect(controller.getSnapshot().canvasReady).toBe(true);
  });
});
