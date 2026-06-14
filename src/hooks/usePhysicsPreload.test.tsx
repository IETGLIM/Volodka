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
    vi.mocked(preloadPhysicsChunk).mockClear();
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
});
