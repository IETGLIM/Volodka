# 3D Asset Attribution

Shipped GLB assets under `public/models/` and their licenses.  
Production bootstrap: `npm run assets:bootstrap` (distinct CC0 interim meshes until AI3DGen Pro art lands).

**Last updated:** June 2026 · **Production target:** AI3DGen Pro commercial tier

## First-person hands

| File | Source | License | Notes |
|------|--------|---------|-------|
| `fps/fps_arms.glb` | [three.js Soldier](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf) | CC0 | Interim rig — replace with [PSX First Person Arms (Drillimpact)](https://drillimpact.itch.io/psx-first-person-arms-free) (CC0) |

## Hero (Володя)

| File | Source | License | Notes |
|------|--------|---------|-------|
| `characters/volodka/volodka_lod*.glb` | Khronos RiggedFigure (interim) | CC0 | Shipped via `player_volodka` manifest — replace after AI3DGen Pro + Blender rig pass |

## NPC models

| NPC | File | Interim source | License |
|-----|------|----------------|---------|
| Альберт | `npcs/albert.glb` | Khronos RiggedFigure | CC0 |
| Зарема | `npcs/zarema.glb` | Khronos CesiumMan | CC0 |
| Бариста | `npcs/cafe_barista.glb` | three.js Soldier | CC0 |
| Александр | `npcs/office_alexander.glb` | three.js Xbot | CC0 |
| Коллега | `npcs/office_colleague.glb` | Khronos RiggedSimple | CC0 |
| Мария | `npcs/maria.glb` | three.js RobotExpressive | CC0 |
| Дмитрий | `npcs/office_dmitry.glb` | three.js Xbot | CC0 |
| Виктор | `npcs/viktor.glb` | three.js Soldier | CC0 |
| Кира | `npcs/kira.glb` | Khronos RiggedFigure | CC0 |
| Борис | `npcs/boris.glb` | Khronos RiggedSimple | CC0 |
| Тамара | `npcs/tamara.glb` | Khronos CesiumMan | CC0 |
| Гриша | `npcs/grisha.glb` | Khronos Fox | CC0 |

- **Khronos source:** https://github.com/KhronosGroup/glTF-Sample-Models (CC0)
- **three.js samples:** https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf (CC0)

## Craft / quest props (AI3DGen catalog)

| Catalog ID | File | Tier (production) | Interim CC0 source |
|------------|------|-------------------|-------------------|
| craft_digital_amulet | `props/digital_amulet.glb` | AI3DGen Pro | Khronos Lantern |
| craft_poetic_compiler | `props/poetic_compiler.glb` | AI3DGen Pro | Khronos DamagedHelmet |
| craft_neural_filter | `props/neural_filter.glb` | AI3DGen Pro | Khronos WaterBottle |
| quest_encrypted_scroll | `props/encrypted_scroll.glb` | AI3DGen Pro | Khronos Avocado |
| quest_server_fragment | `props/server_fragment.glb` | AI3DGen Pro | Khronos AntiqueCamera |

Replace interim meshes via:

```bash
npm run assets:status
npm run assets:ai3dgen-import -- --status
npm run assets:ai3dgen-import -- --id <catalog-id> --file <path.glb>
npm run assets:process -- --input assets-source/ai3dgen/<path>.glb
npm run assets:validate
```

## Environment / vegetation (scene bundles)

| Asset ID | Files | Interim CC0 sources | Production target |
|----------|-------|---------------------|-------------------|
| env_cafe_props | `environments/cafe/props_lod0.glb` | Khronos BrainStem | AI3DGen Pro café kit |
| env_cafe_props | `environments/cafe/props_lod1.glb` | Khronos DamagedHelmet | AI3DGen Pro café kit |
| env_cafe_props | `environments/cafe/props.draco.glb`, `props.meshopt.glb` | Khronos Lantern | AI3DGen Pro café kit |
| veg_tree_pine | `vegetation/pine/pine_lod0.glb` | Khronos Avocado | AI3DGen Pro stylized pine |
| veg_tree_pine | `vegetation/pine/pine_lod1.glb` | Khronos Lantern | AI3DGen Pro stylized pine |
| veg_tree_pine | `vegetation/pine/pine_lod2.glb` | Khronos WaterBottle | AI3DGen Pro stylized pine |

Preload: `cafe_evening` → `env_cafe_props`, `park_day` → `veg_tree_pine` (`sceneGpuLifecycle.ts`).

## Kenney environment props

| Registry ID | GLB | License |
|-------------|-----|---------|
| kenney_* | `props/*.glb` | CC0 1.0 — [Kenney Furniture Kit](https://opengameart.org/content/furniture-kit) |

Rendered via `ScenePropDressing` (`src/config/scenePropDressing.ts`) in volodka_room, corridor, office, library, café, zarema_albert_room.

## Khronos reference library (`models/khronos/`)

Bundled CC0 samples used by `MODEL_URLS` and cinematic fallbacks:

- CesiumMan, RiggedFigure, RiggedSimple, BrainStem, Fox, Avocado, Soldier
- Xbot, DamagedHelmet, Lantern, WaterBottle, AntiqueCamera, RobotExpressive

## Narrative poetry

Стихи (poem_1–poem_18) — **авторское произведение правообладателя проекта** (Владимир Лебедев).  
Тексты неприкосновенны для контрибьюторов; внешняя лицензия на стихи не требуется.

## AI3DGen commercial policy

| Tier | Ship in production |
|------|------------------|
| Free (Lite) | No — personal use only |
| Pro | Yes — GLB + commercial license |

See `assets-source/ai3dgen/README.md`.
