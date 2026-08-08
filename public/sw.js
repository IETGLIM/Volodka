/**
 * Volodka RPG — Service Worker
 *
 * Minimal app-shell caching for offline resilience.
 * - Network-first for the HTML shell (always get the latest version)
 * - Cache-first for hashed static assets (JS, CSS, WASM, SVGs)
 * - Skips non-GET requests and cross-origin resources
 */

const CACHE_NAME = 'volodka-shell-v1';

/**
 * Assets to pre-cache on install.
 * These are the critical files needed for the app shell to render.
 * Hashed JS/CSS bundles from Vite are NOT listed here — they are
 * cached on first fetch via the cache-first strategy.
 */
const PRECACHE_URLS = ['/', '/manifest.json', '/logo.svg', '/icon.svg'];

/**
 * Regex matching Vite's hashed static assets:
 * /assets/*.[0-9a-f]{8}.(js|css|wasm|svg|png|jpg|woff2)
 * Also matches /basis/ and /draco/ decoder files.
 */
const STATIC_ASSET_RE = /^\/assets\/[\w.-]+\.[0-9a-f]{8}\.(?:js|css|wasm|svg|png|jpg|woff2|webp)(?:\?.*)?$/;
const DECODER_RE = /^\/(?:basis|draco)\/.*\.(?:js|wasm)(?:\?.*)?$/;

/**
 * Install event — pre-cache the app shell.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

/**
 * Activate event — clean up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Fetch event — route requests to the appropriate strategy.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests from the same origin.
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  const url = new URL(request.url);
  const path = url.pathname;

  // Strategy 1: Cache-first for Vite hashed static assets.
  // These have content hashes in their filenames, so a cache hit
  // means the file is immutable and correct.
  if (STATIC_ASSET_RE.test(path) || DECODER_RE.test(path)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: Network-first for the HTML shell and manifest.
  // Always try the network first so the user gets the latest version.
  // Fall back to cache when offline.
  if (path === '/' || path === '/manifest.json') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Strategy 3: Pass through for everything else (API calls, fonts, etc.)
  // Let the browser handle these normally.
});

/**
 * Cache-first strategy: serve from cache, fall back to network.
 * If network succeeds, update the cache for next time.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed and no cache — return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network-first strategy: try network, fall back to cache.
 * If network succeeds, update the cache for next time.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
