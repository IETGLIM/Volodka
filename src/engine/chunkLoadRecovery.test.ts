import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CHUNK_RELOAD_SESSION_KEY,
  clearChunkReloadFlag,
  isChunkLoadError,
  recoverFromStaleChunk,
} from './chunkLoadRecovery';

describe('chunkLoadRecovery', () => {
  afterEach(() => {
    clearChunkReloadFlag();
    vi.unstubAllGlobals();
  });

  it('detects dynamic import fetch failures', () => {
    expect(
      isChunkLoadError(
        new Error('Failed to fetch dynamically imported module: https://example.com/assets/foo.js'),
      ),
    ).toBe(true);
    expect(isChunkLoadError(new Error('network timeout'))).toBe(false);
  });

  it('reloads once on stale chunk, then rethrows', () => {
    const reload = vi.fn();
    const storage = new Map<string, string>();

    vi.stubGlobal('window', {
      location: { reload },
    });
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    });

    const err = new Error('Failed to fetch dynamically imported module: https://example.com/assets/foo.js');

    expect(() => recoverFromStaleChunk(err)).toThrow();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.get(CHUNK_RELOAD_SESSION_KEY)).toBe('1');

    expect(() => recoverFromStaleChunk(err)).toThrow(err);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
