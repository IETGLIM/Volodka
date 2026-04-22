# Пакет для анализа моделей (Blender / масштаб)

Собрано из репозитория Volodka: **все GLB из `public/models-external`** и **исходники**, которые задают пути, bbox-скейл и поведение персонажа в обходе.

## GLB (папка `public/models-external/` в архиве)

| Файл | Роль в игре |
|------|----------------|
| **Volodka.glb** | Игрок по умолчанию (`MODEL_URLS.volodka`, `getDefaultPlayerModelPath`). Масштаб в рантайме: bbox SkinnedMesh → uniform под `explorationPlayerGltfTargetMeters` / `explorationPlayerGlbVisualUniformMultiplier` (`scenes.ts` → `PhysicsPlayer` → `GLBPlayerModel`). |
| **smol_ame_in_an_upcycled_terrarium_hololiveen.glb** | NPC «Дима» в `volodka_room` (`npcDefinitions.volodka_dima_neighbor`). |
| **lowpoly_anime_character_cyberstyle.glb** | Частый NPC-ассет в данных. |
| Остальные `.glb` | См. `npcDefinitions.ts` и `MODEL_URLS` — пути вида `/models/foo.glb` переписываются в `/models-external/foo.glb`. |

В Blender проверьте: **масштаб armature/root**, **единый apply scale**, **лишние пустышки с огромным bbox**, **позицию модели относительно origin** (игрок стоит на полу — origin часто в ногах).

## Код (папка `code/` — зеркало путей `src/…`)

- `config/modelUrls.ts` — базовый URL, `MODEL_URLS`, `rewriteLegacyModelPath`.
- `config/scenes.ts` — для сцены `volodka_room`: `explorationPlayerGltfTargetMeters`, `explorationPlayerGlbVisualUniformMultiplier`, NPC-слоты с `modelPath`.
- `config/scenes.explorationScale.test.ts` — зафиксированные числа для тестов.
- `data/npcDefinitions.ts` — `modelPath` по каждому NPC.
- `lib/playerScaleConstants.ts` — `computeExplorationPlayerGlbUniformFromBBox`.
- `lib/gltfSkinnedBoundingHeight.ts` — оценка визуальной высоты по skinned mesh.
- `lib/stripExplorationPlayerRootMotionFromClips.ts` — клипы анимации без root translation.
- `lib/gltfCharacterMaterialPolicy.ts` — материалы/тени exploration.
- `lib/gltfModelCache.ts` — retain/release URL для `useGLTF`.
- `lib/introVolodkaOpeningCutscene.ts` — интро: отдельные константы масштаба и камера.
- `lib/introVolodkaOpeningCutscene.playerScale.test.ts`
- `components/game/PhysicsPlayer.tsx` — **`GLBPlayerModel`**: загрузка `useGLTF`, итоговый `<group scale=…>`.
- `components/game/NPC.tsx` — загрузка GLB NPC, политики материалов, масштаб сцены.

Полный путь в репозитории: префикс `src/` к относительным путям выше.

## Переменные окружения (для справки)

- `NEXT_PUBLIC_MODELS_BASE` — другой каталог/CDN для GLB.
- `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL` — другой GLB игрока.
- `NEXT_PUBLIC_EXPLORATION_VOLODKA_NPC_GLB=0` — отключить GLB NPC в комнате Володьки.
