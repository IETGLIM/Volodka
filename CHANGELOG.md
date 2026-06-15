# Changelog — ВОЛОДЬКА RPG

## v4.2.3 — 15 июня 2026

### AAA polish pass
- **Poem registry**: 21 main + 25 hidden = 46 unified poems (`poemCollectionMeta`); `poem_act6_01` kept as registry ID; achievement/dialogue gates aligned with `TOTAL_UNIFIED_POEMS`.
- **gameDataLoader**: split boot/narrative preload, error reporting via `loadingPipeline`, quest-loaded guard on bootstrap failure; unit tests.
- **NPC registry**: merged `ALL_NPC_DEFINITIONS` with O(1) maps, duplicate detection, `speakerId` on dialogue nodes, `resolveNpcIdFromSpeaker(speaker, speakerId)`.
- **CHK Tolpa**: `speakerId` on all dialogue nodes; `tolpa_honorary_chekist` farewell variant; `chk_silence` / `chk_silence_night` time gates; Act 7 `chk_act7_farewell` story beat + trigger zone.
- **Rapier**: `rapierInitFix` hardened — esbuild expand, `module_or_path` patch, transform cache, DEV self-test.
- **Chunks**: rollup manual chunks keep narrative engine + data acyclic (no circular TDZ splits).
- **Validation**: content pipeline OK; poem count parity enforced in `contentPipelineValidator`.

## v4.2.2 — 15 июня 2026

### AAA polish pass (content, boot, bundles)
- **Poem registry**: 21 main (`poem_1`–`poem_21`) + 25 bonus/hidden = **46 unified**; `poem_act6_01` kept as registry id (not aliased to `poem_22`); achievements and CHK easter-egg gates aligned with `TOTAL_UNIFIED_POEMS`.
- **gameDataLoader**: boot/narrative preload error handling, load-state introspection, `resetGameDataLoader` for tests; guided-path cache invalidation without circular-import TDZ.
- **NPC registry**: merged `ALL_NPC_DEFINITIONS` with O(1) lookup, `speakerId` on CHK dialogues, `resolveNpcIdFromSpeaker` for i18n-safe portrait routing.
- **CHK Tolpa**: `speakerId`, night/day `chk_silence` variants, `tolpa_honorary_chekist` farewell dialogue, Act 7 story beat `chk_act7_farewell` + explore trigger.
- **Rapier / Vite**: `rapierInitFix` hardened (esbuild expand, pattern guards, transform cache, version logging).
- **Rollup chunks**: manual chunk splits to avoid data-mechanics TDZ; validator enforces poem registry parity.
- **Regression tests**: `poemCollectionMeta`, `allNpcDefinitions`, `gameDataLoader`, expanded CHK dialogue coverage.

### Scene transitions / narrative
- **Progress bar 90% hang**: `scene:enter` вложенно срабатывал до latch прогресс-бара — приоритеты EventBus (`Engine` → `Orchestrator`) и буфер `pendingEnter`.
- **Коридор коммуналки**: `corridor_door` / кат-сцена `act1_corridor_solnysh` — story-узел выставляется до `transitionScene`, чтобы cutscene-controller и entry-хелперы видели beat.
- **Regression test**: `SceneTransitionProgress.test.ts` на порядок `scene:transition` / `scene:enter`.

## v4.2.1 — 13 июня 2026

### Player / controls
- **Keyboard movement**: мгновенная целевая скорость WASD (как в SimplePlayer) — без медленного damp-разгона.
- **KCC**: slide-damping скорости только при реальном ударе о стену, не на микро-коллизиях пола.
- **Input**: held-клавиши не сбрасываются при blur, если документ ещё в фокусе (клик по HUD).
- **Virtual controls**: единый `virtualControlsRef` через `usePlayerControls` для HUD и физики.

## v4.2.0 — 13 июня 2026

### Critical fixes
- **NPC templates**: `disposeNpcInstance` skips shared GPU geometry/materials on clone teardown.
- **Audio**: one-shot SFX/ambient/random sounds disconnect nodes on `onended`; gesture handlers re-arm after dispose/revive.
- **LOD**: `lodBias` scales thresholds correctly (low preset → sooner downgrade, ultra → longer detail).
- **Combat**: `getEnemyDefenseReduction` reads buffs only — fixes poem_1 100% defense strip after first attack.
- **Data**: missing perk prerequisites (`iron_will`, `scavenger`, `poetic_soul`, `combat_veteran`); lazy narrative barrel (no eager `STORY_NODES` export).
- **R3F dev**: removed React `StrictMode` wrapper to prevent double effect invocations / physics duplication.

