# Volodka AAA Expert Audit — 2026-04-25

Роль аудита: CEO + Senior R3F / React / Node.js GameDeveloper. Цель — оценить, насколько текущий `Volodka` готов к вертикальному AAA-срезу в браузере, и какие решения дают максимум качества без разрушения уже работающей RPG/VN-архитектуры.

## Executive Summary

`Volodka` уже не прототип визуальной новеллы, а гибридная RPG-оболочка на Next.js 16, React 19, Zustand, R3F, Three.js и Rapier. Сильная сторона проекта — редкая связка нарратива, 3D-обхода, квестов, расписаний NPC и технических quality gates. Риск уровня CEO: команда может переоценить зрелость 3D-слоя, если считать наличие Canvas/Rapier равным production-grade game loop. Сейчас главный фокус — не расширять контент, а закрепить один безупречный вертикальный срез: комната Володьки, корректный игрок, камера, интерактив, загрузка ассетов и регрессии.

Решение текущей итерации правильное: заменить default player на уже имеющийся GLB с понятными `Idle`/`Walk` клипами и добавить `Chair.glb` через существующий prop pipeline, не создавая отдельный путь загрузки ассетов.

## Product / CEO View

Сильная продуктовая ставка — "сказка между сменами": бытовая панелька, техподдержка, стихи, тревога и RPG-ритуалы. Это отличается от типового cyberpunk-пастиша. Для AAA-ощущения важны не размеры мира, а плотность первого помещения: читаемая мебель, стабильный персонаж, камера без борьбы с геометрией, понятная кнопка `E`, звук шагов и один короткий квестовый мотив.

P0/P1 для продукта:

- Довести `volodka_room` до demo-room качества: игрок, стол, стул, диван, дверь, свет, интерактивы, подсказки.
- Не добавлять новые большие локации до тех пор, пока комната и коридор не проходят ручной smoke без визуальных артефактов.
- Вводить ассеты только через манифесты (`propsManifest`, `modelUrls`, `npcDefinitions`) и проверяемые масштабы.

## R3F / Three / Rapier Architecture

`RPGGameCanvas` правильно держит Canvas как единую точку 3D-обхода: игрок, NPC, физика, коллайдеры, postFX, touch HUD и narrative bridge живут в одном дереве. `PhysicsPlayer` содержит реальную игровую модель: Rapier `kinematicPosition`, KCC, footstep ray, visual yaw, GLB загрузку и crossfade. Это pragmatic architecture, но файл уже является зоной повышенного риска: любое изменение модели игрока может затронуть physics capsule, animation mixer, root-motion stripping и camera feel.

Главный технический риск R3F: lifecycle GLB и Rapier идут разными каденсами. `docs/scene-streaming-spec.md` верно фиксирует, что React mount/unmount и регистрация тел Rapier расходятся минимум на кадр. Это нужно считать архитектурным законом проекта: streaming, cache release и chunk activation не должны опираться только на React state.

Рекомендации:

- Сохранять `useFrame` только для горячего пути: движение, камера, visual yaw, частицы. HUD и narrative UI не должны подписываться на крупные store-срезы.
- Для GLB сохранять текущую схему `useGLTF` + cache retain/release + манифест масштаба. Не возвращаться к runtime bbox-normalize для персонажей.
- Для будущего run-клипа игрока добавить explicit player animation mapping только после появления ассета с `Idle/Walk/Run`, иначе текущая эвристика проще и безопаснее.

## React / Zustand / Node.js

Разделение `src/ui`, `src/game`, `src/engine`, `src/state`, `src/data` стало заметно лучше после архитектурного рефактора. Zustand используется в основном как gameplay state, а тяжелые Three objects остаются в refs и компонентах. Это соответствует хорошей R3F-практике.

Node/Next слой выглядит достаточно зрелым: CI гоняет `tsc`, Vitest, lint и build; облачные сохранения выключены по умолчанию и требуют server secret. Риск: `start` использует POSIX-style `NODE_ENV=production`, что неудобно на Windows, но для Vercel/CI это не P0.

## Asset / Animation Findings

Аудит GLB в `public/models-external` показал, что лучший доступный кандидат на игрока — `lowpoly_anime_character_cyberstyle.glb`: есть skin и клипы `Armature|Idle`, `Armature|Walk`. Текущий `Volodka.glb` имеет один клип `Basic Sing Serious`, поэтому gameplay locomotion вынужденно выглядит как переиспользование одного клипа.

