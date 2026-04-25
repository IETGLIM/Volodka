import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '@/engine/events/EventBus';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneStreamingProfile } from '@/config/scenes';
import type { SceneId } from '@/data/types';
import { __resetGltfModelCacheTestState } from '@/lib/gltfModelCache';
import { SceneStreamingCoordinator } from './SceneStreamingCoordinator';

const testProfile: SceneStreamingProfile = {
  neighborSceneIds: ['kitchen_dawn'],
  chunks: [
    {
      id: 'kitchen_night::test_chunk',
      assets: [
        {
          url: '/test-streaming.glb',
          tier: 'critical',
          estimatedGeometryBytes: 100_000,
          estimatedTextureBytes: 50_000,
        },
      ],
    },
  ],
};

describe('SceneStreamingCoordinator', () => {
  let coordinator: SceneStreamingCoordinator;

  beforeEach(() => {
    coordinator = new SceneStreamingCoordinator(eventBus, (id: SceneId) =>
      id === 'kitchen_night' ? testProfile : undefined
    );
    coordinator.attach();
  });

  afterEach(() => {
    coordinator.detach();
    __resetGltfModelCacheTestState();
    vi.restoreAllMocks();
  });

  it('activateChunk is no-op before scene:enter (no bus noise)', () => {
    const spy = vi.spyOn(eventBus, 'emit');
    coordinator.activateChunk('kitchen_night::test_chunk');
    expect(spy.mock.calls.filter((c) => c[0] === 'streaming:chunk_activation_requested')).toHaveLength(0);
  });

  it('does not emit activation for chunkId not listed in profile.chunks', () => {
    const spy = vi.spyOn(eventBus, 'emit');
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    coordinator.activateChunk('kitchen_night::unknown');
    expect(spy.mock.calls.filter((c) => c[0] === 'streaming:chunk_activation_requested')).toHaveLength(0);
  });

  it('activateChunk emits activation_requested and keeps chunk pending until chunk_activated', () => {
    const spy = vi.spyOn(eventBus, 'emit');
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    coordinator.activateChunk('kitchen_night::test_chunk');

    expect(spy).toHaveBeenCalledWith('streaming:chunk_activation_requested', {
      chunkId: 'kitchen_night::test_chunk',
      sceneId: 'kitchen_night',
    });

    let snap = coordinator.getDebugSnapshot();
    expect(snap.activeChunkIds).toEqual([]);
    expect(snap.pendingActivationChunkIds).toContain('kitchen_night::test_chunk');

    eventBus.emit('streaming:chunk_activated', { chunkId: 'kitchen_night::test_chunk', rapierBodyCount: 2 });
    snap = coordinator.getDebugSnapshot();
    expect(snap.activeChunkIds).toContain('kitchen_night::test_chunk');
    expect(snap.pendingActivationChunkIds).toEqual([]);
    expect(snap.budgetTextureBytesApprox).toBe(150_000);
    expect(snap.rapierActiveBodiesApprox).toBe(2);
  });

  it('chunk_activated without activateChunk still registers active (React-first path)', () => {
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    eventBus.emit('streaming:chunk_activated', { chunkId: 'kitchen_night::test_chunk' });
    const snap = coordinator.getDebugSnapshot();
    expect(snap.activeChunkIds).toContain('kitchen_night::test_chunk');
    expect(snap.pendingActivationChunkIds).toEqual([]);
    expect(snap.budgetTextureBytesApprox).toBe(150_000);
  });

  it('deactivateChunk moves active chunk to unloading until chunk_deactivated', () => {
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    coordinator.activateChunk('kitchen_night::test_chunk');
    eventBus.emit('streaming:chunk_activated', { chunkId: 'kitchen_night::test_chunk' });

    const spy = vi.spyOn(eventBus, 'emit');
    coordinator.deactivateChunk('kitchen_night::test_chunk');

    expect(spy).toHaveBeenCalledWith('streaming:chunk_deactivation_requested', {
      chunkId: 'kitchen_night::test_chunk',
      sceneId: 'kitchen_night',
    });

    let snap = coordinator.getDebugSnapshot();
    expect(snap.activeChunkIds).toEqual([]);
    expect(snap.unloadingChunkIds).toContain('kitchen_night::test_chunk');

    eventBus.emit('streaming:chunk_deactivated', { chunkId: 'kitchen_night::test_chunk' });
    snap = coordinator.getDebugSnapshot();
    expect(snap.unloadingChunkIds).toEqual([]);
    expect(snap.activeChunkIds).toEqual([]);
  });

  it('deactivateChunk while pending cancels pending without unloading wait', () => {
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    coordinator.activateChunk('kitchen_night::test_chunk');
    expect(coordinator.getDebugSnapshot().pendingActivationChunkIds).toContain('kitchen_night::test_chunk');

    coordinator.deactivateChunk('kitchen_night::test_chunk');
    const snap = coordinator.getDebugSnapshot();
    expect(snap.pendingActivationChunkIds).toEqual([]);
    expect(snap.unloadingChunkIds).toEqual([]);
    expect(snap.activeChunkIds).toEqual([]);
  });

  it('prefetch enqueues neighbor scene ids (FIFO, deduped)', () => {
    coordinator.prefetch('kitchen_night', 'scene_enter');
    const snap = coordinator.getDebugSnapshot();
    expect(snap.prefetchQueueLength).toBe(1);
    expect(snap.prefetchTargetsPreview).toContain('kitchen_dawn');

    coordinator.prefetch('kitchen_night', 'manual');
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBe(1);
  });

  it('prefetch is no-op when scene has no streaming profile', () => {
    coordinator.prefetch('volodka_room', 'scene_enter');
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBe(0);
  });

  it('scene:enter fills prefetch queue from neighborSceneIds', () => {
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    const snap = coordinator.getDebugSnapshot();
    expect(snap.prefetchQueueLength).toBe(1);
    expect(snap.prefetchTargetsPreview[0]).toBe('kitchen_dawn');
  });

  it('scene:enter orders prefetch neighbors by streaming manifest weight (heavier first)', () => {
    const originNeighbors: SceneStreamingProfile = {
      neighborSceneIds: ['kitchen_dawn', 'volodka_room'],
      chunks: [],
    };
    const coord = new SceneStreamingCoordinator(eventBus, (id: SceneId) => {
      if (id === 'kitchen_night') return originNeighbors;
      if (id === 'volodka_room')
        return SCENE_CONFIG.volodka_room.streaming as SceneStreamingProfile | undefined;
      return undefined;
    });
    coord.attach();
    eventBus.emit('scene:enter', { sceneId: 'kitchen_night' });
    const snap = coord.getDebugSnapshot();
    expect(snap.prefetchTargetsPreview[0]).toBe('volodka_room');
    expect(snap.prefetchTargetsPreview[1]).toBe('kitchen_dawn');
    coord.detach();
  });
});

