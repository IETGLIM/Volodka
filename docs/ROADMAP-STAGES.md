# Дорожная карта работ — реестр этапов (минимум 132)

Методология: работа ведётся поэтапно, контекст сохраняется между сессиями.
Статусы: `[x]` — выполнено, `[~]` — частично, `[ ]` — план (очередь для следующих сессий).
Изучение кодовой базы ведётся исключительно по коду (README/ворклоги не используются как источник истины).
Ограничения: не запускать dev-сервер; проверка — статический анализ (tsc/eslint/валидаторы/vitest); все видимые строки — русский; `src/data/poems.ts` poem_1–18 — не редактировать (авторские).

---

## Фаза 0. Подготовка (1–8)
- [x] 1. Клонирование репозитория IETGLIM/Volodka (частичный клон без лишних blob)
- [x] 2. Доступ к GitHub через `GITHUB_TOKEN` из файла вне репозитория (токен не в config/log)
- [x] 3. Инвентаризация структуры: 444 217 строк в `src/` (components 145k, data 110k, engine 103k, store 11k, config 10k, hooks 9k)
- [x] 4. Метрики по модулям: крупнейшие файлы (triggerZones 9211, act5.structure 3087, AudioEngine 2261…)
- [x] 5. Установка зависимостей (`npm install`, 652 пакета) для статического анализа
- [x] 6. Аудит истории: коммит-стиль `feat:/fix:/docs:/chore:/perf:` на русском, версия 4.21.0
- [x] 7. Аудит конфигов: vite.config.ts, vercel.json, ci.yml, tsconfig, budgets
- [x] 8. Создание настоящего реестра этапов

## Фаза 1. Экспертное изучение UI/HUD (9–28)
- [x] 9. Карта HUD: `hud/ExplorationHUD.tsx` + `orchestrator/OrchestratorGameplaySections.tsx` (~60 виджетов)
- [x] 10. Диагноз бага «\n»: `NpcScheduleDisplay.tsx:316` — литеральный `\n` в JSX-тексте
- [x] 11. Правая колонка: миникарта(146–368) → квест-карта(374) ↔ день/ночь(372) — коллизия
- [x] 12. Нижний центр: 7+ независимых fixed-систем (тулбар 60/z41, тосты 96/z13, examine 196/z30, [E]-промпт 234/z11)
- [x] 13. Двойная система подсказок: `EnhancedCrosshairPrompt` ↔ `InteractionHintPopup` (`useHudProximityFxActive`)
- [x] 14. `ExaminePanel`: compact (акт 1) / cinematic (прочие), diegetic-паддинг
- [x] 15. `AudioVisualizer`: 280×80, rAF, фейковые данные без analyser, visible в useState (не persist)
- [x] 16. `hudLayout.ts`: слот-сетка есть, применяется частично (хардкоды `bottom-24`, `14vh`, `22vh`)
- [x] 17. Адаптивность: `hud-mobile-responsive.css` (940 строк), safe-area, `useIsMobileVisual`, touch-джойстик
- [x] 18. Z-модель: `shared/constants/uiLayers.ts` (HUD=10 … MOBILE_CONTROLS=42, PANEL=60)
- [x] 19. Токены: `styles/tokens.css` (OKLCH, cyber-cyan), `hud-filmic*.css`, ~100 css-файлов
- [x] 20. Миникарта `MinimapComponent.tsx` (1110 строк): canvas-ротация, маркеры, iOS safe-area
- [x] 21. Квест-трекер: `QuestObjectiveCard.tsx` (976) — truncate-обрезка заголовка при maxWidth 300
- [x] 22. `NpcScheduleDisplay.tsx` (325): расписание NPC, `left: RIGHT_INSET` (ошибка имени)
- [x] 23. `ExplorationHintsPanel.tsx` (286): «Неисследованные пути», тот же `RIGHT_INSET`
- [x] 24. `QuickAccessToolbar.tsx` + `quick-access-toolbar.css`: bottom 60px, z=41
- [x] 25. `StoryGuidanceHUD.tsx`: центральная цель + `PlayerLostHintToast` (bottom-24, z13)
- [x] 26. Топ-бар `SceneTopBarHud`: чипы сцены, KarmaTierBadge, KarmaRing, LevelBadge, CompassIndicator
- [x] 27. Уведомления: `HUDNotificationFeed` (top 66 left — конфликт с NpcScheduleDisplay top 66), `EventNotificationPopup` (top-center)
- [x] 28. Доступность: aria-live, reduced-motion-гейты, 44px touch-таргеты