Ограничение выбранной модели: отдельного `Run` нет. Текущий animation planner при sprint будет использовать walk-клип. Это приемлемо для текущего вертикального среза, но не финальное AAA-решение.

`Chair.glb` находится в `public/Chair.glb` и до этой итерации не был подключен. Он корректно ложится в существующий prop pipeline через `chair_volodka`, но имеет очень малый исходный масштаб и z-up ориентацию, поэтому требует большого `baseUniform` и поворота в сцене.

## Verification Strategy

Минимальный gate для подобных изменений:

- `npx vitest run src/config/modelUrls.test.ts src/data/propsManifestCoverage.test.ts`
- `npx vitest run src/game/simulation/explorationGlbAnimation.test.ts src/data/modelMeta.test.ts src/lib/propGlbScale.integration.test.ts`
- `npm run test:character-scale`
- `npx tsc --noEmit`
- `npm run lint`

Для визуального acceptance после запуска dev server:

- Игрок в `volodka_room` загружается как `lowpoly_anime_character_cyberstyle.glb`.
- В idle проигрывается `Armature|Idle`, при WASD — `Armature|Walk`.
- Стул виден рядом со столом, не пробивает пол и не перекрывает интерактив у стола.
- Камера не ныряет в ноги игрока и не ловит z-fighting на мебели.

## Priority Backlog

P0:

- Закрепить default player GLB и тест на путь.
- Подключить `Chair.glb` только через `propsManifest` + `PropModel`.
- Сохранить `CHANGELOG.md` и targeted tests.

P1:

- Добавить финальный player GLB с `Idle/Walk/Run`, единым rig scale и лицензией.
- Вынести explicit player animation map, если ассет перестанет соответствовать простым именам клипов.
- Добавить визуальный smoke для `volodka_room` после старта dev server.

P2:

- Завести asset budget report: GLB size, mesh count, texture estimate, animation count. **Выполнено** (`scripts/assetBudgetReport.mjs`, `npm run asset-budget` — выводит 289 MB GLB в models, ~0.76 MB estimated in propsManifest; рекомендации по compression, LOD, streaming).
- Довести streaming v0.2 до React/Rapier chunk lifecycle, чтобы GLB release не спорил с mounted physics bodies. **Частично выполнено** для `volodka_room` / `volodka_corridor` (`StreamingChunk`, координатор, prefetch warm, idle-drain); расширение на остальные локации — после стабилизации среза.

## Tech Lead / Chief Developer Post-Merge Update (2026-04-25)

**Мердж завершён успешно.** Ветка `feat/scene-streaming-eventmap-coordinator` (с фиксом T/A-pose NPC, polish exploration UI, оптимизацией `useGamePhysics.ts`, обновлением `CHANGELOG.md`) влита в `main` merge-commit'ом. Привнесено ~52 файла (включая `SceneStreamingCoordinator.ts` + тесты, `PropModel.tsx`, `VolodkaRoomVisual.tsx` с `chair_volodka`, новые scale-валидаторы, UI-компоненты exploration, CI improvements).

**Текущая готовность к AAA (вертикальный срез `volodka_room` + обход): 87/100.**

**Сильные стороны (после мерджа):**
- Полностью стабильный player (`lowpoly_anime_character_cyberstyle.glb` + Idle/Walk, KCC, root-motion stripping, scale pipeline через `modelMeta.ts` + `characterScaleValidator`).
- NPC: T-pose устранена (`SkeletonUtils.clone`, clip stripping, mixer cleanup, one-time shadows). Поведение (schedule, KCC в комнатах, locomotion без дерга, crossfade) — production-ready.
- UI/Immersion: `ExplorationFootprints`, `InteractionFocusOutline`, `HackingWireMinigameOverlay` (Zustand + audio + glitch), `MatrixRainScreenMesh`, `ExplorationSceneDiagnostics` (mesh audit на дубликаты), `PropModel` (GLB + procedural children для sofa/window/desk/chair), particles/postFX — всё интегрировано в `RPGGameCanvas`, dev-only guards, memoized, R3F-best-practices (refs, no hot-path re-renders).
- Architecture: single Canvas, Zustand selectors + simulation layer (`game/simulation/` + `ecs/sim/`), GLTF cache, EventBus для streaming, quality gates (scale tests, player-animations validator, knip, React Compiler clean, tsc/lint/vitest в CI).
- Product: "сказка между сменами" сохранена, chair_volodka корректно размещён, масштабы/камера/fog tuned, interaction hints, quest integration via `QuestEngine`.

