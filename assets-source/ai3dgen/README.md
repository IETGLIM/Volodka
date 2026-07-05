# AI3DGen + CC0 freekit — image → 3D / Kenney / Poly Pizza

Генератор AI3DGen: [изображение в 3D бесплатно](https://www.ai3dgen.com/ru/image-to-3d-model-free)

## Где брать бесплатно

Сводная таблица CC0 / бесплатных источников (помимо AI3DGen Pro для production-артa):

| Источник | Тип | Лицензия | URL |
|----------|-----|----------|-----|
| Mixamo | Персонажи + анимации | Free (Adobe ID) | [mixamo.com](https://www.mixamo.com) |
| Sketchfab | Модели | CC0 (фильтр) | [sketchfab.com](https://sketchfab.com) |
| Quaternius | Персонажи, пропсы | CC0 | [quaternius.com](https://quaternius.com) |
| Kenney.nl | 3D-ассеты | CC0 | [kenney.nl](https://kenney.nl) |
| Poly Pizza | Low-poly | CC0 | [poly.pizza](https://poly.pizza) |

### Прямые загрузки (известные паки)

| Источник | Пак | Прямая ссылка |
|----------|-----|---------------|
| Kenney | Furniture Kit (интерьер) | [kenney.nl/assets/furniture-kit](https://kenney.nl/assets/furniture-kit) |
| Kenney | City Kit 3D (улица) | [kenney.nl/assets/city-kit-3d](https://kenney.nl/assets/city-kit-3d) |
| Quaternius | Ultimate Animated Characters | [quaternius.com/packs/ultimateanimatedcharacterpack.html](https://quaternius.com/packs/ultimateanimatedcharacterpack.html) |
| Quaternius | Ultimate Modular Characters | [quaternius.com/packs/ultimatemodularcharacters.html](https://quaternius.com/packs/ultimatemodularcharacters.html) |
| Poly Pizza | Browse CC0 | [poly.pizza/explore](https://poly.pizza/explore) |

### Куда класть файлы

| Папка | Источники | Пример |
|-------|-----------|--------|
| `characters/` | Mixamo (герой), AI3DGen Pro | `volodka.glb` → `public/models/characters/volodka/` |
| `npcs/` | RPM, Mixamo mesh, Quaternius, Sketchfab CC0 | `npc_albert.glb` → `public/models/npcs/albert.glb` |
| `props/` | Kenney City/Furniture, Poly Pizza, AI3DGen | `bench.glb` → `public/models/props/citykit/` |
| `interiors/` | Kenney building shells, Poly Pizza room kits | `cafe_interior.glb` → `public/models/interiors/` |
| `environments/` | Kenney City Kit, scene bundles | `cafe_props.glb` |
| `vegetation/` | Quaternius nature, Poly Pizza | `pine.glb` |

Анимации Mixamo — отдельно: `assets-source/mixamo/` (см. [`../mixamo/README.md`](../mixamo/README.md)).

### Mixamo

1. Войти с **Adobe ID** на [mixamo.com](https://www.mixamo.com).
2. Выбрать персонажа → **Download** → **FBX** или **GLB**; для clip-only — **Without Skin**.
3. Клипы для NPC: **Idle**, **Walking**, **Talking**, **Sitting** (каталог: `src/config/mixamoAnimationCatalog.ts`).
4. Импорт:

```bash
npm run assets:mixamo-import -- --list
npm run assets:mixamo-import -- --clip idle --file "C:/Downloads/idle.glb"
npm run assets:mixamo-import -- --clip walking --file "C:/Downloads/walking.glb"
npm run assets:validate
```

Mesh NPC → `npcs/` + `npm run assets:rpm-import` или `assets:ai3dgen-import` по каталогу.

### Sketchfab

1. Поиск по запросу → фильтры **Downloadable** + лицензия **CC0**.
2. Скачать **glTF Binary (.glb)** → `assets-source/ai3dgen/npcs/` или `props/`.
3. `npm run assets:process -- --input assets-source/ai3dgen/npcs/<name>.glb` → строка в `public/models/ATTRIBUTION.md`.

### Quaternius / Kenney / Poly Pizza

- **Quaternius:** CC0 без регистрации; animated packs — rig + idle/walk → `npcs/` или `characters/`, затем `assets:process`.
- **Kenney:** CC0; Furniture → `props/` / `interiors/`; City Kit → `props/` + `environments/` (см. таблицы ниже). Staging: `npm run assets:freekit-stage`.
- **Poly Pizza:** только CC0; low-poly props → `props/`, интерьеры → `interiors/` (см. Poly Pizza TODO ниже).

## Структура

```
assets-source/ai3dgen/
├── props/                 # 10 Kenney City Kit + Furniture GLBs (CC0)
│   bench.glb, lamp_post.glb, table_small.glb, chair.glb, bookshelf.glb,
│   terminal.glb, coffee_machine.glb, guitar.glb, bottle.glb, campfire.glb
├── interiors/             # 10 interior shells (Kenney fallback — Poly Pizza TODO)
│   room_bedroom.glb, cafe_interior.glb, office.glb, library.glb, factory.glb,
│   corridor.glb, rooftop.glb, basement.glb, pier.glb, forest_clearing.glb
├── characters/
├── npcs/
├── environments/
└── vegetation/
public/models/
  props/citykit/           # staged props
  interiors/               # staged interior shells
```

## Kenney City Kit props (shipped)

| Файл | Источник Kenney | Registry ID |
|------|-----------------|-------------|
| `bench.glb` | Furniture Kit — `bench` | `kenney_city_bench` |
| `lamp_post.glb` | City Kit (Roads) — `light-square` | `kenney_city_lamp_post` |
| `table_small.glb` | Furniture Kit — `sideTable` | `kenney_city_table_small` |
| `chair.glb` | Furniture Kit — `chair` | `kenney_city_chair` |
| `bookshelf.glb` | Furniture Kit — `bookcaseClosed` | `kenney_city_bookshelf` |
| `terminal.glb` | Furniture Kit — `computerScreen` | `kenney_city_terminal` |
| `coffee_machine.glb` | Furniture Kit — `kitchenCoffeeMachine` | `kenney_city_coffee_machine` |
| `guitar.glb` | Furniture Kit — `radio` (interim) | `kenney_city_guitar` |
| `bottle.glb` | Furniture Kit — `tableCoffeeGlass` | `kenney_city_bottle` |
| `campfire.glb` | OpenGameArt CC0 — `camp_fire` | `kenney_city_campfire` |

Лицензии: [Kenney CC0](https://kenney.nl/assets) · [OpenGameArt camping CC0](https://opengameart.org/content/low-poly-camping-assets)

## Poly Pizza interiors — TODO

Poly Pizza programmatic download требует API key / блокируется в CI. Пока используются **Kenney building shells** (см. mapping ниже). Замените GLB в `interiors/` вручную с [poly.pizza](https://poly.pizza/) (CC0), затем:

```bash
npm run assets:freekit-stage
npm run assets:validate
```

| Файл | Сцена | Interim Kenney source | Poly Pizza target |
|------|-------|----------------------|-------------------|
| `room_bedroom.glb` | `volodka_room` | Suburban `building-type-a` | Bedroom interior |
| `cafe_interior.glb` | `cafe_evening` | Commercial `building-c` | Café interior |
| `office.glb` | `office_day` | Commercial `building-skyscraper-a` | Office interior |
| `library.glb` | `library_day` | Commercial `building-b` | Library interior |
| `factory.glb` | `abandoned_factory` | Industrial `building-a` | Factory interior |
| `corridor.glb` | `volodka_corridor` | Suburban `driveway-long` | Corridor |
| `rooftop.glb` | `rooftop_edge` | Commercial `low-detail-building-a` | Rooftop skyline |
| `basement.glb` | `factory_basement` | Industrial `detail-tank` | Basement |
| `pier.glb` | `river_pier` | Suburban `path-stones-long` | Pier / waterfront |
| `forest_clearing.glb` | `chk_forest_zorge` | Suburban `tree-large` | Forest clearing |

## Scene wiring

**Props** (`scenePropDressing.ts`): `street_night` → bench + lamp_post; `cafe_evening` → coffee_machine, table, chair, bottle; `rooftop_edge` / `river_pier` / `chk_forest_zorge` → guitar; `chk_forest_zorge` → campfire + bench.

**Interiors** (`sceneInteriorAssets.ts` + `SceneInteriorAssets`): manifest bundles per scene (см. таблицу выше).

## Pipeline

```bash
# CC0 interim meshes for deploy (Khronos / three.js)
npm run assets:bootstrap

# Stage Kenney props + interior shells → public/models/
npm run assets:freekit-stage

# AI3DGen catalog import (Pro meshes)
npm run assets:ai3dgen-import -- --list
npm run assets:ai3dgen-import -- --id prop_city_bench --file ./downloads/bench.glb

# Ready Player Me NPC GLBs
npm run assets:rpm-import -- --list
npm run assets:rpm-import -- --id npc_albert --file ./npc_albert.glb

# Mixamo animation clips (Adobe ID — manual download)
npm run assets:mixamo-import -- --list
npm run assets:mixamo-import -- --clip idle --file ./downloads/idle.glb

# Draco / Meshopt / LOD for any GLB in assets-source/
npm run assets:process
npm run assets:process -- --input assets-source/ai3dgen/npcs/albert.glb

npm run assets:status
npm run assets:validate
npm run check
```

Каталог: `src/config/ai3dgenAssetCatalog.ts` · пропы: `propModelRegistry.ts` · интерьеры: `assetManifest.ts` + `sceneInteriorAssets.ts`.

## AI3DGen лицензия

| Тариф | Форматы | Коммерция |
|-------|---------|-----------|
| Free (Lite) | OBJ | только личное — **не ship** |
| Pro | GLB | коммерческая — **production** |

CC0 Kenney / OpenGameArt / Poly Pizza — ship без ограничений (см. `public/models/ATTRIBUTION.md`).
