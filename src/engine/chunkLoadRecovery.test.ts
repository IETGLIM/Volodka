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
    vi.restoreAllMocks();
  });

  it('detects dynamic import fetch failures', () => {
    expect(
      isChunkLoadError(
        new Error('Failed to fetch dynamically imported module: https://example.com/assets/foo.js'),
      ),
    ).toBe(true);
    expect(isChunkLoadError(new Error('network timeout'))).toBe(false);
  });

  it('reloads once on stale chunk, then rethrows on second call', () => {
    const reload = vi.fn();
    const storage = new Map<string, string>();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

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

    // First call: reloads the page (returns a never-resolving promise
    // to stop execution while the browser navigates).
    recoverFromStaleChunk(err);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(storage.get(CHUNK_RELOAD_SESSION_KEY)).toBe('1');
    expect(warnSpy).toHaveBeenCalledWith(
      '[chunkLoadRecovery] Stale chunk detected, reloading…',
      err,
    );

    // Second call: reload was already attempted — rethrows the error
    // so the caller (retryLazy) doesn't retry infinitely.
    expect(() => recoverFromStaleChunk(err)).toThrow(err);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
