# Экспертное изучение кодовой базы «Володьки» — 132 этапа

> Версия проекта на момент анализа: **4.8.1** · Объём `src/`: **~430 000 строк** TypeScript/TSX.
> Метод: **только статический анализ кода** (README/патчноуты/ворклоги игнорировались согласно ТЗ).
> Каждый этап зафиксирован отдельной строкой; «✓» — этап завершён, находки внесены в отчёт.

---

## Блок A. Точка входа и загрузка (этапы 1–12)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 1 | `index.html`: шрифты, meta, CSP-совместимость | Google Fonts render-blocking (2 RTT) — риск LCP; preconnect есть | ✓ |
| 2 | `src/main.tsx`: порядок инициализации | `installChunkLoadRecovery` до рендера, SW-регистрация в PROD по `load` | ✓ |
| 3 | `AppBootRoot`: предзагрузка данных | `preloadBootGameData()` грузит data-чанки до первого экрана | ✓ |
| 4 | BootScreen: прогресс/вотчдог | синтетический `canvas:first-frame` при pct≥68 — анти-зависание | ✓ |
| 5 | Ленивый `GamePage → GameOrchestrator` | code splitting подтверждён | ✓ |
| 6 | `GltfPipelineInit`: Draco/Meshopt/KTX2 | Draco WASM `/draco/` OK; KTX2 настроен, но в `public/` 0 `.ktx2` | ✓ |
| 7 | Suspense-фолбэки сцены | `SimpleSceneFallback` без layout-shift | ✓ |
| 8 | Загрузка физического чанка | `preloadPhysicsChunk()` 2 фазы с INP-yield | ✓ |
| 9 | Rapier WASM стратегия | внешний `/rapier/*.wasm` → inline-base64 fallback (мёртвый путь в бандле, задокументирован) | ✓ |
| 10 | PWA `sw.js` v2 | network-first HTML, cache-first хэшей; media-cache eviction по количеству (не LRU) | ✓ |
| 11 | `vite.config.ts`: чанкинг | tier-система boot/gameStart/lazy, `modulePreload:false` (фикс LCP) | ✓ |
| 12 | Бюджеты бандла | `performanceBudgets.json` + CI-gate `check-bundle-budgets.mjs` | ✓ |

## Блок B. Ядро фреймворка (13–30)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 13 | Пайплайн приоритетов R3F | `FrameBudgetRunner`: pre_physics(−1000) → Rapier(0) → post_physics(100) → pre_render(500) | ✓ |
| 14 | Post-render фаза | `PostFrameBudgetRunner` (+1000), никогда не skip | ✓ |
| 15 | Реестр тиков | `FrameBudgetRegistry`: сортированный кэш, soft-skip при FRAME_BUDGET_MS=16.6 | ✓ |
| 16 | Классификация критичности | critical: interaction/player/npc/camera (`frame/types.ts:88-95`) | ✓ |
| 17 | Фиксированный timestep | только Rapier `1/60` без интерполяции (обоснование — кинематика) | ✓ |
| 18 | Клампы dt | `SIM_DELTA_MAX=0.05` на всех сим-путях | ✓ |
| 19 | KCC-субстепы | `MAX_PHYSICS_DT=1/30`, ≤4 шага, NaN-валидация | ✓ |
| 20 | Пауза/видимость | двойной контур: `frameVisibility` + frameloop 'demand' в меню/интро/фоне | ✓ |
| 21 | Разморозка после паузы | dt-клампы + `warmupTimer` 0.2s на спавне | ✓ |
| 22 | Снапшот стора в кадр | `FrameGameSnapshot` без Zustand-подписок; **исправлены 2 спред-аллокации/кадр** | ✓ |
| 23 | EventBus | типизированный pub/sub, приоритеты, FNV-дедуп, cap 20 (throw) | ✓ |
| 24 | Dispose/revive протокол | `disposeGameEngine` ~40 подсистем; **исправлен порядок revive (binders после eventBus)** | ✓ |
| 25 | Runtime reset | `engineRuntimeReset.ts` — 19 сбросов | ✓ |
| 26 | GPU resource lifecycle | 26 текстурных слотов, скелеты, shadow maps, skip-сеты shared | ✓ |
| 27 | Canvas renderer registry | orphan-рендереры чистятся | ✓ |
| 28 | Worker client | terminate/revive `computeWorkerClient` | ✓ |
| 29 | Scene transition | протокол transition_start → unload → store → enter; гвард реэнтрантности | ✓ |
| 30 | Chunk load recovery | пере-загрузка упавших динамических чанков | ✓ |