### Engine / UI
- **Canvas registry**: `canvasRendererRegistry` + ErrorBoundary GPU cleanup on crash.
- **Store/hooks**: quest objective emit after `set()`, stable toast/scene-enter/DPR deps, monotonic notification IDs.
- **Workers**: `worldCompute.worker` error responses; client rejects and falls back to main thread.
- **Content**: poem margin fallbacks (22–35, act6/7), `TOTAL_UNIFIED_POEMS`, NPC model path validation, compiled ambience regexes.

## v4.1.0 — 13 июня 2026

### Архитектура и типы
- **Модульные game types**: `src/shared/types/` — `definitions/`, `state/`,
  `common/`, `brands.ts`; barrel `game.ts` без циклического re-export EventMap.
- **GPU lifecycle**: `graphicsGpuCleanup`, `moduleGeometryRegistry`, расширенный
  `bufferGeometrySanitize`, ref-count текстур/геометрий, тесты teardown.
- **Scene transitions**: `SceneTransitionManager` — re-entrance guard, combat
  start gate; тесты и события `sceneEvents`.

### UI / оркестратор (performance & leaks)
- **Lazy CombatUI** — code-split через `LazyCombatUI` + Suspense (не в boot bundle).
- **Lazy minigames** — `retryLazyDefault` для всех 8 мини-игр (retry на flaky network).
- **Cutscene controller** — cleanup `cutscene:overlay_end` + `ControllerSession.cancel`.
- **CyberpunkTheme** — stable context value (`useMemo`).
- **MiniMap** — stable rAF loop (refs для player/NPC/quest data).
- **CombatUI** — tracked timeouts; memoized buffs/powers.
- **HUD controller** — tracked timeouts (save indicator, karma/energy/stress pulse).
- **Panel coordinator** — `onPanelOpened` только при открытии панели.
- **DialogueRenderer** — memoized NPC/emotion/relation lookups.

### Engine / gameplay
- **Combat buffs**: отдельные слоты buff/debuff (2+2 на target); тесты `buffSystem`.
- **Combat transient pool**, gamepad input tests, head tracking fixes.
- **AudioEngine** refactor + capability probe; player movement/math helpers.
- **Interaction session** — generation guards; NPC sprite texture stability (3D).

### Качество
- Юнит-тесты: **363/363** · `npm run check` (lint + typecheck + validate + build + budgets) — OK.

## v3.4.0 — 12 июня 2026

- **Exploration-first сюжет**: explore-hub для всех игровых локаций
  (кафе, офис, парк, библиотека, крыша, завод, подвал, ЧК, пирс и др.).
  Overlay остаётся открытым, но движение и [E]-триггеры работают на hub-узлах.
- **Remap legacy `explore_mode`**: выбор «осмотреться» из act5/ЧК больше не
  закрывает overlay — переход на hub текущей сцены (`cafe_explore_mode` и т.д.).
- **`syncNarrativeOnSceneEnter`**: beat-узлы в уже загруженной сцене
  автоматически повышаются до scene hub (не только door-узлы).
- Реестр `sceneExploreHubRegistry.ts`, story nodes `sceneExploreHubs.ts`,
  тесты remap + beat promotion.

## v3.3.3 — 12 июня 2026 (hotfix)

- **Прыжок и движение после перехода сцены**: физика больше не обнуляет `vel.y`
  в кадре после tap-jump; при входе в сцену narrative overlay синхронизируется
  с explore-hub (`corridor_door` → `corridor_explore_mode`, `go_home` →
  `explore_mode`, `street_bench` → `street_bench_view`).
- **Наслоение UI в бою**: при старте боя закрывается story overlay; в режиме
  `combat` скрыты narrative renderer и ambient HUD (компас, quick bar и т.д.).
- **NPC в коридоре**: лимит 2 NPC на сцену, патрульные waypoints, разнесённые
  spawn-координаты в расписании, убраны ambient NPC в узком коридоре; spawn
  коридора смещён с z=4 на z=2.
- Регрессионные тесты `exploreHubNodes.test.ts`.

## v3.3.2 — 11 июня 2026 (hotfix)

- **NaN god-rays / гигантские цилиндры**: guard в `GodRays.tsx` при `dist ≈ 0`,
  `normalizeGodRayConfig()`, санитизация `BufferGeometry`.
- **Rapier deprecation**: shim `rapierCompat.ts` через Vite alias.

## v3.3.1 — 11 июня 2026 (hotfix)

