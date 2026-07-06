/**
 * [OPFS] Origin Private File System cache for GLB/model assets.
 *
 * Intercepts THREE.FileLoader to cache responses in OPFS. On subsequent
 * loads, reads from OPFS instead of fetching from network.
 *
 * Browser support: Chrome 86+, Firefox 111+, Safari 15.2+ (OPFS)
 * Falls back to normal fetch if OPFS unavailable.
 *
 * Usage (called once at boot, before any GLB loads):
 * ```ts
 * import { installOpfsCache } from '@/engine/assets/opfsCache';
 * installOpfsCache(); // patches THREE.FileLoader globally
 * ```
 *
 * Cache key: URL path (stripped of query params).
 * Cache invalidation: version-based (bump OPFS_CACHE_VERSION on asset changes).
 */

import * as THREE from 'three';

const OPFS_CACHE_VERSION = 'v1';
const OPFS_DIR_NAME = `volodka-assets-${OPFS_CACHE_VERSION}`;

// Only cache these file types
const CACHEABLE_EXTENSIONS = ['.glb', '.gltf', '.ktx2', '.wasm'];
// Skip files larger than 50MB (OPFS has quota limits)
const MAX_CACHE_FILE_SIZE = 50 * 1024 * 1024;

let opfsDir: FileSystemDirectoryHandle | null = null;
let opfsAvailable = false;
let initPromise: Promise<void> | null = null;

/** Check if a URL should be cached in OPFS. */
function shouldCache(url: string): boolean {
  // Only cache same-origin URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      if (u.origin !== window.location.origin) return false;
    } catch {
      return false;
    }
  }
  // Only cache specific file types
  const cleanUrl = url.split('?')[0].split('#')[0];
  return CACHEABLE_EXTENSIONS.some((ext) => cleanUrl.endsWith(ext));
}

/** Initialize OPFS directory handle. */
async function initOpfs(): Promise<void> {
  if (opfsAvailable) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!('storage' in navigator) || !navigator.storage.getDirectory) {
        console.warn('[OPFS] navigator.storage.getDirectory not available — cache disabled');
        return;
      }
      opfsDir = await navigator.storage.getDirectory();
      // Create/get subdirectory for this cache version
      opfsDir = await opfsDir.getDirectoryHandle(OPFS_DIR_NAME, { create: true });
      opfsAvailable = true;
      console.log(`[OPFS] Cache initialized: ${OPFS_DIR_NAME}`);
    } catch (err) {
      console.warn('[OPFS] Initialization failed — cache disabled:', err);
    }
  })();

  return initPromise;
}

