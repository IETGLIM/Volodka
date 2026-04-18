# Reference: physics, multiplayer, performance

Deep-dive notes for R3F web gamedev. Read this file when the task involves physics engines, networked play, or systematic performance work.

## Physics

### Choosing a stack (default to what the repo already uses)

| Need | Typical choice |
|------|----------------|
| Solid WASM performance, vehicles, complex stacks | `@react-three/rapier` |
| Lighter JS-only prototype, simpler API | `cannon-es` + community R3F glue |

Do not mix two physics worlds in one scene without an explicit migration.

### Integration habits

- **Step the simulation** on the same clock you use for gameplay. Prefer a **fixed timestep** accumulator for stability; interpolate visuals between physics states if the render rate differs.
- **Register bodies/colliders** where the physics library expects (often under a `<Physics>` root for Rapier). Keep **one** world instance per experience.
- **Collision filtering**: use layers/masks/groups so raycasts/picking, character-vs-environment, and triggers stay explicit.
- **Sensors vs solids**: use sensors for pickups, zones, and line-of-sight helpers; avoid “fake” collisions with tiny invisible solids unless there is a good reason.
- **State ownership**: physics bodies are the source of truth for pose during play. Mirror transforms into Zustand only at **low frequency** (checkpoints, UI, saves)—not every `useFrame`.

### Common pitfalls

- Scaling meshes without updating collider sizes.
- Applying impulses every frame without damping → explosions.
- Creating/destroying bodies in hot loops → GC and solver churn.

## Multiplayer

### Authority model

- **Competitive / anti-cheat**: authoritative **server** (Node, dedicated, or hosted game backend). Clients send **inputs**; server simulates and broadcasts snapshots or deltas.
- **Casual co-op / prototypes**: host-authoritative or relayed inputs can be acceptable; document tradeoffs (host advantage, desync).

### Responsiveness

- **Client-side prediction**: apply local input immediately; when server corrections arrive, **reconcile** (rewind/replay or blend).
- **Interpolation**: other players’ entities usually interpolate between two past snapshots; never render remote raw physics at 120 Hz without smoothing.

### Data over the wire

- Prefer **input events** and **state deltas** over full scene serialization every tick.
- Keep a **serializable game state** schema (versioned) for saves and optional replay; avoid sending Three `Object3D` graphs.

### Zustand in networked games

- Split **confirmed** (server-approved) from **predicted** (local) where needed; merge on ack.
- For high-frequency values (remote positions), consider **refs + manual subscription** or a small ring buffer instead of spamming store updates that trigger React.

### Vercel and realtime

- Vercel **serverless** HTTP is not a long-lived game tick loop. Use a **dedicated** realtime layer (managed WebSockets, PartyKit, Colyseus cloud, etc.) when the user needs matchmaking or persistent rooms.
- Document **env** for server URL vs `NEXT_PUBLIC_*` client URL separately.

## Performance checklist

Use as a structured pass before micro-optimizing.

1. **Measure**: one clear target (e.g. steady 60 FPS on a named device + thermal state).
2. **CPU**: profile JS; reduce allocations in `useFrame`; avoid `new` Vector3/Euler every frame—reuse pooled objects.
3. **GPU**: reduce draw calls (instancing, merging static meshes); check overdraw and fill rate; resize textures to needed resolution; prefer compressed textures where the pipeline supports them.
4. **Memory**: dispose discarded geometries/materials/textures; watch duplicate GLTF parses.
5. **React**: ensure hot paths do not trigger full-tree re-renders; narrow Zustand selectors; memoize expensive lists.
6. **Loading**: stream/chunk large assets; show progressive LODs when acceptable.

## Asset pipeline (Node)

- **GLTF**: validate in a viewer; strip unused nodes; compress textures in the DCC or build step when the project supports it.
- **Versioning**: if multiple people touch assets, align on a single export preset and naming convention.
