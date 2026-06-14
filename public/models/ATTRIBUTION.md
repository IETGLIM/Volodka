# 3D Asset Attribution

Shipped GLB assets under `public/models/` and their licenses.

## First-person hands

| File | Source | License |
|------|--------|---------|
| `fps/fps_arms.glb` | [eraofjavascript/fps-arms.glb](https://github.com/eraofjavascript/fps-arms.glb) | Community FPS rig — verify upstream license before commercial ship |

Preferred CC0 alternative when manually available: [PSX First Person Arms by Drillimpact](https://drillimpact.itch.io/psx-first-person-arms-free) (CC0).

## Interactable props (Kenney Furniture Kit)

All props in `public/models/props/` converted from Kenney Furniture Kit OBJ via `obj2gltf`.

| Registry ID | GLB | Kenney model |
|-------------|-----|--------------|
| kenney_desk | desk.glb | desk |
| kenney_bookshelf | bookshelf.glb | bookcaseClosed |
| kenney_window | window.glb | wallWindow |
| kenney_door | door.glb | doorway |
| kenney_door_open | door_open.glb | doorwayOpen |
| kenney_wardrobe | wardrobe.glb | bookcaseClosedWide |
| kenney_terminal | terminal.glb | laptop |
| kenney_bed | bed.glb | bedSingle |

- **Author:** Kenney (www.kenney.nl)
- **License:** CC0 1.0
- **Download:** https://opengameart.org/content/furniture-kit

## NPC animated models (Khronos sample models)

| NPC | File | Source model | License |
|-----|------|--------------|---------|
| Альберт | npcs/albert.glb | Khronos CesiumMan | CC0 |
| Зарема | npcs/zarema.glb | Khronos RiggedFigure | CC0 |
| Бариста | npcs/cafe_barista.glb | three.js Soldier | CC0 |
| Александр | npcs/office_alexander.glb | Khronos BrainStem | CC0 |
| Коллега | npcs/office_colleague.glb | three.js Soldier | CC0 |

- **Source:** https://github.com/KhronosGroup/glTF-Sample-Models
- **License:** CC0 / permissive Khronos sample assets

NPCs without `modelPath` continue to use procedural meshes (`ProceduralNPCModel`).

## AI3DGen (image → 3D)

Models generated via [AI3DGen](https://www.ai3dgen.com/ru/image-to-3d-model-free) and imported with `npm run assets:ai3dgen-import`.

| Catalog ID | File | Tier | Notes |
|------------|------|------|-------|
| _(add after import)_ | | | Document tier + date in this table |

- **Free tier:** personal use only (OBJ, no textures).
- **Pro tier:** commercial license — required for shipped builds with AI3DGen assets.

See `assets-source/ai3dgen/README.md` for the full workflow.