## Блок C. Ввод и управление (31–42)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 31 | Клавиатура | WASD+стрелки, Shift=бег, Ctrl=крадусь, Space, E, X=блок; ролловер W+S | ✓ |
| 32 | Blur-очистка клавиш | `keyboardInputState.ts:195-198` — заливания нет | ✓ |
| 33 | Touch D-pad | write-gate на время лока | ✓ |
| 34 | Virtual joystick | floating, pointer capture, dead zone, haptics | ✓ |
| 35 | Joystick bridge | **исправлен клобберинг геймпада в stop()** | ✓ |
| 36 | Геймпад | оси + кнопки через sharedVirtualControlsRef | ✓ |
| 37 | «Обе кнопки мыши = вперёд» | **добавлен гейт canvas-области** (был по всему окну) | ✓ |
| 38 | Блок ПКМ | **исправлено залипание: гейт canvas + blur/visibility cleanup** | ✓ |
| 39 | Мердж локомоции | `resolveMovementIntent`: клавиатура+virtual+gamepad, hold 0.1s | ✓ |
| 40 | Мобильные кнопки | `MobileActionButtons` через синтетические I/J — хрупкий мост (в бэклоге) | ✓ |
| 41 | Pinch-zoom | отсутствует (только 1-палец орбит) — в бэклоге | ✓ |
| 42 | Гироскоп/вибрация | отсутствуют — в бэклоге | ✓ |

## Блок D. Камера (43–56)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 43 | Архитектура стратегий | exploration/combat/dialogue/cutscene/transition + owner-модель | ✓ |
| 44 | Spring-камера | экспоненциальная интеграция, NaN-санитизация | ✓ |
| 45 | OTS (Max Payne) | дистанция 2.35, плечо 0.45м, лаг-фактор 0.08 | ✓ |
| 46 | Инерция вращения | decay 5.5, gain 0.6 на реальном dt | ✓ |
| 47 | Zoom | колесо (exp 0.011) + spring-snap 0.74 | ✓ |
| 48 | Коллизия: forward raycast | **исправлен баг за-стены: клэмп safe ≤ hit−margin** | ✓ |
| 49 | Коллизия: reverse raycast | **исправлен тот же max(minDistance) баг** | ✓ |
| 50 | Слой коллизий | layer 5, `isCameraCollisionHit` фильтр | ✓ |
| 51 | Shake-система | **добавлена Z-компонента (удар «в спину» 60% от X/Y)** | ✓ |
| 52 | Sprint FOV-панч | **исправлена потеря подписки после dispose/revive** | ✓ |
| 53 | Shift+R reset | **добавлен гейт shouldBlockOrbit()** | ✓ |
| 54 | Диалоговые шоты | overShoulder/closeUp/twoShot, автосмена 3.6–4.5s | ✓ |
| 55 | Ease-back хендшейк | `camera:ease_back` → recenter | ✓ |
| 56 | Fade персонажа при близкой камере | отсутствует (в бэклоге AAA) | ✓ |

## Блок E. Игрок и локомоция (57–68)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 57 | RigidBody | kinematicPosition + CapsuleCollider + KCC | ✓ |
| 58 | Скорости | WALK 4 / RUN 7.2 / CROUCH 1.8 / BLOCK 2.5 м/с | ✓ |
| 59 | Стамина | спринт только при run+движение+нет крадусься/блока | ✓ |
| 60 | Койот-тайм | 0.2s, variable jump | ✓ |
| 61 | Деградация KCC | прямое перемещение + recreate ≤5 попыток | ✓ |
| 62 | Гистерезис анимаций | 0.6/0.15 м/с — нет фликера idle↔walk | ✓ |
| 63 | Шаги | speed-linked интервал, material-звуки, visibility-gate | ✓ |
| 64 | Hard brake | **исправлен ложный brake после телепорта (сцена-владелец записи)** | ✓ |
| 65 | Снапшот в горячем пути | **исправлен двойной getGameSnapshot()** | ✓ |
| 66 | Публикация позиции | `playerFramePrepare/finalizeFrame` | ✓ |
| 67 | Wall-bump шейк | есть | ✓ |
| 68 | Foot-IK/ragdoll | отсутствуют — в бэклоге AAA | ✓ |

