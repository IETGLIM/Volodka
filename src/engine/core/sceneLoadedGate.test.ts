import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  registerCanvasForFirstFrame,
  resetCanvasFirstFrameSessionForTests,
  unregisterCanvasForFirstFrame,
} from '@/engine/canvas/canvasFirstFrameSession';
import {
  ensureSceneLoadedBridge,
  resetSceneLoadedGate,
  scheduleSceneLoaded,
} from './sceneLoadedGate';

describe('sceneLoadedGate', () => {
  beforeEach(() => {
    resetSceneLoadedGate();
    resetCanvasFirstFrameSessionForTests();
    ensureSceneLoadedBridge();
  });

  afterEach(() => {
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
});
