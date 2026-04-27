# Модели Khronos / сэмплы для Vercel / WebGL

Часть файлов с префиксом **`khronos_cc0_*`** — из **[KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)**; персонажные **`khronos_cc0_*.glb`** ниже — из **[KhronosGroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models)** (ветка `master`, папка `2.0/<Model>/glTF-Binary/*.glb`). **Лицензии разные** — сверяйте таблицу перед публикацией.

## Персонажи обхода / игрок (`npcDefinitions`, дефолтный игрок)

| Файл | Источник (raw GitHub) | Лицензия |
|------|------------------------|----------|
| `khronos_cc0_CesiumMan.glb` | `2.0/CesiumMan/glTF-Binary/CesiumMan.glb` | **CC BY 4.0** — donated by Cesium; товарный знак: [Cesium Trademark](https://github.com/AnalyticalGraphicsInc/cesium/wiki/CesiumTrademark.pdf) |
| `khronos_cc0_RiggedFigure.glb` | `2.0/RiggedFigure/glTF-Binary/RiggedFigure.glb` | **CC BY 4.0** — donated by Cesium |
| `khronos_cc0_Fox.glb` | `2.0/Fox/glTF-Binary/Fox.glb` | **Смешанная:** сетка **CC0** (PixelMannen); **риг и анимации CC BY 4.0** (@tomkranis / Sketchfab); конвертация glTF — см. README в репозитории Khronos |

Клипы: `CesiumMan` / `RiggedFigure` — один безымянный цикл → в Three.js обычно `animation_0`; `Fox` — `Survey`, `Walk`, `Run`.

---

## Прочие CC0-пропы (префикс `khronos_cc0_*`)

Файлы ниже скачаны из репозитория **[KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)** (официальные примеры формата glTF 2.0).

| Файл | Источник (raw) | Лицензия |
|------|----------------|----------|
| `khronos_cc0_BoxVertexColors.glb` | `Models/BoxVertexColors/glTF-Binary/` | **CC0 1.0** — Marco Hutter |
| `khronos_cc0_AnimatedMorphCube.glb` | `Models/AnimatedMorphCube/glTF-Binary/` | **CC0 1.0** — Microsoft |
| `khronos_cc0_NormalTangentTest.glb` | `Models/NormalTangentTest/glTF-Binary/` | **CC0 1.0** — Analytical Graphics, Inc. (Ed Mackey) |
| `khronos_cc0_BoomBox.glb` | `Models/BoomBox/glTF-Binary/` | **CC0 1.0** — Microsoft |

Полные юридические формулировки и скриншоты — в `README.md` соответствующей папки модели в репозитории Khronos (см. ссылки на [creativecommons.org/publicdomain/zero/1.0](https://creativecommons.org/publicdomain/zero/1.0/)).

## Использование в коде

Константы в `src/config/modelUrls.ts`: `MODEL_URLS.cc0KhronosBoxVertexColors`, `cc0KhronosAnimatedMorphCube`, `cc0KhronosNormalTangentTest`, `cc0KhronosBoomBox`.

Путь в данных (legacy): `/models/khronos_cc0_BoomBox.glb` → переписывается в `/models-external/...` через `rewriteLegacyModelPath`.

## Заметка по размеру

`BoomBox` ~10 MB — для продакшена при желании замените на более лёгкий проп или вынесите на CDN (`NEXT_PUBLIC_MODELS_BASE`).