/** Convert URL to safe filename for OPFS. */
function urlToFilename(url: string): string {
  const cleanUrl = url.split('?')[0].split('#')[0];
  // Replace / with _ to flatten directory structure
  return cleanUrl.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/** Read a file from OPFS cache. Returns Blob or null if not cached. */
async function readFromOpfs(url: string): Promise<Blob | null> {
  if (!opfsAvailable || !opfsDir) return null;

  try {
    const filename = urlToFilename(url);
    const fileHandle = await opfsDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file;
  } catch {
    // File not in cache (NotFoundError) — normal, return null
    return null;
  }
}

/** Write a Blob to OPFS cache. */
async function writeToOpfs(url: string, blob: Blob): Promise<void> {
  if (!opfsAvailable || !opfsDir) return;
  if (blob.size > MAX_CACHE_FILE_SIZE) return; // Skip large files

  try {
    const filename = urlToFilename(url);
    const fileHandle = await opfsDir.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (err) {
    console.warn(`[OPFS] Failed to cache ${url}:`, err);
  }
}

/** Check if OPFS cache is available. */
export function isOpfsCacheAvailable(): boolean {
  return opfsAvailable;
}

/** Get OPFS cache statistics. */
export async function getOpfsCacheStats(): Promise<{ fileCount: number; totalSize: number }> {
  if (!opfsAvailable || !opfsDir) return { fileCount: 0, totalSize: 0 };

  let fileCount = 0;
  let totalSize = 0;

  try {
    for await (const [name, handle] of (opfsDir as any).entries()) {
      if (handle.kind === 'file') {
        const file = await handle.getFile();
        fileCount++;
        totalSize += file.size;
      }
    }
  } catch {
    // Ignore errors
  }

  return { fileCount, totalSize };
}

/** Clear all OPFS cache entries. */
export async function clearOpfsCache(): Promise<void> {
  if (!opfsAvailable || !opfsDir) return;

  try {
    for await (const [name, handle] of (opfsDir as any).entries()) {
      if (handle.kind === 'file') {
        await opfsDir.removeEntry(name);
      }
    }
    console.log('[OPFS] Cache cleared');
  } catch (err) {
    console.warn('[OPFS] Failed to clear cache:', err);
  }
}

/**
 * Patch THREE.FileLoader to intercept load requests and check OPFS first.
 *
 * Original flow: FileLoader.load(url) → fetch(url) → onLoad(responseText/arrayBuffer)
 * Patched flow: FileLoader.load(url) → check OPFS → if cached: onLoad(cached)
 *                                                → if not: fetch(url) → writeToOpfs → onLoad
 */
export function installOpfsCache(): void {
  // Only install in browser environment
  if (typeof window === 'undefined') return;

  // Only install once
  if ((THREE.FileLoader as any).__opfsPatched) return;

  // Initialize OPFS asynchronously (don't block boot)
  initOpfs();

  const originalLoad = THREE.FileLoader.prototype.load;

  THREE.FileLoader.prototype.load = function (url: string, onLoad: any, onProgress: any, onError: any) {
    // If OPFS not ready or URL shouldn't be cached, use original load
    if (!opfsAvailable || !shouldCache(url)) {
      return originalLoad.call(this, url, onLoad, onProgress, onError);
    }

    // Async: check OPFS cache, fall back to network
    (async () => {
      try {
        const cached = await readFromOpfs(url);

        if (cached) {
          // Cache hit — read from OPFS
          const response = await this.manager.getHandler(url)?.constructor.name === 'GLTFLoader'
            ? cached
            : cached;

          // FileLoader expects text or arrayBuffer based on responseType
          if (this.responseType === 'arraybuffer') {
            const arrayBuffer = await cached.arrayBuffer();
            onLoad(arrayBuffer);
          } else {
            const text = await cached.text();
            onLoad(text);
          }

          // Simulate progress
          if (onProgress) {
            onProgress({ loaded: cached.size, total: cached.size, lengthComputable: true });
          }

          this.manager.itemStart(url);
          this.manager.itemEnd(url);
          return;
        }
      } catch {
        // OPFS read failed — fall through to network
      }

      // Cache miss — fetch from network, cache response, then call onLoad
      const originalOnLoad = onLoad;

      // Wrap onLoad to intercept the response and cache it
      const wrappedOnLoad = async (response: any) => {
        // Cache the response in OPFS (fire-and-forget, don't block)
        try {
          let blob: Blob | null = null;

          if (response instanceof ArrayBuffer) {
            blob = new Blob([response]);
          } else if (response instanceof Blob) {
            blob = response;
          } else if (typeof response === 'string') {
            blob = new Blob([response]);
          }

          if (blob) {
            writeToOpfs(url, blob); // Fire-and-forget
          }
        } catch {
          // Caching failed — don't block the load
        }

        // Call original onLoad with the response
        if (originalOnLoad) originalOnLoad(response);
      };

      originalLoad.call(this, url, wrappedOnLoad, onProgress, onError);
    })();

    // Return a dummy request object (FileLoader.load normally returns XMLHttpRequest)
    this.manager.itemStart(url);
    return {} as any;
  };

  (THREE.FileLoader as any).__opfsPatched = true;
  console.log('[OPFS] FileLoader patched for OPFS caching');
}

/**
 * Preload a URL into OPFS cache without blocking the main thread.
 * Useful for warming the cache during loading screen.
 */
export async function preloadToOpfs(url: string): Promise<void> {
  if (!opfsAvailable || !shouldCache(url)) return;

  // Check if already cached
  const cached = await readFromOpfs(url);
  if (cached) return;

  // Fetch and cache
  try {
    const response = await fetch(url);
    if (!response.ok) return;
    const blob = await response.blob();
    await writeToOpfs(url, blob);
  } catch {
    // Network error — skip
  }
}

/**
 * Batch preload multiple URLs into OPFS cache.
 * Returns when all URLs are cached or failed.
 */
export async function preloadBatchToOpfs(urls: string[], concurrency = 4): Promise<void> {
  if (!opfsAvailable) return;

  const queue = [...urls];
  const workers: Promise<void>[] = [];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      await preloadToOpfs(url);
    }
  }

  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}