## Фаза 2. Экспертное изучение движка (29–52)
- [x] 29. Рендер: `RPGGameCanvas.tsx` (937) — flat, ACES, PCFSoft, стабильная камера, singleton-фабрика GL
- [x] 30. Frameloop: demand в меню/скрытой вкладке/за story-оверлеем; keep-alive burst; CanvasFrameloopController
- [x] 31. Frame-бюджет: `FrameBudgetRegistry` (pre/post physics, pre/post render, soft-skip, критичные тики)
- [x] 32. Ввод: клавиатура-синглтон (WASD/стрелки/Shift/Ctrl/Space/E/X, ПКМ-блок), тач-джойстик, gamepad
- [x] 33. Движение: Rapier KCC, сабстепы, coyote-time, стамина, NaN-санитайз, degraded-fallback
- [x] 34. Камера: spring-стратегии (exploration/dialogue/combat/cutscene), орбита с инерцией, raycast-антиклиппинг (слой 5)
- [x] 35. Комбат реал-тайм: секторный замах, LOS, промахи, бэкстаб, добивание, память HP
- [x] 36. Комбат пошаговый: `CombatSystem.ts` (1795), генерационные таймеры, баффы, телеграфы спец-атак
- [x] 37. ИИ крипов: patrol/chase/kite/attack/cooldown/return, vision+LOS 5Гц, leash, nav-mesh
- [x] 38. Боссы: 5 боссов, фазы по HP-порогам (`bossPhases.ts`)
- [x] 39. Анимации: skinned-клоны, ретаргет Quaternius/Mixamo, crossfade 0.42s, локомоционный бленд
- [x] 40. `AudioEngine.ts` (2261): процедурный WebAudio, пул буферов, реверб-кэш, ducking, мылф-фильтр диалогов
- [x] 41. `MusicEngine.ts` (1758): lookahead-планировщик, 3 слоя, intensity-слои, per-act moods
- [x] 42. Эмбиент: 42 .ogg через HTMLAudio (вне WebAudio-графа — известный компромисс)
- [x] 43. Кат-сцены: 4 пресета + кинематик-таймлайны (`cinematicTimelineController`), скиппинг с ease-back
- [x] 44. Хазарды: 9 зон/9 сцен, световые столбы `ProximityGodRay`, предзонные аккумуляторы
- [x] 45. Погода/время: `weatherDirector`, `computeTimeOfDayLighting`, HDRI
- [x] 46. Сторы: фасад `gameStore` + 9 слайсов, rAF-batch фасада, селекторный слой
- [x] 47. `EventBus.ts` (465): приоритеты, капы 20/event, dispose/revive
- [x] 48. GPU: `disposeThreeResources` (398), `sceneGpuOwnership`, template-кэш NPC, texture-reuse
- [x] 49. Adaptive DPR: кольцевой буфер Float64Array, пороги 25/45, стабилизация 2 окна
- [x] 50. Утечки-таймеры: generation-гарды (Audio/Combat), Sets с cleanup — явных протечек нет
- [x] 51. Утечки-подписки: EventBus-капы, storeBindings rAF-flush — ок
- [x] 52. Горячие пути: двойные 500мс интервалы HUD, 22мс интро-скрамбл, погода/кадр, DPR в demand — найдены

## Фаза 3. Экспертное изучение контента (53–64)
- [x] 53. Карта `src/data`: ~573 триггер-зоны, 154 квеста, ~660 диалогов, ~800 story-узлов, 46 стихов
- [x] 54. `poems.ts`: poem_1–18 — авторские (В. Лебедев), НЕ редактировать; канон 21+25 бонусных
- [x] 55. Квесты: 154 (дубликатов нет), 13 категорий валидации, типы целей flag/location/npc/item/poem/minigame
- [x] 56. Диалоги: skill-чеки white/red, karmaThresholds, гейты выбора (одежда, TTL, мысли), слияние паков
- [x] 57. Story: акты 1–7 (structures + texts JSON, `applyStoryTexts` fail-fast) + сателлиты + ЧК
- [x] 58. Фракции: 5 фракций, 7 тиров, репутация агрегируется из npcRelations
- [x] 59. Предметы: 131 (equipment 31, quest 30, misc 30, consumable 22, key 10, book 7, poem_fragment 2)
- [x] 60. Навыки: 7 trainable + дерево 34 узла + 45 перков
- [x] 61. Thought cabinet: 105 мыслей, MAX_EQUIPPED 3, пары исключения
- [x] 62. Лор: 108 записей, LORE_SCENE_MAP
- [x] 63. i18n: `i18n/messages/ru.ts` (45 ключей), английских строк в HUD не найдено — интерфейс полностью русский
- [x] 64. Валидатор: `contentPipelineValidator.ts` (900 строк, 17 групп) — статический, запускается через tsx

