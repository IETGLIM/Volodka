# AI3DGen — image → 3D для Volodka RPG

Генератор: [AI3DGen — изображение в 3D бесплатно](https://www.ai3dgen.com/ru/image-to-3d-model-free)

## Быстрый цикл

1. Откройте каталог в коде: `src/config/ai3dgenAssetCatalog.ts` — поле `imageBrief` описывает, что загружать.
2. Сгенерируйте модель на AI3DGen (перетащите PNG/JPG, дождитесь очереди).
3. Скачайте **OBJ** (бесплатно) или **GLB** (Pro).
4. Импорт в репозиторий:

```bash
npm run assets:ai3dgen-import -- --list
npm run assets:ai3dgen-import -- --status
npm run assets:status
npm run assets:ai3dgen-import -- --id npc_albert --file "C:/Downloads/albert.obj"
npm run assets:process -- --input assets-source/ai3dgen/npcs/albert.glb
npm run assets:validate
```

5. Подключите регистры — CLI выведет, какие строки добавить в `npcDefinitions`, `propModelRegistry`, `assetManifest`.
6. Запишите лицензию в `public/models/ATTRIBUTION.md`.

## Лицензия AI3DGen

| Тариф | Форматы | Текстуры | Коммерция |
|-------|---------|----------|-----------|
| Free (Lite) | OBJ | нет | только личное использование — **не ship в production** |
| Pro | GLB, STL | PBR | коммерческая лицензия — **обязательна для production** |

Для релиза Volodka нужен **Pro**, если модели идут в продакшен-сборку.

## Ограничения для игры

- **Пропы / крафт / квест-объекты** — идеальный кейс (статичная mesh).
- **NPC** — mesh отобразится через `GltfNPCModel`, но **без анимации** (AI3DGen не выдаёт rig). Для walk/talk оставьте procedural или добавьте rig в Blender.
- **Герой (Володя)** — нужен rigged GLB + LOD; AI3DGen годится как блок-out, финал — ретоп + скелет.

## Структура папок

```
assets-source/ai3dgen/
  characters/
  npcs/
  props/
  environments/
  vegetation/
public/models/          ← после process или quick-stage из import
```

## Масштаб

После импорта проверьте размер относительно игрока (1.75 m):

```bash
node scripts/inspect-glb-bounds.mjs public/models/npcs/albert.glb
```

Подстройте `defaultScale` в каталоге и `scale` в `propModelRegistry`.