## Блок F. Комбат (69–84)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 69 | Ядро | `CombatSystem.ts` (1773 стр.) — пошаговый оркестратор | ✓ |
| 70 | Формулы | `formulas.ts`: криты, комбо-множители, XP | ✓ |
| 71 | Враги | 1893 стр., 2 спец-атаки на тип, defeat barks | ✓ |
| 72 | Боссы | 3 фазы, i-frames, adds (`bossPhases.ts`) | ✓ |
| 73 | Баффы | `buffSystem.ts` | ✓ |
| 74 | RNG | сидированный `combatRng` | ✓ |
| 75 | Сложность | множители кредитов/урона | ✓ |
| 76 | 3D-слой | стелс-ИИ: конус зрения + wall-aware LOS 5Гц, leash, kiting, navmesh | ✓ |
| 77 | Энкаунтер | startEncounter → 820ms presentation beat → пошаговый бой | ✓ |
| 78 | Hazards | пресеты окружения, стресс-DoT, HUD-канал | ✓ |
| 79 | Hitbox/hitsphere в 3D | **отсутствует** — бой остаётся пошаговым (главный разрыв с ТЗ «реальный 3D-комбат»); архитектурный факт зафиксирован | ✓ |
| 80 | Комбо/поэмы-способности | `actions.ts` | ✓ |
| 81 | Победа | `computeVictoryRewards` чистая функция + dispatch | ✓ |
| 82 | XP-эмиссия | батчер → `fx:xp_gain` единственный канонический эмиттер; **убран дубль combat:victory в DamageNumberFloat** | ✓ |
| 83 | Audio combat | удары/блоки процедурные | ✓ |
| 84 | Отступление врагов | contact-lost grace, leash return | ✓ |

## Блок G. NPC и диалоги (85–96)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 85 | Реестр NPC | 52 NPC (12+14+8+18), алиасы legacy | ✓ |
| 86 | Патрули | waypoints у 16 NPC + patrolRadius | ✓ |
| 87 | Расписания | `npcSchedules.ts` + ScheduleEngine | ✓ |
| 88 | Головные看向 трекинг | headTracking + resume-задержка | ✓ |
| 89 | WoW-индикаторы `!/ ?` | бобинг, sprite pool | ✓ |
| 90 | Диалоговые узлы | ~602 узла, 18 источников merge | ✓ |
| 91 | Битые ссылки | **проверено рантайм-скриптом: 727 узлов, спорный хаб существует — ложная тревога**, граф цел | ✓ |
| 92 | Валидатор контента | `validate-content.ts`: 0 ошибок, 7 варнингов (дублирование флагов награды/цели — informational) | ✓ |
| 93 | Return-диалоги | 35 генерируемых mkReturn | ✓ |
| 94 | Деревья решений | варианты → репутация/карма/квесты | ✓ |
| 95 | Dice-роллы | `DialogueDiceRollDisplay` | ✓ |
| 96 | Bark-система | ambient/npcQuestBarks/idleMonologues | ✓ |

## Блок H. Контент: стихи/квесты/предметы (97–108)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 97 | Стихи | 46 (первые 18 = poem_1…poem_18, **не изменялись**); порядок массива ≠ order — учтено | ✓ |
| 98 | Реестр поэм | ручной `unifiedPoemRegistry` (46 дескрипторов) + дев-ассерты | ✓ |
| 99 | Квесты | 147 (31 main / 90 side / 2 hidden) | ✓ |
| 100 | Цели квестов | flag 315 / talk 83 / visit 67 / item 39 / poem 13 / minigame 8 | ✓ |
| 101 | Дубли ID квестов | 0 | ✓ |
| 102 | Ссылки quest→NPC/item | 0 битых | ✓ |
| 103 | Предметы | 131 (+5 questItems + stubs), категории оборудование/квест/книга/… | ✓ |
| 104 | Достижения | 68 (20 трофеев) | ✓ |
| 105 | Кат-сцены | 14 записей + arrival-таймлайны сцен | ✓ |
| 106 | Лор | loreEntries + loreSceneMap + thoughtCabinet | ✓ |
| 107 | Фракции | репутация = среднее relation членов (network/guild/resistance/neutral/tolpa), отдельного slice нет — зафиксировано | ✓ |
| 108 | POEMS_PER_ACT[6]=0 | дыра ритма сбора в акте 6 — зафиксировано в бэклоге | ✓ |

