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

## Прочие CC0-пропы (Sample-Assets)

Отдельные файлы **`khronos_cc0_BoxVertexColors`**, **`AnimatedMorphCube`**, **`NormalTangentTest`**, **`BoomBox`** из репозитория **[KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)** в этой копии проекта **не лежат** (объём репозитория). Их можно снова положить в `public/models-external/` по таблице в апстриме Khronos и обновить URL в `src/config/modelUrls.ts`.

Пока файлов нет, константы `MODEL_URLS.cc0Khronos*` в коде указывают на загруженный в репо **`khronos_cc0_Fox.glb`** как на общий stand-in (см. комментарии в `modelUrls.ts`).

## Использование в коде

Константы в `src/config/modelUrls.ts`: `MODEL_URLS.cc0KhronosBoxVertexColors`, `cc0KhronosAnimatedMorphCube`, `cc0KhronosNormalTangentTest`, `cc0KhronosBoomBox`.

Путь в данных (legacy): `/models/…` → `/models-external/…` через `rewriteLegacyModelPath` (для удалённого `Volodka.glb` есть редирект на `khronos_cc0_RiggedFigure.glb`).

## Заметка по размеру

Крупные пропы при желании держите на CDN (`NEXT_PUBLIC_MODELS_BASE`) или восстанавливайте локально из Sample-Assets.
