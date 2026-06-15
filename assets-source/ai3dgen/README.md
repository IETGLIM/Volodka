# AI3DGen + CC0 freekit — image → 3D / Kenney / Poly Pizza

Генератор AI3DGen: [изображение в 3D бесплатно](https://www.ai3dgen.com/ru/image-to-3d-model-free)

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
# Stage CC0 props + interiors from assets-source → public/models/
npm run assets:freekit-stage

# AI3DGen single import (Pro meshes)
npm run assets:ai3dgen-import -- --list
npm run assets:ai3dgen-import -- --id prop_city_bench --file ./downloads/bench.glb

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
