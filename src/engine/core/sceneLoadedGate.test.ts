import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  registerCanvasForFirstFrame,
  resetCanvasFirstFrameSessionForTests,
  unregisterCanvasForFirstFrame,
} from '@/engine/canvas/canvasFirstFrameSession';
import { SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS } from '@/shared/constants/transitionTimings';
import {
  ensureSceneLoadedBridge,
  resetSceneLoadedGate,
  scheduleSceneLoaded,
} from './sceneLoadedGate';

describe('sceneLoadedGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSceneLoadedGate();
    resetCanvasFirstFrameSessionForTests();
    ensureSceneLoadedBridge();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetCanvasFirstFrameSessionForTests();
  });

  it('emits scene:loaded on canvas:first-frame when canvas is registered', () => {
    const canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);

    const loaded = vi.fn();
    eventBus.on('scene:loaded', loaded);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    expect(loaded).not.toHaveBeenCalled();

    eventBus.emit('canvas:first-frame', { generation: 1 });
    expect(loaded).toHaveBeenCalledWith({
      sceneId: 'cafe_evening',
      fromSceneId: 'volodka_room',
    });

    unregisterCanvasForFirstFrame(canvas);
  });

  it('drops stale canvas:first-frame after a newer scene:enter', () => {
    const canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);

    const loaded = vi.fn();
    eventBus.on('scene:loaded', loaded);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    scheduleSceneLoaded({ sceneId: 'street_night', fromSceneId: 'cafe_evening' });

    eventBus.emit('canvas:first-frame', { generation: 1 });
    expect(loaded).toHaveBeenCalledTimes(1);
    expect(loaded).toHaveBeenCalledWith({
      sceneId: 'street_night',
      fromSceneId: 'cafe_evening',
    });

    unregisterCanvasForFirstFrame(canvas);
  });

  it('soft-flushes scene:loaded when first-frame watchdog times out (FIX P0 #5)', () => {
    const canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);

    const loaded = vi.fn();
    const failed = vi.fn();
    eventBus.on('scene:loaded', loaded);
    eventBus.on('scene:transition_failed', failed);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    expect(loaded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS);

    // FIX P0 #5: watchdog now soft-flushes scene:loaded instead of failing,
    // so the transition overlay closes and gameplay HUDs attach even on
    // slow devices that take longer than the watchdog to composite the
    // first frame. Real WebGL failures still surface via Canvas3DErrorBoundary.
    expect(loaded).toHaveBeenCalledWith({
      sceneId: 'cafe_evening',
      fromSceneId: 'volodka_room',
    });
    expect(failed).not.toHaveBeenCalled();

    unregisterCanvasForFirstFrame(canvas);
  });

  it('clears pending latch on canvas:context-lost without emitting stale scene:loaded', () => {
    const canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);

    const loaded = vi.fn();
    const failed = vi.fn();
    eventBus.on('scene:loaded', loaded);
    eventBus.on('scene:transition_failed', failed);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    eventBus.emit('canvas:context-lost', {});

    expect(loaded).not.toHaveBeenCalled();
    expect(failed).toHaveBeenCalledWith({
      reason: 'WebGL context lost',
      targetScene: 'cafe_evening',
      fromScene: 'volodka_room',
      errorCode: 'webgl_context_lost',
    });

    eventBus.emit('canvas:first-frame', { generation: 1 });
    expect(loaded).not.toHaveBeenCalled();

    unregisterCanvasForFirstFrame(canvas);
  });

  it('cancels watchdog when scene:loaded fires normally', () => {
    const canvas = {} as HTMLCanvasElement;
    registerCanvasForFirstFrame(canvas);

    const loaded = vi.fn();
    const failed = vi.fn();
    eventBus.on('scene:loaded', loaded);
    eventBus.on('scene:transition_failed', failed);

    scheduleSceneLoaded({ sceneId: 'cafe_evening', fromSceneId: 'volodka_room' });
    eventBus.emit('canvas:first-frame', { generation: 1 });

    expect(loaded).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(SCENE_LOADED_FIRST_FRAME_WATCHDOG_MS);
    expect(failed).not.toHaveBeenCalled();

    unregisterCanvasForFirstFrame(canvas);
  });
});
