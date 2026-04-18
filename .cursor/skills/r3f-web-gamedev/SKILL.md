---
name: r3f-web-gamedev
description: >-
  Guides web gamedev with React, @react-three/fiber (R3F), Three.js, Zustand,
  Node.js, and Vercel. Covers scene graph patterns, game state, performance,
  and deployment. Use when the user mentions gamedev, games in the browser, 3D
  scenes, Canvas, R3F, react-three-fiber, drei, Zustand, Three.js, GLTF, game
  loop, physics, or shipping a React/Three project to Vercel—even if they only
  name part of the stack.
---

# R3F web gamedev (React · Zustand · Fiber · Node · Vercel)

## Default stack

Unless the repo already dictates otherwise, assume:

- **Runtime / tooling**: Node.js (current LTS), package manager already in use in the project.
- **UI + 3D**: React with `@react-three/fiber` as the bridge to Three.js; `@react-three/drei` for helpers (OrbitControls, useGLTF, Environment, Html, etc.).
- **State**: Zustand for gameplay and app state; keep Three object ownership clear (see below).
- **Deploy**: Vercel for hosting static or full-stack Next.js apps.

Prefer existing project patterns (folder layout, lint, testing) over generic templates.

## Architecture

- **Split concerns**: DOM HUD (menus, HUD, debug panels) in normal React; world/scene inside `<Canvas>`. Use `drei`’s `<Html>` only when intentional overlay inside the canvas is required.
- **Single Canvas** per experience unless there is a documented reason for multiple WebGL contexts.
- **Load assets** with suspense-friendly hooks (`useGLTF`, etc.) and show fallbacks; avoid blocking the main thread with huge synchronous parses on the hot path.
- **Game loop**: put per-frame simulation in `useFrame` (R3F) or dedicated systems called from `useFrame`; keep React re-renders out of the hot loop.

## Zustand with Three.js

- Store **serializable / small / gameplay** state in Zustand (score, flags, inventory IDs, difficulty, RNG seeds, settings).
- Prefer **refs or local mutable state** inside components/hooks for heavy Three objects (meshes, materials, buffers) unless profiling shows a safe pattern; never let giant typed arrays or GPU resources churn through React props every frame.
- Use **selectors** (`useStore((s) => s.score)` or other primitive fields) to limit re-renders; for picking several fields as one object without referential churn, use `useShallow` from `zustand/react/shallow`. Avoid subscribing to the whole store in leaf components.
- For **multiplayer or time-travel**, design stores so state can be snapshotted or reduced from events; see [reference.md](reference.md).

## R3F / Three.js habits

- Respect **color space and lighting** for the Three.js version in use (e.g. `THREE.ColorManagement.enabled`, renderer `outputColorSpace`); when things look “washed” or “too dark,” fix color management and physically reasonable lights before random tweaks.
- **Dispose** geometries/materials/textures when dynamically creating and discarding resources to avoid GPU memory leaks.
- **Instancing** (`InstancedMesh`) for many similar objects; **merge** static geometry when appropriate; profile before micro-optimizing draw calls.
- **Physics**: follow whatever the project already uses (`@react-three/rapier`, cannon-es, etc.); do not add a second physics stack without a migration plan. For engine choice and stepping patterns, see [reference.md](reference.md).

## Node.js

- Use the project’s **lockfile and scripts**; do not invent a new package manager mid-repo.
- Prefer **typed, small modules** for game systems; colocate tests when the project already tests that way.
- For **CLI tooling** (asset pipelines, tile baking), keep scripts idempotent and document env vars in code comments or existing README patterns only if the user asks for docs.

## Vercel

- **Next.js**: use App Router conventions if the repo does; place client-only Three code behind `"use client"` where required.
- **Environment variables**: use `NEXT_PUBLIC_*` only for values that must be visible in the browser; keep secrets server-side.
- **WebGL on server**: never instantiate a WebGL renderer during SSR; guard Canvas to client-only (dynamic import with `ssr: false` in Next, or equivalent).
- **Headers / caching**: treat large static assets (models, textures) as static files or CDN-backed; align with Vercel’s static asset behavior and any existing `vercel.json`.

## Additional resources

- Physics deep-dive, multiplayer sync, performance pass, and asset notes: [reference.md](reference.md).

## When requirements are ambiguous

1. Confirm **target frame budget** (desktop vs mobile) and **single-player vs multiplayer** if not stated.
2. Match **existing** state management and routing before introducing new libraries.
3. Prefer **incremental** changes: one vertical slice (spawn → update → render → UI) before broad refactors.