## Фаза 4. Экспертное изучение сборки/ассетов (65–76)
- [x] 65. vercel.json: build:vercel (vite build + prune), rewrites, CSP с wasm-unsafe-eval
- [x] 66. CI ≠ деплой: CI гоняет `vite build` без budgets/verify:deploy — разрыв зафиксирован
- [x] 67. Бюджеты: boot ≤650KB gzip, game-start ≤1.8MB, кумулятив ≤2.45MB, firstScenePlayable ≤5s
- [x] 68. `vite/chunks.ts` (~450 строк): vendor-тиры, data-бакеты по актам, ленивые panel/minigame
- [x] 69. public/ = 111 MB: models 78 (NPC 54), textures 14, hdri 13, sounds 3.5, rapier 1.6
- [x] 70. NPC: 19 × 3 варианта (none/draco/meshopt) + риги; байт-дубликатов нет (MD5-скан: 0)
- [x] 71. Текстуры: asphalt_02 7.7MB (2k-масштабы), HDRI moonlit_golf_2k 7MB
- [x] 72. Prune/verify: keep-set из манифестов; verify-deploy-assets НЕ в CI
- [x] 73. Сверка путей: 38 GLB и 42 OGG из кода существуют; битые — только `sounds/npc/*.ogg` (мёртвые данные chkTolpa)
- [x] 74. sw.js: app-shell + WASM + медиа, офлайн-режим
- [x] 75. Совместимость: es2022, нет WebGL2-гейта (риск чёрного экрана), touch/gamepad полные
- [x] 76. Загрузка: LoadingPipeline (boot→narrative→wasm→canvas→first frame), chunk-load recovery

## Фаза 5. Критические UI-фиксы (77–92)
- [x] 77. Фикс «\n» в `NpcScheduleDisplay.tsx:316`
- [x] 78. Слот дня/ночи → под квест-картой (`explorationDayNightTopPx` = achievementCardSafeTopPx)
- [x] 79. Новые слоты `bottomCenterHintPx`/`bottomCenterHintSecondaryPx` для тостов-подсказок
- [x] 80. Реактивный гейт осмотра (`useExamineOverlayOpen`) — скрывает [E]-промпт/кроссхейр-промпт/подсказки при открытом осмотре
- [x] 81. Трекер квеста: заголовок 2 строки + полная полоса прогресса + title-атрибут
- [x] 82. AudioVisualizer: persist видимости/режима, компактный размер, честный idle без фейк-данных
- [x] 83. `LEFT_INSET` в hudLayout; NpcScheduleDisplay/ExplorationHintsPanel переведены на него
- [x] 84. Статический анализ после фиксов (tsc + eslint + validate:content)
- [x] 85. Регресс-тест: линтер-правило на литеральные `\n` внутри JSX-текста
- [x] 86. Мобильная ревизия нижнего стека (джойстик/кнопки/тулбар)
- [x] 87. `FirstMinutesDirector` (`bottom-[14vh]`) → слот-сетка
- [x] 88. `CriticalStatusWhisper` (`clamp(118px,16vh,176px)`) → слот-сетка
- [x] 89. `AaaImmersiveGuide` (`bottom-[22vh]`) → слот-сетка
- [x] 90. `EmergencyHelpButton`/`AmbientSoundMixer` — ревизия правого нижнего угла
- [x] 91. Консолидация UI-тиков кулдаунов (интервалы останавливаются при простое)
- [x] 92. Скрипт-аудит слотов (детектор коллизий прямоугольников HUD-виджетов)