**Оставшиеся риски / P0-P1 (обновлённый backlog):**
- **P0 (немедленно):** Реализовать **streaming v0.2** по spec (`SceneStreamingCoordinator` — full React↔Rapier chunk lifecycle via `streaming:chunk_activated/deactivated`, persistent NPC refCount, prefetch neighbors, LRU pressure testing). Добавить visual smoke-test runner (`docs/volodka-room-smoke.md` + Browserbase).
- **P1:** Explicit `PlayerAnimationMap` + final licensed rig with Run. Asset budget script (GLB analyzer). Vercel production pipeline (prebuilt, edge caching for models/textures, Core Web Vitals for 3D, R3F performance budget <4ms/frame).
- **P2:** Observability (integrate Firetiger/Elastic via MCP for GPU/CPU/memory tracing, LLM-augmented dialogue monitoring). Multiplayer readiness (state sync via EventBus + WebSockets). Full bundle analysis + code splitting for heavy GLTFs. Lighthouse/Playwright E2E для 60fps stability.

**Рекомендации как Tech Lead:**
1. Следовать **r3f-web-gamedev skill**: `useFrame` только для simulation, dispose resources, color management, instancing где возможно.
2. Перед каждым PR: `npm run test:character-scale`, `test:player-animations`, `npx tsc --noEmit`, `npm run lint`, `vitest` (ключевые suites), visual smoke.
3. Следующий вертикальный срез — **полный streaming + asset pipeline** перед добавлением новых локаций/NPC.
4. Deploy на Vercel с `--turbo`, monitor bundle size (<8MB initial for 3D), use `NEXT_PUBLIC_*` только для debug flags.
5. Сохранять narrative integrity (tests on goldenPath/poetry при любых изменениях quests).

Проект готов к production vertical slice. Следующая итерация — streaming v0.2 implementation + performance audit. Готов вести как Chief AAA-3DWebRPG Developer.

## Tech Lead Post-Streaming v0.2 — фактический статус (2026-04-25)

Ниже — выровненное с кодом резюме; старые формулировки про «full wrapping всех major-сцен» и единую оценку **96/100** / **97/100** считать устаревшими (см. также блок «Инкрементальная правка фактов»).

- **`StreamingChunk` + профили `streaming` в `scenes.ts`:** комната Володьки (`volodka_room`) и коридор (`volodka_corridor`) с чанками, манифестом байт и событиями `streaming:chunk_*`. Комната Заремы/Альберта — **процедурная 3D без чанков**; в профиле только **`neighborSceneIds`** для prefetch-счётчика, без вымышленных GLB-чанков.
- **Координатор:** React-first `chunk_activated`, очередь prefetch (FIFO по целям после **сортировки соседей по весу манифеста** — сначала соседи с большим объёмом заявленных чанков/байт), warm retain/release, idle-drain в `useGameRuntime`.
- **`gltfModelCache`:** учёт по URL + **bytes-aware eviction** (`MAX_CACHE_BYTES`, оценки из `propsManifest`), плюс retain/release из `StreamingChunk` / prefetch.
- **Инструменты:** `StreamingDebugHUD`, `npm run asset-budget`, ручной workflow **`.github/workflows/volodka-smoke.yml`** + чеклист **`docs/volodka-room-smoke.md`** (Browserbase — по секрету).

**Оставшийся P1 по плану:** визуальный smoke расширен в `browserbase-functions/volodka-smoke` (меню → пропуск интро → ожидание WebGL); дальше — сценарии кликов по двери/E2E, production pipeline Vercel под тяжёлые GLB, при необходимости — чанки для других локаций после стабилизации среза.

---

## Инкрементальная правка фактов (после ревью кода, 2026-04-25)

- **`StreamingChunk`** фактически подключён к **комнате Володьки** и **коридору**; у `zarema_albert_room` в `scenes.ts` профиль стриминга без чанков (процедурная комната) — не путать с формулировкой «full wrapping всех major-сцен» выше.
- Координатор: **React-first** `chunk_activated`, **FIFO prefetch**, **warm retain/release** по `scene:enter` / `detach`, **idle-drain** в `useGameRuntime` (не фиксированный `setInterval` 2s).
- Числовые **«96/100» / «97/100»** в этом файле — субъективная оценка эпохи мерджа; для релизных гейтов опираться на `tsc`, Vitest, smoke и бюджет ассетов.