describe('SceneStreamingCoordinator (real SCENE_CONFIG prefetch)', () => {
  let coordinator: SceneStreamingCoordinator;

  beforeEach(() => {
    coordinator = new SceneStreamingCoordinator(eventBus);
    coordinator.attach();
  });

  afterEach(() => {
    coordinator.detach();
    __resetGltfModelCacheTestState();
    vi.restoreAllMocks();
  });

  it('scene:enter on volodka_room enqueues volodka_corridor', () => {
    eventBus.emit('scene:enter', { sceneId: 'volodka_room' });
    const snap = coordinator.getDebugSnapshot();
    expect(snap.prefetchTargetsPreview).toContain('volodka_corridor');
    expect(snap.prefetchQueueLength).toBeGreaterThanOrEqual(1);
  });

  it('drainPrefetchHeadApplyRetain pops queue and emits prefetch_warm_applied', () => {
    const spy = vi.spyOn(eventBus, 'emit');
    eventBus.emit('scene:enter', { sceneId: 'volodka_room' });
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBeGreaterThanOrEqual(1);

    const before = coordinator.getDebugSnapshot().prefetchQueueLength;
    const did = coordinator.drainPrefetchHeadApplyRetain();
    expect(did).toBe(true);
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBe(before - 1);

    const warm = spy.mock.calls.filter((c) => c[0] === 'streaming:prefetch_warm_applied');
    expect(warm.length).toBeGreaterThanOrEqual(1);
    const last = warm[warm.length - 1][1] as { targetSceneId: string; urls: string[] };
    expect(last.urls).toContain('/lamp.glb');
  });

  it('drainPrefetchHeadApplyRetain returns false when queue empty', () => {
    const c = new SceneStreamingCoordinator(eventBus);
    c.attach();
    expect(c.drainPrefetchHeadApplyRetain()).toBe(false);
    c.detach();
  });
});