- **Критический фикс React #185** (Maximum update depth exceeded) при открытии
  сюжетного оверлея из панели осмотра: `useStoryContext`/`useDialogueContext`
  возвращали вложенный объект-литерал на каждый снапшот, ломая `useShallow` и
  зацикливая `useSyncExternalStore`. Селекторы сделаны плоскими, контекст условий
  собирается в `useMemo`; регрессионный тест на стабильность снапшотов.
- Заглушено предупреждение GLTFLoader `KHR_materials_pbrSpecularGlossiness`
  (источник — fps_arms.glb): зарегистрирован no-op плагин в `gltfPipeline`,
  материал штатно фоллбечится на metallic-roughness.

## v3.3.0 — 11 июня 2026

### Две новые локации
- **«Подвал завода»** (`factory_basement`) — катакомбы под заводом: ряды серверных
  стоек с мигающими LED (инстансинг), пульсирующий монолит «Зари-М» (машина дышит
  задолго до исповеди акта 5), капающие трубы, лужи, красные аварийные лампы.
  Фригийский саб-дрон в музыке, зелёный god ray, холодный грейд.
- **«Пирс у реки»** (`river_pier`) — вторая тусовка ЧК: костёр в бочке, портвейн
  «777», гитара, гирлянда, лунная дорожка на воде, камыши, старая лодка, удочка.
  Тёплая пентатоника, плеск воды и треск костра в эмбиенте.
- Полная провязка: завод ↔ подвал (за ключом сторожа), парк ↔ пирс; погодные/
  мировые/музыкальные карты типобезопасно расширены.

### Контент и история
- **NPC**: Трофим (старик-рыбак, бывший сторож завода — ключ от подвала за
  портвейн) и Ритка из ЧК с гитарой; диалоговые деревья, расписания.
- **Квесты**: «Ключ сторожа» → «Гул под полом» (форшадоуинг «Зари-М» со 2-го
  акта), «Песня для Ритки» (ЧК-линия, флаг для концовок). 10 trigger-зон,
  5 лор-записей, 4 предмета.
- **«Поля»** — 52 заметки Володьки на полях стихов (poem_1–21, 2–3 варианта
  на стих): тон меняется от кармы, флагов судьбы Заремы и акта. Тексты стихов
  Владимира Лебедева не тронуты — меняется только отношение героя к ним.
- **Концовки-зеркала**: у всех 6 концовок акта 5 и финала акта 7 появился выбор
  «оглянуться» — узлы-отражения собирают итог конкретного прохождения (судьба
  Заремы и «Зари-М», письмо, тихие сцены, карма).
- **«Тихий час»** перед штурмом (акт 4): 5 необязательных контемплятивных сцен
  (крыша с Дмитрием, чай с Заремой, сообщение Альберта, окно опенспейса, первый
  стих) — их флаги выстреливают в зеркалах концовок.
- Крипы: Призрак Данных в подвале, Дрон-Цензор на пирсе (акт 3+); пинаемые
  предметы в обеих локациях.

### Интерфейс
- **«Тихий HUD»**: амбиентные элементы (статы, мини-карта, компас, погода,
  день/ночь, карма, тулбары) тают до 14% после 6 с без ввода и мгновенно
  просыпаются от действия; в бою не засыпают. Компас теперь только на улице.
- **Арбитр уведомлений**: 7 каналов (квесты, события, тосты, ачивки, погода,
  крафт, лут) делят максимум 2 слота по приоритету — стена карточек невозможна.
- **Портреты NPC в диалогах**: детерминированные процедурные нуар-аватары
  (canvas, сканлайны, неоновая окантовка) + затемнение HUD при диалоге.

### Исправления
- **Масштабы моделей**: Kenney-пропсы (стол 7.3 м, дверь 10 м, окно 13 м!)
  отцеплены от зон — в комнатах остаётся более богатая процедурная мебель
  (анимированные двери, мониторы Grafana/Zabbix); реестр получил выверенные
  масштабы для будущего использования. Александр больше не гном 0.6 м
  (двойная коррекция scale поверх авто-нормализации); битые 15-КБ стабы
  баристы/коллеги заменены валидным Soldier (CC0).
- Письмо на кухне теперь ставит флаг `read_zarema_letter` (был `read_maria_letter`
  — письмо от Заремы, не от Марии), и концовки на него реагируют.

## v3.2.0 — 11 июня 2026

### Геймплей: живой мир
- **Патрулирующие крипы** вместо невидимых боевых зон: 6 видимых врагов с конусами зрения,
  FSM «патруль → погоня → бой». Скорость погони ниже бега — убежать можно всегда.
  Победа убирает врага до перезахода в сцену; поражение/побег дают 8 секунд форы
  (`src/data/creepPatrols.ts`, `PatrollingCreeps.tsx`).
