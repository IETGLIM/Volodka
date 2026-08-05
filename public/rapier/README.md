# Rapier WASM — external cached version

This folder contains a copy of `rapier_wasm3d_bg.wasm` (1.5 MB) from `@dimforge/rapier3d-compat`
for optional external loading with streaming compilation.

## Why external?

- Default `rapier.mjs` inlines WASM as base64 string (2.2 MB JS) — blocks main thread parsing, no caching.
- External file can be:
  - Cached via `vercel.json` immutable header (`/rapier/(.*)` → public, max-age=31536000)
  - Compiled via `WebAssembly.compileStreaming` / `instantiateStreaming` — 2-3x faster on second load
  - Served with `application/wasm` MIME + COOP/COEP headers for future `SharedArrayBuffer` multithread

## Loading strategy (rapierCompat.ts)

```ts
// Probe /rapier/rapier_wasm3d_bg.wasm via HEAD
// If exists → init({module_or_path: '/rapier/rapier_wasm3d_bg.wasm'})
// Else fallback → inline base64
```

## Build

File is copied manually but also available via `scripts/bootstrap-production-assets.mjs` future step.
Do not edit manually — source is `node_modules/@dimforge/rapier3d-compat/rapier_wasm3d_bg.wasm`.

## Performance

- Inline: ~800-1200ms on mid-tier (base64 decode + compile)
- External streaming: ~250-400ms first load, ~80-150ms from disk cache

See `src/engine/physics/preloadPhysicsChunk.ts` marks `physics:wasm-start/end`.
