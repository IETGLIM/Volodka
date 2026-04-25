import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus } from '@/engine/events/EventBus';
import type { SceneStreamingProfile } from '@/config/scenes';
import type { SceneId } from '@/data/types';
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

  it('prefetch increments debug queue length when profile exists', () => {
    coordinator.prefetch('kitchen_night', 'scene_enter');
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBe(1);
  });

  it('prefetch is no-op when scene has no streaming profile', () => {
    coordinator.prefetch('volodka_room', 'scene_enter');
    expect(coordinator.getDebugSnapshot().prefetchQueueLength).toBe(0);
  });
});
