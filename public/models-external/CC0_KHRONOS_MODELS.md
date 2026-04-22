# Бесплатные модели (CC0) для Vercel / WebGL

Файлы в этой папке с префиксом **`khronos_cc0_*`** скачаны из репозитория **[KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)** (официальные примеры формата glTF 2.0).

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