- **Поэтический стелс**: активная «Путеводная Звезда» (poem_3) сжимает конусы зрения
  крипов до 45% — визуально и механически. Стихи Владимира Лебедева управляют миром.
- **Пинаемые физические предметы**: банки, бутылки, ящики, бочки — dynamic-тела Rapier
  в 5 сценах, толкаются персонажем, звенят процедурным звуком удара (`DynamicProps.tsx`).

### Сюжет: сквозной путь до финала
- Все 6 концовок акта 5 теперь ведут через эпилог `act5_ending_epilogue` в акты 6–7 —
  47 узлов и 9 main-квестов перестали быть недостижимым контентом.
- Квесты акта 5 (`final_code`, `machine_confession`, `echo_of_vladimir`) получили
  триггеры и сцены; все «висячие» флаги objectives теперь выставляются сюжетом.
- `GOLDEN_PATH_STORY_SPINE` продлён до `act7_true_end`; квестовый spine покрывает акты 5–7.
- 60 меток `goldenPath: true` в актах 1–5 — derived-spine совпадает с каноном
  (75 → 15 предупреждений валидатора; остаток — честная диагностика хабовых переходов).

### Физика и мир
- **Дверные проёмы в стенах**: периметр сцен генерируется с проёмами по `doorways`
  и утопленными «нишами»-backstop — двери стали альковами, из карты не выйти.
  Дубли definition-стен на периметре убраны. Покрыто юнит-тестами.
- Улица: видимый бордюр + металлическое ограждение по границе играбельной зоны.

### Визуал
- **Лес Зорге**: инстансированный пояс из ~46 деревьев (3 draw call), луна, звёздное
  небо, светлячки у костра, валежник и подлесок.
- **Крыша**: закатный градиентный купол неба, лужи с отражениями; окна skyline
  детерминированы (исправлено «прыгание» на каждом рендере).
- **Парк**: туманный пояс из 34 деревьев за оградой, вороны, кованые ворота.
- **Арена боя**: эмиссивная сетка пола с пульсом и вспышками на ударах
  (синхронизация с боем через EventBus), разбитая машина как укрытие.
- **Офис**: сетка люминесцентных потолочных панелей.
- Убран двойной дождь (street_night) и двойной снег (street_winter).

### Настройки, которые теперь работают
- Пост-обработка, яркость, тряска камеры, чувствительность мыши, инверсия Y,
  сканлайны, частицы, «Без звука» — все переключатели подключены к рендеру/вводу/звуку
  (новый модуль `engine/visualSettings.ts`; раньше писались в localStorage и игнорировались).
- `npcRenderMode` из пресетов качества управляет выбором GLB/процедурных NPC.

### Производительность
- **Меню больше не тянет весь движок**: разорваны цепочки статических чанков
  (LoadingTimeline выпал из `game-canvas`, `gameDataLoader` отделён от валидатора
  контента, `goldenPath` — от barrel всех актов). Modulepreload на старте: 28 → 5
  чанков; boot ~300 КБ gzip при бюджете 439 КБ.

### Надёжность
- **Автовосстановление сейва**: при битом основном сохранении загружается резервная
  копия с уведомлением; битые ключи не затираются до первого успешного сохранения.
- Валидатор GLB-ассетов проверяет реальные рантайм-реестры (props/NPC/FPS-руки)
  и ловит «404-заглушки» по магическим байтам; восстановлены битые Soldier/Xbot GLB.
- Удалены ~15 осиротевших файлов прошлых сессий, ломавших typecheck.

### Метрики релиза
- typecheck: 0 ошибок · ESLint: 0 ошибок · юнит-тесты: 144/144
- валидатор контента: 0 ошибок / 15 предупреждений (golden-path fallback)
- бюджеты бандла: boot 300/439 КБ, game-start 540/1172 КБ — OK

---

## v3.1.0

### Исправления
- Камера адаптируется к масштабу локации — 2.5 м в комнатах, 6.5 м на улицах
- Улучшенная коллизия — skin width 2 → 8 см, персонаж не проходит сквозь мебель
- MatrixRain больше не блокирует управление в indoor-сценах

### Новый контент
- +10 записей лора, +8 перков, +5 рецептов крафта, +5 предметов

### Оптимизация
- Кэширование статических ассетов в Vercel, security-заголовки

## v3.0.x
- Большой рефакторинг: typed EventBus с дедупликацией и приоритетами,
  GameActionDispatcher, ленивые narrative-паки по актам, бюджеты бандла в CI,
  валидатор контента, error boundaries с graceful degradation.
