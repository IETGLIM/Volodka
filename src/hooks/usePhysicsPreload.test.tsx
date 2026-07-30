import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadingPipeline } from '@/engine/loading/LoadingPipeline';
import { usePhysicsPreload } from '@/hooks/usePhysicsPreload';

vi.mock('@/engine/physics/preloadPhysicsChunk', () => ({
  preloadPhysicsChunk: vi.fn(() => Promise.resolve()),
}));

import { preloadPhysicsChunk } from '@/engine/physics/preloadPhysicsChunk';

describe('usePhysicsPreload', () => {
  beforeEach(() => {
    loadingPipeline.reset();
    vi.mocked(preloadPhysicsChunk).mockReset();
    vi.mocked(preloadPhysicsChunk).mockResolvedValue(undefined);
  });

  afterEach(() => {
    loadingPipeline.reset();
  });

  it('skips preload while on menu', () => {
    renderHook(() => usePhysicsPreload('menu'));
    expect(preloadPhysicsChunk).not.toHaveBeenCalled();
  });

  it('preloads physics when entering exploration', async () => {
    renderHook(() => usePhysicsPreload('exploration'));
    await waitFor(() => expect(preloadPhysicsChunk).toHaveBeenCalledOnce());
    expect(loadingPipeline.getSnapshot().stage).toBe('physics_wasm');
  });

  it('retries preload after a transient failure', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(preloadPhysicsChunk)
        .mockRejectedValueOnce(new Error('wasm boom'))
        .mockResolvedValueOnce(undefined);

      renderHook(() => usePhysicsPreload('exploration'));

      await Promise.resolve();
      await Promise.resolve();
      expect(preloadPhysicsChunk).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1_500);
      await Promise.resolve();
      await Promise.resolve();

      expect(preloadPhysicsChunk).toHaveBeenCalledTimes(2);
      expect(loadingPipeline.getSnapshot().stage).toBe('physics_wasm');
    } finally {
      vi.useRealTimers();
    }
  });
});