## Блок I. Store и состояние (109–116)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 109 | Фасад | gameStore над 10 сторами (zustand + subscribeWithSelector) | ✓ |
| 110 | Слайсы | 16 файлов: player×6, world, exploration, ui, cutscene, save, achievement, dialogueHistory, difficulty, thoughtCabinet, npcCodex | ✓ |
| 111 | Персист | Zod SavePayloadSchema; миграции saveMigrations | ✓ |
| 112 | Действия | `applyGameAction` диспетчер + батчи XP | ✓ |
| 113 | Quest store | QuestTracker + time limits | ✓ |
| 114 | TTL-флаги | activeTTLFlags | ✓ |
| 115 | Селекторы | кэш combinedState + crossSliceReads | ✓ |
| 116 | Snapshot cache | gameSnapshotCache + subscribe | ✓ |

## Блок J. UI/HUD (117–126)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 117 | Миникарта | 2D canvas, вращение с камерой, маркеры NPC/квестов, edge-clamp, M-сворачивание, IO-пауза | ✓ |
| 118 | Правая колонка | **перекрои устранены: топ-бар→сложность(48)→баффы(84)→миникарта(146)→квест-карта(348)→ачивки(570)** | ✓ |
| 119 | Discovery | **убран двойной попап (Toast+Celebration → только Celebration)** | ✓ |
| 120 | XP-каналы | **7 визуальных артефактов на одно событие → 2 (число у прицела + лента)** | ✓ |
| 121 | Достижения | **3 уведомления → 1 попап (+полноэкранная кат-сцена для трофеев)** | ✓ |
| 122 | WoW-фрейм героя | **создан и смонтирован PlayerStatusFrame (портрет+ЭН/СТР/КАР)** | ✓ |
| 123 | DifficultyIndicator | **мёртвая кнопка → открывает меню** | ✓ |
| 124 | QuickInventoryBar | **убран (дублировал QuickUseBar, перекрывал [E]-промпт и crafting-тосты)** | ✓ |
| 125 | Локализация | error-экраны канваса переведены на русский; остальное — русский, i18n-вынос в бэклоге | ✓ |
| 126 | Доступность | FocusTrap/AriaLive/ColorBlind/не тронуты; KarmaHudMeter остался доступным для переиспользования | ✓ |

## Блок K. Аудио (127–130)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 127 | SharedAudioContext | один AudioContext, user-gesture, suspend/resume; двойной registerTabVisibility — no-op | ✓ |
| 128 | AudioEngine | 2261 стр. процедурных SFX/spatial/reverb; decodeAudioData отсутствует → фризов декодинга нет | ✓ |
| 129 | MusicEngine | 3 слоя, duck, act-mood; setInterval-джиттер под нагрузкой — в бэклоге (lookahead-планировщик) | ✓ |
| 130 | AmbientEngine | **кэш noise-буфера вместо синтеза на каждый кроссфейд** | ✓ |

## Блок L. Сборка, деплой, перф-политика (131–132)

| № | Этап | Результат | Статус |
|---|------|-----------|--------|
| 131 | Сборка | `vite build` ✓ 37s; бюджетная политика; `build:vercel` prune недостижимых ассетов; физический чанк 829КБ gzip — осознанный cost (fallback resilience, документирован) | ✓ |
| 132 | Vercel | rewrites/headers/CSP/кэш корректны; SW↔rewrites конфликтов нет; edge-функции api/ с кэшем и rate-limit | ✓ |

---

## Итоговые метрики проверки (после правок)

| Проверка | Результат |
|---|---|
| `tsc --noEmit` | **0 ошибок** |
| `eslint` (все изменённые файлы) | **0 нарушений** |
| `vitest` (затронутые подсистемы) | **245+ тестов зелёные** (43 файла компонентов/стора + 3 файла движка + 5 frame/EventBus) |
| `vite build` | **успех, 37.4s**, бюджеты соблюдены |
| `validate-content.ts` | **0 ошибок** |

## Что сознательно НЕ тронуто (и почему)

1. **Первые 18 стихов** (`src/data/poems.ts`, poem_1…poem_18) — прямое требование ТЗ.
2. **Inline-base64 Rapier** — осознанный fallback: стрип экономит 829КБ gzip лени-чанка, но ломает инициализацию физики при недоступности внешнего WASM. Задокументировано в `rapierCompat.ts`.
3. **Пошаговый комбат** — перевод в реал-тайм 3D требует новых hitbox-систем, анимационных окон урона и баланса всех 52 NPC/врагов; это отдельный проект, а не патч. Архитектура (события, презентационный бит, hazards) уже готова к миграции.
4. **4 toast-системы / 2 DialogueHistoryPanel** — консолидация затрагивает ~20 панелей; рискованно в одном проходе, зафиксировано в бэклоге.
