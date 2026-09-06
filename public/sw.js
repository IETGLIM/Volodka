/**
 * Volodka RPG — Service Worker
 *
 * App-shell + game-asset caching for offline resilience.
 * - Network-first for the HTML shell (always get the latest version)
 * - Cache-first for hashed static assets (JS, CSS, WASM, SVGs) and
 *   immutable decoder/runtime binaries (/basis/, /draco/, /rapier/)
 * - Bounded runtime cache (LRU-ish) for heavy game media
 *   (/models/, /textures/, /hdri/, /menu/) — cached on first fetch,
 *   trimmed when the entry budget is exceeded so we never blow the
 *   browser storage quota.
 * - Skips non-GET requests and cross-origin resources
 */

const CACHE_NAME = 'volodka-shell-v3';
const MEDIA_CACHE_NAME = 'volodka-media-v3';

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
 * Physics WASM runtime — required for Rapier to boot. Immutable per deploy,
 * small enough (~1.5 MB) to pre-cache on install so the game can start offline.
 */
const RAPIER_RE = /^\/rapier\/rapier_wasm3d_bg\.wasm$/;

/**
 * Heavy immutable game media — cached on first successful fetch.
 * GLB models, PBR textures, HDRI panoramas, menu art, ambient audio loops.
 * Cached in a separate cache so it can be trimmed independently of the code shell.
 * v4.15: + /sounds/*.ogg — файловые ambient-лупы истории (раньше их не было в
 * кэше И в vercel.json-rewrite, откуда /sounds/* отдавал index.html).
 */
const MEDIA_RE = /^\/(?:models|textures|hdri|menu|sounds)\/.+\.(?:glb|gltf|bin|webp|png|jpg|ktx2|hdr|svg|ogg|mp3|wav)(?:\?.*)?$/;

/**
 * Soft cap on cached media entries. Each GLB is 0.3–2 MB, textures 0.2–2 MB,
 * HDRIs up to 7 MB — 120 entries keeps us comfortably inside the usual
 * ~250 MB quota headroom while still covering a full scene set.
 */
const MEDIA_CACHE_MAX_ENTRIES = 120;

/**
 * v4.8.4: soft BYTE budget for the media cache (~180 MB). Entry count alone
 * can't see mass: 120 HDRIs × 7 MB would blow the quota while a texture-heavy
 * session fits easily. When sizes are known (content-length), oldest entries
 * are evicted until the total fits; unknown sizes degrade gracefully to the
 * entry-count cap above.
 */
const MEDIA_CACHE_MAX_BYTES = 180 * 1024 * 1024;

/**
 * v4.8.4: in-memory size table (url → estimated bytes) for byte-budget
 * trimming. Lives for the SW instance; re-seeded lazily from the cache after
 * a restart. Accounting is best-effort — failures fall back to count-only cap.
 */
const mediaSizeTable = new Map();
let mediaSizeTableSeeded = false;

function estimateResponseBytes(response) {
  const len = Number(response && response.headers ? response.headers.get('content-length') : NaN);
  return Number.isFinite(len) && len > 0 ? len : 0;
}

async function seedMediaSizeTable(cache) {
  if (mediaSizeTableSeeded) return;
  mediaSizeTableSeeded = true;
  try {
    const keys = await cache.keys();
    for (const req of keys) {
      const cached = await cache.match(req);
      const bytes = estimateResponseBytes(cached);
      if (bytes > 0) mediaSizeTable.set(req.url, bytes);
    }
  } catch {
    // Size accounting is best-effort; count cap still applies.
  }
}

/**
 * Install event — pre-cache the app shell (+ physics WASM).
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).catch(() => {
          // Shell URLs must precache; physics WASM is best-effort.
          return cache.addAll(PRECACHE_URLS);
        }),
      )
      .then(() =>
        caches.open(CACHE_NAME).then((cache) => cache.add('/rapier/rapier_wasm3d_bg.wasm').catch(() => undefined)),
      )
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
            .filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE_NAME)
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

  // Strategy 1: Cache-first for Vite hashed static assets, decoders and
  // the physics WASM runtime. These are immutable per deploy, so a cache
  // hit is always correct.
  if (STATIC_ASSET_RE.test(path) || DECODER_RE.test(path) || RAPIER_RE.test(path)) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Strategy 2: Network-first for the HTML shell and manifest.
  // Always try the network first so the user gets the latest version.
  // Fall back to cache when offline.
  if (path === '/' || path === '/manifest.json') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Strategy 3: Bounded cache-first for heavy game media. Cache on first
  // successful fetch; trim the oldest entries when over budget.
  if (MEDIA_RE.test(path)) {
    event.respondWith(boundedMediaCache(request));
    return;
  }

  // Strategy 4: Pass through for everything else (API calls, fonts, etc.)
  // Let the browser handle these normally.
});

/**
 * Cache-first strategy: serve from cache, fall back to network.
 * If network succeeds, update the cache for next time.
 */
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed and no cache — return a basic offline response
    return offlineResponse();
  }
}

/**
 * Bounded cache-first for game media with LRU trimming.
 * v4.8.4: hits refresh recency (delete + re-put marks the entry as newest),
 * so rarely used media is evicted first — not just the oldest inserted.
 */
async function boundedMediaCache(request) {
  const cached = await caches.match(request);
  if (cached) {
    // LRU touch: any failure here must not break serving the response.
    try {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      await cache.delete(request);
      await cache.put(request, cached.clone());
    } catch {
      // Ignore — recency refresh is an optimization.
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(MEDIA_CACHE_NAME);
      await cache.put(request, response.clone());
      mediaSizeTable.set(request.url, estimateResponseBytes(response));
      trimMediaCache(cache).catch(() => undefined);
    }
    return response;
  } catch {
    const fallback = await caches.match(request);
    if (fallback) return fallback;
    return offlineResponse();
  }
}

/**
 * Trim the media cache: (1) entry-count cap by oldest-entry eviction, then
 * (2) v4.8.4 byte-budget cap when sizes are known. Cache keys preserve
 * insertion order in most engines, which we use as the LRU approximation —
 * hits refresh their position (see boundedMediaCache), so eviction targets
 * the least recently used entries first.
 */
async function trimMediaCache(cache) {
  // 1) Count-based cap (existing behavior)
  let keys = await cache.keys();
  if (keys.length > MEDIA_CACHE_MAX_ENTRIES) {
    const excess = keys.length - MEDIA_CACHE_MAX_ENTRIES;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
      mediaSizeTable.delete(keys[i].url);
    }
    keys = keys.slice(excess);
  }

  // 2) Byte-budget cap (v4.8.4) — only when every size is known; otherwise
  //    degrade silently to the count cap (unknown = don't guess).
  if (keys.length === 0) return;
  await seedMediaSizeTable(cache);

  let total = 0;
  let allKnown = true;
  for (const req of keys) {
    const bytes = mediaSizeTable.get(req.url);
    if (bytes === undefined) {
      allKnown = false;
      break;
    }
    total += bytes;
  }
  if (!allKnown) return;

  let i = 0;
  while (total > MEDIA_CACHE_MAX_BYTES && i < keys.length - 1) {
    await cache.delete(keys[i]);
    total -= mediaSizeTable.get(keys[i].url) || 0;
    mediaSizeTable.delete(keys[i].url);
    i++;
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
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}
