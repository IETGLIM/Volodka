# Mixamo animations — Volodka RPG

[Mixamo](https://www.mixamo.com) provides free humanoid animation clips (Adobe account required).  
License: free for commercial games when downloaded with your Adobe ID — see [Mixamo FAQ](https://www.mixamo.com/faq).

> **Cannot auto-download** — you must sign in at mixamo.com and download each clip manually.

## Quick workflow

1. **Rig your character** on Mixamo (upload T-pose photo or use an existing Mixamo character matching your GLB skeleton).
2. **Pick animations** from the catalog in `src/config/mixamoAnimationCatalog.ts`:
   - Idle (standing)
   - Walking
   - Talking (gesturing)
   - Sitting
3. **Download** each clip (see export settings below).
4. **Import** into the repo:

```bash
npm run assets:mixamo-import -- --list
npm run assets:mixamo-import -- --status
npm run assets:mixamo-import -- --clip idle --file "C:/Downloads/idle.glb"
npm run assets:mixamo-import -- --clip walking --file "C:/Downloads/walking.glb"
npm run assets:mixamo-import -- --clip talking --file "C:/Downloads/talking.glb"
npm run assets:mixamo-import -- --clip sitting --file "C:/Downloads/sitting.glb"
npm run assets:validate
```

5. Record attribution in `public/models/ATTRIBUTION.md`.

## Mixamo export settings (recommended)

| Setting | Value |
|---------|--------|
| Format | **glTF Binary (.glb)** |
| Skin | **Without Skin** (animation-only; smaller files) |
| Frames per second | **30** |
| Keyframe Reduction | none / minimal |
| In Place | **checked** (no root translation for patrol NPCs) |

### FBX alternative

If you only have FBX (e.g. from older Mixamo UI):

1. Open in Blender → select armature → export **glTF 2.0 (.glb)**.
2. Or use `fbx2gltf` / online converter.
3. Import the resulting `.glb` with `assets:mixamo-import`.

## Quaternius interim clips (no Mixamo account)

When Mixamo downloads are unavailable, use the CC0 extract pipeline:

| Catalog id | Primary source | Fallback (modular pack) |
|------------|----------------|-------------------------|
| idle / walking / talking | Quaternius modular `Idle`, `Walk`, `Wave` | — |
| sitting | UAL `Sitting_Idle_Loop` (retargeted) | `Interact` crouch |
| working | UAL `Fixing_Kneeling` (retargeted) | `Interact` |
| sleeping | UAL `Death01` prone (interim) | `Death` collapse |

```bash
node scripts/extract-quaternius-animations.mjs
npm run assets:ual-import
npm run assets:optimize-animations
```

True sleep mocap (lying idle) still requires manual Mixamo or KayKit import — see `assets-source/animations/README.md`.

## Folder layout

```
assets-source/mixamo/          ← raw downloads (source of truth)
├── README.md
├── idle.glb                   ← after import
├── walking.glb
├── talking.glb
└── sitting.glb

public/models/animations/      ← runtime copies (staged by import script)
├── idle.glb
├── walking.glb
├── talking.glb
└── sitting.glb
```

Placeholders (`.gitkeep`) ship until you import real clips.

## Runtime wiring

| System | Behavior |
|--------|----------|
| `GltfNPCModel` | idle default; walk on patrol/schedule; talk during dialogue; sit on work/read/rest |
| `CesiumPlayerModel` | Mixamo idle + walking when shipped; falls back to embedded GLB clips |
| `useNPCAnimation` | crossfade + Mixamo clip name aliases |
| `mixamoAnimationShipped.ts` | auto-updated by import script |

## Skeleton / retargeting

Mixamo clips target **Mixamo humanoid bone names**. Khronos interim NPC GLBs (CesiumMan, Xbot, etc.) use different rigs — clips will not retarget until you:

1. Export the **same Mixamo character** as your NPC GLB, or
2. Retarget in Blender (Rokoko / Auto-Rig Pro), or
3. Re-download animations **for each character** on Mixamo (per-character folder convention).

For production: generate hero/NPC meshes via [AI3DGen](../ai3dgen/README.md), rig on Mixamo, download matched clips.

## Related docs

- AI3DGen meshes (static → rigged): `assets-source/ai3dgen/README.md`
- Attribution: `public/models/ATTRIBUTION.md`
- Catalog: `src/config/mixamoAnimationCatalog.ts`
