# 3D Asset Attribution

Shipped GLB assets under `public/models/` and their licenses.  
Production bootstrap: `npm run assets:bootstrap` (distinct CC0 interim meshes until AI3DGen Pro art lands).

**Last updated:** June 2026 · **Production target:** AI3DGen Pro commercial tier

**Где брать бесплатно (CC0 / free):** Mixamo, Sketchfab (CC0 filter), Quaternius, Kenney.nl, Poly Pizza — таблица, прямые ссылки, папки `assets-source/ai3dgen/` и команды импорта: [`assets-source/ai3dgen/README.md`](../../assets-source/ai3dgen/README.md#где-брать-бесплатно).

## First-person hands

| File | Source | License | Notes |
|------|--------|---------|-------|
| `fps/fps_arms.glb` | [three.js Soldier](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf) | CC0 | Interim rig — replace with [PSX First Person Arms (Drillimpact)](https://drillimpact.itch.io/psx-first-person-arms-free) (CC0) |

## Hero (Володя)

| File | Source | License | Notes |
|------|--------|---------|-------|
| `characters/volodka/volodka_lod*.glb` | [Quaternius](https://quaternius.com/packs/ultimatemodularcharacters.html) Ultimate Modular Men (male_01) when imported; else Khronos RiggedFigure interim | CC0 | `npm run assets:quaternius-import -- --all`

## Quaternius animated NPCs (CC0)

Pack: [Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html) + [Ultimate Modular Women](https://quaternius.com/packs/ultimatemodularwomen.html) · License: CC0 · Author: [Quaternius](https://quaternius.com)

Import:

```bash
npm run assets:quaternius-import -- --all
npm run assets:validate
```

Mapped NPCs (when staged): Володя, Альберт, Зарема, Дмитрий, бариста, Александр, Мария, Максим, Жека, Трофим, Катя, Аня, Баба Зина, Солныш, CHK (Ру, Басед, Смерть, Сталкер, Элис, Ритка). See `assets-source/ai3dgen/npcs/README.md` and `scripts/quaternius-import.mjs`.

## NPC models (interim Khronos until Quaternius import)

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
| kenney_* | `props/*.glb` | CC0 1.0 — [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) |
| kenney_city_* | `props/citykit/*.glb` | CC0 1.0 — Kenney City Kit (Roads) + Furniture Kit + OpenGameArt campfire |

Rendered via `ScenePropDressing` in volodka_room, corridor, office, library, café, street_night, pier, CHK forest, rooftop.

## Kenney interior shells (Poly Pizza TODO)

| Manifest ID | File | Interim source | Target |
|-------------|------|----------------|--------|
| interior_room_bedroom | `interiors/room_bedroom.glb` | Kenney Suburban `building-type-a` | Poly Pizza bedroom |
| interior_cafe | `interiors/cafe_interior.glb` | Kenney Commercial `building-c` | Poly Pizza café |
| interior_office | `interiors/office.glb` | Kenney Commercial skyscraper | Poly Pizza office |
| interior_library | `interiors/library.glb` | Kenney Commercial `building-b` | Poly Pizza library |
| interior_factory | `interiors/factory.glb` | Kenney Industrial `building-a` | Poly Pizza factory |
| interior_corridor | `interiors/corridor.glb` | Kenney Suburban driveway | Poly Pizza corridor |
| interior_rooftop | `interiors/rooftop.glb` | Kenney Commercial low-detail | Poly Pizza rooftop |
| interior_basement | `interiors/basement.glb` | Kenney Industrial tank | Poly Pizza basement |
| interior_pier | `interiors/pier.glb` | Kenney Suburban path stones | Poly Pizza pier |
| interior_forest_clearing | `interiors/forest_clearing.glb` | Kenney Suburban tree | Poly Pizza forest |

Rendered via `SceneInteriorAssets` (`sceneInteriorAssets.ts`). Replace GLBs manually from [Poly Pizza](https://poly.pizza/) (CC0), then `npm run assets:freekit-stage`.

Campfire prop: [OpenGameArt Low Poly Camping Assets](https://opengameart.org/content/low-poly-camping-assets) (CC0) by Saraskau.

## Staged humanoid animations (`models/animations/`)

| Clip | File | Source | License |
|------|------|--------|---------|
| Idle (standing) | `animations/idle.glb` | Quaternius `Idle` (or [Mixamo](https://www.mixamo.com)) | CC0 / Mixamo ToS |
| Walking | `animations/walking.glb` | Quaternius `Walk` | CC0 |
| Talking | `animations/talking.glb` | Quaternius `Wave` | CC0 |
| Sitting / rest | `animations/sitting.glb` | Quaternius `Idle_Neutral` | CC0 |
| Sleeping | `animations/sleeping.glb` | Quaternius `Idle` | CC0 |
| Working | `animations/working.glb` | Quaternius `Interact` | CC0 |

Extract from Quaternius CC0 rig (no Adobe login):

```bash
node scripts/extract-quaternius-animations.mjs
npm run assets:validate
```

Mixamo import (optional override — Adobe login):

```bash
npm run assets:mixamo-import -- --list
npm run assets:mixamo-import -- --clip idle --file <path.glb>
```

Guide: `assets-source/mixamo/README.md` · Catalog: `src/config/mixamoAnimationCatalog.ts`

Clips target Quaternius / Mixamo humanoid rigs; Khronos interim NPC GLBs were replaced via `assets:quaternius-import`.

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
