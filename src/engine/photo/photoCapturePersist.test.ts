import { describe, expect, it, vi, beforeEach } from 'vitest';
import { loadPersistedPhotoGallery, persistPhotoGallery } from './photoCapturePersist';
import type { PhotoCaptureHistoryEntry } from './photoCaptureHistory';

const store = new Map<string, unknown>();

function mockIdb() {
  const fakeDb = {
    objectStoreNames: { contains: () => true },
    transaction: (_store: string, _mode: string) => {
      const tx: {
        objectStore: () => {
          get: (key: string) => { onsuccess: (() => void) | null; onerror: (() => void) | null; result: unknown; error: null };
          put: (value: unknown, key: string) => void;
        };
        oncomplete: (() => void) | null;
        onerror: (() => void) | null;
        error: null;
      } = {
        objectStore: () => ({
          get: (key: string) => {
            const req = {
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              result: store.get(key),
              error: null,
            };
            queueMicrotask(() => req.onsuccess?.());
            return req;
          },
          put: (value: unknown, key: string) => {
            store.set(key, value);
          },
        }),
        oncomplete: null,
        onerror: null,
        error: null,
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx;
    },
    close: () => undefined,
  };

  vi.stubGlobal('indexedDB', {
    open: () => {
      const req = {
        result: fakeDb,
        error: null,
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
      };
      queueMicrotask(() => req.onsuccess?.());
      return req;
    },
  });
}

describe('photoCapturePersist', () => {
  beforeEach(() => {
    store.clear();
    mockIdb();
  });

  it('round-trips gallery entries', async () => {
    const entries: PhotoCaptureHistoryEntry[] = [
      {
        id: 'cap-1',
        dataUrl: 'data:image/png;base64,abc',
        timestamp: 100,
        filter: 'neon',
        sceneName: 'Street',
      },
    ];
    await persistPhotoGallery(entries);
    const loaded = await loadPersistedPhotoGallery();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].sceneName).toBe('Street');
    expect(loaded[0].filter).toBe('neon');
  });

  it('returns [] when IndexedDB missing', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(await loadPersistedPhotoGallery()).toEqual([]);
  });
});