## Фаза 6. Производительность (93–108)
- [x] 93. Кулдаун-тики HUD: интервал умирает, когда кулдаунов нет (было: вечные 500мс ре-рендеры)
- [x] 94. Интро-скрамбл: setInterval(22мс) → rAF с капом ~45Гц (меньше jank на дорогом первом экране)
- [x] 95. `useDynamicDPR`: замер suspend'ится в demand-режиме (меню/оверлеи) через опцию `enabled`
- [x] 96. Погодный множитель скорости: кэш по квантованному ключу вместо расчёта каждый кадр
- [x] 97. Крипы: LOS/страйк-репорты по дистанционному LOD (расширить npcRenderTier на AI-тик)
- [x] 98. Persistent EffectComposer между сценами (убрать stall 250–2000мс на переходах) — ЗАКРЫТ v4.29.0
  - v4.28.0 дал план; v4.29.0 реализовал: дети композера — фиксированный
    суперсед пассов с КОНСТАНТНЫМИ props (args-мемо обёрток пересоздаёт эффект
    при любом изменении props), дети — useMemo по структурному ключу
    (lite/full, тир, reduced-motion, godrays-ready, agx, vignette) — смена
    сцены НЕ пересобирает детей; композер ремaунтится только при смене
    renderer'а (key = glInstanceKey). Все пер-сценные вариации — императивно:
    новый чистый resolveScenePostFxProfile (SCENE_*-таблицы переехали из
    ExplorationPostFX; фолбэки derived-сцен сохранены байт-в-байт) +
    applyScenePostFx (сеттеры Bloom/Vignette/HueSaturation/BrightnessContrast/
    ChromaticAberration/ToneMapping, pass.enabled N8AO/SMAA/GodRays, LUT-swap:
    LUT-пасс живёт постоянно на нейтральной identity-текстуре, пер-сценные
    kind'и — effect.lut = texture, без redefine — все LUT 16³ UnsignedByte).
    Применение: на монтировании + на scene:transition_start (targetSceneId,
    под визиром SceneTransitionVeil, до записи сцены в стор) + на смену
    настроек. Стресс/энергия/поэм-буст — покадровый тик (getState — ноль
    store-подписок на рендер), soft-budget гейты N8AO/GodRays — в тике при
    изменении. GodRays: персистентный sun mesh вне детей композера, позиция/
    цвет/visible — императивно по sceneId (GODRAYS_SUN_CONFIG переехал в
    профили). MotionBlurEffect: cutscene-гейт читается из стора в тике
    (без пропа). pipelineKey удалён. Unit-тесты: scenePostFxProfiles (9,
    точные значения таблиц/фолбэки/фриз) + applyScenePostFx (18: хелперы,
    lite-parity, pass.enabled, слитые пассы не трогаются). Найден и
    задокументирован исторический no-op: ToneMappingEffect в postprocessing
    6.39 не имеет exposure — проп exposure ничего не делал; поведение
    сохранено, значения SCENE_TONE_EXPOSURE живут в профиле ради будущего
    включения.
- [x] 99. Выборочная интерполяция динамических физтел (сейчас interpolate=false глобально)
- [x] 100. Фасад-стор: точечные подписки HUD вместо useGameStore-фасада
  - v4.27.0 (волна 1): инвентаризация показала — «голых» useGameStore() в HUD
    уже 0; оставшийся бандл — 12-полевой useHUDControllerState (7 потребителей).
    Удалён: SceneTopBarHud → useProgressionSummary (memo-виджет больше не
    ре-рендерится на погоду/энергию), HUDChromaticEdge → useScreenEffectsVitals,
    RainScreenEffect/SceneAmbientVignette → useHUDExploration, useContextualHints
    → useVitalStats + useCurrentSceneId, корень useHUDController → 3 узкие
    подписки (мёртвое collectedPoems убрано). HudAmbientOverlay /
    AmbientAtmosphereCaption / GameStatsDashboard — по одному shallow-бандлу
    вместо 3/5/6 отдельных; ProximityWhisperOverlay — мёртвые подписки удалены.
    Контракт-тест hudSelectors.test.ts (бандл не вернётся, shallow-стабильность
    React #185). Волна 2 (v4.28.0, закрыта): новые бандлы
    selectQuickUseHotbarState (QuickUseBar + MobileActionButtons: 6 подписок → 1)
    и selectMinimapHudState (MinimapComponent: 4 подписки → 1, фильтр активных
    квестов — useMemo в компоненте по контракту ссылочной стабильности);
    useMiniMapState без мёртвого playerRotation (ре-рендер SceneContextChip и
    MinimapComponent на телепортах); CompassHUD — raw useGameStore →
    useCurrentSceneId. Полный vitest 2666/2666.
- [x] 101. `useWorldClock`: dirty-check NPC-стейтов перед записью в стор
- [x] 102. DPR: O(n) среднее → инкрементальная сумма
- [x] 103. Патрули: `path.shift()` O(n) → индексный курсор
- [x] 104. Холодные интервалы (useCityNews/useWorldClock/панели) → единый UI-clock
  - v4.25.0: императивный `onUiTick` в useUiTick; переведены useWorldClock (60с),
    useCityNews (поллер 3,5 мин — без вызовов в скрытой вкладке), useWeatherEffects
    (1с + 10с), useHudQuiet (1с). Фиксы: гард периода ≤0 (busy-loop) и утечка
    visibilitychange-листенера. Тесты onUiTick (4).
- [x] 105. Budgets-отчёт: прогнать `check-bundle-budgets --report`, зафиксировать цифры
  - Зафиксировано 2026-09-12 (v4.24.0): boot 624.5/634.8 KB gzip (hard max),
    game-start 1326.6/1757.8 KB, кумулятив до первой сцены 1951.1 KB,
    ленивый ярус (Rapier) 1565.4 KB, весь JS gzip 3607.0 KB, entry CSS 133.4 KB,
    WebGL-стек (three+r3f+drei) 270.1 KB ≈ 20% game-start.
- [x] 106. Профилировка LCP загрузки (perf-marks уже есть)
  - v4.25.0: lcpProfiler (PerformanceObserver, buffered:true, тихое отключение в
    средах без поддержки); DEV-лог LCP рядом с first-scene-playable в LoadingTimeline.
- [x] 107. Дедуп DOM-подписок в оркестраторе (13 setTimeout в useGameLifecycleManager)
  - v4.25.0: KeyedTimeoutScheduler (schedule/cancel/disposeAll, дедуп по ключу);
    12 «голых» setTimeout переведены; хвосты больше не срабатывают после unmount.
- [x] 108. GC-давление фасада: мемоизация combined-объекта по полям
  - v4.25.0: переиспользуемые буферы ссылок слайсов (storeBindings) и ключа
    снапшота на 44 поля (gameSnapshotCache); замороженные EMPTY_* вместо
    «?? []»; кэш-попадания без аллокаций, семантика сравнения не изменена.

## Фаза 7. Контент и локализация (109–118)
- [x] 109. Аудит русских строк HUD — непереведённого нет
- [x] 110. Мёртвые `audioCue` (`sounds/npc/*.ogg`) в `data/chkTolpa/npcs.ts` — удалены
- [x] 111. Новый квест №155 (исследование: «Эхо пирса»)
  - v4.25.0: ep_pier_echo (акт 2, Трофим → тихий маршрут → прослушивание → Ритка);
    6 story-нод (pierEchoStory.ts), пак 'pierEcho' в buildStoryNodes +
    narrativePackRegistry (паритет статик/рантайм), хук в trofim_greeting +
    возвратная реплика; reachability: 0 недостижимых. Тест пака (8).
- [x] 112. Новые предметы (3–5) с русскими описаниями
  - v4.25.0: ep_tape_echo (quest_item), ep_glass_float (misc, стресс −3),
    ep_pier_postcard (misc), ep_lantern_battery (consumable, энергия +20).
- [x] 113. Новый лор (3–4 записи, связанные с новыми квестами)
  - v4.25.0: lore_pier_echo, lore_trofim_watchman, lore_glass_floats,
    lore_pier_nineteenth — обнаружение через discoverLore-эффекты нод квеста.
- [x] 114. Расширение диалогов (возвратные реплики для новых NPC)
  - v4.25.0 (частично): возвратная реплика Трофима для продолжения цепочки «Эха пирса».
  - v4.26.0 (закрыт): пост-квестовые возвратные реплики — Ритка «четвёртый голос»
    (greeting + пирсовый return, мини-узел chk_ritka_fourth_voice_echo), Трофим
    (trofim_echo_afterword), Баба Зина (baba_zina_box_afterword), Марат-эхо
    (marat_echo_server_afterword); все одноразовые (missingFlag-гарды),
    validate:content = 0, reachability/parity 34/34.
- [x] 115. Вынос HUD-строк в файл локализации
  - v4.26.0 (волна 1): 159 строк через t(key, fallback) из src/i18n — 113 статических
    ключей hud.* в messages/ru.ts + 46 динамических (ключи-константы вне каталога,
    чтобы не перебивать интерполяцию); 12 постоянных HUD-виджетов + toast-слой +
    karmaTier; контракт-тест ru.hudCoverage.test.ts (каждый hud.*-ключ в каталоге).
  - v4.27.0 (волна 2): плейсхолдеры {name} в t(key, fallback, params) — 11 динамических
    ключей (toast-билдеры, aria PlayerStatusFrame) переведены в каталог-шаблоны.
  - v4.28.0 (волна 3): +109 ключей каталога — WeatherIndicator, DayNightCycleIndicator
    (дедуп двойной таблицы фаз), CompassHUD (буквы + aria-направления),
    MinimapComponent (+ labelKey в minimapZoomSetting), QuickUseBar, MobileActionButtons,
    AaaImmersiveGuide (31 строка внутреннего голоса). Попутный fix: имя навыка в тосте
    хотбара — из каталога hud.skill.name.* вместо сырого ключа («writing +2» → «Письмо +2»).
  - v4.30.0 (волна 4): финализация — 35 динамических вызовов в 10 файлах переведены
    на литеральные ключи каталога-шаблонов (t('hud.*', fallback, params)); карты
    ключей-констант удалены (включая волны 2: toast-билдеры, aria PlayerStatusFrame —
    итого 46 вызовов); контракт-тест поднят до ≥220 ключей и автоматически проверяет
    все шаблоны; остаточные ключи-переменные (union-карты, ambient.*) задокументированы.
- [x] 116. Вычитка терминологии (карма/репутация/стресс — единообразие)
  - v4.26.0: инвариант подтверждён (игрок — «Карма», фракции — «Репутация фракции»,
    «Стресс» без синонимов); исправлен дефект двойного знака у отрицательной кармы
    («Карма +-15» → «Карма -15»: questAcceptDialog, QuestsPanel, QuestObjectiveCard) +
    регресс-тест.
- [x] 117. Кодекс: перекрёстные ссылки новых записей
  - v4.25.0: relatedEntries внутри блока + на lore_great_crash_2029 и
    lore_city_ufa; условия обнаружения (discoveryCondition) на русском.
- [x] 118. Баланс наград новых квестов (прогнать валидатор и reachability)
  - v4.25.0: награды ep_pier_echo в коридоре тира акта 2 (55cr/4кармы/35XP,
    тест пака фиксирует коридор 40–60/3–5/0–50); validate:content = 0,
    validate:act1-extended = 0, reachability 0 недостижимых.

## Фаза 8. Сборка/деплой (119–126)
- [x] 119. `--mode analyze`: подключён rollup-plugin-visualizer (dist/stats.html)
- [x] 120. `.vercelignore`: удалена мёртвая запись `public/models/khronos/`
- [x] 121. WebGL2-гейт: русское сообщение вместо чёрного экрана
- [x] 122. CI: добавить `budgets:check` + `verify:deploy` после build
  - v4.26.0: оба шага добавлены в .github/workflows/ci.yml после build
    (без prune — контракт verify:deploy это позволяет); локально проверено.
- [x] 123. NPC-варианты: исключить `.meshopt.glb` из keep-set, если не выбран пресетами (−15–20 MB)
  - v4.26.0, находка: посылка этапа частично неверна — пресет «ultra» выбирает
    compression: 'meshopt' (qualityPresets.ts), значит NPC-варианты meshopt
    ВЫБИРАЮТСЯ пресетом. Фактический объём 19 файлов ≈ 12.0 MB (не 15–20).
  - v4.27.0 (закрыт): ultra переведён на draco (draco-пары есть для всех 19 NPC,
    героя и пропсов кафе; декодер draco/ уже в PRESERVED_PREFIXES); из
    assetManifest удалены meshopt-варианты npcCharacterAsset/player_volodka/
    env_cafe_props → из keep-set prune уходит 21 файл = 12.85 MiB деплоя.
    Проверено: build:vercel + verify:deploy OK (114 путей, dist 97.1 MB),
    budgets OK. «None»-GLB содержат EXT_meshopt — MeshoptDecoder остаётся
    подключенным (не трогать).
- [x] 124. Текстуры → KTX2 (инфраструктура basis/ уже в деплое)
  - v4.27.0, вердикт: клиентская инфраструктура готова заранее (KTX2Loader +
    setTranscoderPath('/basis/') + detectSupport в gltfPipeline.ts,
    basis_transcoder в деплое), НО энкодер (toktx/KTX-Software) недоступен:
    gltfProcess.mjs зондирует `ktx` и молча пропускает ETC1S-пасс, поэтому в
    GLB нет KHR_texture_basisu, а .ktx2-файлов в репо 0. Производство
    KTX2-ассетов возможно только в среде с KTX-Software; этап остаётся открытым
    до появления тула. Повторная проверка: при появлении toktx запустить
    gltf-process и расширить манифест.
  - v4.32.0 (ЗАКРЫТ): тулчейн установлен и верифицирован — KTX-Software 4.4.2,
    унифицированный `ktx` CLI; новый синтаксис `ktx create --format <VkFormat>
    --encode basis-lz --generate-mipmap in.png out.ktx2` заменил legacy
    `toktx --t2 --bcmp out.ktx2 in.png` (@gltf-transform/cli 4.4.1 спавнит
    `ktx create` внутри и требует >= 4.3.0 — зонд `command -v ktx` корректен).
    Найден и исправлен латентный баг пайплайна: команда `etc1s` ДЕКОДИРУЕТ
    KHR_draco_mesh_compression при чтении — прежний порядок (ETC1S поверх
    draco-варианта) молча лишил бы варианты сжатия геометрии (замер:
    13.9 → 19.2 KB). Новый порядок: copy → optimize → etc1s (по оптимизированной
    базовой копии lod0) → draco → meshopt → LOD; end-to-end проверено: с ktx draco-вариант
    несёт KHR_draco_mesh_compression + KHR_texture_basisu (image/ktx2), без ktx —
    прежнее поведение + подсказка установки 4.3+. Регенерация shipped-ассетов
    НЕ проводилась (обоснованное решение, инвентаризация): все 31 draco-вариант
    содержат ~0.1 MB текстур (NPC/герой/пропсы — изображение-заглушка без
    bufferView; интерьеры — 12K палитровые PNG, на которых ETC1S РАСТЁТ:
    11.8 → 16.4 KB из-за mip-цепочки), а интерьеры в манифесте шипят lod0
    `.glb`, не draco-варианты. Реальная цель KTX2 — внешние текстуры PolyHaven
    (14 MB) / HDRI (13 MB) → новый этап 133 (требует браузерной QA качества
    транскодинга).
- [x] 125. `menu/cinematic_night_plate.png` (1.2MB) → WebP
  - v4.26.0: PNG 1 218 655 B → WebP q90 170 576 B (−86%, −1.05 MB деплоя);
    POLYHAVEN_MENU_PLATE → .webp; tsc/build/budgets/verify:deploy — OK.
- [x] 126. `.nvmrc` (pin Node 22 = CI)
  - v4.25.0: .nvmrc с «22» — синхронизация локальной среды и CI (node-version 22).

## Фаза 9. Документация и финал (127–132)
- [x] 127. Реестр этапов (этот файл)
- [x] 128. README: раздел «Что нового» + сборка/деплой актуализированы
- [x] 129. ARCHITECTURE: дополнен (HUD-слоты, гейт осмотра, DPR/погодные оптимизации)
- [x] 130. CHANGELOG: v4.22.0
- [x] 131. Атомарные коммиты (fix/feat/perf/chore/docs) + push в origin/main
- [x] 132. Финальная сверка Vercel-конфигурации и бюджетов

## Фаза 10. Пост-реестровые follow-up (133+)
- [x] 133. Внешние текстуры → KTX2 (v4.34.0): diff/rough/ao всех 5 материалов
  PolyHaven закодированы basis-lz (21 файл, 7.22 MB; PSNR 49.4 dB — визуально
  прозрачно, встроенные mip-цепочки, 4 bpp в VRAM против 32 bpp RGBA8);
  нормали ОСТАВЛЕНЫ WebP по измерениям (ETC1S 30.1 dB — блочность бликов,
  UASTC 5.1 MB на одну 2k — 8bpp-пол; оба варианта отбракованы числами);
  HDRI не тронут (basis — 8-битный LDR, raw RGB16F — no-gain). Генератор
  scripts/generate-polyhaven-ktx2.mjs (ktx create 4.x, идемпотент,
  верификация по заголовкам); runtime — standalone KTX2Loader
  (src/engine/assets/ktx2Textures.ts), роутинг по расширению URL,
  WebP-фолбэк «всё или ничего», reset в GPU-жизненном цикле; keep-set на
  канонических списках, verify-deploy проверяет PolyHaven/HDRI (170 путей;
  раньше — дыра). FOLLOW-UP: первая браузерная QA KTX2-пути (тайлинг,
  нормали-блики, diagnostics при 404 ktx2) в среде с browser QA; после
  подтверждения — убрать WebP-фолбэк цветовых карт из keep-set (−11 MB
  деплоя).
- [x] 134. Волна стабилизации видимых дефектов (v4.33.0): по фидбеку игрока
  «текстуры/модели/движения» — 10 подтверждённых фиксов: NPC-«статуи»
  (useNPCAnimation cleanup только на анмаунт + rearmStoppedAction в
  useNpcLocomotionBlend); гейт-матчинг timeScale героя и NPC (замер
  естественных скоростей клипов 0.66/1.30 м/с); clipOverrides-ключ в bind
  (сон/сидение применяются); applySway без rotation.x (Z-up не падают);
  ambient-риги male_03/male_05/female_03 в keep-set prune + verify-deploy
  (117 путей) + per-figure ErrorBoundary; независимый тайлинг PolyHaven
  (клоны с общим Source); KTX2-гонка закрыта (импорт из
  configureGltfPipeline); SW media v3→v4; поправка инвентаризации v4.32.0
  (палитровые Kit-текстуры, не «0-байтовые заглушки»).

---

- [x] 135. Волна доказательных фиксов №2 (v4.35.0): по фидбеку «текстуры/
  масштабы/позиционирование/камера/музыка/модели/физика» — 6 подтверждённых
  дефектов: вечная Suspense-петля usePolyHavenPbr (use() с свежим промисом на
  каждый рендер — материалы PBR не появлялись вовсе; регрессия этапа 133);
  мёртвый ground-probe (membership в младших 16 битах interaction groups
  Rapier → рейкаст всегда мимо); drag-орбит без гейта shouldBlockOrbit во
  время диалогов/кат-сцен (мутированные yaw/pitch протекали в пост-катсценную
  позу); city_square без паритета с фикс-ом v4.14.0 street_night (лестницы
  12 м и баки 2.2 м, утопленные фонари — ground-anchor по измеренным minY);
  офисный терминал парил ~0.24 м над столешницей; VO мимо мастер-мьюта.
  FOLLOW-UP (нужны глаза/дизайн-решение): STREET_FACADE_SCALE рассчитан из
  неверной посылки «~3 м shell» — реальный натив 17 м даёт инстансы 30–41 м
  против процедурного силуэта 15–25 м (выбрать силуэт → пересчитать);
  тайлинг-джамп PBR↔фолбэк (concrete 5 vs 6; тротуар 5.5 vs 1.75×11);
  офисный стол 0.556 м vs deskHeightM 0.76; bench targetSizeM 2.05 м
  (скамья 1.56 м ростом); street_lamp_02 ниже игрока (1.28 м).

---

- [x] 136. Волна доказательных фиксов №3 (v4.36.0): закрыты все
  «измеренные-но-не-тронутые» пункты follow-up этапа 135 — решения по
  ИЗМЕРЕННЫМ нативам GLB (accessor min/max × node-TRS, рекурсивный обход
  нод, инвариант с методом этапа 135):
  STREET_FACADE_SCALE 1.78–2.38 → 0.88–1.18 — натив фасада 51.53×17.0 м,
  силуэт инстансов 15.0/17.5/20.1 м согласован с процедурным бэкдропом
  15–25 м (было 30–41 м высоты, до 123 м длины); фасадам street_night и
  city_square добавлен groundAnchor (натив minY −2.0 топил наземный этаж
  на −2.1…−4.76 м); street_lamp_02 ×1.0–1.05 → ×2.6 (1.28–1.35 м → ≈4.37 м,
  паритет с lamp_01 4.06 м; registry-путь уже был корректен — сломан был
  только manualScale-путь); скамьи: InstancedProp ×1.35/1.15/1.1 →
  ×1.0/0.95/0.9 и registry [2.05×0.88 width-fit] → [1.75×0.9 height-fit]
  (скамья 1.57 м ростом → 0.90 м, длина 1.17 м); тайлинг-прыжок PBR↔фолбэк:
  процедурный concrete 6 → 5 (= PBR DEFAULT_REPEAT), тротуарный фолбэк
  (repeat×0.35, ×2.2 = 1.75×11) → getPolyHavenRepeat (5.5 uniform) —
  единый источник UV-плотности (polyhavenAssets.getPolyHavenRepeat).
  НЕ тронуто (дизайн-вопрос, в очередь): офисный стол 0.556 м vs
  deskHeightM 0.76; анизотропная растяжка PBR-тротуара (тайл 1.09×7.27 м
  на плите 6×40) — нужна визуальная QA.
  Верификация: tsc (0), ESLint изменённых (0), vitest ПОЛНЫЙ 2731/2731
  (438 файлов), validate:content (0), build + budgets (OK).

---

---

- [x] 137. Прозрачность деплоя (v4.36.1): по жалобе «не заметно разницы»
  форензика прода показала — volodka.vercel.app раздаёт сборку на 132 коммита
  позади main (доказательства: прод-чанки содержат старые фасады hero:2.38,
  нет маркера ktx2:texture-loader-init, sw.js v2/v2), при этом Vercel-деплои
  на каждый push УСПЕШНЫ (GitHub Status API) — но уходят в preview
  (git-main домен под SSO), а production-домен не переключается. Код
  исправлен: fix(ci) — ci.yml триггер branches был повреждён до 'ain]'
  (CI не запускался вовсе), восстановлен; feat(build) — SHA коммита вшит
  в бандл (define __BUILD_SHA__), чип версии в меню показывает
  «v4.36.1 · sha» — несоответствие прод/main теперь видно без DevTools.
  ДЕЙСТВИЕ НА СТОРОНЕ VERCEL (вне репо): Promote to Production свежего
  деплоя и/или Settings → Git → Production Branch → main.


---

- [x] 138. Первая браузерная QA + два прод-фикса (v4.37.0): геймплейный
  прогон headless-браузером по собранному прод-артефакту (статический
  сервер с продовым CSP) и консоль владельца со свежего Vercel-деплоя.
  (а) React #185 «Maximum update depth exceeded» — краш всего HUD при входе
  в геймплей: useFactionReputation строил НОВЫЙ объект карты фракций на
  каждый вызов селектора (useShallow спасает только верхний уровень) →
  нестабильный getSnapshot useSyncExternalStore → бесконечный синхронный
  цикл (53 рендера DiegeticDialogueHUD → краш). Фикс: мемоизация по
  source-ref + инвалидация по refs флагов; +4 регресс-теста. (б) Физика
  Rapier на проде падала 4× EvalError CSP — embind требует динамический eval,
  'wasm-unsafe-eval' покрывает только компиляцию WASM; script-src дополнен
  'unsafe-eval' (+ manifest-src 'self'). В рантайме подтверждено: KTX2-путь
  жив (.ktx2 + транскодер 200, WebP-фолбэк не срабатывает — follow-up 133
  закрыт), GLB-модели грузятся, после фикса #185 — ноль ошибок прогона.
  FOLLOW-UP: снять WebP-фолбэк цветовых карт из keep-set (−11 MB); проверить
  физику на проде после деплоя (консоль без EvalError, ground-probe жив).

- [x] 139. «Музыка отсутствует» — два корневых дефекта аудио-шины (v4.38.0):
  (а) padGain создавался в 0 и никогда не взводился — пэд-слой (аккорды,
  основная масса музыки) молчал с v3.1.0 (git log -S: ramp не существовал
  никогда); (б) уровни шины −30…−48 дБ против SFX −17…−13 дБ — музыка
  неслышима на любом устройстве, игрок слышит только SFX и .ogg-эмбиенты.
  Фикс: ramp padGain 0→1 за 2 с; MUSIC_BUS_MAKEUP_GAIN ×6 (+15.6 дБ) в
  fade-in и applyVolume; лимитер (−6 дБ, 12:1) master→destination с
  корректным dispose; прод-маркер «[audio:music] bed …» для проверки
  владельцем в консоли. Эмбиент: AMBIENT_BUS_MAKEUP ×4 (+12 дБ) + фикс
  stale destination.gain при setVolume. +5 регресс-тестов (полный vitest
  2740/2740). FOLLOW-UP: живое прослушивание владельцем (баланс
  музыка/эмбиент/SFX — субъективная приемка); при запросе — пер-сценная
  ручная подстройка masterGain поверх makeup.

## Правила продолжения (для следующих сессий)
1. Не дублировать выполненные этапы — statuses выше источник истины.
2. Реестр закрыт (132/132, v4.32.0). Фаза 10: этапы 133–139 ЗАКРЫТЫ
   (включая первую браузерную QA, этап 138; аудио-реанимацию, этап 139).
   Очередь: живое прослушивание музыки владельцем (баланс после makeup ×6/×4),
   снятие WebP-фолбэка
   цветовых карт из keep-set (−11 MB; KTX2-путь подтверждён рантаймом),
   прод-проверка физики после CSP-фикса (консоль без EvalError),
   визуальная QA фиксов 135–136 (фасады/фонари/скамьи/тайлинг);
   далее — пер-сценная экспозиция ToneMapping, CoherentNoiseEffect,
   check-asset-manifest, вторая волна QTE-эмиттеров.
3. Перед контентом: `npm run validate:content && npm run validate:act1-extended`.
4. После каждого этапа: атомарный коммит (русский, `feat:/fix:/perf:/docs:/chore:`), периодический push.
5. Ограничения неизменны: без dev-сервера; poems.ts:1–18 не трогать; всё видимое — на русском.
