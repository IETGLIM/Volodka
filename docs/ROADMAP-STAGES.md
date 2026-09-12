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
- [ ] 98. Persistent EffectComposer между сценами (убрать stall 250–2000мс на переходах)
- [x] 99. Выборочная интерполяция динамических физтел (сейчас interpolate=false глобально)
- [ ] 100. Фасад-стор: точечные подписки HUD вместо useGameStore-фасада
- [x] 101. `useWorldClock`: dirty-check NPC-стейтов перед записью в стор
- [x] 102. DPR: O(n) среднее → инкрементальная сумма
- [x] 103. Патрули: `path.shift()` O(n) → индексный курсор
- [ ] 104. Холодные интервалы (useCityNews/useWorldClock/панели) → единый UI-clock
- [x] 105. Budgets-отчёт: прогнать `check-bundle-budgets --report`, зафиксировать цифры
  - Зафиксировано 2026-09-12 (v4.24.0): boot 624.5/634.8 KB gzip (hard max),
    game-start 1326.6/1757.8 KB, кумулятив до первой сцены 1951.1 KB,
    ленивый ярус (Rapier) 1565.4 KB, весь JS gzip 3607.0 KB, entry CSS 133.4 KB,
    WebGL-стек (three+r3f+drei) 270.1 KB ≈ 20% game-start.
- [ ] 106. Профилировка LCP загрузки (perf-marks уже есть)
- [ ] 107. Дедуп DOM-подписок в оркестраторе (13 setTimeout в useGameLifecycleManager)
- [ ] 108. GC-давление фасада: мемоизация combined-объекта по полям

## Фаза 7. Контент и локализация (109–118)
- [x] 109. Аудит русских строк HUD — непереведённого нет
- [x] 110. Мёртвые `audioCue` (`sounds/npc/*.ogg`) в `data/chkTolpa/npcs.ts` — удалены
- [ ] 111. Новый квест №155 (исследование: «Эхо пирса»)
- [ ] 112. Новые предметы (3–5) с русскими описаниями
- [ ] 113. Новый лор (3–4 записи, связанные с новыми квестами)
- [ ] 114. Расширение диалогов (возвратные реплики для новых NPC)
- [ ] 115. Вынос HUD-строк в файл локализации
- [ ] 116. Вычитка терминологии (карма/репутация/стресс — единообразие)
- [ ] 117. Кодекс: перекрёстные ссылки новых записей
- [ ] 118. Баланс наград новых квестов (прогнать валидатор и reachability)

## Фаза 8. Сборка/деплой (119–126)
- [x] 119. `--mode analyze`: подключён rollup-plugin-visualizer (dist/stats.html)
- [x] 120. `.vercelignore`: удалена мёртвая запись `public/models/khronos/`
- [x] 121. WebGL2-гейт: русское сообщение вместо чёрного экрана
- [ ] 122. CI: добавить `budgets:check` + `verify:deploy` после build
- [ ] 123. NPC-варианты: исключить `.meshopt.glb` из keep-set, если не выбран пресетами (−15–20 MB)
- [ ] 124. Текстуры → KTX2 (инфраструктура basis/ уже в деплое)
- [ ] 125. `menu/cinematic_night_plate.png` (1.2MB) → WebP
- [ ] 126. `.nvmrc` (pin Node 22 = CI)

## Фаза 9. Документация и финал (127–132)
- [x] 127. Реестр этапов (этот файл)
- [x] 128. README: раздел «Что нового» + сборка/деплой актуализированы
- [x] 129. ARCHITECTURE: дополнен (HUD-слоты, гейт осмотра, DPR/погодные оптимизации)
- [x] 130. CHANGELOG: v4.22.0
- [x] 131. Атомарные коммиты (fix/feat/perf/chore/docs) + push в origin/main
- [x] 132. Финальная сверка Vercel-конфигурации и бюджетов

---

## Правила продолжения (для следующих сессий)
1. Не дублировать выполненные этапы — statuses выше источник истины.
2. Приоритет очереди: 85–92 (UI-слоты) → 97–104 (перф) → 111–118 (контент) → 122–126 (сборка).
3. Перед контентом: `npm run validate:content && npm run validate:act1-extended`.
4. После каждого этапа: атомарный коммит (русский, `feat:/fix:/perf:/docs:/chore:`), периодический push.
5. Ограничения неизменны: без dev-сервера; poems.ts:1–18 не трогать; всё видимое — на русском.
