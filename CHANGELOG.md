## v4.34.0 (2026-09-13) — этап 133 закрыт: внешние карты PolyHaven → KTX2, политика кодирования по измерениям

### Сводка
Этап 133 (внешние текстуры → KTX2, открыт с v4.31) закрыт. Принцип волны —
доказательность: каждое решение о формате подтверждено измерениями
(ktx --compare-psnr/--compare-ssim), два «очевидных» варианта отбракованы
числами. Итог: diff/rough/ao всех 5 материалов PolyHaven — KTX2/Basis
(basis-lz, встроенные mip-цепочки, 4 bpp в VRAM против 32 bpp RGBA8), нормали
осознанно остаются WebP. Генератор идемпотентен и верифицирует выходы по
заголовкам KTX2; runtime — новый standalone KTX2Loader с роутингом по
расширению URL, WebP-фолбэком «всё или ничего» и сбросом в GPU-жизненном
цикле; keep-set переведён на канонические списки, verify-deploy закрыл дыру
(PolyHaven/HDRI раньше не проверялись). Верификация: tsc (0), ESLint
(0 errors, 58 legacy — базлайн), vitest ПОЛНЫЙ 2730/2730 (438 файлов),
validate:content (0), validate:act1-extended (0), vite build + budgets (OK),
prune 182 пути, verify:deploy 170 путей. poems.ts не тронут.

### feat(pipeline): генератор KTX2 с доказательной политикой
- `scripts/generate-polyhaven-ktx2.mjs` (npm run assets:polyhaven-ktx2):
  WebP→PNG раунд-трип (sharp, теперь прямая devDependency) → `ktx create`
  (синтаксис KTX-Software 4.x; старый `toktx --t2 --bcmp` удалён из 4.x;
  опция — `--uastc-quality`, не `--uastc-level`).
- Политика по типу карты ИЗМЕРЕНА (asphalt_02 2k, ktx 4.4.2):
  diff → basis-lz sRGB q200 (PSNR 49.4 dB, визуально прозрачно);
  rough/ao → basis-lz UNORM q191;
  nor_gl → WebP: ETC1S q255 даёт PSNR 30.1 dB / SSIM 0.81 (блочность бликов —
  отбраковка по качеству, подтверждено опасение ROADMAP), UASTC q2+RDO+zstd
  даёт PSNR 100 dB, но 5.1 MB на одну 2k (18.2 MB на 7 нормалей против
  4.0 MB WebP — отбраковка по размеру; RDO помогал слабо: 20.2→18.2 MB).
- 2-канальные нормали (--normal-mode) неприменимы — three-материалы ждут RGB.
- HDRI (13 MB) сознательно не тронут: basis — 8-битный LDR (потеря динамики),
  raw RGB16F KTX2 ≈ 12–16 MB против 7 MB RGBE (no-gain) — обоснование в
  ARCHITECTURE.
- Идемпотентность (skip свежих выходов, --force) + верификация каждого
  выхода по заголовку (магия KTX2, 1024/2048, mips ≥ 4,
  supercompressionScheme). Частичный набор = exit 1. 21 файл / 7.22 MB
  закоммичены (в CI/Vercel ktx CLI отсутствует — там скрипт не выполняется).

### feat(textures): standalone KTX2-путь в рантайме
- `src/engine/assets/ktx2Textures.ts`: собственный KTX2Loader (не делится с
  gltfPipeline — тот обслуживает GLB-встроенные текстуры): динамический
  import (транскодер ~571KB вне основного бандла), '/basis/',
  detectSupport(renderer) с перепроверкой при смене renderer'а; кэш промисов
  по URL (стабильные ссылки для React 19 use()).
- `usePolyHavenPbr`: drei useTexture → React 19 `use()`; роутинг по
  расширению (`.ktx2` → KTX2Loader, `.webp` → TextureLoader); конфигурация
  клонов v4.33.0 (независимый тайлинг, общий Source) сохранена — клон
  CompressedTexture шарит Source так же. Фолбэк «всё или ничего»: сбой
  KTX2-ветки перестраивает весь набор по WebP (событие в diagnostics),
  ошибка доходит до ErrorBoundary только при провале обеих веток.
- `gpuResourceLifecycle`: resetKtx2TextureLoader в teardown/HMR (воркеры
  транскодера, кэш промисов).
- `polyhavenAssets.ts`: канонические списки (POLYHAVEN_MATERIAL_IDS/MAP_KINDS/
  TEXTURE_SCALES) + POLYHAVEN_KTX2_MAP_KINDS = {diff, rough, ao} — смена
  политики = правка одного множества; getPolyHavenFallbackMapUrl (WebP) для
  фолбэка и keep-set. Тесты-контракт URL-роутинга (5 тестов).

### fix(assets): keep-set без дрейфа, verify-deploy без дыр
- prune-deploy-assets.ts: локальные копии списков заменены каноническими
  экспортами; WebP-фолбэк цветовых карт остаётся в деплое до первой
  браузерной QA KTX2-пути (staged rollout, после — −11 MB из деплоя).
  Prune: 182 пути (было 161, +21 KTX2).
- verify-deploy-assets.ts: внешние карты PolyHaven (KTX2+WebP) и 4 HDRI
  раньше вообще не проверялись в dist — теперь обязательны (170 путей,
  было 117); дрейф валит build, а не 404ит в рантайме.
- SW media-кэш не бампается (regex уже пропускал ktx2; webp-ключи остаются
  валидными, ktx2 — новые ключи).

## v4.33.0 (2026-09-13) — волна стабилизации видимых дефектов: анимации, модели, текстуры

### Сводка
Реакция на фидбек игрока «текстуры, модели, движения корректно не работают».
Три параллельных исследования (текстуры / модели / анимации) + runtime-проба
на реальных three.js-микшерах (вне репозитория) подтвердили 10 дефектов —
все исправлены. Ключевые: NPC замирали «статуями» через несколько секунд
после загрузки сцены (cleanup `useNPCAnimation` останавливал действия при
каждом прибытии отложенного клипа, а bind `useNpcLocomotionBlend` их не
перезапускал — подтверждено пробой isRunning:false); герой скользил ногами
(~8× на шаге, ~3.7× на беге — клипы Quaternius имеют естественные 0.66/1.30
м/с против скоростей тела 4/7.2 м/с, timeScale теперь гейт-матчится: hSpeed ÷
естественная скорость клипа); ambient-толпа на high/ultra в ПРОДЕ — 404 трёх
ригов (`male_03/male_05/female_03` выпиливались prune'ом) → чёрный канвас
«Ошибка 3D-движка» (keep-set дополнен пулом ригов + per-figure
ErrorBoundary + verify-deploy проверяет 117 путей); тайлинг PolyHaven-текстур
«плавал» между сценами (repeat мутировался на SHARED-инстансах кэша useTexture —
теперь конфигурируются клоны, шарящие Source без лишней VRAM); NPC «спали
стоя» (clipOverrides не влияли на bind) и Z-up-модели укладывались на землю
(applySway писал rotation.x в fit-группу); закрыта KTX2-гонка
(configureGltfPipeline стартует импорт транскодера сам) до этапа 133; SW
media-кэш v3→v4. Поправлена ошибочная инвентаризация v4.32.0: «0-байтовых
заглушек» нет — это палитровые Kit-текстуры по дизайну (0-байтовых изображений
в 149 GLB не найдено). Скорости движения и баланс НЕ менялись.
Верификация: tsc (0), ESLint (0 errors, 58 legacy — базлайн), vitest ПОЛНЫЙ
2725/2725 (437 файлов), validate:content (0), validate:act1-extended (0),
vite build + budgets (OK), prune 161 путь, verify:deploy 117 путей,
assets:validate (OK).

### fix(anim): NPC-«статуи», скольжение ног, расписание-позы, sway
- `useNPCAnimation`: cleanup со stop() всех действий — только на анмаунт
  хука (actionsRef-паттерн); identity-чurn объединённого actions больше не
  глушит играющие действия.
- `useNpcLocomotionBlend`: ветка «bindKey не изменился» ре-армит
  остановленные действия (rearmStoppedAction — play с сохранёнными весами);
  bindKey учитывает контент-ключ clipOverrides (sleep/sit/идл-варианты
  применяются при смене расписания); патрульный Walk получает гейт-матч
  1.2/0.66 ≈ 1.82.
- `playerLocomotionPresentation`: WALK/RUN_CLIP_NATURAL_MPS (замер по
  трекам Foot.L/R GLB) + resolveGaitTimeScale; resolveLocomotionClipState
  возвращает гейт-матченные walkTimeScale/runTimeScale; тест «timeScales
  constant» переписан под новый контракт.
- `usePlayerLocomotionController`: timeScale берётся из clipState (убраны
  старые формулы 0.42–1.05×/1.45×); NPC-толпа: AMBIENT_WANDER_MPS = 0.5 —
  единый источник для mover и клипа (0.5/0.66 ≈ 0.76).
- `npcProceduralLayers.applySway`: убрана запись root.rotation.x (для
  Z-up GLB fit.rotX = −π/2 укладывала NPC на землю).
- `playerMainMovement`: удалён мёртвый self-assignment scratch.groundY;
  `useNpcVisualBehavior`: setCurrentEmotion вынесен из useMemo в useEffect.

### fix(assets): ambient-риги больше не выпадают из деплоя
- `quaterniusRigCatalog`: AMBIENT_SKINNED_RIG_POOL + getAmbientSkinnedRigUrls
  (канонический пул; компонент импортирует из каталога).
- `prune-deploy-assets`: пул в keep-set (161 путь; stripped 27 файлов/9.6 MB
  вместо 30/11.7 MB); `verify-deploy-assets`: пул в обязательных путях (117)
  — дрейф реестра роняет сборку до деплоя.
- `AmbientSkinnedMidLod`: каждая фигура под ErrorBoundary (fallback null) —
  отказ одного GLB деградирует в отсутствие прохожего, а не в чёрный канвас.
- `public/sw.js`: MEDIA_CACHE_NAME v3→v4 (cache-first кэш моделей бампится
  при смене ассетов).

### fix(textures): независимый тайлинг PolyHaven у каждого потребителя
- `usePolyHavenPbr`: конфигурация (colorSpace/wrap/repeat/anisotropy)
  выполняется на клонах текстур (Texture.clone() шарит Source — одна GPU-
  загрузка); repeat больше не «гонки» layout-эффектов ~60 call-site'ов.

### fix(pipeline): KTX2-гонка закрыта до этапа 133
- `gltfPipeline`: configureGltfPipeline стартует динамический импорт
  KTX2Loader сразу (рандерер закэширован); исправлен неверный комментарий
  (GLTFLoader бросает исключение на basisu без KTX2Loader, а не молча
  фолбэкается на PNG).

### docs: поправка инвентаризации v4.32.0
- ARCHITECTURE: раздел «Инвентаризация текстур» дополнен поправкой —
  палитровые Kit-текстуры по дизайну, интерьеры 512×512 ~12 KB; без текстур
  только 8 сгенерированных пропсов. README/ROADMAP актуализированы.

## v4.32.0 (2026-09-13) — этап 124 закрыт: тулчейн KTX2, фикс порядка пассов ETC1S/Draco

### Сводка
Закрыт последний этап реестра (124, KTX2) — устранён блокер-тулинг:
KTX-Software 4.4.2 (унифицированный `ktx` CLI). Новый синтаксис `ktx create
--format <VkFormat> --encode basis-lz --generate-mipmap in.png out.ktx2`
заменил legacy `toktx --t2 --bcmp out.ktx2 in.png`; @gltf-transform/cli 4.4.1
спавнит `ktx create` внутри и требует KTX-Software >= 4.3.0 — пайплайн
совместим без изменений вызовов. Найден и исправлен латентный баг пайплайна:
команда `gltf-transform etc1s` декодирует KHR_draco_mesh_compression при
чтении, поэтому прежний порядок (ETC1S поверх уже-draco-варианта) молча лишил
бы варианты сжатия геометрии (замер на тестовом интерьере: 13.9 → 19.2 KB).
Новый порядок: copy → optimize → etc1s (по оптимизированной базовой копии
lod0) → draco → meshopt → LOD; draco-вариант несёт оба сжатия. End-to-end
проверено в обеих средах: с `ktx` — KHR_draco_mesh_compression +
KHR_texture_basisu (image/ktx2) вместе; без `ktx` — прежнее Draco-only
поведение с расширенной подсказкой (4.3+, синтаксис `ktx create`). Решение
НЕ регенерировать shipped-ассеты обосновано инвентаризацией: все 31
draco-вариант содержат ~0.1 MB встроенных текстур (NPC/герой/пропсы —
изображение-заглушка без bufferView; интерьеры — 12K палитровые PNG, на
которых ETC1S растёт: 11.8 → 16.4 KB из-за mip-цепочки), интерьеры шипят
lod0-`.glb`. Реальная цель KTX2 — внешние текстуры PolyHaven (14 MB) /
HDRI (13 MB) → открыт этап 133 (требует браузерной QA транскодинга).
Верификация: tsc (0), ESLint (0 errors, 58 legacy — базлайн), vitest ПОЛНЫЙ
2725/2725 (437 файлов), validate:content (0), validate:act1-extended (0),
vite build + budgets:check (OK), verify:deploy (114 путей),
assets:validate (OK). Реестр: 132/132.

### fix(assets): ETC1S-пасс до Draco — фикс потери сжатия геометрии вариантов
- `scripts/lib/gltfProcess.mjs`: ETC1S выполняется по оптимизированной
  lod0-базе ДО draco-пасса; draco-вариант собирается из etc1s-копии и несёт
  KHR_texture_basisu + KHR_draco_mesh_compression одновременно. При ошибке
  etc1s / отсутствии `ktx` — фолбэк на прежний Draco-only (non-fatal, временный
  файл чистится). Предупреждение об отсутствии тула расширено: KTX-Software
  4.3+, унифицированный `ktx` CLI, синтаксис `ktx create`. Обновлены шапочные
  комментарии пайплайна (порядок пассов, документация нового синтаксиса).

### docs: реестр 132/132, открыт follow-up этап 133 (внешние текстуры → KTX2)
- ROADMAP-STAGES: 124 → [x] с вердиктом тулчейна и инвентаризацией текстур;
  новая «Фаза 10» с этапом 133 (PolyHaven/HDRI → KTX2: подмена загрузчика,
  политика кодирования по типу карты, браузерная QA); «Правила продолжения»
  актуализированы (приоритет очереди — этап 133 + приоритеты worklog).
- ARCHITECTURE: раздел v4.32.0 (тулчейн KTX2, питфолл «etc1s декодирует
  Draco», обоснование отказа от регенерации). readme: «Текущее состояние»
  v4.32.0. Версия 4.32.0 (package.json + lock).

## v4.31.0 (2026-09-13) — контентный слой QTE: событийные триггеры, мобильная адаптация оверлея

### Сводка
Подсистема QTE (v4.30) перестала быть dormant: qte:start теперь эмитят
сценарные источники. (1) Хак-гейт терминалов — декларативное поле
`TriggerZone.linkedQte`: перед миниигрой взлома игрок стабилизирует канал
(QTE, клавиша E); успех — +2 XP, провал не блокирует взлом (помехи + glitch,
без soft-lock квестовых зон); поле нет или экран занят — миниигра открывается
сразу (прежнее поведение). Включено на 4 терминалах с нарастающей сложностью
(room_terminal easy 3000 мс → basement_entry_terminal hard 1900 мс).
(2) Финишер-усилитель — после реал-тайм добивания крипа с шансом 0.65 и
куладауном 25 с запускается бонусный QTE «фиксация протокола» (пробел):
успех — +3 XP и karma-уведомление. (3) Новое событие `qte:closed` — хост
сигналит «оверлей полностью ушёл с экрана» (cancelled — сразу, остальные —
после экрана результата), миниигра хак-гейта открывается по нему — устранено
наложение терминала на экран результата QTE. Контексты сессий —
дискриминированное объединение с FIFO-капом, чистка на closed. Фикс из
тестов: кулдаун финишера инициализирован нулём — при малом performance.now()
первое добивание первых 25 секунд страницы молча блокировалось; теперь
инициализация в «прошлое». Стиль (мандат деталей): мобильная адаптация
QTE-оверлея — TOUCH_SIZES (кольцо 160→124, клавиша 80→64, трейл 48→40),
safe-area-пады корня (notch-устройства), экранная кнопка отмены 44px для
тача с подсказкой «Крестик — отмена». Верификация: tsc (0), ESLint
(0 errors, 58 legacy — базлайн), vitest ПОЛНЫЙ 2725/2725 (437 файлов,
+15: 13 qteTriggers + 2 хост qte:closed), validate:content (0),
validate:act1-extended (0), vite build + budgets:check (OK).

### feat(qte): событийные триггеры — хак-гейт linkedQte, финишер, домен qte:closed
- `engine/events/qteEvents.ts`: +`qte:closed` (QteClosedPayload) — «экран
  свободен» в отличие от qte:resolve («логика наград»); хост эмитит в обоих
  путях закрытия (cancelled — сразу, результат — после hold 1600 мс).
- `engine/qte/qteTriggers.ts` (волна контентного слоя): startQteMinigameGate
  (гейты: linkedQte есть + экран свободен; фолбэк — minigame:open напрямую),
  handleCreepFinished (шанс 0.65, кулдаун 25 с, инициализация в «прошлое»),
  двухфазная оркестрация resolve→closed, дискриминированный контекст
  hack_gate|finisher, FIFO-кап 16 контекстов, идемпотентные
  attach/detachQteTriggerListeners.
- `data/triggerZones.ts`: тип `linkedQte` (type-only импорт QTEEventType/
  QTEDifficulty из engine/qte — прецедент cutscenes.ts) + данные на 4
  терминалах; `InteractionController.triggerLinkedContent` маршрутизирует
  через startQteMinigameGate (без linkedQte — поведение прежнее).
- `QuickTimeEventTriggers.tsx` — маунт-компонент (null-рендер) рядом с
  QuickTimeEventHost в GameplaySharedEffects.
- Тесты +15: qteTriggers.test.ts (13: фолбэки, гейты, награды/помехи,
  cancelled, чужие сессии, повторный closed, шанс/кулдаун/RNG-промах,
  detach) + QuickTimeEventHost.test.tsx (+2: closed при отмене сразу,
  closed после экрана результата ровно один раз).

### style(qte): мобильная адаптация оверлея (тач-размеры, safe-area, кнопка отмены)
- `QuickTimeEventOverlay.tsx`: useMobileDetection → TOUCH_SIZES (кольцо
  160→124, клавиша 80→64, трейл 48→40, hold-полоса 40→32) — QTE влезает в
  узкие экраны, не перекрывая мобильный HUD; safe-area-пады корня
  (env(safe-area-inset-*)); экранная кнопка отмены 44px (top/right с
  safe-area-отступом, onPointerDown-stopPropagation — тап не считается
  вводом), подсказка «Крестик — отмена» на таче.

## v4.30.0 (2026-09-13) — фича QTE (запуск подсистемы), i18n волна 4, HUD-детали стиля, −13 MB мёртвых ассетов

### Сводка
Крупнейшая фича со времён этапа 98: orphan-компонент QuickTimeEventOverlay
(1078 строк, существовал с июля, но никогда не монтировался) переработан и
подключён как полноценная игровая подсистема. Исправлены все P0 из аудита:
60 FPS-setInterval с ре-рендером поддерева каждый тик → 10 Гц-тик с
framer-интерполяцией кольца; перерегистрация window-keydown на каждый инпут
→ одна регистрация на сессию (refs-зеркала); перезапуск сессии от
нестабильных пропсов → сброс только по isActive; hold через OS-автоповтор →
keydown/keyup + тик (работает и на таче); e.repeat больше не считается за
нажатия; stale-check hold-успеха; мёртвый код; магический делитель «+10»
кольца mash → targetPresses. Новое: тач-прохождение (тап/удержание пальцем),
Escape-отмена (результат «cancelled» стал достижим), aria-live на результате,
подсказка «Esc — отмена», pointer-events-auto на корне. Инфраструктура:
EventBus-домен qte:* (qte:start/qte:resolve), хост QuickTimeEventHost с
гейтами занятости экрана (молча пропускает start при активном
диалоге/кат-сцене/миниигре/осмотре) и локомоция-гейтом
setQteLocomotionGate (WASD/прыжок/взаимодействие заморожены на время QTE),
6 выделенных SFX-пресетов qte_* вместо деградации в «click». Монтаж — в
GameplaySharedEffects (паттерн PoemRevealHost). Прогресс реестра: 131/132
(124 — блокер-тулинг: toktx в среде по-прежнему нет). Верификация: tsc (0),
ESLint (0 errors, 58 legacy — базлайн), vitest ПОЛНЫЙ 2710/2710 (436 файлов,
+17: 12 оверлей + 5 хост), validate:content (0), validate:act1-extended (0),
vite build + verify:deploy (114 путей) + budgets:check (OK).

### feat(qte): подсистема быстрых событий — запуск (домен + хост + гейт + монтаж)
- Новые модули: `src/engine/qte/qteTypes.ts` (нейтральные типы QTE для
  engine-слоя; оверлей ре-экспортирует для совместимости),
  `src/engine/events/qteEvents.ts` (QteEvents: qte:start/qte:resolve) — домен
  `qte` влит в EventMap/EVENT_DOMAINS; onSuccess/onFailure оверлея сужены до
  QTEFinalResult («pending» недостижим).
- `QuickTimeEventHost.tsx` — единственная точка монтирования: слушает
  qte:start (always-mounted listener, паттерн PoemRevealHost), гейтит
  занятость экрана через isGameplayOverlayLocomotionLocked (диалог/кат-сцена/
  миниигра/осмотр/панели), дедуп повторных start, эмитит qte:resolve ровно
  один раз, экран результата держится 1600 мс (cancelled — сразу),
  ставит/снимает локомоция-гейт, маппит qte:* звуки на пресеты.
- `playerLocomotionGate.ts`: +setQteLocomotionGate — модальный QTE
  замораживает WASD/прыжок/взаимодействие (keyboardInputState — соседний
  window-слушатель, stopPropagation его не изолирует).
- `sfxPresets.ts`: +6 пресетов qte_start/press/near_miss/success/failure/
  complete (процедурные осцилляторы с собственным ритмом события).
- Монтаж: `<QuickTimeEventHost />` в GameplaySharedEffects (Orchestrator-
  GameplaySections) после EncounterBeatOverlay — кросс-режимный слой.

### fix(qte): переработка оверлея — P0-дефекты производительности и корректности
- Таймер: setInterval(16 мс) с setState каждый тик (60 ре-рендеров/с) →
  тик 100 мс; кольцо сглаживается framer-переходом (duration = тик).
- Ввод: keydown перерегистрировался на каждый инпут (deps handleInput/state) →
  одна регистрация keydown+keyup на сессию, значения через refs-зеркала;
  быстрые нажатия между рендерами не теряются (синхронное зеркалирование
  stateRef).
- Сессия: deps таймер-эффекта [isActive, eventType, adjustedDuration,
  handleFailure, playSound, showResult, keyBindings] — инлайн-пропсы
  перезапускали сессию и QTE не доходил до конца → deps [isActive, stopTimer],
  сброс только по isActive-переходу.
- hold: прогресс по OS-автоповтору (+0.02/keydown) → keydown/keyup-пара +
  тик-накопление (HOLD_FILL_MS/speedMult); успех по уже вычисленному значению
  (stale-check чинил срабатывание на нажатие позже порога).
- mash: e.repeat игнорируется; кольцо mash: pressCount/(pressCount+10) →
  pressCount/targetPresses.
- Escape → onFailure('cancelled') без экрана результата; мёртвый код
  `...(eventType === 'hold' ? {} : {})` удалён.

### feat(i18n): волна 4 этапа 115 — все динамические HUD-ключи в каталоге
- 35 динамических вызовов в 10 файлах (QuestObjectiveCard 8, TopBarDataTicker 6,
  HUDNotificationFeed 8, ExplorationHUD 3, ActiveQuestMiniTracker 3, StaminaBar 2,
  QuickAccessToolbar 2, SceneContextChip/EnvironmentMoodIndicator/EmergencyHelpButton
  по 1) переведены на литеральные ключи t('hud.*', fallback, params) —
  вывод байт-в-байт прежний; карты ключей-констант удалены.
- Волна 2 добита до того же стиля: notificationToastPresentation (8) и
  PlayerStatusFrame (3) — тоже литеральные ключи.
- Контракт-тест ru.hudCoverage: порог 60 → ≥220 ключей (фактически 229);
  it3 пополнен 14 assert-ами волны 4; заголовок переписан (динамические
  ключи-переменные задокументированы как вне контракта).

### style(hud): детали стиля по словарю волн v4.27–v4.29
- StaminaBar: пороговая насечка 25% (риск+пульс при low, красное свечение
  fill, reduced-motion-гейт) — словарь v4.27, DOM-ref-паттерн без ре-рендеров.
- HUDNotificationFeed: TTL-hairline 2px вдоль нижнего края карточки
  (width 100%→0 за 5 с жизни, аналог bottom-progress AutoSaveIndicator;
  reduced-motion — статичная полоска).
- SceneContextChip: акцент типа сцены (outdoor→cyan, indoor→matrix,
  underground→amber, dream→violet — иконка/рамка/свечение) + одноразовый
  вспых-пульс значений NPC:/EX: при смене (remount по key=value, паттерн
  StatPulse); +токен --cyber-violet-rgb в tokens.css.
- EnvironmentMoodIndicator: пульс иконки при шторме (intensity ≥ 0.8) +
  красная рамка контейнера и тень лейбла (паттерн HazardStatusIndicator).

### chore(assets): удалены мёртвые meshopt-GLB из репозитория (−13 MB)
- 31 файл *.meshopt.glb (13 MB) в public/ больше ни на что не ссылается:
  этап 123 исключил meshopt-варианты из манифеста/keep-set, prune вырезал их
  из dist, но сами файлы оставались в репо. Проверено: rg по src/scripts/api
  — ссылок на пути .meshopt.glb нет (gltfProcess.mjs умеет их генерировать
  заново при необходимости). Рабочая копия легче на 13 MB, деплой-инварианты
  (verify:deploy 114 путей, budgets) не изменились.

### docs
- ROADMAP: этап 115 волна 4 (реестр 131/132, 124 — блокер-тулинг).
- ARCHITECTURE: раздел v4.30.0 (QTE-подсистема, локомоция-гейт, i18n волна 4).
- readme: «Текущее состояние» обновлено.

## v4.29.0 (2026-09-12) — этап 98: персистентный EffectComposer (нулевые ремaунты на смене сцен)

### Сводка
Последний крупный перф-этап реестра закрыт. Смена сцены больше НЕ пересобирает
EffectComposer: раньше pipelineKey = `${sceneId}-${lite|ao|full}${-smaa}`
ремaунтил композер → 8–10 перекомпиляций шейдеров = 250–2000 мс stall на
каждом переходе. Теперь дети композера — фиксированный суперсед пассов с
константными props (мемо по структурному ключу тира/настроек), все
пер-сценные вариации — императивные (uniform-запись, pass.enabled, LUT-swap),
композер ремaунтится только при смене renderer'а (glInstanceKey). Прогресс
реестра: 131/132. Верификация — только статический анализ: tsc (0), ESLint
(0 errors, 60 legacy-warnings), vitest ПОЛНЫЙ 2693/2693 (434 файла, +27),
validate:content (0), validate:act1-extended (0), vite build + budgets:check
(OK; boot/game-start — документированное состояние в hard-max). Dev-сервер
не запускался; poems.ts не изменялся.

### perf(postfx): персистентный композер — этап 98 закрыт
- Новые модули: `scenePostFxProfiles.ts` — чистые SCENE_*-таблицы (переехали
  из ExplorationPostFX) + `resolveScenePostFxProfile(sceneId)` (замороженный
  профиль: grade/vignette/bloom/chromatic/aoColor/toneExposure/noise/
  scanlines/hero/lutKind/godRaysSun; фолбэки derived-сцен — байт-в-байт);
  `applyScenePostFx.ts` — императивный аплаер + чистые рантайм-хелперы
  (bloom/vignette/chromatic/grade формулы) с узкими структурными типами.
- `ExplorationPostFX` переписан: дети — useMemo по structuralKey
  (lite/full, тир пресета, selectedPreset, visualLite, coarsePointer,
  reducedMotion, AgX, godrays-ready, vignetteEnabled) — смена сцены не
  входит; props всех пассов — константы (любое изменение props обёртки
  @react-three/postprocessing пересоздаёт инстанс эффекта через args-мемо).
- Императивные сеттеры postprocessing 6.39: Bloom (intensity +
  luminanceMaterial.threshold/smoothing), Vignette (offset/darkness/eskil),
  HueSaturation (hue/saturation), BrightnessContrast (brightness/contrast),
  ChromaticAberration (uniform offset мутируется на месте — без аллокаций),
  ToneMapping (mode для AgX↔ACES).
- N8AO: пасс смонтирован всегда на full-структуре; пер-сценное вкл/выкл —
  pass.enabled + Proxy-конфигурация n8ao (aoRadius/aoIntensity/color) —
  без реконструкции тяжёлых шейдеров SSAO. Scanline/Noise — вкл/выкл через
  blendMode.opacity (density/premultiply константы).
- LUT: пасс живёт постоянно; сцены без LUT получают нейтральную identity-
  текстуру (новый `getNeutralProceduralLut3DTexture`, 16³ RGBA UnsignedByte —
  тот же формат, что и процедурные), пер-сценная подмена — `effect.lut = tex`
  (чистый uniform-swap: define'ы не меняются, перекомпиляции нет).
- GodRays: персистентный sun mesh (GodRaysSunMesh) вынесен из детей
  композера и живёт между сценами; позиция/цвет/visible — императивно по
  sceneId (конфиг GODRAYS_SUN_CONFIG переехал в scenePostFxProfiles).
  Пер-сценное вкл/выкл — точечный pass.enabled (эффект-пасс находится по
  инстансу GodRaysEffect; слитые пассы защитно не трогаются); opacity
  0↔0.55 анимируется тиком, гаснет в диалогах/кат-сценах.
- Применение профиля: монтирование + `scene:transition_start`
  (targetSceneId — событие приходит ДО записи сцены в стор, применение
  происходит под визиром SceneTransitionVeil, мгновенно и без ре-рендеров) +
  смена настроек (idempotent). Стресс/энергия/поэм-буст — покадровый тик
  через getState() (ноль store-подписок на рендер у пайплайна); soft-budget
  гейты N8AO/GodRays — в тике, переключение только при изменении.
- MotionBlurEffect: без пропов — cutscene/dialogue-гейт читается из стора
  в собственном тике (isSoftWorkAffordable перечитывается в тике).
- pipelineKey удалён; ManagedEffectComposer: key = glInstanceKey (ремaунт
  только при смене renderer'а/context restore), dispose — на unmount.
- Найден и задокументирован исторический no-op: ToneMappingEffect в
  postprocessing 6.39 НЕ имеет exposure — проп `exposure` у <ToneMapping>
  ничего не делал (r3f клал мёртвое свойство). Поведение сохранено
  байт-в-байт; SCENE_TONE_EXPOSURE живёт в профиле документации ради
  будущего включения.
- Тесты +27: scenePostFxProfiles.test.ts (9 — точные значения таблиц,
  фолбэки наследников, фриз, согласованность godRays/LUT-реестров) и
  applyScenePostFx.test.ts (18 — рантайм-хелперы с формулами, lite-parity,
  гашение сканлайнов/зерна, LUT-swap identity↔kind, pass.enabled GodRays,
  защита слитых пассов). Полный vitest 2693/2693 (434 файла).

## v4.28.0 (2026-09-12) — волна 2 этапа 100 (бандлы хотбара/миникарты) + i18n волна 3 + HUD-детали

### Сводка
Этап 100 закрыт полностью (волны 1+2); этап 115 дополнен волной 3 (+109
ключей каталога); этап 98 — готов детальный план (сам этап остаётся открытым,
требует отдельного раунда). Прогресс реестра: 130/132. Верификация — только
статический анализ: tsc (0), ESLint (0 errors, 60 legacy-warnings), vitest
ПОЛНЫЙ 2666/2666 (432 файла, +4), validate:content (0),
validate:act1-extended (0), vite build + budgets:check (OK; новые i18n-строки
в game-ui/GameOrchestrator-чанках, boot-чанки чистые). Dev-сервер не
запускался; poems.ts не изменялся.

### perf(hud): бандлы хотбара и миникарты — волна 2 (этап 100 закрыт)
- Новый `selectQuickUseHotbarState` / `useQuickUseHotbarState` (hudSelectors):
  фаза + инвентарь + слоты хотбара + онбординг-гейт (уровень/основные стихи).
  QuickUseBar и MobileActionButtons — по одному shallow-бандлу вместо
  6 подписок у каждого.
- Новый `selectMinimapHudState` / `useMinimapHudState`: MinimapComponent —
  один бандл вместо 4 подписок (gamePhase + useMiniMapState +
  useNpcRelations + useActiveQuests); фильтр активных квестов — useMemo в
  компоненте (фильтр внутри plain-селектора нарушил бы контракт ссылочной
  стабильности).
- `useMiniMapState`: удалено мёртвое поле playerRotation — ни один
  потребитель его не деструктурировал, а стор пишет rotation на
  телепортах/кинематике и зря будил MinimapComponent и SceneContextChip.
- CompassHUD: raw `useGameStore((s) => s.exploration.currentSceneId)` →
  `useCurrentSceneId()` (единый селекторный фасад).
- Контракт-тест расширен: оба новых селектора в списке shallow-проверок;
  мок состояния дополнен срезом фаз/хотбара. Полный vitest 2666/2666.

### feat(i18n): волна 3 — 109 строк 7 виджетов в каталоге RU_MESSAGES
- WeatherIndicator (заголовок/Цельсий/типы/ветер/воздух), DayNightCycleIndicator
  (фазы + дедуп дубля phaseRuLabel — aria и видимый текст теперь из одного
  источника), CompassHUD (буквы С/СВ/… и 8 полных названий направлений для
  aria), MinimapComponent (aria/свернуть/развернуть/масштаб/дистанция),
  QuickUseBar (меню назначения/aria/тултипы/тост), MobileActionButtons
  (все надписи и aria), AaaImmersiveGuide (31 строка внутреннего голоса).
- minimapZoomSetting: уровни получили `labelKey` — подпись уровня из каталога,
  labelRu остаётся фолбэком (вывод байт-в-байт прежний).
- Шаблоны с плейсхолдерами ({slot}, {item}, {dir}, {n}…) — через
  t(key, fallback, params) волны 2; репрезентативные byte-проверки добавлены
  в ru.hudCoverage.test.ts.
- **fix:** имя навыка в тосте хотбара бралось сырым ключом («writing +2») —
  видимая не-русская строка. Теперь из каталога hud.skill.name.* («Письмо +2»).

### feat(hud): детали стиля и обратная связь (мандат «more details»)
- Миникарта: дистанция до цели подписана у обода для прижатых квест-маркеров
  (GTA-стиль, цвет маркера, шрифт monospace) — «далеко ли идти» читается
  сразу; кнопкам масштаба — hover-glow/active-масштаб/focus-ring,
  свёрнутой «таблетке» — hover/active/focus-visible отклик.
- DayNightCycleIndicator: тонкая полоса прогресса текущей фазы в блоке
  «Следующий:» (цвет — акцент следующей фазы, reduced-motion — без анимации);
  метки 06/12/21 на дуге — дуга читается как шкала.
- QuickUseBar: янтарный пульс-индикатор «последний предмет» (quantity = 1) —
  видно, что после использования слот опустеет; reduced-motion — статично.
- WeatherIndicator: при сильном ветре иконка ветра мягко пульсирует, при
  смоге тревожно дышит точка качества воздуха; reduced-motion — статично.
- Мобильные кнопки: плавный transform-переход нажатия (0.12s) и первая
  видимая фокус-рамка :focus-visible (доступность клавиатурой/switch-access).

### docs: этап 98 — план готов, этап открыт
- Детальное исследование lifecycle единственного EffectComposer
  (ExplorationPostFX/ManagedEffectComposer): stall переходов создаёт
  pipelineKey (sceneId + lite/ao/full + smaa) — 8–10 ре-компиляций шейдеров.
- План: фиксированный суперсед пассов + императивные включения
  (pass.enabled/uniforms/LUT-swap), ключ → glInstanceKey, профили сцен —
  чистая resolveScenePostFxProfile с unit-тестами, применение по
  scene:transition_start под визиром перехода. Риски зафиксированы
  (tone-mapping инвариант, prop-churn wrapEffect, GodRays sun mesh, SMAA).
  Реализация — отдельный раунд: высокий регресс-риск без браузерной проверки.

## v4.27.0 (2026-09-12) — точечные подписки HUD (этап 100) + ultra→draco (этап 123) + плейсхолдеры i18n

### Сводка
Закрыты этапы 100 (волна 1) и 123; этап 124 зафиксирован как блокер-тулинг.
Прогресс реестра: 130/132. Верификация — только статический анализ:
tsc (0), ESLint (0 errors, 60 legacy-warnings), vitest точечный 119/119 +
i18n/toast 19/19 + selectors/graphics 135/135, validate:content (0),
validate:act1-extended (0), vite build + build:vercel/prune + verify:deploy
(OK, 114 путей, dist 97.1 MB) + budgets (OK). Dev-сервер не запускался;
poems.ts не изменялся.

### perf(hud): точечные подписки вместо широкого HUD-бандла — волна 1 (этап 100)
- Инвентаризация: «голых» `useGameStore()` без селектора в HUD — 0; последний
  широкий бандл — 12-полевой `useHUDControllerState` (7 потребителей).
- Бандл удалён: SceneTopBarHud → `useProgressionSummary` (memo-виджет больше
  не ре-рендерится на смену погоды/энергии/кармы), HUDChromaticEdge →
  `useScreenEffectsVitals`, RainScreenEffect/SceneAmbientVignette →
  `useHUDExploration`, useContextualHints → `useVitalStats` +
  `useCurrentSceneId`, корень useHUDController → три узкие подписки
  (мёртвое `collectedPoems` больше не тянет ре-рендер корня).
- HudAmbientOverlay / AmbientAtmosphereCaption / GameStatsDashboard — по
  одному shallow-бандлу (`useAmbientOverlayState`, `useAtmosphereCaptionState`,
  `useStatsDashboardState`) вместо 3/5/6 отдельных подписок.
- ProximityWhisperOverlay: удалены мёртвые подписки `_sceneId/_playerPos/_flags`.
- Новый контракт-тест `hudSelectors.test.ts`: широкий бандл не вернётся;
  новые plain-селекторы shallow-стабильны (React #185).

### perf(assets): ultra переведён на draco, meshopt-варианты исключены из деплоя (этап 123)
- qualityPresets: ultra.compression `'meshopt'` → `'draco'` (draco-пары есть
  для всех 19 NPC, героя и пропсов кафе; декодер `draco/` уже в
  PRESERVED_PREFIXES; LOD1/LOD2 NPC и так draco — клиентских изменений нет).
- assetManifest: удалены meshopt-варианты npcCharacterAsset, player_volodka,
  env_cafe_props → из keep-set prune уходит 21 файл = **12.85 MiB деплоя**
  (19 NPC = 11.47 MiB + герой/кафе = 1.38 MiB).
- Авто-подпись пресета: «Draco/Meshopt» → «Draco».
- Проверено end-to-end: `build:vercel` (prune: stripped 61 файл / 24.6 MB),
  `verify:deploy` OK (114 путей, dist 97.1 MB), `budgets:check` OK.
- «None»-GLB содержат EXT_meshopt — MeshoptDecoder остаётся подключенным.

### feat(i18n): плейсхолдеры {name} в t(key, fallback, params) — волна 2 этапа 115
- `t()` получил необязательный третий аргумент `params`: шаблоны каталога
  интерполируются ({delta} → значение), неизвестные параметры остаются
  литералом, вызовы без params не меняют поведение волны 1.
- 8 динамических toast-ключей (notificationToastPresentation) и 3 aria-ключа
  PlayerStatusFrame перенесены в каталог RU_MESSAGES как шаблоны — фолбэки
  байт-в-байт повторяют прежние литералы, видимый вывод не изменился.
- Тесты i18n: +6 кейсов (каталог/фолбэк/числа/неизвестные параметры/
  совместимость/скобки).

### feat(hud): пороговые насечки на витальных барах
- PlayerStatusFrame: у баров ЭН/СТР появилась риска опасной зоны — бледная
  при запасе; при пересечении порога (энергия <25 / стресс >70, единый
  источник hudThresholds) краснеет и мягко пульсирует; reduced-motion —
  без пульсации.

### docs: этап 124 (KTX2) — блокер-тулинг
- Клиентская инфраструктура готова заранее (KTX2Loader + basis_transcoder
  в деплое), но энкодер toktx/KTX-Software недоступен: gltfProcess.mjs
  молча пропускает ETC1S-пасс, .ktx2-файлов в репо 0. Этап остаётся
  открытым до появления тула в среде сборки.

## v4.26.0 (2026-09-12) — фаза 7 закрыта: диалоги/i18n/терминология + CI-бюджеты + WebP

### Сводка
Закрыты этапы 114, 115, 116, 122, 125; по 123 — находка, меняющая постановку.
Прогресс реестра: 128/132. Верификация — только статический анализ:
tsc (0), ESLint (0 errors, 60 legacy-warnings), vitest 2649/2649 (431 файл,
+4 новых), validate:content (0), validate:act1-extended (0), vite build +
budgets (OK), verify:deploy (OK, dist 121.7 MB). Dev-сервер не запускался;
poems.ts не изменялся.

### feat(dialogue): возвратные реплики для новых NPC (этап 114)
- Ритка: «послушай ленту — там четвёртый голос» в greeting и пирсовом
  return + мини-узел `chk_ritka_fourth_voice_echo` (гард
  `ep_ritka_fourth_voice_talked`, relation +4, карма +1).
- Трофим: послесловие после прослушанной ленты (`trofim_echo_afterword`).
- Баба Зина: «коробку Марина приняла» (`baba_zina_box_afterword`) —
  согласовано с репликой Марины «Сама приду».
- Марат-эхо: итог подъёма блока (`marat_echo_server_afterword`, маркер —
  `pv_server_block_raised`).
- Все реплики одноразовые (missingFlag-гарды); validate:content = 0;
  reachability/parity/pack-тесты 34/34.

### feat(i18n): вынос HUD-строк в файл локализации — волна 1 (этап 115)
- `src/i18n/messages/ru.ts`: +113 статических ключей `hud.*`.
- 12 постоянных HUD-виджетов + toast-слой (константы и билдеры) +
  karmaTier переведены на `t(key, fallback)` — фолбэки байт-в-байт,
  вывод не изменился (текстовые тесты зелёные без правок).
- Динамические строки: ключи через константы `HUD_DYNAMIC_KEYS`,
  сознательно вне каталога (статичная запись перебила бы интерполяцию).
- Новый контракт-тест `ru.hudCoverage.test.ts`: каждый `hud.*`-ключ из
  t()-вызовов есть в каталоге (≥60), значения совпадают с фолбэками.

### fix(hud): терминология кармы — двойной знак (этап 116)
- Вычитка подтвердила инвариант: игрок — «Карма», фракции — «Репутация
  фракции», «Стресс» без синонимов.
- Реальный дефект: отрицательная награда кармы (factory_secret_blueprint,
  −15) рендерилась «Карма +-15» — исправлено в questAcceptDialog,
  QuestsPanel и QuestObjectiveCard; регресс-тест.

### ci: budgets:check + verify:deploy после build (этап 122)
- CI ловит пробитие бюджетов бандла и потерю деплой-ассетов до мерджа.

### perf(assets): ночной план меню PNG → WebP (этап 125)
- `cinematic_night_plate.png` (1 218 655 B) → `.webp` (170 576 B, q90,
  −86%); единственный потребитель `POLYHAVEN_MENU_PLATE` обновлён;
  dist 122.7 → 121.7 MB; бюджеты и verify:deploy — OK.

### docs: находка по этапу 123
- Пресет ultra сам выбирает `compression: 'meshopt'` — NPC-варианты
  meshopt (19 файлов ≈ 12.0 MB, не 15–20) выбираются пресетом; простое
  исключение из keep-set невозможно. Отложено до решения о переводе
  ultra на draco.

## v4.25.0 (2026-09-12) — хвост фазы 6 (UI-clock, LCP, дедуп, GC) + фаза 7: квест «Эхо пирса»

### Контент
Завершён перф-хвост фазы 6 (этапы 104, 106, 107, 108) и открыта фаза 7
(этапы 111, 112, 113, 117, 118, плюс частично 114) — новый квест-исследование
«Эхо пирса» с предметами, лором и перекрёстными ссылками кодекса; этап 126
(.nvmrc). Прогресс реестра: 108/132. Верификация — только статический
анализ: tsc (0), ESLint (0 errors, 73 legacy-warnings), vitest 2645/2645
(430 файлов, +14 новых), validate:content (0), validate:act1-extended (0),
vite build + check-bundle-budgets (OK). Dev-сервер не запускался;
poems.ts не изменялся.

### perf(ui): единый UI-clock для холодных интервалов (этап 104)
- useUiTick получил императивный API `onUiTick(periodMs, cb)` на общем
  тикере (один интервал на частоту; тики пропускаются в скрытой вкладке;
  по возврату видимости — догоняющий бамп).
- Переведены: useWorldClock (60с — мировой тик), useCityNews (поллер
  3,5 мин — больше не сжигает серверлесс-вызовы в скрытой вкладке),
  useWeatherEffects (1с длительность + 10с эффекты), useHudQuiet (1с).
- fix: гард периода ≤0 — useUiTick(0) по документации «подписки нет»,
  но фактически запускал setInterval(0) (busy-loop) для закрытой панели.
- fix: утечка visibilitychange-листенера — добавлялся на каждый
  startTicker и никогда не снимался.

### perf(orchestrator): дедуп отложенных таймеров жизненного цикла (этап 107)
- Новый KeyedTimeoutScheduler (schedule/cancel/has/pendingCount/disposeAll):
  повторный schedule по тому же ключу заменяет незрелый таймер.
- 12 «голых» setTimeout в useGameLifecycleManager (баннер сцены, мысли
  при входе в сцену, 9 реактивных мыслей) переведены на планировщик.
- fix: хвосты setTimeout срабатывали после unmount (фантомные мысли в
  HMR/StrictMode) — все незрелые задачи снимаются при размонтировании.

### perf(store): кэши фасада без аллокаций в горячем пути (этап 108)
- storeBindings: ссылки 9 слайсов собираются в переиспользуемый
  мутабельный кортеж — getCombinedGameState() при свежем кэше больше не
  аллоцирует массив (вызовов — сотни за кадр: все useGameStore.getState()).
- gameSnapshotCache: ключ на 44 поля — постоянный буфер вместо массива на
  каждый вызов; замороженные EMPTY_CHOICE_LOG/EMPTY_MORAL_CHOICES вместо
  аллокаций «?? []»; мост подписок (мимо rAF-батчинга) перестал создавать
  мусор на каждый чейндж слайса. Семантика сравнения не изменена.

### feat(perf): LCP-профилировщик загрузки (этап 106)
- Новый lcpProfiler: PerformanceObserver('largest-contentful-paint',
  buffered: true), тихое отключение в средах без поддержки типа.
- LoadingTimeline: в DEV после first-scene-playable печатает LCP и тег
  крупнейшего элемента — если LCP позже играбельной сцены, смотреть в
  шрифты/постер меню, а не бандл.

### feat(quest): квест №155 «Эхо пирса» — исследование (этапы 111/118)
- ep_pier_echo (акт 2, гивер — Трофим): легенда об эхе пирса №3, тихий
  маршрут парком (location_visited), прослушивание на рассвете (флаг
  ep_echo_listened + кассета), разговор с Риткой о четвёртом голосе.
- 6 story-нод (src/data/story/pierEchoStory.ts): две ветки старта,
  маршрут, прослушивание, два финала-развилки (поплавок / открытка 1987).
- Регистрация пака 'pierEcho': quests/index, buildStoryNodes,
  narrativePackRegistry (тип + ленивый загрузчик + порядок сателлитов).
- Диалоговый хук trofim_greeting: вход (requiredAct 2) + возвратная
  реплика продолжения (частично этап 114).
- Награды в коридоре тира акта 2: 55 кредитов / +4 кармы / +35 XP;
  тест пака фиксирует коридор 40–60 / 3–5 / 0–50 (этап 118).

### feat(items/lore): предметы и лор «Эха пирса» (этапы 112/113/117)
- Предметы: Кассета с эхом (quest_item), Поплавок из речного стекла
  (misc, стресс −3), Открытка «Пирс №3, 1987» (misc), Батарея маяка
  (consumable, энергия +20).
- Лор: «Эхо пирса №3», «Тридцать лет сторожки», «Побочная линия
  "Хром-М"», «Девятнадцатое число» — обнаружение через discoverLore
  эффекты нод квеста; перекрёстные ссылки внутри блока и на
  lore_great_crash_2029 / lore_city_ufa (этап 117).

### chore: .nvmrc — Node 22 (этап 126)
- Фиксация версии рантайма, синхронной с CI (node-version: '22').

### Верификация v4.25.0
- tsc --noEmit: 0 ошибок; ESLint: 0 errors (73 legacy-warnings — базлайн).
- vitest: 2645/2645 (430 файлов) — включая reachability (0 недостижимых
  квестов), паритет narrative-реестров и 8 новых тестов пака «Эхо пирса».
- validate:content + validate:act1-extended: 0 issues.
- vite build 38.2с + check-bundle-budgets: OK (boot/game-start — в
  hard-max, на уровне v4.24.0; контент — в ленивых data-story-чанках).

## v4.24.0 (2026-09-12) — фаза 6: перф-волна AI/физики/HUD (этапы 97–105)

### Контент
Продолжение фазы 6 реестра (производительность): пять оптимизаций
горячих путей — дистанционный LOD AI-тика крипов, выборочная
интерполяция динамических физтел, dirty-check расписания мировых
часов, O(1)-среднее DPR, O(1)-потребление нав-путей + фиксация
бюджет-цифр. Верификация — только статический анализ: tsc (0),
ESLint (0 errors), vitest engine 1502/1502, validate:content (0),
validate:act1-extended (0), vite build + бюджеты (OK). Dev-сервер
не запускался; poems.ts не изменялся.

### perf(npc): дистанционный LOD AI-тика крипов (этап 97)
- Мирные крипы (patrol/return/cooldown) дальше 30 м от игрока
  симулируются на ~10 Гц вместо каждого кадра: delta аккумулируется,
  движение/таймеры/LOS/stuck остаются точными по времени; между
  LOD-тиками пропускаются страйк-репорты (map.set + LOS-тест),
  навигация и презентация (HP-билборд, конус, свет).
- Бой, погоня и зона замаха (<2.7 м) — всегда реал-тайм; HUD-подсказка
  замаха (HINT_STALE_MS=260) не успевает протухнуть.
- Константы CREEP_AI_LOD_FAR_M/CREEP_AI_LOD_FAR_TICK_S — в чистом
  creepTactics.ts (идея tier-ов npcRenderTier расширена на AI-тик).

### perf(combat): индексный курсор пути вместо path.shift() (этап 103)
- Патрульные пути крипов потребляются курсором (O(1) за тик) вместо
  мутации массива shift() (O(n) на вейпоинт); курсоры сбрасываются
  на всех путях жизненного цикла (погоня/return/stuck/приход домой).

### perf(physics): выборочная интерполяция динамических физтел (этап 99)
- Новый engine/physics/propSmoothing.ts: EMA-follower мировой позиции
  (α = 1 − exp(−rate·dt), кадронезависимо) в фазе post_physics —
  после снапа трансформаций Rapier.
- Мотивация: в @react-three/rapier 2.2.0 флаг interpolate глобальный;
  включение вернуло бы «аватар отстаёт от камеры», а без него пинаемый
  реквизит дёргается на дисплеях >60 Гц. Теперь плавают ТОЛЬКО пропсы
  (банки/бутылки/ящики/бочки DynamicProps) — игрок и камера не тронуты.
- Вращение не сглаживается (компромисс задокументирован), спящие тела
  и телепорты >0.5 м снапаются мгновенно; коллизии — по физтелам.

### perf(world): dirty-check NPC-расписания (этап 101)
- areNpcScheduleStatesEqual (чистый компаратор) + запись
  setExplorationNPCStates только при фактическом изменении: типичный
  тик мировых часов (раз в 60 с) больше не сбрасывает ссылки npcStates
  и не перерисовывает подписчиков без причины. События
  world:tick/world:hour_changed — как раньше.

### perf(hud): O(1)-среднее DPR (этап 102)
- useDynamicDPR: инкрементальная сумма FPS вместо O(n)-обхода
  кольцевого буфера каждые windowMs; сумма обновляется на push/evict.

### docs: бюджеты зафиксированы (этап 105)
- check-bundle-budgets --report: boot 624.5/634.8 KB gzip (hard max),
  game-start 1326.6/1757.8 KB, кумулятив до первой сцены 1951.1 KB,
  ленивый ярус (Rapier) 1565.4 KB, весь JS 3607.0 KB gzip, entry CSS
  133.4 KB, WebGL-стек ≈ 20% game-start. Цифры — в ROADMAP-STAGES.md.

### Верификация v4.24.0
- tsc --noEmit: 0 ошибок; ESLint: 0 errors (60 legacy-warnings, не новые).
- vitest engine: 1502/1502 (254 файла) — включая точечные прогоны
  engine/npc, engine/combat, shared/schedule после каждого этапа.
- validate:content + validate:act1-extended: 0 issues.
- vite build 37.4 с + check-bundle-budgets: OK (boot/game-start — в
  hard-max, на уровне v4.23.0: новые модули не попадают в boot).

## v4.23.0 (2026-09-12) — фаза 5 закрыта: полная слот-сетка HUD, UI-clock, тесты-контракты

### Контент
Завершение фазы 5 реестра (этапы 85–92): все оставшиеся хардкоды
позиций нижне-центральных тостов переведены на слот-сетку hudLayout,
правый нижний угол разведён по рядам, секундные тики панелей сведены в
общий UI-clock, добавлены два теста-контракта. Верификация — только
статический анализ: tsc (0), ESLint (0 errors), vitest 189/189
(включая 10 новых), vite build + бюджеты (OK). Dev-сервер не
запускался; poems.ts не изменялся.

### feat(hud): слоты режиссуры/голоса/тревоги — хардкоды vh устранены
- FirstMinutesDirector: bottom-[14vh] → bottomCenterGuidancePx.
  Высокая карточка (~90px, текст + прогресс-точки) вписана в зазор
  между поэзией (180) и [E]-промптом — из-за её высоты промпт на
  desktop поднят с 234 на 282 (было реальное наложение верха карточки
  и промпта: 284 против 234).
- AaaImmersiveGuide: bottom-[22vh] → bottomCenterGuidePx (514).
- HazardStatusIndicator: clamp(184px, 24vh, 248px) →
  bottomCenterAlertPx (572) — нижний край старого диапазона наезжал
  на слот [E]-промпта.
- CriticalStatusWhisper: собственный tertiary-ряд (456) — раньше делил
  secondary-слот с ContextualHint и наезжал на него при одновременном
  показе.
- Desktop-цепочка теперь строго возрастает: 186 → 282 → 340 → 398 →
  456 → 514 → 572 (шаг 58px).
- Мобильная модель пересчитана по факту CSS-подъёма стека (поэзия 292,
  тулбар 216, промпт 402–450): primary (352) — единственный ряд под
  промптом; guidance/secondary/tertiary/guide/alert делят один слот
  460 над промптом (детерминированного конфликта с интерактивом нет;
  взаимные наложения редких транзиентов — сознательный компромисс).

### fix(hud): правый нижний угол — четыре ряда без наложений
- AudioVisualizer: bottom-4/right-4 → четвёртый ряд колонки (168,
  bottomAudioVisualizerPx) — раньше налегал на миксер звука (тот же
  угол 16/16). Цепочка: миксер (16) → статусы (72) → помощь (116) →
  визуализатор (168).
- На ≤768px визуализатор скрыт (как и миксер): конфликтовал бы с
  поднятым рядом статусов (168) и кластером мобильных кнопок.

### perf(hud): общий UI-clock вместо N секундных интервалов
- Новый useUiTick(periodMs) на useSyncExternalStore: один setInterval
  на частоту на ВСЕХ подписчиков, гасится, когда подписчики кончились;
  тик пропускается в скрытой вкладке, по возврату видимости —
  догоняющий бамп.
- Переведены: PoemJournalPanel (1с интервал на панель), PoemsTab
  (локальный ДУБЛИКАТ хука usePoemCooldownSeconds удалён — импорт
  канонического), канонический usePoemCooldownSeconds (500мс на
  потребителя).

### test(hud): два контракта вместо регрессий «на глаз»
- jsxNoLiteralNewline.test.ts (этап 85): сканер всех .tsx на
  литеральные backslash-n в JSX-позиции вне строк — ловит повторение
  бага «\n» из NpcScheduleDisplay:316 на уровне CI.
- hudLayoutSlots.test.ts (этап 92): детектор коллизий слотов — правая
  колонка (миникарта → квест-карта → день/ночь → погода → достижения),
  desktop-цепочка нижнего центра (шаг ≥ 48px + правило высокой
  карточки), мобильная модель (primary под промптом, общий слот над
  ним), правый нижний угол (миксер → статусы → помощь → визуализатор).

### docs: ROADMAP — фаза 5 закрыта (77–92 из 132)
Очередь: фаза 6 (97–104: LOS-LOD крипов, persistent EffectComposer,
интерполяция физтел, dirty-check useWorldClock), фаза 7 (контент),
фаза 8 (CI budgets+verify, prune meshopt, .nvmrc).

## v4.22.0 (2026-09-12) — слот-сетка HUD, реактивный гейт осмотра и перф-волна

### Контент
Волна исправлений UI по скриншоту игрока (литеральный «\n» в панели
«Персонажи», наложение квест-карты и виджета дня/ночи, стопка тултипов
внизу центра, обрез заголовка трекера, вечно включённый аудио-визуализатор)
и первая волна производительности (этапы 77–96 реестра
`docs/ROADMAP-STAGES.md`). Верификация — только статический анализ:
`tsc --noEmit` (0), ESLint (0 errors / 60 legacy-warnings),
`validate:content` (0), `validate:act1-extended` (0), vitest точечно
(14/14), `vite build` + бюджеты бандла (OK). Dev-сервер не запускался.
Памятная неприкосновенность: первые 18 стихотворений в
src/data/poems.ts не изменялись.

### fix: литеральный «\n» в панели «Персонажи» и слот-сетка правой колонки
- NpcScheduleDisplay.tsx:316 — в JSX-текст попали литеральные символы
  `\n` (след скриптовой склейки): JSX не интерпретирует escape-
  последовательности, и над футером панели печатался буквальный «\n».
  Заменено на реальный перенос строки.
- Правая колонка разведена в строгую вертикальную цепочку: миникарта →
  квест-карта → день/ночь → погода. Раньше DayNightCycleIndicator
  (minimapBottom+4) и QuestObjectiveCard (minimapBottom+6, до 216px)
  рисовались друг на друге — теперь `explorationDayNightTopPx()` = слот
  под квест-картой (`explorationAchievementCardSafeTopPx()`).
- Новый `LEFT_INSET` в hudLayout: панели «Персонажи» и «Подсказки»
  использовали `RIGHT_INSET` слева — работало по совпадению (оба = 12px).

### feat(hud): единые слоты нижне-центральных подсказок + реактивный гейт осмотра
- Новые слоты `bottomCenterHintPx` / `bottomCenterHintSecondaryPx` в
  hudLayout: PlayerLostHintToast (был bottom-24 = 96px — внутри диапазона
  тулбара 60–112px) и ContextualHint (был clamp(72px, 11vh, 128px))
  подняты строго НАД слотом [E]-промпта. CriticalStatusWhisper тоже
  переведён со хардкода clamp(118px, 16vh, 176px) на слот-сетку.
- Реактивный гейт осмотра: `gltfPreloadOverlayGate` получил подписки
  (useSyncExternalStore) + хук `useExamineOverlayOpen`. Пока панель
  осмотра открыта, скрываются [E]-промпт, кроссхейр-промпт, контекстная
  подсказка и тост «Вы сбились с пути» — раньше они висели поверх
  панели осмотра (та самая стопка тултипов со скриншота).

### feat(hud): читаемый трекер квеста
- Компакт-режим QuestObjectiveCard: заголовок больше не режется до
  «Первое чте…» — до 2 строк (line-clamp-2 + min-w-0 + title-атрибут),
  прогресс — отдельной полосой на всю ширину карточки, проценты —
  справа. Раньше в одну строку с truncate умещалось ~135px.

### feat(hud): аудио-визуализатор — persist, компактный размер, честный idle
- Видимость и режим persist'ятся в localStorage (кнопка «скрыть» больше
  не сбрасывается после перезахода).
- Канвас компактнее: 280×80 → 216×52 (мобильный 200×60 → 156×40).
- Без AnalyserNode рисуется статичный idle «нет данных» — раньше
  фейковые «танцующие» бары изображали играющую музыку при выключенном
  звуке и жгли rAF-цикл впустую. Фейк-генераторы удалены как мёртвый
  код; добавлен дешёвый 1Гц-опрос появления анализатора после первого
  жеста пользователя.

### perf: кулдауны HUD, интро-скрамбл, DPR-замер, погодный множитель
- hudMountSelectors: useActiveEffects и useSkillSlots держали по вечному
  setInterval(500мс) после первого использования стихотворной силы
  (условие «есть записи» остаётся true и после истечения кулдауна) —
  бесконечные ре-рендеры трекера и SkillRechargeHUD. Теперь общий тик
  usePoemPowerCooldownTick: интервал живёт только пока есть активный
  кулдаун и сам останавливается.
- MatrixPoemAssembly: setInterval(22мс) ≈ 45 ре-рендеров/сек самого
  дорогого первого экрана → rAF с капом ~45Гц (бесплатная пауза в
  скрытой вкладке, выравнивание с кадрами отрисовки).
- useDynamicDPR: новая опция enabled — замер FPS suspend'ится в
  demand-фреймлоупе (меню/статичные оверлеи), где кадры не рисуются, а
  замер искажал среднее и жёг rAF. RPGGameCanvas передаёт
  `enabled: canvasFrameloop === 'always'`.
- playerMainMovement: determineWeatherType + getWeatherEffect
  вычислялись КАЖДЫЙ кадр на улице → кэш по квантованному ключу
  (флаг/сцена/час/интенсивность дождя).

### fix(data): мёртвые пути звуков «ЧК · Толпа»
- data/chkTolpa/npcs.ts: 6 × audioCue 'sounds/npc/chk_*_idle.ogg' —
  каталога public/sounds/npc/ не существует, потребителей поля нет.
  Поля удалены (с комментариями), visualDescription сохранены.

### feat(app): WebGL2-гейт
- three 0.172 / R3F v9 требуют WebGL2; без него игрок видел чёрный
  канвас. До монтирования приложения — детекция WebGL2 и понятный
  экран с требованиями на русском (браузер/аппаратное ускорение).

### chore(build): analyze-режим и чистка .vercelignore
- `--mode analyze` был no-op (visualizer установлен, но не подключён) —
  теперь `npm run build:analyze` пишет dist/stats.html (sunburst,
  gzip/brotli-размеры).
- .vercelignore: удалена мёртвая запись public/models/khronos/ (папки
  больше нет в репозитории).

### docs: реестр этапов
- Новый docs/ROADMAP-STAGES.md — реестр из 132 обязательных этапов
  (9 фаз) со статусами: изучение кодовой базы (UI/HUD, движок, контент,
  сборка), критические UI-фиксы, производительность, контент,
  деплой. Правила продолжения для следующих сессий — в конце файла.

## v4.21.0 (2026-09-12) — световые столбы хазардов и честный lazy story-граф

### Контент
Волна A/G из ТЗ: визуальное качество опасных зон (направленная
подсветка) и производительность загрузки (снятие eager-импорта всего
story-графа с gameStart-чанков). Верификация — только статический
анализ: `tsc --noEmit` (0), ESLint (0 errors), vitest (2615/2615).
Dev-сервер не запускался. Памятная неприкосновенность: первые 18
стихотворений в src/data/poems.ts не изменялись (проверено git-историей).

### feat: божественные лучи над опасными зонами (приоритет A)
- ProximityGodRay расширен props coneRadius / enableLights / spotAngle:
  ширина аддитивного конуса для площадных зон, отключение реальных
  источников света (visualLite), угол прожектора; дистанция прожектора
  масштабируется от высоты столба. Существующие три вызова
  (TriggerZone / SceneExitIndicator / NPCProximityMarker) не меняются.
- EnvironmentalHazardSystem: над каждым включённым хазардом —
  направленный световой столб в цвет типа угрозы (HAZARD_KIND_COLOR,
  та же палитра, что 3D-маркер и HUD): опасность читается с другого
  конца сцены. Геометрия — из halfExtents зоны (электрощит — узкий
  холодный столб, плесень — широкая зелёная пелена).
- Бюджеты: visualLite (low/medium) — только аддитивный конус,
  0 дополнительных light-юнитов и 0 изменений числа источников
  (нет шейдер-перекомпиляций); reduced-motion — статичное свечение
  без пульсации (imperative ref, без ре-маунта группы).

### perf: ambient и content-truth читают ленивый кэш narrative-паков
- ambientPlayContext (цепочка оркестратора: useAudioOrchestrator →
  GameOrchestrator) статически импортировал STORY_NODES → весь story-граф
  (~2.3 МБ исходников, все 7 актов + спутники) въезжал в gameStart-чанки,
  полностью обходя систему ленивых narrative-паков — ради двух полей
  текущей ноды (ambientSound / proceduralAmbientOverride).
- Теперь модуль читает getStoryNodesCache() из narrativePackRegistry:
  текущая нода гарантированно в кэше к моменту показа оверлея (её
  показали — значит, её пакет загружен).
- contentTruthManifest: eager-фолбэк '@/data/story' убран; CI-parity
  снапшот перенесён в contentPipelineValidator (он грузится только
  динамически — dev-проверки QuestTracker и npm run validate), так что
  полный граф по-прежнему доступен валидатору, но не бандлу.
- Тесты переведены на рантайм-пути вместо мёртвого eager-фолбэка:
  freeExplorationHub.test повторяет bootstrap-порядок
  (loadStoryPack('act1') + loadSceneExploreHubs()), ambientPlayContext
  мерджит ноду через mergeStoryNodesIntoCacheForTests, expansionContent
  передаёт статический граф явно.

## v4.20.0 (2026-09-12) — типографика кат-сцен и опасные зоны окружения

### Контент
Волна A/C из ТЗ: визуальное качество кат-сцен (проброс type в оверлей)
и расширение системы опасных зон (приоритет C — environment hazards).
Верификация — только статический анализ: `tsc --noEmit` (0), ESLint (0),
vitest (2615/2615). Dev-сервер не запускался.

### fix: type кат-сцен не пробрасывался в оверлей — стили актов никогда не срабатывали
- `CutsceneDef.type` существовал в данных, но `overlayFromCutscene`
  (cutsceneToTimeline.ts) его не копировал, а `CinematicTimelineRunner`
  хардкодил `type: 'character_intro'` → у ВСЕХ 14 сюжетных кат-сцен
  была типографика «знакомства» (4xl light), а не своя:
  act_transition (8xl bold, tracking 0.3em, FilmGrain, ярлык
  «volodka rpg»), revelation (7xl + 30 угольков), story_moment (italic).
- Проброска: CinematicOverlayConfig.type → phases[0].overlay.type →
  payload cutscene:overlay → CutsceneOverlay (payload.type).
- Данные: 5 из 14 кат-сцен жили без type (act2_to_act3, act3_to_act4,
  act4_to_act5, poem_virus_revelation, resistance_awakening) — всем
  проставлен явный type + oneShot/letterboxStyle по образцу сиблингов;
  финалу добавлены угольки, «Тени сгущаются»/«Революция» — глитч,
  «Чёрная Чернильница» — угольки в розовом акценте.
- Регрессия: cutscenes.test.ts (7 инвариантов данных: 14 уникальных
  id/triggerStoryNode, type у всех, кириллица текстов) + расширение
  cinematicTimelineController.test.ts (проброс type у всех 14).

### fix: скрытие текста кат-сцен расходилось с таймлайном на низком FPS
- Автоскрытие оверлея жило на wall-clock setTimeout(remainingMs), а
  таймлайн — кадровый (dt клампится 0.05с): при <20 FPS / свёрнутой
  вкладке таймлайн растягивался, и текст гас среди полёта камеры
  (остаточная форма аудита Task 3 «камера летит в тишине»).
- Теперь managed-оверлеи скрываются по `cutscene:overlay_end` из
  completeCinematicTimeline (естественное завершение / скип / orphan-
  watchdog), а wall-clock таймер — страховка с grace +4с (для
  reduced-motion кламп ≤2.5с сохранён).
- Данные: textDurationMs у 14/14 выровнен с Σ waypoints (поле теперь
  «нижняя граница fallback-оценки», комментарий переписан) — аудиторский
  гэп 500–3000 мс закрыт и на уровне данных.

### feat: 4 новые опасные зоны + тип «Белый шум» (9 зон в 9 сценах)
- Приоритет C ТЗ: опасные зоны расширенны с 5 до 9 — плесень в подвале
  библиотеки (toxic), шина под напряжением в серверной Гильдии
  (electric), южный край заводской крыши (fall), глушилка «Белого
  шума» в бункере Сопротивления (новый тип static — перекликается с
  фазой «Белый шум» босса «Тихий Хранитель» из «Крипты Тишины»).
- Все размещения проверены против геометрии сцен: вне главных
  маршрутов (обходится по выбору игрока — тактическая глубина
  «стресс-дебаффы перед боем»).
- Новый тип static: label «Белый шум», цвет #cfe8ff, 3D-маркер
  концентрических колец помех (бегут наружу со сдвигом фазы),
  fx-кейс (холодная вспышка + хроматика).

### feat: звук опасных зон + независимые тики наложений
- Раньше у зон не было ни одного звука: теперь вход в зону и каждый тик
  урона проигрывают процедурный sfx своего типа (6 новых пресетов
  hazard_* в SFX_PRESETS, маппинг HAZARD_KIND_SFX).
- Наложение зон: аккумулятор тика стал предзонным (Map<zoneId, dt>) —
  каждая зона тикает своим интервалом; переход A→B больше не наследует
  накопленное время A (мгновенный первый тик B — мини-баг). HUD
  показывает сильнейшую зону (pickStrongestHazard: стресс → урон → id).
- Тосты входа перезаряжаются при смене сцены (раньше — один раз за
  сессию, Set не чистился).

### feat: HUD-индикатор опасной зоны — редизайн с деталями
- Иконка типа опасности в акцентном «стеке» с пульсацией (reduced-motion
  выключает): Flame / Zap / Biohazard / TriangleAlert / Waves /
  AudioLines; акцентная рамка и свечение полоски тика — в цвет зоны из
  единой палитры HAZARD_KIND_COLOR (совпадает с 3D-маркером в мире);
  двухстрочная компоновка (тип + таймер), backdrop-blur.

### Верификация
- tsc --noEmit: 0; ESLint: 0 ошибок; vitest: 424 файла, 2615/2615.
- Новые/обновлённые тесты: cutscenes.test.ts (7), environmentalHazards.test.ts
  (+7: pickStrongestHazard ×3, sfx-мэппинг, static-реестры, новые сцены),
  cinematicTimelineController.test.ts (+1: проброс type).


## v4.19.1 (2026-09-12) — оживление сюжетных боёв и честность наград

### Контент
Пост-контентная волна: два системных фикса, вскрывшихся после доставки
приоритета F (v4.18/4.19). Верификация — только статический анализ:
`tsc --noEmit` (0), ESLint (0), vitest (2603/2603). Dev-сервер не запускался.

### fix: combat-эффект в выборе story/dialogue-узла запускал бой
- 16 сюжетных боёв молча пропускались: applyEffects в choice-путях
  (executeStoryChoice / executeDialogueChoice) вызывался без коллбэка
  startCombat — игрок выбирал «драться», а повествование сразу переходило
  на пост-бойную ноду, описывающую победу, которой не было.
- Затронуты: акты 3–7 (включая сюжетных боссов boss_neuro_sys,
  boss_dream_eater, nexus_guardian ×2, void_echo, boss_final_code,
  corporate_golem, system_daemon, shadow_agent) и все три патруля
  «Крысиных гонок» (streetLegends).
- Теперь executor передаёт мост в CombatSystem (encounterSource: 'story');
  благодаря асинхронности presentation-beat навигация на пост-бойную ноду
  успевает выполниться до коммита боя — она пушится как return-node,
  оверлей прячется, после победы/поражения игрок возвращается на неё
  (поражение = ретрай того же выбора).
- Mount-эффекты узлов намеренно без моста: возврат на узел после боя
  повторно применил бы combat-эффект и зациклил встречу.
- Регрессия: 3 теста в narrativeChoiceExecutor.test.ts.

### fix: npcChange-награды квестов начисляются при завершении
- 35 наград отношений (5 файлов квестов, включая все фракционные выплаты
  «Фракционных поручений») молча отбрасывались: switch в
  completeQuestAndApplyRewards не имел кейса npcChange, при этом UI обещал
  игроку рост отношений в карточках принятия и завершения задания.
- Теперь применяются после коммита player-батча: прямой платёж цели
  (setNpcRelation, fairmath, скейл перками) + разбавленное распространение
  на фракцию (×0.3) — зеркально пути applyEffects.
- UI-честность карточек: npcChange отображается во всех четырёх местах
  (диалог принятия с иконкой Heart и лейблом «Отношения: …», диалог
  завершения с 🤝, карточка целей HUD, сводка уведомления).
- Регрессия: fairmath-тест в questCompletionRewards.test.ts (50 + 8 → 54).

### feat: ростер знакомых в панели репутации фракций
- Чипы встреченных участников фракции под баром: топ-5 по отношению,
  «+N» для остальных; цвет точки — по ступени отношения NPC.
- Прогрессия ступеней: светящийся тик границы следующей ступени на баре
  + подпись «до «Друг»: N» в центре шкалы.
- Анимации: свайп-смена цифры средней репутации, блик на заполненной части
  (отключается при reduced-motion).
- Чистая функция buildAllFactionMembers (конвенция «met» как в
  buildRelationsByFaction); в панели — useMemo по ref-подпискам.
- Регрессия: 3 теста в factionReputationSelectors.test.ts.

### Счётчики
- 2603 теста (+7), 153 квеста, 628+ диалоговых узлов, 52 NPC.

## v4.19.0 (2026-09-12) — «Крипта Тишины»: боссовое подземелье

### Контекст
Вторая контент-волна приоритета F из ТЗ (подземелье с боссом). Приоритет F
закрыт полностью: 5 фракционных квестов (v4.18.0) + босс-данж. Верификация —
только статический анализ: `tsc --noEmit` (0), ESLint (0), vitest (2596/2596).

### Новый босс — Тихий Хранитель (boss_silent_warden)
- 520 HP, три фазы: «Слушатель» (×1.0) → «Помехи в архиве» (×1.3, i-frame,
  призыв) → «Белый шум» (×1.6, ×1.5 скорость). Пороги 100/60/30 без разрывов.
- Телеграфируемые спец-атаки: Поле Тишины (защита −30%, энергия −8),
  Архивный Залп (×1.6 урон, стресс +4), Белый Шум (×1.9, +8 атака себе).
- Аффинности: стихи ×2.0 (главное оружие), код ×1.5, физика ×0.5, логика ×0.7.
- Полный UI-контур: интро-синематик 3с, босс-бар с фаз-пипсами,
  ethereal-визуал 1.5, AI-поведение Крипты (агро 14, leash 24), лут-таблица.
- Победа автоматически ставит флаг `boss_silent_warden_defeated`.

### Подземелье (бункер Сопротивления, ярус −2)
- Квест fc_silent_warden «Крипта Тишины» (hard, акт 4, Сопротивление):
  вход — только после «Частоты „Заря-М“» (фракционная награда доверием).
- 3 триггер-зоны по глубине коридора: врата (examine → нода пред-боя),
  засада (autoTrigger → бой, ретрай при поражении), архив (после победы).
- 4 story-ноды с моральным финалом: отдать ленты правды Кате (+5 кармы)
  или запечатать архивы (город заслуживает тишины, +2).
- Сеттеры всех flag_set-объективов в паке — инвариант KNOWN_DEAD_FLAG
  остаётся пустым (все 153 квеста завершаемы).

### Технический состав
- 9 файлов кода босса: EnemyType, ENEMY_TEMPLATES, BOSS_ENEMY_TYPES,
  BOSS_PHASE_MAP, аффинности, AI-оверрайды, визуал, BOSS_BAR_DATA,
  BOSS_INTRO_DATA.
- Инвариант-тест silentWardenDungeon.test.ts: 12 проверок (регистрации,
  фазы/пороги, шансы/кулдауны атак, лут, зоны по глубине, гейты флагов,
  мост, requiresQuests, карма).
- Счётчики: 153 квеста (+1), 2596 тестов (+12).

## v4.18.0 (2026-09-12) — «Фракционные поручения»: 5 новых фракционных квестов

### Контекст
Первая контент-волна приоритета F из ТЗ (фракции). Пять новых побочных
квестов — по одному на каждую фракцию города плюс один кросс-фракционный,
связывающий все стороны конфликта. Верификация — только статический анализ:
`tsc --noEmit` (0 ошибок), ESLint (0), полный vitest-прогон (2584/2584).
Dev-сервер не запускался.

### Новые квесты (fc_*, Акт 3–4)
- **«Эхо на проводе» (fc_network_echo, Сеть)** — эхо Марата рассыпается
  на три фрагмента: терминал кафе, серверная стойка Гильдии, старый телефон
  на крыше. Сбор + моральный выбор: отпустить в эфир или переписать в тетрадь.
- **«Три минуты слепой зоны» (fc_guild_blind_spot, Гильдия)** — Олег выносит
  чип со списком наблюдений за 3:14–3:17. Курьерская доставка через ночной
  город до бункера + выбор: передать Сопротивлению или расплавить.
- **«Частота „Заря-М“» (fc_resistance_zarya, Сопротивление)** — подъём
  вещательной станции: перфокарта-пароль из книжного подвала, медь от Зины,
  антенна на крыше завода. Тест-эфир + выбор частоты: шифр для своих или
  открытая для всего города.
- **«Угольные письма» (fc_tolpa_embers, Толпа)** — у костра ЧК пропадают
  письма, которые пишут в огонь. Расследование: Сталкер → тропа →
  гость-аналитик с «полевым материалом». Три финала, включая доставку
  писем «по назначению».
- **«Руки, которые чинят» (fc_neutral_hands, кросс-фракционный)** — три
  доставки Зины трём фракциям; каждая предлагает «эксклюзив» за её руки.
  Финал: честность (карма +5), обещание всем троим (карма −5) или молчание.

### Технический состав
- 28 новых story-нод (`factionContractsStory.ts`): моральные выборы, карма,
  навыки, выдача/изъятие предметов, смены сцен, accessibility-аннотации,
  guidance-подсказки. Тон — пост-советский киберпанк, нумерология «трёх».
- 5 диалоговых мостов в greeting-узлах квестгиверов (expandedDialogueNodes,
  chkTolpa/dialogues) с act-гейтами и missingFlag-защитой от повторов.
- Регистрация пака: `quests/index.ts` (спред), `buildStoryNodes.ts`
  (источник factionContracts), `narrativePackRegistry.ts` (сателлит
  factionContracts + ленивый загрузчик — паритет статика/рантайм).
- Инвариант-тест `factionContracts.test.ts`: 13 проверок — структура пака,
  5 фракций, валидность всех NPC/предметов/сцен, сеттеры всех flag_set
  объективов (KNOWN_DEAD_FLAG_OBJECTIVES остаётся пустым), addItem-выдача
  всех item-объективов, резолв всех next/мостов/квестгиверов, 5 разных
  механик, карма-выборы, XP в диапазоне 80–220.
- Счётчики контента: 152 квеста (+5), 628+28=656 story-нод пака,
  2584 теста (+13).

### Контекст
Экспертный статический аудит (5 параллельных направлений: рендер-ядро,
геймплей, UI/HUD, контент, аудио/state). Верификация — только статический
анализ: `tsc --noEmit` (0 ошибок), ESLint (0), полный vitest-прогон
(2571/2571). Dev-сервер не запускался.

### Критические фиксы
- **MusicEngine: музыка не играла вообще.** `stopMusic()` инкрементирует
  `sceneGeneration`, а токен поколения в `playSceneMusic`/`playMenuMusic`
  захватывался ДО `stopMusic()` — guard абортил каждый старт бэда.
  Дополнительно: кроссфейд (startDelay=900) вычислялся после обнуления
  `currentScene` (мёртв), а `pendingStopCleanupTimer` старого бэда убивал
  бы узлы нового через ~1.5с после старта.
- **PatrollingCreeps: осцилляция крипа сквозь игрока.** Позиция дуэли
  считалась как `player + dir·2.4` (за игроком) вместо `player − dir·2.4` —
  крип перебрасывался на противоположную сторону каждый кадр (рывки 4.8м,
  флип yaw 180°). Три места: applyStrike, per-frame inArena, автовход в бой.
- **useSkinnedGltfClone: dispose без skip-сета.** SkeletonUtils.clone()
  шарит geometry/material/текстуры с кэшем useGLTF — dispose клона
  уничтожал общие ресурсы → ре-аплоад буферов и перекомпиляция шейдеров у
  живых клонов (спайки-фризы при LOD-свитчах NPC и смене сцен). Skip-сет
  строится на каждый эффект и мерджится с опциями вызова. AmbientSkinnedMidLod
  диспозил общие GEOMETRY — исправлено аналогично.
- **NPC мутировали SHARED-материалы.** GltfNPCModel применял
  deplasticize + tint к материалам клона, шарящимся с кэшем (17 ригов на
  30+ NPC): tint/glow протекал между NPC, roughnessMul=1.3 применялся
  повторно на каждом маунте. Новая утилита
  `engine/graphics/materials/cloneSceneMaterials.ts` (Map-дедуп — shared-связи
  внутри клона сохраняются). AmbientSkinnedMidLod: deplasticize перенесён
  ПОСЛЕ клонирования.
- **12 мёртвых флагов — 6 квестов были незавершаемы.** Сеттеры: 5
  choice-эффектов в milestoneDialogues (книга Заремы, тетрадь Солныш) +
  10 триггер-зон «DEAD-FLAG REPAIR» (архив Марата и его стихи, сверка и
  судьба тетради, отключение «Ока» двумя шагами, свидетель тётя Роза и
  передача тетради, честь Поэта у костра, рубильник «Протокола Чистоты»).
  `KNOWN_DEAD_FLAG_OBJECTIVES` пуст — инвариант «новые флаги несут сеттер»
  полный.
- **Бар кармы врал.** Шкала считалась по −100…+100 при клампе стора 0…100:
  75% при старте (вместо 50%), ниже 25% не опускался никогда. Пороги цвета
  приведены к `KARMA_HIGH/LOW_THRESHOLD` из data/constants.

### Мобильное управление
- Слой джойстика помечен `data-exploration-ui` — драг джойстика больше не
  вращает камеру (window touchstart орбит-инпута считал его «канвасом»).
- Пинч армят только когда ОБА пальца на канвасе (палец джойстика + палец
  камеры больше не дают случайный зум).
- `pointerType === 'touch'`-гейт — на тач-ноутбуках невидимый слой левой
  половины не перехватывает ЛКМ (взаимодействие/орбита слева работали
  некорректно).
- «Бег»: сайд-эффект убран из setState-апдейтера; подписка на write-гейт
  (`subscribeVirtualControlsGate`) сбрасывает тоггл при закрытии гейта.
- Прыжок: 120мс-удержание вместо одноразового rAF-импульса (порядок rAF
  против R3F-кадра не детерминирован — прыжок терялся).
- Джойстик-bridge восстанавливает оси при открытии write-гейта.

### Аудио / воркеры / стриминг
- `computeWorkerClient`: таймаут ответа 3с, reject всех pending при
  terminate (стриминг чанков больше не висит вечно), строгое сравнение id
  (reset-ответ больше не резолвит чужой запрос), messageerror-обработчик,
  ленивый revive.
- `gltfPreloadScheduler`: combat:end-хук переживает teardown EventBus
  (rearmGltfPreloadCombatHook в resetEngineModuleRuntimeState) — очередь
  прелоада не застревает на паузе навсегда после StrictMode-ремаунта.
- `ProceduralSoundscapes` на общем `SharedAudioContext` (лимит Chrome ~6
  контекстов больше не исчерпывается при ремаунтах), dispose освобождает
  только собственные узлы.
- Очередь `whenAudioReady` ограничена 32 колбэками (дроп старых) — нет
  залпа наложенных звуков после первого жеста.

### Комбат / UX / HUD
- Вертикальный фильтр хитбокса замаха (`MELEE_STRIKE_VERTICAL_TOLERANCE_M`):
  крип на этаж выше/ниже больше не получает удар сквозь перекрытие.
- Кат-сцены: overlay закреплён на ПЕРВОЙ фазе, длительность = остаток
  таймлайна — заголовок акта виден весь полёт камеры (6.5–8с), а не
  последние 1.5–2с.
- z-index CSS-токены (`--z-menu/--z-panel/--z-tooltip`) синхронизированы с
  `UI_LAYERS` (58/60/62) — тултипы не под панелями.
- Тост обратной связи инвентаря над панелью (`UI_LAYERS.TOOLTIP`).
- Мобильная миникарта уважает iOS safe-area (`env(safe-area-inset-*)`).
- Событийные тосты перенесены в топ-центр (не наезжают на индикатор
  сложности и бафф-трекер правой колонки).
- Подсказки хоткеев: Tab/M — «Карта мира» (не инвентарь), Y — «Карма и
  стихи» (не отношения), добавлен F — быстрый переход.
- Крестик закрытия настроек — 44px тач-таргет. Осевые клавиши гасят
  дефолт (стрелки не скроллят документ).

### Производительность
- Удалены CSM-каскады с intensity=0 (`CascadedShadowMaps.tsx`): в three.js
  тень умножает вклад света — нулевой вклад = ноль тени, но 2048+1024
  shadow-карты рендерились каждый кадр на high/ultra outdoor.
- `useDynamicDPR`: ring-буфер на двух Float64Array — нулевая аллокация в
  rAF-цикле (включая demand-фреймлоуп меню).
- Общий 5Hz-тикер `engine/lod/lodActiveUrlTicker.ts` вместо
  setInterval(200мс) на каждый LOD-ассет.

### Контент-гигиена
- Порядковая коллизия стихов-стабов (poem_36/37 → order 112/113) — мина
  при слиянии кодекса обезврежена.

## v4.17.0 (2026-09-07) — плотность Acts 3–4: многобитовые кейсы и детектор мёртвых флагов

### Контекст
Roadmap «Days 31–60 → Content: Acts 3–4 dialogue density» (последний
открытый пункт волны). Анализ плотности (r7-explore) показал: четыре
сюжетно значимых квеста Acts 3–4 были тонкими (3–5 объективов, 0 квестовых
диалогов, ≤350 слов), а один объектив вообще не имел сеттера флага —
квест whisper_of_walls был незавершаем. Канон утолщения — act1Extended
(«6–12 бит на кейс»): объективы + цепочка story-узлов + зоны + хабы.

### Новое
- **`src/data/story/act34CaseExpansions.ts`** — 19 story-узлов, четыре
  многобитовых кейса:
  - **Крыша Мира** (прелюдия финала, 5 битов): лестница с охранником
    (парле «красная ручка» или воздуховоды) → поле антенн (позиция по
    ветру) → первое слово (город-схема) → прошлое Александра (2029,
    14 минут, 704/3108) → стык с существующим финальным выбором.
  - **Защита Хранилища** (военный совет, 5 битов): арифметика Альберта →
    роли по строфам (баба Зина с чайником) → фаервол из стихов (дождь/
    зеркало/честная строка) → волна прорыва (дроны-инспекторы и
    дешифраторы против метафор) → финальная волна: хор из двенадцати
    голосов против «Протокола Забвения».
  - **Правда Виктории** (детектив, 4 бита): бариста за сменой (блокнот
    дат) → картотека 2029 (спецконтур 4729) → эхо-флешбэк (полсекунды
    ручки) → стенгазета 2031 (фрагмент личности 12%).
  - **Нить из 18 строк** (сшивание, 5 битов): Фёдор-свидетель → обелиск
    (18 имён) → акростих «ПРОГРЕСС СЕМЬ ЖИВЫХ ПОМНИТ» → сердце гула
    (дышащий монолит П-7) → сшивание нити у камня.
- **Квесты утолщены**: roof_of_the_world 3→8, vault_defense 4→9,
  maria_truth 4→9, thread_of_18_lines 3→8 объективов (все новые
  флаг-объективы с сеттерами, linkedStoryNodeIds дополнены узлами пака).
- **Входы**: +11 выборов в хабах sceneExploreHubs (rooftop/park/office/
  cafe/library, флаг-гейты mid-resume) + 6 narrative-зон (5 vault-битов
  в abandoned_factory + сердце гула в factory_basement).
- **Лор**: 4 новые записи кодекса (Охранник, который писал / Спецконтур
  4729 / Восемнадцать имён Фёдора / Нить из 18 строк — legendary).

### Исправлено
- **whisper_of_walls был незавершаем**: флаг `bunker_recordings_heard`
  нигде не ставился. Добавлены 4 зоны бункера: катушечный проигрыватель
  (выдаёт bunker_recording_device) + три плёнки («Столовая» / «Совещание»
  / «Последняя» — последовательное прослушивание, третья ставит флаг).
- **Мёртвые флаги Acts 3–4** (7 квестов незавершаемы): watchers_shadow
  (узел Смотрящего в гильд-мейнфрейме + чип), night_shift (три фантома +
  рубильник «Аварийный Останов»), catacombs_shadows (тёмный маг,
  побеждённый произнесёнными именами).

### Тесты
- **NEW `flagSetObjectiveSetters.test.ts`** — системный ракет-тест:
  каждый flag_set-объектив обязан иметь сеттер (story/dialogue/зоны/
  награды) либо быть в осознанном whitelist (движок минигеймы) либо в
  списке известного долга. Долг виден явно (12 позиций: expansion stubs
  + chkTolpa), список только сокращается. Этот тест ловит ровно тот
  класс багов, что делал whisper_of_walls незавершаемым.
- **NEW `act34CaseExpansions.test.ts`** — 11 инвариантов кейсов: ≥7
  объективов, сеттеры новых флагов, ключ==id, contextNote+announce,
  резолв choice.next, прямые (roof/vault) и хаб-опосредованные цепочки,
  BFS-достижимость всех 19 узлов из хабов (+рёбра зон), linkedStoryNodeIds,
  русский текст без CJK.
- Полный прогон: **421 файл / 2570 тестов PASS** (было 419/2556).

### Инженерное
- Новый story-пак регистрируется в ДВУХ реестрах: `buildStoryNodes.ts`
  (статический merge) + `narrativePackRegistry.ts` (сателлит-лоадер
  `act34CaseExpansions` + `STANDALONE_STORY_SATELLITE_ORDER`) — иначе
  narrativeRegistryParity ловит расхождение (поймал при разработке).
- Runtime-паритет: узлы пака доступны ensureStoryNode по спросу.


## v4.16.0 (2026-09-07) — арки проработки мыслей: внутренний диалог обретает прогрессию (Thought Cabinet arcs)

### Контекст
Аудиторский трек 132/132 закрыт (v4.15.8, ⚠ = 0). Фокус раунда —
`docs/AA_QUALITY_ROADMAP.md`, волна «Days 31–60»: «Content: Acts 3–4
dialogue density + **Thought Cabinet arcs**». Кабинет мыслей был
плоским: экипировал → полные эффекты мгновенно. Диско-Элизиум-механика
«проработки мысли» (internalization) превращает выбор голоса в
долгосрочное решение: арочная мысль включается постепенно, а не
мгновенно — системная плотность без единого нового ассета.

### Новое
- **`src/shared/thoughts/thoughtInternalization.ts`** — чистая логика
  арок (shared-слой: доступен и store, и engine, и UI). Каноническая
  таблица `THOUGHT_INSIGHT_POINTS` (выбор 2 / проверка навыка 3 / сцена
  2 / победа в бою 4 / объектив квеста 5 / стих 4) — единый источник
  правды для драйверов и тестов. Прогресс — доля 0..1, кламп очков;
  `partialEffects: true` — линейный целочисленный масштаб (округление
  «от нуля», знак сохраняется, ноль на старте), `false` — гейт: эффекты
  только на 100%. Вехи (`milestones`) пересекаются строго «вверх»,
  однократно (сравнение до/после — при загрузке сейва повторов нет);
  финал — отдельный канал `completionText`. Завершённые мысли больше
  не копят очки; `advanceInternalizationPoints` чистый, без мутаций.
- **Контент**: 10 арок для знаковых мыслей всех семи голосов —
  Внутренний Критик (60), Серверный Шёпот (80), Эмпатический Радиус
  (90), Тёмный Юмор (50), Шестое Чувство (70), Голос Стихии (100),
  Ритм Серверной (120, гейт — Ритм-Синхронизация только после полной
  проработки), Постсоветская Ностальгия (70), Сопротивление Системе
  (80), Память о Потерях (90, hidden). У каждой — 3 вехи с репликами
  внутреннего голоса (25/50/75%) и финальная реплика. Мысли без арки
  работают как раньше — мгновенные полные эффекты (обратная
  совместимость сейвов).
- **Срез**: `thoughtInternalizationPoints` (persisted), действие
  `advanceThoughtInternalization(event)` (начисляет очки, шлёт
  уведомления вех/финала через кросс-слайс), `getEquippedThoughtEffects()`
  масштабируется прогрессом, `getThoughtInternalizationFraction(id)`.
  Снятие мысли сохраняет прогресс — повторная экипировка продолжает.
- **Драйверы**: 6 слушателей в `useGameLifecycleManager`
  (choice:made, scene:loaded, combat:victory, quest:complete_objective,
  poem:collected, skill:level_up) — событийная прогрессия, ноль
  таймеров.
- **Боевой мост**: `resolveThoughtCombatEffects` /
  `resolveThoughtCombatContributions` принимают карту очков из
  снапшота (кэш-ключ снапшота дополнен полем — изолированные
  изменения очков больше не дают стейл-эффекты в бою), вклад
  масштабируется, в описаниях виден «(проработка NN%)».
- **UI**: карточка мысли — бейдж «ПРОРАБОТКА 42%» / «ПРОРАБОТАНО»;
  детальная панель — `InternalizationProgressSection`: прогресс-бар
  с тиками вех 25/50/75, прошедшие вехи показывают авторский текст,
  будущие скрыты маской, финальная реплика после завершения; CSS со
  сканлайнами и pulse-анимацией завершённой арки (reduced-motion
  уважается). HUD-бейдж голосов — процент проработки в чипе и
  цветовая точка, наливающаяся по прогрессу.
- **Persistence**: `thoughtInternalizationPoints` в
  `SavePayloadSchema` (record<string, number>, default {}) — старые
  сейвы совместимы, новые не разбухают (очки клампятся); поле в
  persisted-дефолтах и patchState PLAYER_KEYS.

### Верификация
- tsc — 0 ошибок; eslint — 0 ошибок/0 новых предупреждений;
- vitest — **419 файлов / 2556 тестов PASS** (+2 файла, +33 теста:
  24 чистых + 9 срезовых, включая гейт-арку, вехи, финал,
  unequip/re-equip, совместимость безарочных мыслей);
- validate — 0 ошибок/0 предупреждений; placement — 799/0.

### Правила (новые для ARCHITECTURE.md)
- Чистая логика домена, нужная store и engine одновременно, живёт в
  `src/shared/**` — не в `src/engine/**` (no-restricted-imports:
  store не импортирует engine).
- Новое событие-источник очков прозрения → только в
  `THOUGHT_INSIGHT_POINTS` + слушатель в lifecycle-менеджере.

## v4.15.8 (2026-09-07) — пробуждение канваса «по спросу» + стабильная сортировка NPC-бэтча (этапы 64 и 110 закрыты; ⚠ = 0, 132/132)

### Контекст
Финальные две позиции бэклога аудита. Этап 64: «Меню-keep-alive
invalidate 2с — известная цена demand-режима (интервал в меню)».
Слепой интервал в CanvasFrameloopController каждые 2 секунды гонял
полный кадр R3F (все useFrame-колбэки NPC, процедурные слои, рендер
с тенями) — в том числе в главном меню и интро, где канвас
CSS-скрыт (`visibility: hidden` в OrchestratorCanvasLayer): чистая
трата CPU/GPU на невидимый рендер, плюс фоновая вкладка, где rAF
и так не срабатывает. Этап 110: «rebuildSortedEntries churn при
50 NPC» — `enabled`-опция в deps-массиве useLayoutEffect хука
useRegisterNpcFrame: инлайн-стрелки (`enabled: () => cond`)
получали новую идентичность на каждом рендере, каждое перерисовывание
NPC-компонента сносило и заново регистрировало запись бэтча, ставя
dirty — и пересортировка `[...entries].sort()` выполнялась почти
каждый кадр.

### Новое
- **`src/engine/canvas/canvasKeepAliveBurst.ts`** — событийные окна
  пробуждения вместо слепого интервала. Меню/интро/скрытая вкладка:
  интервал убран полностью — бут-пайплайн продвигают собственные
  механизмы (пинки монтирования 100/500/1500 мс, сердцебиение
  sceneLoadedGate каждые 1.5 с → `canvas:invalidate-first-frame`,
  слушаемое контроллером), выход из demand-режима инвалидируется
  эффектом `[idle]`; после бута рендер в скрытом меню — 0 кадров.
  Story-оверлей (диалог): канонический реестр событий, которые реально
  анимируют мир за оверлеем — `npc:entry_start`/`npc:exit_start`
  (окно EXIT_TIMEOUT_S + 500 мс), `npc:animation`/
  `npc:emotion_triggered`/`quest:pulse_marker` (700 мс). Окно —
  цепочка rAF с дедлайном: полно-FPS анимация, пока переход NPC
  реально идёт, самозавершение по дедлайну, перекрывающиеся события
  расширяют окно (max); в always-режиме пробуждение не срабатывает
  вовсе; dispose гасит цепочку и отписки. Побочных таймеров нет.
- **`RPGGameCanvas.tsx`**: keep-alive-эффект переведён на
  `startKeepAliveBurst` (isStaticScreen через latest-ref), интервал
  2 с удалён.
- **`npcFrameBatch.ts` (этап 110)**: `enabled` выведен из deps-массива
  `useRegisterNpcFrame` — обёртка читает `enabledRef` в момент вызова,
  по-кадровая семантика сохранена (undefined → всегда активен,
  boolean → значение, функция → вызов), ре-рендеры компонентов больше
  не перерегистрируют записи: dirty/пересортировка возникают только
  на реальных монтированиях/демонтажах/смене NPC. Добавлен
  наблюдаемый счётчик `getNpcFrameBatchRebuildCount()` для
  регрессионного детектора churn.

### Тесты
- NEW `src/engine/canvas/canvasKeepAliveBurst.test.ts` (6): без
  событий — 0 инвалидаций и 0 запланированных кадров; окно
  entry_start идёт кадрами и самозавершается по дедлайну; always-режим
  не инвалидирует; перекрывающиеся события расширяют окно (max);
  dispose гасит цепочку и отписывает; согласованность констант.
- NEW `src/engine/npc/npcFrameBatch.hook.test.tsx` (6): 50 ре-рендеров
  с новой инлайн-идентичностью enabled → 1 запись и 1 пересортировка
  (churn-регрессия); семантика enabled false/true/функция без
  перерегистрации; без опций — всегда активен; смена ownerKey
  перерегистрирует, смена колбэка — нет; анмаунт снимает регистрацию.
- Полный прогон: tsc 0 · eslint 0 (73 предсуществующих warnings) ·
  vitest 417 файлов / 2523 теста · validate 0 нарушений · placement 799/0.

## v4.15.7 (2026-09-07) — бюджет экранных FX для iGPU + пинч-зум (этапы 32 и 121 закрыты)

### Контекст
Этап 32 аудита: «Пиковые full-screen FX-слои: 7 композит-слоёв —
кандидат дропов на iGPU». В пике комбата одновременно жили flash +
damage vignette + хроматика + винетки низкого HP ×2 + edge-полосы +
glitch-канвас — каждый отдельный full-screen композит-слой браузера;
на интегрированных GPU это fill-rate и дропы кадра. Этап 121:
`user-scalable=no` в viewport-мете — a11i-минус (WCAG 1.4.4/1.4.10),
компенсированный uiTextScale, но жест зума был недоступен в принципе.

### Новое
- **`src/engine/fx/screenFxBudget.ts`** — единый бюджет экранных FX по
  пресету качества (чистая функция, 4 тира): low — 1 оверлей, без
  хроматики/blend/бесконечных пульсаций, merge дублирующих красных
  слоёв, DPR канваса 1; medium — 2 оверлея, хроматика без blend,
  статичные винетки; high — 3 оверлея, полный стек; ultra — 4.
- **`ScreenEffects`** уважает бюджет: пул flash-оверлеев ограничен
  `maxOverlayLayers` (вытеснение старых — свежий хит важнее);
  `combat:hit` больше не дублирует мелкий красный flash поверх
  damage vignette (low/medium); хроматика гейтится; `mixBlendMode`
  отключается на low/medium; LowHealthVignette — merge винеток
  энергии/стресса и HP в один слой + статичный режим без бесконечных
  пульсаций (композитор не перерисовывает градиент бесконечно).
- **ВАЙРИНГ МЁРТВЫХ СОБЫТИЙ**: `fx:screen_flash` и `fx:chromatic_burst`
  эмитились AaaCombatCinematic с момента его появления, но не имели
  НИ ОДНОГО слушателя — теперь пробрасываются в общий flash-пул и
  хроматический слой (кинематографический фидбэк критов и хитов
  игрока наконец виден, с бюджетом и reducedMotion-клампом).
- **`GlitchEffect`**: DPR full-screen glitch-канваса ограничен бюджетом
  (low 1 / medium 1.25 / high 2 / ultra 3) — перерисовка канваса
  в DPR 3 больше не дропает кадр на iGPU.
- **`HUDChromaticEdge`**: edge-полосы отключаются на low-тире.
- **Этап 121**: настройка «Масштабирование жестом (пинч)» в разделе
  «Доступность» (выключена по умолчанию — игровая фиксация viewport).
  Включение переписывает `<meta name="viewport">` без блокировки зума:
  новый модуль `pinchZoomViewport.ts` + третий тип DOM-хука
  `viewportMeta` в accessibilityDomPresentation. Управление через
  settings-фасад: `setPinchZoomEnabled`, LS-ключ
  `volodka_pinch_zoom_enabled`.

### Тесты
- NEW `src/engine/fx/screenFxBudget.test.ts` (4): детерминированность
  по тирам, самый строгий low, монотонность low→ultra (бюджет не
  ужесточается при росте тира), medium без blend / ultra с полным.
- NEW `src/engine/accessibility/pinchZoomViewport.test.ts` (4):
  зумируемая мета без user-scalable=no/maximum-scale, возврат игровой
  фиксации, идемпотентность, no-op вне DOM (SSR) и без мета-тега.
- Полный прогон: tsc 0 · eslint 0 (73 предсуществующих warnings) ·
  vitest 415 файлов / 2511 тестов · validate 0 нарушений · placement 799/0.

## v4.15.6 (2026-09-07) — сателлитные диалоги: 202 «мёртвых» узла достижимы через темы-хабы (этап 84 закрыт)

### Контекст
Этап 84 аудита: «Диалоги: 607 узлов, BFS достижимости — 202 сателлита
недостижимы (мёртвый груз данных)». Треть диалогового контента игры —
глубокие авторские ветки (part2–5 expanded, WS-спринты ws17b/ws22b/ws23b/
ws26, act3/act4 expansion: квест-финалы, тюремная линия Заремы,
исповедь Дмитрия, эволюция Александра, эпилоги всех NPC) — существовала
в данных, но ни один внешний вход (NPC-вход, story-выбор, триггер-зона)
на неё не вёл. Игрок физически не мог увидеть этот контент.

### Новое
- **`src/data/dialogue/satelliteBridges.ts`** — новый пак (14 узлов):
  **темы-хабы в стиле Gothic 2** для 13 NPC + хаб внутренних монологов
  Володьки. 136 тем-выборов с русскими подписями; поздний контент
  гейтится (`requiredAct` 2–5, флаги событий `zarema_arrested`/
  `watchers_shadow_complete`/`poetry_duel_finished`/…, пороги отношения,
  `missingFlag` для одноразовых событий) — ранние акты не спойлерят
  финалы, cold-приветствия переосмыслены как «воспоминания о первой
  встрече» (работают при любом отношении).
- **Точки входа** (минимальные правки исходников, паритет-безопасные):
  - 7 авторских return-узлов (albert/zarema/alexander/barista/maria/
    colleague/dmitry в part1/part2) получили выбор «поговорить по душам»;
  - 6 entry-узлов NPC-стабов expansion (park_old_man, dying_poet,
    factory_foreman, surveillance_contact, rival_poet_max, fyodor) —
    темы-финалы их квестов (гейт по флагу завершения);
  - `explore_volodka_inner` → хаб размышлений (8 акт-гейтов);
  - 6 новых триггер-зон ambient-сцен: улица×2 (`street_entry_bench`,
    `street_neon_view`), комната (`room_home_ambient`), кухня
    (`home_quiet_corner`, `kitchen_table_ambient`), коридор
    (`corridor_entry_ambient`) — examine-панели с иконками и RU-текстами.
- **Registry**: пак добавлен по правилу «4 зеркальных шага» — статика
  (`dialogue/index.ts`, последним) и рантайм (`DialoguePackId` +
  `DIALOGUE_PACK_ORDER` + лоадер `satelliteBridges`). Коллизий нет
  (все id новые), паритет-тест транзитивно покрывает пак.
- **Русификация**: «Не interested» у Макса (act4_expanded) →
  «Не интересно».
- **Движковые сироты** (найдены НОВЫМ гардом, невидимы для файлового
  сканирования): `zarema_rescue` (спасение с poem_14 и relation+25 —
  теперь тема в хабе Заремы, гейт `zarema_arrested`+`missingFlag
  zarema_rescued`), `explore_corridor_door` и `explore_kitchen_table`
  (имели маппинг в explorationStoryBridge, но ни одного триггера —
  получили зоны).

### Тесты
- **`src/data/narrative/dialogueReachability.test.ts`** (2 теста):
  BFS достижимости от РЕАЛЬНЫХ движковых входов — NPC
  (dialogueNodeId/returnDialogueNodeId/relationMilestones),
  триггер-зоны (linkedDialogueNodeId), story-выборы. Любой новый
  осиротевший узел = красный тест с точным списком id; второй тест —
  хабы ссылаются только на существующие узлы. Гард строже файлового
  сканирования (маппинги-словари и ключи не считаются входами).
- Полный прогон: tsc 0 · eslint 0 · vitest 413 файлов / 2503 теста ·
  validate 0 нарушений · placement 799/0.

### Результат
- Достижимость диалогов: 614/614 узлов (было 412/614) — 100% контента
  играбелен. Итог аудита: ✓95 · ⚙33 · ⚠4.

## v4.15.5 (2026-09-07) — системный uiTextScale: слайдер масштаба управляет всем текстом UI (этап 79 закрыт)

### Контекст
Этап 79 аудита: «Микротекст 7–10px в 194 файлах, частично гейтируется».
Слайдер «Масштаб интерфейса» (настройки доступности, 85–130%) применял
`--volodka-ui-text-scale` на `<html>`, но корневое правило
`html{font-size:calc(16px*var(…))}` масштабирует ТОЛЬКО rem-текст. Реальный
интерфейс задавал размер шрифта px-литералами: ~1200 Tailwind
arbitrary-классов (`text-[7px]`…`text-[13px]`), ~190 ручных CSS-деклараций
и 57 инлайн-стилей React — слайдер не влиял на ~95% текста HUD и панелей.

### Новое
- **`vite/uiTextScalePostcss.mjs`** — PostCSS-плагин `volodka-ui-text-scale`:
  каждая декларация `font-size` с ЧИСТЫМ px-литералом переписывается в
  `calc(Npx * var(--volodka-ui-text-scale, 1))`. Подключён через
  `postcss.config.mjs`. Благодаря `enforce:'pre'` у `@tailwindcss/vite`
  плагин видит уже развёрнутые утилиты — работает в dev и build одинаково,
  ноль правок 194 исходников, будущие `text-[Npx]` подчиняются масштабу
  автоматически. Границы: rem/em/%/calc()/var() не трогаются (нет двойного
  масштабирования rem-цепочки), line-height не трогается (px-leading —
  раскладочный приём).
- **`src/engine/accessibility/uiTextScaleCss.ts`** — хелпер `uiTextScaledPx(N)`
  для инлайн-стилей и DOM-слоёв движка (единый источник имени переменной).
- **Кодмод 57 инлайн-замен** в 29 файлах: `fontSize: '10px'`/`fontSize: 10` →
  `uiTextScaledPx(10)` — HUD-виджеты (SessionPlayTimer, KarmaTierBadge,
  FootstepPedometer, ExplorationProgressBadge, SkillRechargeHUD,
  ActiveQuestMiniTracker, StoryGuidanceHUD), уведомления
  (QuestNotificationSystem, AchievementNotification, AchievementDetailsPanel),
  минигеймы (Hacking, CodeBreaker, BashTerminal, матрицы), индикаторы
  (NpcEmotionIndicator, UmkaDog, WorldItemPickupGlow), WebGL-context-loss
  оверлей, панели квестов/ачивок.
- **Числа урона** (damageNumberLayer): font-size пула теперь через
  `uiTextScaledPx` — боевой фидбэк масштабируется вместе с HUD.
- **Кастомное свойство `--dr-font-size`** (particle-effects.css) — единственный
  найденный обходной случай, переведён на calc вручную.
- Canvas-текстуры 3D-мира (монитры, сны) — диегетический арт, масштабируется
  перспективой камеры; осознанно ВНЕ uiTextScale.

### Тесты
- `vite/uiTextScalePostcss.test.ts` — 9 тестов: переписывание px (вкл.
  минифицированные декларации и `!important`), идемпотентность, неприкосновенность
  rem/em/%/calc/var/line-height.
- `src/engine/accessibility/uiTextScaleCss.test.ts` — 3 теста хелпера
  (вкл. сверку имени переменной с DOM-хуком менеджера).

### Верификация
- Интеграционная проверка реального конвейера (in-process Vite transform,
  БЕЗ dev-сервера): **244 calc-переписывания, 0 оставшихся px-литералов
  font-size** в итоговом CSS (~1.19 МБ).
- tsc 0 ошибок; eslint 0 ошибок; vitest 412 файлов / 2501 тест PASS;
  validate-content 0 нарушений; placement 799/0.

## v4.15.4 (2026-09-07) — вайринг Виктории + dialogue-parity guard (этапы 95–96 закрыты)

### Контекст
Два пункта ⚠-бэклога аудита, рекомендованные к следующему раунду:
- **Этап 95** — NPC `victoria` (хранительница ключей, EXPANSION_NPC_STUBS)
  была зарегистрирована в реестре (сплеш, баки, npcChange-эффекты из story
  act4/6/7), но без `dialogueNodeId` и расписания **не появлялась ни в одной
  сцене**: разговор с ней был невозможен, а флаг `met_victoria` (спящая ветка
  ачивки `story_meet_victoria` в AchievementEngine) не выставлялся никогда.
- **Этап 96** — порядок слияния диалоговых паков в статике
  (dialogue/index.ts) ≠ рантайм (DIALOGUE_PACK_ORDER): part1AlbertExpanded
  стоял 3-м против 11-го, exploration/chk поменяны местами. Коллизий ключей
  нет, но паритет-тест существовал только для story — расхождение было
  не защищено.

### Новое
- **`data/dialogue/victoriaDialogues.ts`** — диалоговый пак хранительницы
  ключей (7 узлов, guild_mainframe):
  - `victoria_greeting` (первая встреча) → `victoria_vault_lesson`
    («стёртые — не мёртвые», открывает легендарный лор
    `lore_guild_first_archivist`) → `victoria_keys_question`;
  - `victoria_who_she_is` → `victoria_key_mistake` — история ошибки,
    оплаченной стиранием (карма/навыки/relation, `showThought`);
  - `victoria_archivist_story` — легенда 4729-А (intuition-чек, открывает
    `lore_guild_founding_secret`);
  - `victoria_return` — повторные визиты с textVariants (high/lowRelation,
    high/lowKarma) — первый возвратный узел с полным набором вариантов.
  Все узлы задают `speakerId: 'victoria'`: без него русский спикер
  «Виктория» резолвится в `maria` (легаси-алиас актов 1–5, где Виктория —
  ИИ-сознание Марии). Это другая, физическая Виктория.
- **Вайринг NPC**: `dialogueNodeId: 'victoria_greeting'` +
  `returnDialogueNodeId: 'victoria_return'` в стабе (entry→return-маппинг
  собирается автоматически через DIALOGUE_RETURN_ENTRY_NODES).
- **`VICTORIA_SCHEDULE`**: пост в серверной гильдии — стойка ключ-карт
  [-1.5,-2.5], обход стоек [0,1.5], ночные смены; act-4 override
  `override_victoria_act4_cafe_farewell` — вечера у дверей кафе (зеркало
  story-узла act4_exp_victoria_sacrifice_prep), до получения пароля
  (`victoria_password_received`).
- **Спящий вайринг ачивки**: `met_victoria` теперь выставляется при первой
  встрече — ветка `flags['met_victoria']` в AchievementEngine
  (story_meet_victoria «Встреча с Викторией») заработала.
- **Parity-гард (этап 96)**: `DIALOGUE_PACK_ORDER` синхронизирован со
  статическим слиянием пакет-в-пакет (part1AlbertExpanded → после
  part5Expanded; chk/exploration → в статическом порядке); новый пак
  `victoria` добавлен в ОБА реестра последним.

### Тесты
- **`narrativeDialogueRegistryParity.test.ts`** (4 теста): множество id
  совпадает в обе стороны + **deep-equal каждого узла** (ловит расхождение
  порядка слияния при коллизиях, история v4.8.9) + резолв паков Виктории
  через `ensureDialogueNode`.
- Placement-аудит: +1 вариант-оверрайд (victoria в albert_backroom —
  наследование позиции кафе в подсобку 8×6); проверено 799 размещений,
  0 нарушений.

### Верификация
tsc 0 · eslint 0 · vitest 410 файлов / 2489 тестов PASS · validate-content OK.

## v4.15.3 (2026-09-07) — фича: пуловые числа урона (этап 28 закрыт)

### Контекст
Аудит-этап 28 («Damage numbers: DOM vs canvas», ⚠ бэклог) скрывал реальную
проблему: **каждый хит в пошаговом бою рендерился сразу тремя слоями** —
`DamageNumber` из CombatUI, `CombatDamageNumbers` на framer-motion и
`FloatingTextLayer` через floatingTextService (подписка combat:hit). Игрок
видел 2–3 наложенных числа на каждый удар, а JS-анимации framer-motion
съедали бюджет кадра на босс-файтах (частые криты/статусы/спец-атаки).

### Новое
- **`engine/floatingText/damageNumberLayer.ts`** — единый пуловый DOM-слой
  чисел урона по формуле бэклога «пул + transform-only»:
  - модуль-одиночка БЕЗ React/framer-motion: контейнер + пул из 24 заранее
    созданных узлов — ноль DOM-аллокаций в бою;
  - анимация **Web Animations API** с ключевыми кадрами только по
    `transform`/`opacity` → композитор GPU, без layout/paint, без re-render
    React-дерева; деградация до таймаута на WebView без WAAPI;
  - **коалесценция бёрстов**: окно 130 мс на пару (якорь × тип) — быстрый
    мульти-хит доливается в летящее число (`Σ×N`), босс-АоЕ больше не
    сыпет простыню;
  - приоритетное вытеснение при исчерпании пула: добивание > крит >
    лечение/урон > статус/замах > промах; дешёвый входящий спам
    отбрасывается;
  - якорные полосы вместо рандома по экрану: удары по врагу — верхняя
    центральная (у панели врага), по игроку — левая нижняя (у карточки),
    реал-тайм замахи — центр;
  - `prefers-reduced-motion` → статичная позиция, короткий fade.
- **Реал-тайм слой боя получил числовой фидбэк** (раньше — только искры):
  `combat:melee_strike` → «УДАР» / «В СПИНУ!» (фиолет) / «ПОВЕРЖЕН»
  (добивание), `combat:melee_miss` → «ПРОМАХ», `combat:creep_finished` →
  «+N ОП». Все метки — на русском.
- Цветовая семантика: крит — золотой (крупнее, дольше), урон по игроку —
  красный, лечение — зелёное, статусные тики — оранжевые.

### Удалено (мёртвый код после консолидации)
- `components/game/CombatDamageNumbers.tsx` (framer-motion, 219 строк);
- `components/game/hud/parts/DamageFloatSystem.tsx` (768 строк, ни одного
  импортёра) и мёртвый баррель `hud/parts/index-enhanced.ts`;
- `DamageNumber` из CombatDamageFx (оставлены ComboCounter/CombatScreenFlash);
- слушатель `combat:hit → floatDamage` в floatingTextService (единственный
  владелец события — damageNumberLayer);
- мёртвые CSS-кейфреймы `hud-filmic-damage-rise-fade` (hud-filmic.css).

### Жизненный цикл
`resetDamageNumberLayer()` в engineRuntimeReset (гасить летящие числа между
сессиями, пул живёт), `registerHmrDispose(disposeDamageNumberLayer)`.

### Верификация
tsc 0; eslint 0; vitest 409 файлов / 2485 тестов PASS.

## v4.15.2 (2026-09-07) — фича: враги на миникарте (WoW-стиль)

### Новое
- **Враги на миникарте** (п.4E ТЗ, из бэклога «чего не хватает» аудита 3-b):
  патрулирующие крипы видны красными треугольниками на миникарте в
  реальном времени. Раньше отображались только NPC по репутации — игрок
  натыкался на агро-конусы вслепую.
  - `engine/combat/realtime/creepPresenceRegistry.ts` — модульный реестр
    живых позиций (паттерн creepVitality: без стора/React, ноль аллокаций
    на чтение): пишет PatrollingCreeps (один map.set за кадр в существующем
    useFrameTick('npc')), читает MinimapComponent в rAF-цикле отрисовки.
  - Цветовая семантика состояний: патруль — красный, погоня/бой —
    ярко-красный с пульсирующим агро-кольцом (индикатор угрозы как в WoW),
    возврат/передышка — серо-красный.
  - Формы разведены: круги — жители, ромбы — квесты, треугольники — враги.
  - visualLite/reduced-motion — упрощённый рендер без колец/пульсаций.
  - Жизненный цикл: unmount/победа/деспавн крипа убирает маркер;
    полный сброс реестра в engineRuntimeReset (teardown сессии).

### Верификация
tsc 0; eslint 0; vitest 409 файлов / 2485 тестов PASS.

## v4.15.1 (2026-09-07) — Аудит 132 этапа: критические баги наград, GPU-утечки, 60 FPS raycast, русификация

### Контекст
Экспертный статический аудит кодовой базы (~401k строк src, 2158 файлов) в 132
этапа тремя параллельными аналитиками (движок/производительность, UI/HUD,
контент/данные). Проверка — только статическая (tsc, eslint, vitest, validate,
vite build, verify:deploy): dev-сервер и браузер не запускались.
Статус FreeRouter: **сервис закрыт** (freerouter.eu.cc и api.freerouter.eu.cc
не резолвятся, на сайте shutdown-заглушка) — «Шёпот города»/matrix-цитаты
перманентно работают на статичных фолбэках, игра не ломается.

### Исправления
1. **Критично — награды квестов**: `rewardItems` (12 квестов: encrypted_usb,
   banned_book, eye_blueprint, old_poetry_book, marat_code_copy,
   encrypted_scroll, father_photo, anonymous_letter, old_radio_transmitter,
   rat_king_crown и др.) декларировались в данных и показывались в карточке
   наград, но НЕ выдавались при завершении — игрок терял предметы.
   → `completeQuestAndApplyRewards` выдаёт rewardItems через batchAddItem.
2. **Критично — невыполнимый квест**: `dying_poet_last_letter` зависал на
   целях «найти/передать адресату»: Елена была в реестре NPC без dialogueNodeId
   и расписания. → подключены диалог `poem_recipient_elena_meeting` (писался
   мёртвым грузом) и расписание (street_night, «Болотная улица» из лора).
3. **Аудио 404 на деплое**: файловый ambient story-нод резолвился относительным
   URL от адреса страницы → на суб-путях Vercel отдавал index.html вместо .ogg.
   → `resolvePublicAssetUrl()` от `import.meta.env.BASE_URL`; громкость лупа
   теперь живая (AUDIO_SETTINGS_CHANGED), а не фиксированная при создании.
4. **GPU-утечки**: 16 BoxGeometry+16 MeshBasicMaterial на смену сцены
   (AaaInteractionRich), PlaneGeometry HP-баров крипов (PatrollingCreeps),
   GL-программа CoherentNoiseEffect при смене opacity — всё получает dispose.
5. **60 FPS — камера**: двойной рекурсивный raycast по ВСЕМУ графу сцены за
   кадр (тысячи Object3D) заменён raycast'ом по плоскому реестру прокси-стен
   (CameraCollisionProxies, layer 5) без рекурсии; пустой реестр → прежний путь.
6. **Teardown-утечки**: активная VO-реплика (HTMLAudio+speechSynthesis)
   продолжала играть после dispose движка; LRU-кэш 128 портретов терял
   scene:enter-листенер после disposeEventBus+revive → оба сбрасываются
   в resetEngineModuleRuntimeState.
7. **Русификация UI**: ENEMY→ВРАГ, ATK/DEF/SPD→АТК/ЗАЩ/СКР,
   SKILL.CHECK→ПРОВЕРКА НАВЫКА, SYSTEM READY→СИСТЕМА ГОТОВА,
   NPC→Персонаж/Жители, «Entity occluded»→русский тултип.
8. **DevPanel в проде**: полностью английский дев-инструмент открывался любому
   игроку по F3 → гейт `import.meta.env.DEV`.
9. **Мёртвый UI-код**: 14 никогда не импортируемых компонентов удалены
   (QuickInventoryBar, LevelUpNotification, StatusEffectsBar,
   PoemReadingCutscene, PoemDiscoveryReveal, RewardDisplay,
   CyberpunkPoemOverlay, GamepadIndicator, DifficultySelector,
   AchievementPopup, ExplorationMobileHud+обёртка и др.);
   мёртвый конвейер skill:level_up→skillAchievement вырезан (событие
   обрабатывают HUDNotificationFeed/ScreenEffects/haptics/GameAnnouncer).
10. **Тулбар быстрого доступа**: слоты «Карта»/«Кодекс» были заглушками —
    подключены через firePanelShortcut(KeyM/KeyK); боевые/диалоговые/меню
    контексты (все слоты-заглушки) скрыты — там свои органы управления.
11. **Конфликт клавиши M**: открытие карты мира одновременно сворачивало
    миникарту → миникарта сворачивается только тапом.
12. **Touch-таргеты**: зум-кнопки миникарты 18px → 44px (Apple HIG/WCAG),
    MINIMAP_HEIGHT 196→222; на вьюпортах ниже 560px правая колонка HUD
    (погода/день-ночь/POI-компас) скрывается вместо клиппинга.
13. **Perf мелочи**: AmbientParticles в центральном frame-budget (мягкий пропуск
    + авто-пауза в demand-режиме); PostFrameBudgetRunner переиспользует
    game-снапшот кадра вместо пересоздания; маркер «↗ квест» в случайной
    точке экрана (дезинформация) удалён, таймеры маркеров чистятся.
14. **Контент-гигиена**: дубли названий квестов уникализированы
    («Тетрадь Бориса: контрабанда», «Ночная рыбалка: разговор у воды»).

### Верификация
tsc --noEmit 0 ошибок; eslint src 0 ошибок (60 warnings — консоли в devLog);
validate-content OK; verify-act1-extended OK; vitest 409 файлов / 2485 тестов
PASS; vite build 39.5с; prune+verify-deploy OK (dist 110.5 МБ, бюджеты OK).

## v4.15.0 (2026-09-06) — Репорт игрока 3/10: спальня, парящие пропсы, тишина, дубли UI

### Контекст
Игрок протестировал свежий деплой и оценил игру на **3/10**, перечислив 9 проблем.
Статический аудит (dev-server/browser недоступны) нашёл конкретные корни почти
по каждому пункту. Проверено: физический слой (коллайдеры/спавн [0,0,2]/Rapier
external-WASM chain) в HEAD дефектов не имеет — «физика не работает» была
зрительным выводом из парящих пропсов; декодеры GLTF (draco/meshopt/ktx2,
self-hosted) целы; prune-deploy-assets сохраняет всю комнатную цепочку
(apartment_envelope, GothicBed, paintedWoodenTable, rapier wasm — проверено
на реальном dist/).

### Исправления
1. **«Нет кровати» + «Володька висит в воздухе»** — в GLB-пресете (Medium+)
   кровать существовала ТОЛЬКО как GothicBed GLB внутри `<Suspense fallback={null}>`:
   пока GLB стримился (или при отказе) кровати не было вообще. → `BoxBed`
   (процедурная кровать Low-комплекта) стал Suspense-fallback: кровать видна
   всегда, GLB подменяет её по готовности.
2. **«Мониторы висят в воздухе» + «клавиатура висит»** — якоря мониторов/клавы
   стоят на `deskSurfaceY=0.98` (GLB-стол), а Suspense-fallback стола
   (`CraftedDeskShell`) имел верх 0.78: при загрузке/отказе GLB пропсы парили
   на 0.2 м над fallback-столом. → `CraftedDeskShell` получил `topY`; fallback
   в GLB-пресете рендерится с `topY=0.98` — посадка совпадает с GLB-столом.
3. **«Книги висят в воздухе»** — в GLB-пресете книги стояли по координатам
   ПРОЦЕДУРНОЙ полки (0.8×2×0.35, полки 0.5/1.0/1.5), а полка была
   `woodenBookshelfWorn` GLB (реально 1.21×1.81×0.51 на scale 0.88 — замер
   accessor'ов): корешки висели мимо досок. → в комнате одна процедурная полка
   с книгами для всех пресетов (доски/корешки согласованы по построению);
   worn-GLB остался в office/library/cafe, где книги на нём не расставляются.
4. **«Тумба, которая влезает в стол и мониторы, ни к месту»** — верхний жёлтый
   кабинет висел на y=1.55 при крышке нижнего на 1.121 (1.18 GLB × 0.95 scale,
   зазор 0.43 м). → посажен на крышку (`PAINTED_CABINET_TOP_Y=1.12`).
5. **«Звук не работает»** — три независимых дефекта:
   а) все 42 story-ссылки `sounds/ambient/*.ogg` были мёртвыми данными: папки
      `public/sounds` не существовало, консьюмера у поля `ambientSound` не было;
   б) vercel.json rewrite НЕ исключал `/sounds/*` → даже существующие файлы
      отдавались как index.html (200 HTML → decode fail);
   в) service worker не кэшировал/не знал про звуки.
   → детерминированный ffmpeg-генератор (scripts/generate-ambient-audio.mjs,
   14-сек лупы, 3.5 MB, рецепты по ключевым словам) + 42 ogg в репо; проводка
   `StoryNode.ambientSound` → `AmbientPlayContext.storyAudioFile` →
   `SceneAudioController` (зацикленный HTMLAudio, громкость от ambient-шины);
   `/sounds` в rewrite-exclusion + cache-headers; SW: MEDIA_RE += ogg/mp3/wav.
6. **«Дубликаты логики интерфейса»** — CraftingPanel звал legacy
   `toastManager.addToast` (второй независимый стек тостов рядом с
   NotificationToastsPanel) → переведён на канонический `notify()` из
   UnifiedNotifications. Полная консолидация 4 toast-систем — в бэклоге.
7. **SW-инвалидация** — кэши v2→v3: старые закэшированные GLB/чанки больше не
   переживают редеплой (защита от «устаревшего прод-кэша» как класса).

### Верификация
tsc 0 · eslint (6 файлов) 0 · vitest 2486/2486 (410 файлов) · validate:content
OK 0 issues · build:vercel 40 с + prune: 42 ogg, envelope, GothicBed,
rapier_wasm — всё в dist/ · ffprobe лупа: 14.000 s.

### Известные ограничения
- Лупы — процедурные шумовые текстуры (без сэмплов): правдоподобные,
  но не музыка. Настоящий джаз/голоса — следующий этап (TTS/сэмплы).
- «Появляется тумба после интро» дополнительно лечится отложенным стримингом:
  теперь у каждого GLB-пропса комнаты есть процедурный двойник-фоллбек, кримп
  «появления» исключён для кровати/стола/полки.
- Если после редеплоя что-то останется — F8-панель (v4.14.1) покажет точные
  отказы загрузки и статус Rapier (external/inline/failed).

## v4.14.0 (2026-09-05) — «Модели на местах, часть 2»: GLB-пропсы и оболочки — выпечка нод, якоря Y, пересадка на мебель

### Контекст
Продолжение аудита v4.13.0: та проверка выровняла **NPC-якоря и коллайдеры**,
но слой **самих GLB-моделей** (dressing-пропсы, manifest-бандлы, фоновые
оболочки, инстансы) оставался слепой зоной. Замер on-disk габаритов всех GLB
(GLB-парсер: accessors × node-TRS, правило деавантизации three.js) вскрыл
несоответствия вплоть до ×20 и класс дефектов «полузарытые/парящие модели».

### Корневые дефекты и исправления
1. **InstancedProp терял трансформы нод** — собирались только пары
   (geometry, material), собственные translation нод-мешей выбрасывались:
   пожарные лестницы складывались в кучу на земле (узлы перил/платформ на
   y 4.05/5.76 схлопывались в уровень земли), ручки баков налипали на корпус.
   → выпекание матрицы каждого меша в клон геометрии (+ dispose клонов на
   unmount; скинned-геометрия не трогается) + опция `normalizeFootY`
   (modular_fire_escape: minY −3.65 → база на y инстанса).
2. **Ложные габариты в INTERIOR_SHELL_SOURCE_BOUNDS_M** — 5 из 9 строк не
   соответствовали файлам (corridor в 20 раз, pier в 10): corridor.glb —
   'driveway-long' 0.36×0.01×0.40 (плитка), pier.glb — 'path-stones-long'
   0.14×0.01×0.40, basement.glb — 'detail-tank' 0.85×0.42×0.52,
   forest_clearing.glb — 'tree-large' 0.21×0.77×0.24, factory.glb —
   'building-a' 2.08×1.47×1.24. Таблица переписана по замерам.
3. **Бессмысленные маунты удалены**: interior_corridor («коврик» 0.72 м в
   процедурном коридоре), interior_rooftop (башня 0.9×3.6 м на [4,0,−6] — вне
   плиты крыши, парила в пустоте; у визуала крыши свой skyline),
   river_pier backdrop (плитка вместо пирса).
4. **Подвесные светильники ×3 к цели**: fitAxis 'maxHorizontal' раздувал лампу
   1.36 м до 1.85 м, а min-якорь ставил плашку в authored Y и протыкал потолок
   хвостом подвеса. → fitAxis 'height' (0.95 м) + новый якорь `anchorY: 'max'`
   (верх подвеса в authored Y; authored высоты 2.45–4.8 снова высоты креплений).
5. **Полузарытые уличные пропсы** (PolyHavenStreetDressing, raw-масштабы без
   замера): street_lamp_02 −0.395, old_tyre −0.30, power_box −0.252 —
   `groundAnchor` (подъём min.y → authored Y) для наземных пропсов; люк
   (заподлицо), настенные и подвесные — без якоря. GltfAsset тоже получил
   `groundAnchor` (куча env_cafe_props проседала на 0.37 м, minY −0.247).
6. **Гигантские инстансы**: GLB metal_trash_can — ПАРА контейнеров
   (AABB 1.84×1.35) при масштабах 1.2/1.1 давала 2.2-метровых монстров →
   0.67/0.62 (~0.9 м); цель в propModelRegistry переписана под пару.
   Пожарные лестницы 9.76 м (натив) при масштабах 0.95–1.25 торчали над
   фасадами (~5–7 м) → масштабы 0.5–0.62.
7. **Парящие терминалы**: kenney_terminal имеет minY=0, а stale-offset
   [0,−0.28,0] (компенсация до v4.8.1) топил его ниже поверхности или вешал
   в воздухе. Пересажены на реальные поверхности: factory_basement — на
   процедурный стол [4.5,0,5.5] (верх 0.41, свободный от машины конец),
   underground_bunker — на радио-стол (верх 0.61), guild_mainframe — на
   консоль (верх 1.1; второй терминал без мебели убран), library_basement —
   на картонную коробку (верх 0.47).
8. **Серверы/ящики в воздухе**: ai3dgen_server_fragment (y 0.15–0.55) и
   utility_box (y 0.55) опущены на пол (y 0.02/0).
9. **Деревья-заглушки**: veg_tree_pine — «Avocado» 4×6×3 см из Khronos-пака
   (3 шт в парке, 12 в лесу). Удалены из манифеста; новые
   `kenney_forest_tree` (Kenney 'tree-large', подгон по высоте 4.3 м) в
   SCENE_PROP_DRESSING — те же координаты, все в пределах полов.
10. **Стол volodka_room**: коллайдер 1.85×0.82 против GLB-стола 2.46×0.98×1.16
    (полуразмеры [1.23,0.49,0.58]) — игрок проваливался в столешницу на ~0.3 м.
11. **Бутылка-клаттер**: kenney_city_bottle — merged-меш 0.66×0.23×0.40 рендерил
    66-см кластер на столах → множитель 0.45 (~30×10×18 см).

### Аудит (регресс-гейт расширен)
- `placementAudit` теперь проверяет и **dressing/manifest-слой**:
  777 размещений (было 635), правила: настольные/настенные (y > 0.08) не
  ждут пол; outdoor-сцены — структурный пол накрывает габариты; допуск
  габаритов 3 м для фасадных пропсов; «встроенность» — только npc/spawn
  (dressing сознательно сидит в своих коллайдерах).
- Тесты переписаны под новые инварианты: river_pier/corridor/rooftop НЕ
  монтируются, масштабы оболочек = замерам, манифест без авокадо, терминалы
  на поверхностях (y > 0.1).

### Верификация
tsc 0 · eslint 0 (0 новых) · vitest 2476/2476 (409 файлов) · vite build 41 c ·
validate:content 0 ошибок · аудит размещения 777 точек HIGH=0 MEDIUM=0 LOW=0.

## v4.13.0 (2026-09-05) — «Модели на местах»: аудит размещения 635 точек, 52 HIGH-дефекта позиций устранены

### Контекст
Владелец зафиксировал: «Проблема с моделями не исправлена. Проверь их позиции
и расчёты. Проверь все сцены». Полный статический аудит «позиция vs геометрия»
по всем 29 сценам (635 размещений: NPC-расписания + актор-оверрайды, спавны,
выходы, GLB-пропы триггер-зон) нашёл **HIGH=52, MEDIUM=38**. После правок — **0/0**.

### Классы найденных дефектов
1. **NPC внутри мебели/геометрии** (центр модели в коллайдере): бариста стояла
   ВНУТРИ стойки кафе, коллеги/ЧК — в центральном острове офиса и в серверных
   шкафах гильдии, виктор — в бетономешалке завода, лена — в конвейере,
   борис — в кухонной стойке, чк-смэрт — в костре, чк-сталкер — в валуне,
   гриша — за краем крыши (в «пустоте»), солныш спала на письменном столе.
2. **Коллайдеры не совпадали с визуальными моделями**: столы кафе
   (коллайдеры на 0.5–1.5 м в стороне от GLB-столов — невидимые стены и NPC
   «у воздуха»), кухонная стойка home_evening (коллайдер в [0,-5], визуал в
   [4,-5.5] — 4 м расхождения), обелиск парка (визуал без коллайдера —
   проходим насквозь).
3. **Stale-коллайдеры без визуала**: «прилавок» [1.6,0.5,0.7] в центре улицы —
   в него попадали defaultSpawn и 4 spawn-точки выходов (игрок спавнился
   ВНУТРИ коллайдера) и 8 NPC-маршрутов; «фонтан»/«клумба» в парке.
4. **Наследование расписаний в вариантах сцен**: SCENE_SCHEDULE_PARENT
   переносит позиции родителя в сцену с другой геометрией — NPC подвисали в
   воздухе (albert_backroom уже родителей), вставали в шкафы (guild_mainframe),
   ящики (library_basement), трубы (factory_roof), костёр (chk_campfire_night).

### Исправления
- **Данные** (~45 позиций в npcSchedules/chkTolpa + 4 спавна): все центры
  выведены из коллайдеров с сохранением авторского замысла («у стола», «за
  стойкой» — теперь у ВИЗУАЛЬНОГО стола/стойки); места кафе пересчитаны под
  реальные GLB-столы (polyhaven_painted_wooden_table 1.55×0.95).
- **sceneDefinitions**: удалены stale-коллайдеры (улица, парк ×2); кухонная
  стойка совмещена с визуалом + добавлены холодильник/диван/столик; столы
  кафе выровнены по dressing; добавлен коллайдер под обелиск парка.
- **npcVariantPlacementOverrides.ts (новое)**: позиции NPC для 6 вариантов
  сцен, где унаследованные расписания ломались о локальную геометрию.
- **Рантайм**: `resolveNpcPlacementForScene` применяет оверрайды в NPCSystem,
  InteractiveTriggers, миникарте и NPCProximityIndicator; заодно матч сцены
  заменён на `sceneMatchesScheduleEntry` — в вариантах (guild_mainframe и
  др.) маркеры миникарты и индикатор близости раньше были пустыми/не совпадали
  с моделями; уличные патрульные точки обведены вокруг киоска и ящика.

### Инфраструктура (регресс-гейт)
- `engine/scene/placementAudit.ts` — общая математика (Rapier half-extents,
  покрытие пола, Y-якорь, встраивание, допуск sleep/rest ≤1.35 м).
- `scripts/analyze-model-placement.ts` — CLI (exit 1 при HIGH), включён в
  `npm run validate`.
- `placementAudit.test.ts` — vitest-гейт: 0 HIGH навсегда (+3 теста).

### Верификация
tsc 0 · eslint 0 · vitest 2470/2470 (409 файлов) · validate 0 (включая аудит
HIGH=0) · достижимость квестов 147/147 · vite build 40.5 c.

## v4.12.1 (2026-09-05) — прод-фиксы из консольного лога volodka.vercel.app: Draco-декодер и бэкофф тикера

### fix: самохостинг Draco-декодера — useGLTF.setDecoderPath вместо перезатираемого extendLoader
- **Прод-баг (CSP × gstatic)**: консольный лог с volodka.vercel.app показал
  17+ ошибок «Failed to fetch … violates Content-Security-Policy
  "connect-src 'self' blob:"» на `www.gstatic.com/draco/versioned/decoders/1.5.5/`
  — каждый fetch Draco-декодера резался CSP, draco-сжатые GLB не парсились.
- **Корень**: drei `useGLTF.extensions()` вызывает `extendLoader` ПЕРВЫМ,
  но ЗАТЕМ перезатирает `loader.setDRACOLoader(...)` своим модульным
  синглтоном с дефолтным decoderPath gstatic — наш `sharedDraco` из
  `configureGltfPipeline()` для useGLTF-моделей никогда не применялся.
  В dev CSP нет → gstatic загрузка удавалась → баг не проявлялся.
- **Фикс**: `useGLTF.setDecoderPath('/draco/gltf/')` на модульном уровне
  `gltfPipeline.ts` — поддерживаемый drei механизм, отрабатывает до первого
  extensions()-колбэка (ESM-семантика: каждый call-site импортирует
  gltfPipeline раньше своих preload-ов). Same-origin '/draco/gltf/'
  разрешён `connect-src 'self'`; файлы `draco_wasm_wrapper.js` +
  `draco_decoder.wasm` существуют в `public/draco/gltf/` и переживают
  prune-deploy-assets (PRESERVED_PREFIXES). WASM-eval разрешён
  `script-src 'wasm-unsafe-eval'`.
- Побочно: attachment `sharedDraco` в `extendGltfLoader` оставлен (Meshopt,
  KTX2, specGloss-stub работают как раньше), но путь декодера больше
  зависит от него не в коем случае.

### fix: бэкофф городского тикера при устойчивых сбоях /api/city-news
- **Прод-лог**: повторяющиеся `GET /api/city-news 503 (Service Unavailable)`
  — при незаданном `FREEROUTER_KEY` в Vercel env каждый тик поллера тратил
  серверлесс-вызов впустую (~410/сутки на активную вкладку).
- Клиент при 503 уже показывал фолбэк-новость из тела (контент доставлен),
  но поллер продолжал фиксированный цикл 3.5 мин. Добавлен экспоненциальный
  бэкофф на ЖЁСТКИЕ сбои (ответ без фолбэк-новости, таймаут, сеть):
  интервал ×2 за каждый подряд-сбой, кап ×4 (3.5 → 7 → 14 → 28 мин),
  сброс при любом успешном контенте. Фолбэк-новость из 503-тела сбоем
  НЕ считается. Тики поллера пропускаются до истечения бэкоффа —
  интервал остаётся фиксированным, частота деградирует плавно.

### Верификация
- tsc 0; eslint (изменённые) 0; gpuResourceLifecycle-тесты 3/3 (drei-импорт
  в gltfPipeline совместим с vitest); vite build 41с; dist/draco/gltf/
  переживает prune; validate:content 0 ошибок.

## v4.12.0 (2026-09-05) — «Честный промах»: замах решает RNG скоупа, событие combat:melee_miss

### feat: честный промах замаха — шанс по дистанции и углу, событие combat:melee_miss
- **Четвёртое звено реал-тайм слоя** (замах v4.8.7 → добивание v4.8.8 →
  удар в спину v4.11.0 → честный промах): замах больше не гарантированное
  попадание — удар решает бросок RNG скоупа. Новый ЧИСТЫЙ модуль
  `src/engine/combat/realtime/meleeMiss.ts` (без импортов Three/стора —
  как meleeSweep.ts).
- **Формула шанса** (`computeMeleeMissChance`): база 0.06; линейный рост
  до +0.14 на кромке reach (2.7 м) И до +0.14 на краю конуса (~58.4°) —
  промах тем вероятнее, чем дальше и «краше» угол; point-blank (≤ 1.4 м)
  — база без надбавок; жёсткий потолок 0.35, зажим [0, cap]
  (`clampMeleeMissChance`). Экспортированные константы для тестов и
  баланса: `MELEE_MISS_BASE`, `MELEE_MISS_EDGE_BONUS`,
  `MELEE_MISS_HARD_CAP`, `MELEE_MISS_COOLDOWN_SEC`.
- **Инвариант детерминизма**: `isBackstab` или `isFinishable` → шанс
  ВСЕГДА 0 (стелс-удар и добивание уже гейтятся геометрией задней дуги и
  состоянием цели ≤ 35% HP — честный RNG их не оспаривает, кубик даже не
  бросается).
- **RNG инжектится параметром** (`rng: () => number`) для
  тестируемости; в рантайме Math.random. Бросок честный: промах, если
  `rng() ≥ 1 − шанс` (P(промах) = шанс); `rng() = 0` — всегда попадание.
- **Интеграция в `attemptMeleeStrike`**: решение ПОСЛЕ гейтов замаха/LOS
  и расхода выносливости — промах «стоит сил» (стамина 22 тратится как
  раньше). При промахе: НОВОЕ событие `combat:melee_miss` (поля сессии +
  `missChance`), `applyStrike` НЕ вызывается, `combat:melee_strike` НЕ
  эмитится, сообщение «💨 Промах!» через существующий
  `ui:exploration_message`. Новый исход `'miss'` в `MeleeStrikeOutcome`
  — клик consumed (ЛКМ не проваливается во взаимодействие).
- **Кулдаун промаха короче**: 0.45 с (`MELEE_MISS_COOLDOWN_SEC`) вместо
  0.9 с — честный second-chance; кулдаун после попадания не изменился.
- **Хаптика**: `hapticMiss()` — лёгкий одиночный тик [8] по событию
  `combat:melee_miss`, троттлинг общий с боевыми (350 мс).
- **FX**: MeleeStrikeFx — вариант «miss»: серо-белая (#d1d5db) МАЛЕНЬКАЯ
  искра 0.4 (меньше обычной 0.6); цвет и размер задаются при КАЖДОМ
  acquire из пула (паттерн стелс-цвета #c084fc), анимация растёт от
  базового размера искры. Зеркало подсказки `getMeleeStrikeHint` не
  менялось (промах — мгновенное событие).
- Тесты +11: `meleeMiss.test.ts` (+8 — база на point-blank, рост к
  кромкам, детерминизм стелса/добивания без броска, жёсткий кап с сеткой
  факторов, зажим отрицательных, rng=()=>0 — всегда попадание,
  rng=()=>0.999 — промах, монотонность по дистанции и углу) и
  `meleeStrike.test.ts` (+3 — miss-ветка с событием/без applyStrike/
  кулдауном 0.45 с, стелс не промахивается, добивание не промахивается;
  Math.random под шпионом во всех describe).

### Верификация
- tsc 0; eslint 0 ошибок на изменённых файлах; vitest 2466/2466 в 408
  файлах (+11); vite build OK; validate:content 0 ошибок.

---

## v4.11.0 (2026-09-05) — «Удар в спину»: стелс-ослабление крипа, тихое добивание с бонусом XP, фиолетовая стелс-капсула

### feat: удар в спину — стелс-ослабление крипа и тихое добивание с бонусом XP
- **Третье звено реал-тайм слоя** (замах v4.8.7 → добивание v4.8.8 →
  удар в спину): подкрадись к патрулирующему крипу сзади — бой стартует
  на 50% HP врага, а тихое добивание из стелса платит +25% XP.
- **Стелс-гейт двойной**: крип не в погоне (`isAware() === false` —
  патруль/возврат; убегающий «в курсе»; cooldown после побега — нет:
  крип вернулся к посту) И удар в заднюю дугу его взгляда — новая чистая
  геометрия `isBehindCreep` в `meleeStrike.ts`: dot(взгляд крипа,
  направление на игрока) ≤ −0.17 (дуга ≥ ~100°), конвенция forward =
  (sin(yaw), cos(yaw)) как в meleeSweep и headingRef крипа.
- **Единая точка решения**: сила ослабления собирается только в
  `attemptMeleeStrike` и уходит крипу контрактом
  `applyStrike({ introHpPct, backstab })` — PatrollingCreeps отдаёт
  движку факты (getFacingYaw/isAware) и применяет готовый introHpPct в
  startEncounter. Приоритет: память HP после побега (creepVitality) >
  стелс 0.5 > база 0.75 — стелс не наслаивается на запомненный урон
  (0.6 остаётся 0.6 — тест). Провайдеры опциональны: цели без них
  бодрствуют (обычный путь).
- **Экономика**: `computeCreepFinisherRewards({ backstab })` — +25% XP
  (`CREEP_FINISHER_BACKSTAB_XP_BONUS = 0.25`; floor(25×0.6×1.25)=18 против
  15), карма неизменна (фиксированная 2), кредиты считаются от бонусного
  XP той же формулой. Событие `combat:melee_strike` расширено полем
  `backstab: boolean` — потребители ветвятся без повторных вычислений.
- **Хаптика**: `hapticStealthStrike([10,60,10,60,25])` — «два шага
  подкрадывания и глухой удар», троттлинг общий с боевыми.
- Тесты +12: `meleeStrike.test.ts` (+11 — геометрия задней дуги/бок/перед,
  стелс-вовлечение, взгляд на игрока, гейт осведомлённости, отсутствие
  провайдеров, память HP старше стелса, тихое/обычное добивание, зеркало
  подсказки) и `rewards.finisher.test.ts` (+1).

### style: HUD-капсула удара в спину и фиолетовая стелс-искра
- **MeleeStrikeHint**: третий стейт `data-backstab` — «в спину — ЛКМ»
  (тач: «кнопка „Удар“»), иконка EyeOff, фиолетовая палитра #c084fc в
  рифму с чипом «Мир Снов», медленное дыхание ореола 3.2s
  (prefers-reduced-motion глушит). Приоритет стейтов
  finishable > backstab > обычный решается в компоненте
  (backstab && !finishable), без CSS-специфичности; поллинг 150мс не тронут.
- **MeleeStrikeFx**: фиолетовая искра крупнее обычной; цвет задаётся при
  КАЖДОМ acquire из пула — иначе стелс-цвет «протекал» бы в обычные удары
  при переиспользовании мешей.

### Верификация
- tsc 0; eslint 0 ошибок; vitest 2455/2455 в 407 файлах (+12);
  vite build OK; validate:content 0 ошибок.

---

## v4.10.0 (2026-09-05) — «Мир Снов»: 147/147 квестов достижимы, сеттеры отложенных целей, чипы тем журнала

### feat: контент-пак «Мир Снов» — достижимость 147/147 квестов
- **Достижимость 145 → 147 из 147**: последние два недостижимых квеста
  (`dreamworld_lost_child`, `void_echo_poem`) получили контент-пак — 11
  story-узлов в `act5DreamWorld.ts` (шлюз-тетрадь, дитя у фонаря, три
  воспоминания, прощание с выбором «провести»/«отпустить», поэт на краю сна,
  стих `poem_32` с выбором «записать»/«оставить неписаным»). Пак слит в
  `buildStoryNodes()` и зарегистрирован сателлитом акта 5
  (`narrativePackRegistry`: `ACT_STORY_SATELLITES.act5` +
  `STANDALONE_STORY_SATELLITE_ORDER`) — без этого `ensureStoryNode` бросил
  бы «not found» в рантайме (урок v4.8.9).
- **Хуки активации + инвариант «гейты после активации»**: два новых выбора
  в `vladimir_secret_room_read` — `triggerQuest` и флаг-гейт выставляются
  ОДНОВРЕМЕННО (`dream_world_opened` / `void_echo_quest_started`); все
  зоны-сеттеры целей гейтятся `requiredFlag` этим флагом, поэтому ни одна
  цель квеста не требует зон, недоступных до активации. Цель, выполненная
  до активации (например, `poem_32` из акта 1), добирается ретроактивно —
  `QuestTracker.retroactiveCheck` подписан на `quest:accepted`.
- **Зоны-сеттеры (16) в `triggerZones.ts`**: во сне — фонарь, три
  воспоминания (`child_memory_mother/school/poems`), край сна, силуэт
  поэта; в яви — три эха (`river_pier` → `void_echo_river`,
  `rooftop_edge` → `void_echo_roof`, `library_day` → `void_echo_library`)
  и повторная дверь в сон (`library_dream_notebook` → `act5_dream_descent`;
  выход из сна — exit сцены в `volodka_room`).
- **Кумулятивный гейт эха**: `void_echo_all_heard` (открывает «Ответить на
  эхо» в `void_poet_gate`) выставляет `QuestTracker.checkNewFlags`, когда
  услышаны все три эха — по образцу quest-специфичных mid-resume флагов
  (`archive_vault_accessed`, `final_poem_unlocked`, `freedom_virus_written`).
- **Сеттеры отложенных целей (бэклог раунда 9)**: «Эхо Катастрофы» — флаг
  `catastrophe_echo_started` у Лены + 3 зоны в `guild_mainframe` (коридоры →
  терминал ядра с `memory_fragment` → аварийная шахта; цепочка гейтов
  `datacenter_*`); «Потерянный Инженер» — журнал Григория в цеху (+lore) и
  убежище в подвале (`grigory_rescued`, гейт `grigory_journal_found`);
  «Секретный Чертёж» — нода `blueprint_fate_choice` в `act4SideQuestStory.ts`
  (сжечь +8 кармы / сохранить −8 / отложить) с зоной-активатором у тайника.
- **Soft-lock `final_poem_read`**: флаг перенесён из единственного выбора
  в visit-эффекты узла, зона тетради больше не скрывается после прочтения —
  хуки «Мира Снов» доступны при повторном открытии, «Эхо Владимира»
  не блокируется сном.
- Тесты: `act5DreamWorld.test.ts` (11) — регистрация пака, зоны/координаты,
  инвариант гейтов, сеттеры всех целей; `questReachability.test.ts` —
  бейзлайн 2 → 0 и полный перебор 147/147.

### fix: вычищены двойные награды квестов
- Цели `npc_talked` срабатывают при открытии диалога: автокомплит квеста
  выдавал награды ещё до финального узла благодарности, а диалоговые узлы
  дублировали те же гранты. Вычищено: `merchant_boris_thankyou`
  (−100 XP / −50 кредитов / −2 зелья), `blacksmith_ignat_blade_done`
  (−клинок / −120 XP / −coding 3), `marina_receive_letter`
  (−2×(80 XP + флаг)), `captain_garold_cornered` (−2×(200 XP + флаг));
  карма-ветки сохранены. Принцип «награды квеста — единый источник
  грантов» зафиксирован JSDoc у квестовых дефиниций.

### style: журнал заданий — иконки целей и тематические чипы
- В развёрнутых карточках квестов иконка цели по типу
  (`npc_talked` / `flag_set` / `item_collected` / `location_visited` /
  `poem_collected` / `minigame_completed`) с русским тултипом — вместо
  безликого кружка-статуса.
- Тематические чипы рядом с чипом фракции: «Мир Снов» (фиолетовая
  палитра сна) и «Пустота» (фуксия эха) — определяются по id квеста,
  `data-testid="quest-theme-chip"`.
- Маркеры навигации: NPC-подсказка Лены и сцены-уэйпоинты «Эха
  Катастрофы» переведены в настоящий дата-центр (`guild_mainframe`),
  уэйпоинты эха/поэта/чертежа согласованы с координатами зон.

### Верификация
- tsc 0; eslint 0 ошибок; vitest 2447/2447 в 408 файлах (+19);
  vite build OK; validate:content 0 ошибок (7 старых info-варнингов);
  достижимость 147/147 (`analyze-quest-reachability.ts`).

---

## v4.9.0 (2026-09-05) — «Почтальон оживлённых глав»: AAA-пак, гиверы-заглушки, сквозные реестры

### fix: перекрёстные реестры повествования — kind-recovery и visitStoryNode-хуки
- **Видимый баг 1**: хуки-выборы в приветствиях NPC ведут прямо в story-узлы
  (`next: 'sl_courier_start'`, `'aaa_*_start'`), но оверлей открывался с
  `kind='dialogue'` — `DialogueRenderer` искал story-узел только в диалоговых
  паках и показывал игроку ошибку загрузки вместо вступления квеста.
- **Видимый баг 2**: хуки с `next: null` + `visitStoryNode` (уроки Альберта,
  friday-мост, ночной обход) закрывали оверлей, не показывая story-узел:
  вступление терялось, старт-флаги цепочки не выставлялись.
- Новый модуль `engine/narrative/narrativeKindResolution.ts`:
  `guessNarrativeKind` (синхронная догадка по кэшам реестров) +
  `resolveNarrativeKindByLoading` (асинхронное разрешение дозагрузкой паков).
  `narrativeChoiceExecutor` открывает оверлей с kind цели; оба рендера
  переоткрывают оверлей с корректным kind — синхронно по кэшам и асинхронно
  через ensure-фолбэк чужого реестра.
- Тесты: `narrativeKindResolution.test.ts` (7), `narrativeChoiceExecutor.test.ts` (4).

### fix: достижимость 28 квестов — 117 → 145 из 147
- **AAA-пак (8 квестов, акт 2–7)**: хуки-выборы в приветствиях гиверов —
  Мария («Пропавший дневник»), Трофим («Эхо в канализации», «Ночная
  рыбалка»), Борис («Контрабанда стихов»), Тамара («Старая фотография»),
  Баба Зина («Сломанный механизм»), Басед («Лагерный огонь»), Альберт
  («Последнее письмо»). Гейты `requiredAct` + флаги предпосылок
  (`network_member`, `trofim_basement_hint`, `chip_cafe_clearance_done`,
  `library_lost_archive_done`, `resistance_joined`, `guild_rebuilt`).
- **Одиночные квесты актов 3–4 (20)**: 14 NPC-заглушкам добавлены
  `dialogueNodeId` и 12 расписаний — Торговец Борис, Кузнец Игнат,
  Умирающий старик, Информант Серёжа, Капитан Гарольд, Контакт из Сети,
  Поэт Макс, Библиотекарь Фёдор, Радист Катя, Контрабандист Гриша,
  Снабженец Общины, Поставщик Союза впервые появляются в сценах.
- **Зоны добычи (7)**: ящик торговца (Лесная Поляна), руда (завод),
  кристалл (парк), чешуя ящера (пирс), два документа о коррупции (офис),
  чертёж «Ока» (завод) — цели `item_collected` стали выполнимы.
- **Паритет целей**: сеттеры флагов `archive_puzzle_solved`,
  `bunker_message_decoded`, `bunker_sender_found`, `goods_transport_started`,
  `patrol_avoided`, `blacksmith_special_done` — полные циклы у
  `lost_shipment`, `blacksmith_special`, `last_wish`,
  `guard_bribe_evidence`, `trade_route` (новые узлы приёма груза).
- **Точность анализатора**: учтены `triggerQuest` в node-эффектах узлов
  (`poetry_broadcast` из `act4_broadcast_execute`) и в эффектах зон
  (`solnysh_roof_wine` из `solnysh_wine_closet`).
- Бейзлайн регрессионного теста: 30 → 2 (остаток — `dreamworld_lost_child`
  и `void_echo_poem`: цели ссылаются на несуществующие сцены «Мира Снов»).

### style: детали журнала заданий
- Чип «Акт N» на карточке активного квеста; бейдж прогресса показывает
  счётчик целей «3/5 · 60%» с цветовой дифференциацией; строка гивера
  с иконкой; завершённые квесты — с изумрудным акцентом и чипом акта.
- Маркеры навигации (`questNpcMarkers`): NPC-подсказки и сцены-уэйпоинты
  для всех оживлённых квестов — миникарта и CTA «на карте» ведут к гиверам
  и точкам добычи. Тесты на валидность ссылок (+3).

### Верификация
- tsc 0; eslint 0 ошибок; vitest 2428/2428 в 406 файлах (+20);
  vite build OK; validate:content 0 ошибок (7 старых info-варнингов);
  достижимость 145/147.

---

## v4.8.9 (2026-09-05) — «Мёртвые главы оживают: достижимость квестов»

### QA-исследование: анализатор достижимости квестов (новый инструмент)
- **Находка**: из 147 квестов **51 не имел ни одного пути активации** —
  `triggerQuest` существовал только внутри их собственных story-нод, в
  которые нельзя попасть из игры (нет ни диалогового хука, ни зоны, ни
  spine-правила). Полностью «мёртвыми» были 3 content-пака: «Уличные
  легенды» (5 квестов), «Голоса Пирса» (5), AAA-расширение (8) — плюс ~33
  одиночных квеста и цепочки, зависящие от NPC без расписаний.
- Новый чистый модуль `shared/validation/questReachability.ts` (BFS по
  графу story+dialogue от корней: диалоги NPC с расписаниями, return- и
  milestone-узлы, зоны, explore-хабы, пролог, кинематографические
  активации) + CLI `scripts/analyze-quest-reachability.ts` (exit 1 при
  недостижимых квестах).

### fix: runtime-реестр диалогов — паритет со статическим (9 новых пак-лоадеров)
- В `narrativePackRegistry` добавлены 9 отсутствовавших runtime-лоадеров:
  `part2Expanded…part5Expanded`, `returns`, `milestones`, `act4New`,
  `act3ExpandedDialogues`, `act4ExpandedDialogues`. Раньше 220 диалоговых
  узлов существовали только в статическом `DIALOGUE_NODES` (валидатор,
  тесты), но не в кэше сессии.
- **Видимый баг**: milestone-диалоги Альберта / Заремы / Марии / Солныш
  (relationMilestones @50/@80) не резолвились `ensureDialogueNode` — порог
  отношения срабатывал, а диалог не открывался. `milestones` добавлен в
  `BOOTSTRAP_DIALOGUE_PACKS` (порог 50 достижим в акте 1).
- **27 коллизий return-узлов**: `returnDialogues.ts` генерировал
  двух-выборочные заглушки, которые при слиянии ЗАТИРАЛИ авторские
  return-узлы из пак-файлов (в т.ч. `albert_return` с веткой серьёзного
  разговора — вход в дерево `act1_albert_alliance`, и `solnysh_return` с
  хуками act-4 цепочек). returnDialogues переведён в fallback: теперь он
  сливается ПЕРВЫМ и пак-файлы переопределяют заглушки.
- Регрессионный тест `narrativePackParity.test.ts`: runtime-кэш обязан
  покрывать весь статический реестр; авторские return-узлы обязаны
  побеждать заглушки; milestone-узлы акта 1 обязаны резолвиться.

### fix: 15 квестов оживлены (96 → 117 достижимых из 147)
- **«Уличные легенды» (5)** — хуки в приветствиях гиверов:
  `sl_window_light` → Гриша (акт 3), `sl_reluctant_courier` → Лёня (акт 3,
  после «Света в окне»), `sl_rat_race` → Мастер завода (акт 4),
  `sl_quiet_hour` → Тамара (акт 4, после «Утерянного архива»),
  `sl_drainpipe_voice` → Уличный поэт (акт 5, после «Крысиных бегов»).
- **«Голоса Пирса» (5)**: `pv_zina_tin_box` → Баба Зина (акт 2),
  `pv_three_voices` → Трофим (акт 2, после доставки коробки),
  `pv_drowned_server` → Марат-эхо (акт 3, после «Трёх голосов»),
  `pv_waiting_on_pier` → Ритка (акт 4), `pv_fourth_voice` → Трофим (акт 4,
  через новый мост-диалог `trofim_fourth_voice_gate`, требующий обе
  завершённые ветки — сервер со дна + билет Марины).
- **Цепочки от безрасписанных NPC**: Мастер завода, Марина, Марат-эхо,
  Старик на скамье, Умирающий поэт получили расписания и/или
  `dialogueNodeId` — раньше их нельзя было даже поговорить, поэтому
  `night_shift`, `rusty_keys`, `dying_poet_last_letter`,
  `pv_zina_tin_box` (цель npc_talked «Марина») были невыполнимы.
  Для Марины написаны новые диалоги (`marina_greeting`,
  `marina_waiting_asked`) — персонаж пак-а «Голоса Пирса» впервые заговорил.
- Регрессионный тест `questReachability.test.ts`: пак-ы sl_*/pv_* достижимы
  целиком; гиверы имеют расписания; бейзлайн недостижимых (30) не растёт.
- **Оставшийся бэклог** (30 квестов, следующий раунд): AAA-пак (8) + ~22
  одиночных (`act2_archive_seven`, `blacksmith_special`, `bunker_signal`,
  `catacombs_shadows`, `factory_lost_engineer`, `poetry_broadcast`,
  `solnysh_roof_wine`, `watchers_shadow`, `zarema_heritage` и др. — полный
  список: `npx tsx scripts/analyze-quest-reachability.ts`).

### style: журнал заданий — чип фракции на карточке квеста
- `QuestsPanel`: рядом со сложностью квеста — фракционный чип (`Users` +
  каноничное название из `FACTION_LABELS_RU`, legacy-алиасы нормализуются:
  streltsy/merchant_guild/it_guild → Гильдия, underground → Сопротивление).
  Цвета согласованы с `FactionAttitudeChip` и `FactionReputationPanel`
  (изумрудный — Сеть, янтарный — Гильдия, красный — Сопротивление,
  лаймовый — ТОЛПА, каменный — нейтральные). Тултип поясняет, что
  репутация фракции влияет на отношение NPC и торговые цены.

### Верификация
- tsc 0; eslint 0 ошибок; vitest 2415/2415 в 404 файлах (+10 тестов);
  vite build 39 с; validate:content 0 ошибок (7 старых info-варнингов);
  анализатор: 117/147 достижимых (было 96).

## v4.8.8 (2026-09-05) — «Добивание до боя: реал-тайм HP крипов»

### Бой: память HP крипов + добивание до пошаговой фазы (приоритет C, инкремент 2)
- **Проблема**: после инкремента 1 (v4.8.7, удар первым) встреча всегда
  начиналась пошаговым боем, а побег игрока «лечил» крипа — урон между
  встречами не существовал, и тактика «ослабил — отступил — добил» была
  невозможна.
- **Память HP** (`engine/combat/realtime/creepVitality.ts`, новый модуль):
  остаток HP врага на момент `combat:fled` запоминается за creepId
  (PatrollingCreeps читает `getCombatState().enemy.hp/maxHp`). Повторная
  встреча стартует с запомненным HP (свежий удар первым — прежние 75%).
  Ослабление монотонное (минимум), регенерация ленивая и полная за 90 с,
  очистка — по смене сцены, победе и поражению (крип отстоял — лечится).
- **Добивание**: крип с HP ≤ 35% (`MELEE_STRIKE_FINISHER_HP_PCT`)
  повержается опережающим ударом БЕЗ пошаговой фазы — «☠ Добивание — {имя}
  повержен без боя!». Награды детерминированные и урезанные
  (`rewards.ts §9.3 computeCreepFinisherRewards`): XP = 60% шаблона
  (мин. 1), карма 2, кредиты по боевой формуле от урезанного XP с
  множителем сложности; лут не выпадает — честная цена за пропуск финальной
  фазы боя и комбо-бонусов. Награды идут через обычный
  `dispatchGameAction` (addKarma/addXp/addCredits).
- **Слои не пересекаются**: `meleeStrike.ts` расширен веткой добивания
  после тех же гейтов (фаза/замок/катсцена/LOS/кулдаун/выносливость);
  `MeleeStrikeTarget` получил `enemyType` (обязателен), `getFinisherXpReward`
  и `applyFinisher` (заморозить крипа до размонта; без него — защитный
  fallback на обычную встречу). Итог замаха несёт `finished: boolean`.
- **События**: `combat:melee_strike` получил `finished: boolean`;
  добавлено `combat:creep_finished` (creepId/enemyType/имя/точка/награды) —
  слушатель PatrollingCreeps снимает крипа со сцены, как при
  `combat:victory`.

### Презентация добивания
- **HUD-подсказка** (`MeleeStrikeHint`): для добиваемой цели — череп
  вместо меча, действие «добить — ЛКМ» (тач — «кнопка „Удар"»), красная
  капсула через `data-finishable` (CSS в hud-extensions.css, сочетаемо с
  `data-tired` — читаемость сохраняется).
- **3D**: над ослабленным крипом в исследовании — HP-полоска: два меша
  (фон + заполнение с левым анкером через сдвинутую геометрию), билборд
  к камере вне вращающейся группы крипа, видна только вне арены, стены её
  перекрывают (depthTest включён — wallhack исключён). Пул/LOD/бюджеты не
  затронуты: +2 меша только на ослабленных крипах.
- **Хаптика/FX**: добивание — `hapticHeavy()` вместо обычного паттерна;
  искра из пула `combatHitSparkPool` крупнее (scale 1.0) и ярче.

### Торговля: честные цены + реплики торговцев
- **Fix расхождения цен**: панель показывала цену по смеси «80% личное +
  20% фракция», а транзакции слайса списывали по чисто личному отношению.
  Единая формула `resolveTradeRelationValue` (tradingData.ts,
  `TRADE_FACTION_WEIGHT = 0.2`) теперь используется и панелью, и
  транзакциями (`crossSliceReads.readNpcTradeRelationValue` →
  buyItem/sellItem/canBuyItem/canSellItem, включая гейты `minRelation`).
  Репутация фракции считается по ЖИВЫМ slice-сторам через новый
  `buildFactionReputationMapFrom` (combined-кэш стора отстаёт на
  микротаску).
- **Реплики торговцев** (`shared/merchantTradeFlavor.ts`): постоянная
  строка в шапке лавки по уровню отношения фракции торговца — все пять
  уровней, шаблоны с «%f», выбор детерминирован хешем npcId (не мигает),
  формулировки без родовых окончаний. Цвет по уровню (изумрудный →
  янтарный → красный). Без фракции/знакомых членов — базовое приветствие.

### Тесты и проверки
- +21 тест: `creepVitality.test` (8: зажим, монотонность, регенерация,
  порог добивания, очистка), `rewards.finisher.test` (5), `meleeStrike.test`
  (новый блок добивания: награды/события/запрет встречи при ≤35%, обычный
  путь при >35%, fallback без applyFinisher, зеркало подсказки),
  `tradingRelation.test` (6) + `crossSliceReads.tradeRelation.test` (5) +
  `merchantTradeFlavor.test` (5). Итого 2391 тест зелёный.
- tsc 0 · eslint 0 ошибок · vite build успешен · budgets OK ·
  events:check OK · validate-content 0 ошибок.

# Changelog — ВОЛОДЬКА RPG

## v4.8.7 (2026-09-05) — «Опережающий удар: первый реал-тайм слой боя»

### Бой: удар первым до пошаговой встречи (приоритет C, инкремент 1)
- **Проблема**: до сих пор бой начинался только пассивно — крип подходил
  на контакт (1.15 м) или стреляющий попадал в свой коридор атаки. Игрок не
  мог активировать встречу сам: «реал-тайм 3D-комбат» оставался крупнейшим
  пунктом бэклога (9) и требовал поэтапного входа.
- **Реал-тайм слой** (`engine/combat/realtime/meleeStrike.ts` + чистая
  геометрия `meleeSweep.ts`): ЛКМ / мобильная кнопка «Удар» в фазе
  исследования делает секторный замах (дальность 2.7 м, конус ~58°, вплотную
  — всегда). Если враг в секторе и в прямой видимости (vision-блокеры сцены)
  — встреча стартует с **ослабленным врагом** (75% HP), вместо ожидания
  контакта. Промах мимо врагов не «съедает» клик — ЛКМ работает как раньше.
- **Честная цена**: замах стоит 22 выносливости (новое
  `consumePlayerStamina` в `playerStamina.ts` — разовый расход вне спринта,
  с той же задержкой регенерации); кулдаун 0.9 с; не хватило выносливости —
  замах срывается без штрафа. Кулдаун и выносливость проверяются только при
  реальной цели в секторе — взаимодействие ЛКМ не блокируется.
- **Пошаговый бой не тронут**: `CombatStartOptions`/`EncounterContext`
  получили опциональный `introHpPct` (враг вступает с долей HP + строка в
  боевом логе «⚡ Опережающий удар»); `maxHp`, награды и фазы босса считаются
  от полного HP. Вовлечение крипа (`applyStrike`) — точная копия контактной
  ветки CHASE: презентация, победа, побег и тесты работают как раньше.
- **Ввод**: ЛКМ сначала пробует замах (`useEKeyInteraction`), «hit»/
  «tired»/«cooldown» consumes клик; мобильная кнопка «Удар» (Sword, янтарный
  акцент) вызывает `attemptMeleeStrike('mobile_hud')` напрямую.
- **Событие** `combat:melee_strike` (только при попадании) — consumers:
  искры и хаптика. Слой живёт только в фазе exploration и никогда не
  пересекается с пошаговым боем.

### HUD: подсказка «враг в зоне удара» + искры попадания
- `hud/parts/MeleeStrikeHint` — стеклянная янтарная капсула над нижним
  HUD-стеком: «⚔ {враг} · удар — ЛКМ» (на тач — «кнопка „Удар“»). Поллинг
  150 мс по зеркалу из реал-тайм слоя (паттерн StaminaBar, без подписок на
  кадр); при нехватке выносливости капсула тускнеет и честно объясняет
  причину. Появление — 240 мс ease-out; пульс отключён при
  prefers-reduced-motion.
- `MeleeStrikeFx` — первый рантайм-потребитель пула `combatHitSparkPool`
  (до сих пор пул разминался только тестом): искра в точке удара — вспышка,
  подъём, растворение за 0.45 с; императивное добавление/релиз без
  React-состояния, тик в skippable-системе `misc` (косметика).

### Мир: фракционные реплики при приближении (продолжение фракционной линии)
- `shared/npcFactionBark.ts` (чистый shared) — барки NPC, отражающие
  уровень отношения **фракции**: только сильные уровни (союзник 45% /
  враждебность 60% за подход), метка фракции подставляется в шаблон.
  cordial/neutral/wary молчат — контроль шума, как в диалоговом флейворе.
- Мост: `useNpcBark` → `useNpcFactionAttitude` (компонентный слой, стор не
  течёт в движок) → `computeBark(definition, factionContext?)`. Приоритет
  барок не изменился: квестовая → фракционная → по личному отношению.

### Проверки
tsc --noEmit: 0 ошибок · eslint: 0 ошибок (изменённые файлы чисты, 73
старых варнинга — baseline) · vitest: 2363 зелёных в 396 файлах (+23:
геометрия замаха, модуль удара, introHpPct, выносливость, фракционные
барки) · vite build: успех (39с) · budgets: OK · events:check: OK ·
validate-content: 0 ошибок.

## v4.8.6 (2026-09-05) — «Честные сохранения, фракции в диалоге, тактильность»

### Сохранение/загрузка: честный исход вместо ложного «Игра сохранена»
- **Проблема**: F5 показывал «Игра сохранена» даже когда `saveGame` молча
  пропускал запись (кат-сцена / бой / диалог) или падал; «Загрузить» из меню
  паузы и F9 работали молча, а загрузка **в бою** вообще была возможна —
  патч сейва сбрасывал runtime движка под живым CombatSystem'ом (боевой
  runtime не персистится).
- **Решение** (`saveSlice` + `components/game/save/quickSaveLoad.ts`):
  `saveGame`/`loadGame` возвращают типизированный исход
  (`SaveGameOutcome`/`LoadGameOutcome`), единая точка `quickSaveGame()`/
  `quickLoadGame()` переводит его в русский тост для всех входов — F5/F9,
  меню паузы и мобильный HUD. Примеры: «Сохранение недоступно в бою»,
  «Дождитесь конца сцены», «Сохранений пока нет». Ошибки записи/чтения не
  дублируются тостом — слайс уже отправляет `game:system_alert`.

### Мобильный HUD: быстрое сохранение/загрузка
- Пара кнопок «Сохранить/Загрузить» под кластером действий: прямые вызовы
  `quickSaveLoad` (без синтетических клавиш), дебаунс тапов и хаптика.
- Стили в одном ключе с кластером: стеклянная капсула-pill
  (`.mobile-save-load-row`), amber = сохранение, cyan = загрузка, отдельные
  размеры для альбомной ориентации.
- Подписи кнопок кластера 8px → 9px (аудит читаемости мобильного HUD).

### Тактильная отдача: события игры + настройка «Виброотклик»
- `engine/feedback/hapticEventFeedback` — модуль-одиночка: урон
  (`combat:damage`, троттлинг 350 мс), повышение уровня/навыка, завершение
  квеста, перк и физическая деградация → вибрация. Подписки переустанавливаются
  через `registerModuleGlobalCleanupBinder` — переживают dispose/revive шины
  (ErrorBoundary/StrictMode), как sprint-launch камеры.
- `hapticFeedback` — единый гейт `vibrateIfEnabled`: мастер-настройка
  применяется перед каждым вызовом; `hapticsSetting.ts` —
  `localStorage volodka_haptics_enabled`, дефолт ВКЛ.
- SettingsPanel → «Управление»: тумблер «Виброотклик (вибрация)», действует
  мгновенно, участвует в сбросе настроек. На десктопе — нулевая цена
  (navigator.vibrate отсутствует, кэшируется).

### Диалоги: репутация фракции говорящего
- Чип «фракция · уровень отношения» рядом с именем NPC
  (`FactionAttitudeChip`): цветовая кодировка согласована с баром отношения;
  тултип поясняет расчёт (среднее по знакомым членам фракции).
- Уровни (чистая логика в `shared/npcFactionAttitude.ts`): союзник ≥65,
  расположены ≥55, нейтрально 45–54, настороженно 31–44, враждебно ≤30 —
  пороги краёв взяты из общих `npcRelationThresholds`, чтобы чип и бар
  отношения не расходились.
- Реплика-флейвор над текстом только для сильных уровней (союзник/
  враждебность) — иначе повторялась бы на каждом узле и шумела.

### Стили: выносливость
- При полном истощении полоска «дышит» янтарной подсветкой (1.6s, класс
  `stamina-bar--exhausted` из существующего 100-мс опроса, без ре-рендеров);
  анимация отключается при prefers-reduced-motion.

### Проверки
tsc --noEmit: 0 ошибок · eslint: 0 ошибок (73 старых варнинга — baseline) ·
vitest: 2340 зелёных в 393 файлах · vite build: успех (39с) ·
validate-content: 0 ошибок.

## v4.8.5 (2026-09-05) — «Панели без синтетики, миникарта с обзором, голос и субтитры, фракции в цене»

### Мобильный HUD: прямое открытие панелей вместо синтетических клавиш
- **Проблема**: кнопки «Сумка»/«Журнал» в мобильном HUD открывали панели
  синтетическим `KeyboardEvent('KeyI'/'KeyJ')` на `window`. Событие проходило
  по всем подписчикам (мини-игры, photo mode), поведение зависело от порядка
  листенеров, а каждый новый не-клавиатурный источник (геймпад) требовал
  новой эмуляции клавиш.
- **Решение** (`engine/input/panelShortcutDispatcher.ts` + свитчборд в
  `useKeyboardShortcutManager`): панельный свитчборд «чистых» клавиш выделен
  в единую функцию `runPanelSwitchboard`; оркестратор регистрирует её при
  монтировании, мобильный HUD вызывает `firePanelShortcut('KeyI')` напрямую.
  Фолбэк для несмонтированного оркестратора (меню/интро) — прежнее
  синтетическое событие. Модификаторные комбинации (Shift+P, Shift+T)
  остаются только на клавиатуре — до свитчборда, порядок приоритетов сохранён.

### Миникарта: масштаб обзора (обзор / обычный / крупный)
- Кнопки «−/+/уровень» под кругом миникарты (внутри зарезервированного слота
  196px — правая колонка HUD не наезжает на квест-карту).
- Три уровня множителя радиуса обзора: ×1.35 («Обзор»), ×1 («Обычный»),
  ×0.7 («Крупный»); радиус сцены клэмпится снизу (`MINIMAP_VIEW_RADIUS_MIN=4`),
  чтобы «крупный» план не вырождался в «нос игрока».
- Выбор сохраняется в localStorage (`volodka_minimap_zoom_index`, паттерн
  `arrivalCinematicsSetting`); haptic-отклик на таче; aria-label и disabled
  на краях диапазона; клик по контролам не сворачивает карту.

### Голосовые линии: opt-in озвучка (Web Speech) + субтитры
- **Синтез речи** (`voiceOverSettings.ts` + `voiceLinePlayer.ts`): когда
  VO-файл недоступен (public/audio/vo/ не поставляется) и настройка
  «Озвучка реплик (синтез речи)» включена (вкладка «Аудио», дефолт ВЫКЛ),
  реплика проговаривается через `speechSynthesis` русским голосом
  (lang `ru-RU`); если русских голосов нет — тихий skip без испорченного
  звука. Тембр/темп зависят от эмоции реплики (calm/angry/sad/happy/whisper).
- **Субтитры** (`VoiceLineSubtitleHud`): во время реального воспроизведения
  (VO-файл ИЛИ синтез) внизу экрана показывается стеклянная капсула
  «Спикер: текст» — события `audio:voice_line_start` / `audio:voice_line_end`
  в типизированном eventBus; шрифт масштабируется через `--subtitle-scale`;
  таймаут-предохранитель, если событие end потерялось; без воспроизведения
  субтитр не рисуется (текст и так виден в диалоге).
- **Слой**: новый канонический `UI_LAYERS.VOICE_SUBTITLE` (37) — над диалогом,
  под панелями; никакого z-NN.
- Выключение настройки (и «Сбросить всё») немедленно глушит текущую
  озвучку (`stopVoiceLinePlayback`), включая синтез.

### Торговля: репутация фракции влияет на цены
- Эффективное отношение торговца = **80% личного отношения + 20% средней
  репутации его фракции** (среди знакомых членов; `useFactionReputation`).
  Легаси-фракции нормализуются (`normalizeFactionId`); NPC без фракции или
  без знакомых членов фракции торгует по личному отношению, как раньше.
- В подвале панели видно «· фракция {название}» с тултипом о вкладе репутации;
  работает и на цены покупки, и на выкуп, и на пороги `minRelation`.

### Проверки
tsc --noEmit: 0 ошибок · eslint (изменённые файлы): 0 ошибок ·
vitest: 2340 зелёных в 393 файлах · vite build: успех (39с) ·
validate-content: 0 ошибок.

## v4.8.4 (2026-09-05) — «Ритм без дрожания, честные дельты экипировки, кэш по весу»

### Музыка: sample-accurate lookahead-планировщик
- **Проблема**: бас и мелодия шли через `setInterval(beatMs)`, аккорды — через
  цепочку `setTimeout`. Дрожание таймеров (±4мс+) размывало ритм, а в скрытом
  табе Chrome троттлит `setInterval` до ≥1000мс — пульсы баса срывались и слои
  рассинхронизировались.
- **Решение** (`MusicEngine.ts`): единый планировщик «A Tale of Two Clocks» —
  стенные часы раз в 100мс расписывают пульсы баса, ноты мелодии и смены
  аккордов вперёд по точной сетке `AudioContext.currentTime` (горизонт 0.4с,
  в скрытом табе 2.6с > троттлинга).
- Реанкоринг «протухших» сеток после троттлинга: fast-forward без взрывного
  доигрывания пропущенных событий; аккордовое блуждание проходит пропущенные
  интервалы корректно.
- Смена интенсивности (exploration → tension → combat) больше не перестраивает
  сетку — темп подхватывается со следующего события без рассинхрона.
- Очистка узлов мелодии отсчитывается от реального старта ноты (раньше при
  планировании вперёд нота обрезалась бы доигрывающим таймером).
- Фейд уходящего аккорда считается по таймлайну атаки голоса, а не по
  мгновенному `.gain.value` в момент планирования.

### Инвентарь: сравнение экипировки в панели деталей
- **Панель деталей** показывает дельты против надетого в том же слоте
  (Cyberpunk-стиль: «Новое │ значение │ Надето», вердикты ↑/↓/=, зелёный/красный).
  Раньше сравнение было только в hover-тултипе (v4.7.9).
- В сравнение теперь входят и **боевые бонусы** (`combatBonus`) — раньше
  сравнивались только `effects`; строка с преимуществом подсвечивается,
  равные — приглушённо; стабильный порядок: статы → навыки → бой.
- Новая секция **«Боевые бонусы»** в панели деталей: combatBonus виден игроку
  (⚔ навык +N / % на все навыки) — раньше эти дельты были невидимы вовсе.
- Единый UI-блок `EquipmentComparisonBlock` для тултипа и панели деталей —
  без дублей разметки; логика сравнения — одна функция
  `buildEquipmentComparison` в `inventoryTooltipPresentation.ts`.
- **Слоты экипировки** получили микро-чип главного бонуса надетого предмета
  (цвет = польза/вред: эмеральд/роза).

### PWA: медиа-кэш по весу (LRU)
- К байтовому бюджету добавлен **кап 180 МБ**: 120 записей HDR по 7МБ
  выбивали квоту, а счётчик записей этого не видел.
- Хиты обновляют «недавность» (delete + re-put) — вытесняется давно
  неиспользуемое, а не просто самое старое по вставке.
- Учёт размеров по `content-length`, лениво пересевается после рестарта SW;
  при неизвестных размерах элегантно деградирует к капу по записям.

### Документация
- `POEMS_PER_ACT`: задокументировано, что акт 6 сознательно даёт 0 основных
  стихов (его дуга — скрытые poem_act6_01…08); «дыры» нет.
- Проверка «1 квест без questType» из аудита не подтвердилась (фалс-позитив
  подсчёта; validate-content: 0 ошибок).

### Также в этом цикле (QA-раунд 2, коммиты 7e5cabe/9734235 — не вошли в v4.8.3)
- EventBus: мягкий кап подписок в проде (21-я подписка больше не роняет бут),
  `strictCapacity` для тестов; канонические `UI_LAYERS` для Letterbox/SkillRecharge/
  AudioInfoDisplay; `matchMedia` вместо resize-листенера в мобильной детекции.
- **Pinch-zoom камеры** двумя пальцами (экспо-зум, FOV-режим от первого лица,
  сброс на blur) и **ghost-чип урона** во фрейме героя (WoW-приём).

### Проверки
tsc --noEmit: 0 ошибок · eslint: 0 ошибок (60 старых варнингов без изменений) ·
vitest: 2340 зелёных в 393 файлах · vite build: успех (38с) ·
validate-content: 0 ошибок.

## v4.8.3 (2026-09-04) — «Экспертный аудит: 132 этапа, камера честная, HUD без дублей»

### Критические исправления геймплея
- **Камера больше не проходит сквозь стены** (`cinematicCamera.ts`): клэмп
  `Math.max(minDistance, hit−margin)` размещал камеру ЗА стеной в тесных
  коридорах (стена ближе 1.35м). Теперь камера всегда между точкой взгляда
  и стеной (пол 0.2м); исправлен и обратный «inside-geometry» проход.
- **Залипание блока ПКМ устранено** (`useGamePhysics.ts`): блок включался
  по любому ПКМ в окне и не снимался при alt-tab. Добавлены гейт
  canvas-области и очистка по blur/visibilitychange.
- **Sprint-launch FOV-панч больше не умирает** после ремоунта оркестратора:
  подписка переведена на registerModuleGlobalCleanupBinder, порядок revive
  исправлен (eventBus раньше биндеров модулей).
- **Z-шейк камеры**: добавлена ось Z (удар «в спину»), раньше отбрасывалась.
- **Ложный hard-brake** после телепорта/смены сцены устранён (запись скорости
  привязана к сцене-владельцу).
- **Shift+R** больше не мутирует камеру в кат-сценах и диалогах.
- **Геймпад** больше не глушится при остановке тач-джойстика.

### HUD: дедупликация и единая сетка
- Открытие локации: один попап вместо двух (SceneDiscoveryToast снят с монтирования).
- XP: 7 визуальных артефактов на одно событие → 2 канала (число у прицела + лента).
  Убраны дубли из FloatingActionIndicator, LevelUpNotification, store-дифа
  useHUDController и повторное число combat:victory в DamageNumberFloat.
- Достижения: 3 уведомления → 1 попап; трофеи — только полноэкранная кат-сцена.
- Убран дублирующий QuickInventoryBar (перекрывал [E]-промпт и crafting-тосты).
- Единая сетка правой колонки: топ-бар → сложность (48) → баффы (84) →
  миникарта (146–342) → квест-карта (348) → ачивки (570). QuestObjectiveCard
  больше не налегает на миникарту; DifficultyIndicator открывает меню.
- Новый **PlayerStatusFrame** (WoW-стиль): портрет + бары Энергия/Стресс/Карма
  с числами и тиром — в топ-баре, desktop.
- Error-экраны 3D-канваса переведены на русский («Ошибка 3D-движка», «ПОВТОРИТЬ»).

### FreeRouter (AI-фичи) — рабочий эндпоинт и модель
- Эндпоинт исправлен: `https://api.freerouter.eu.cc/v1/chat/completions`
  (прежний хост отдаёт HTML документации — matrix-quote и city-news всегда
  уходили в фолбэк).
- Дефолтная модель `auto` вместо удалённого из каталога `glm-5.2` (проверено
  GET /v1/models по официальному API). Ключ по-прежнему только в env.

### Производительность
- FrameBudgetRunner: −2 спред-аллокации/кадр (≈120/сек GC-мусора).
- Горячий путь движения: один снапшот стора вместо двух.
- AmbientEngine: кэш noise-буфера вместо синтеза на каждый кроссфейд.
- useDeviceTier: синхронная детекция — мобильные не начинают грузить 2k-HDRI (6.66 МБ).

### Документация
- `docs/EXPERT_ANALYSIS_STAGES.md` — отчёт 132 обязательных этапов изучения
  кодовой базы (статический анализ ~430k строк) с находками и статусами.
- `ARCHITECTURE.md` — секция v4.8.3 (фиксы, сетка HUD, FreeRouter, перф).
- `readme.md` — обновлены переменные окружения (FREEROUTER_MODEL=auto).

### Проверки
tsc --noEmit: 0 ошибок · eslint: 0 нарушений · vitest: 245+ зелёных ·
vite build: успех · validate-content: 0 ошибок.

## v4.8.2 (2026-08-27) — «Аудит и стабильность сборки»

### Документация и аудит
- **docs/audit-report.md**: полный 15-этапный аудит кодовой базы (структура, сборка, типы, состояние, игровой цикл, управление, комбат, NPC/диалоги, UI/HUD, ассеты, сохранения, производительность, безопасность, совместимость) + сводный список багов по критичности.
- **readme.md**: синхронизирована версия пакета (4.4.2 → 4.8.1).

### Стабильность сборки
- Подтверждено: все 4491 модулей успешно трансформируются без ошибок компиляции; сборка упирается только в лимит памяти CI-окружения (cgroup 2 ГБ), на Vercel (16 ГБ) проходит. Рекомендация для локального CI: `NODE_OPTIONS=--max-old-space-size=1536 npm run build`.

## v4.8.1 (2026-08-24) — «Книги на полках, надписи без повторов»

### Исправления (по боевому фидбэку с volodka.vercel.app)
- **Книги висят в воздухе**: useGltfPropPlacement измерял bounds через
  requestIdleCallback — на первом кадре footY=0 ставил модель по центру
  (низ под землёй, верх с книгами в воздухе). Теперь bounds измеряются
  синхронно на mount (useMemo перед useState); idle-фолбэк остался для
  перестановок клонов
- **Сцены/надписи повторяются по несколько раз**: hero-arrival-таймлайны
  (street_night, city_square) играли на КАЖДЫЙ вход — возврат = тот же
  overlay-текст снова. Теперь ВСЕ arrival-сцены одноразовые за сессию
  (markArrivalSeen), как streetLegends с v4.7.6

## v4.8.0 (2026-08-24) — «Голоса Пирса: пять историй с реки»

### Контент
- **Новый квест-пак «Голоса Пирса»** (147 квестов итого): 5 побочных
  квестов акты 2→4, 19 сюжетных нод, river-noir тональность — река
  помнит больше, чем городские архивы:
  - «Радиограмма для Зины»: жестяная коробка из-под чая, 30 лет
    ехавшая до адресата; развилка паром/мост
  - «Три голоса реки»: ленточный магнитофон Трофима «Маяк-203» —
    скрип причала на рассвете, ночной гудок буксира, песня Ритки
  - «То, что гильдия утопила»: Марат-эхо и серверный блок с
    невыключенными разумами; речные крипы-сторожа
  - «Ожидание на причале»: Марина и 30 лет по девятнадцатым числам;
    старый паромный билет и второй медальон
  - «Четвёртый голос» (финал линии): чужая тайна, записанная рекой —
    3-сторонний моральный выбор (гильдия/сеть/владелец)
- Цепочка: zina_tin_box → three_voices → drowned_server →
  fourth_voice (+waiting); все NPC/сцены/флаги сверены с реестрами
- 8 юнит-тестов структуры пака (уникальность, типы объективов,
  резолв нод, русскоязычность, моральная развилка, квестгиверы)

## v4.7.9 (2026-08-24) — «Сравнение по-честному: две колонки»

### Новое
- **Двухколоночное сравнение экипировки** в тултипе (Cyberpunk 2077-стиль):
  значение на новом предмете │ название стата │ значение на надетом —
  по каждой строке вердикт ↑/↓ с величиной дельты; выигрывающие значения
  emerald, проигрывающие rose, равные приглушены. Включает РАВНЫЕ статы —
  полная картина вместо списка только изменений
- Заголовок «Новое vs {надетое} · {слот}»; ширина тултипа адаптируется
  при сравнении (w-64 → w-72); sr-only сводка дельт для скрин-ридеров
- 4 новых юнит-теста (полнота rows, согласованность delta = new −
  equipped, отсутствие сравнения при том же предмете/не-экипировке)

## v4.7.8 (2026-08-24) — «Волна из двух: бой подкрепляется»

### Новое
- **Волна из двух врагов** (последняя крупная геймплей-фича HUD-аудита):
  арена-бои на акте 3+ могут подкрепляться вторым врагом (шанс 15% / 25%
  / 35% на актах 3 / 5 / 7). Падение первого — не победа, а смена цели:
  половинные награды начисляются сразу, второй вступает на полном HP со
  своими спец-атаками; инициатива у игрока
- Смена цели: баффы врага и телеграф сбрасываются, баффы игрока живут
  (бой один); экранная вспышка + mystery-стингер + вибрация геймпада
- UI-индикатор волны в панели врага: пульсирующий ⚠ «Следом: ещё
  противник» (amber) — игрок знает, что бой не кончится на первом
- Архитектура — очередь `pendingEnemies: EnemyType[]` в CombatState
  (контракт `enemy` не тронут: ~114 ссылок в 8 файлах целы); пустая
  очередь/legacy = классический 1v1 без behavioral-изменений
- 5 интеграционных тестов (смена цели vs победа, полные награды за
  второго, сброс телеграфа/баффов, шансы rollEncounterWave по актам)

## v4.7.7 (2026-08-24) — «Хотбар в твоих руках: reorder + настройки входов»

### Новое
- **Переупорядочивание хотбара drag'ом**: предмет слота 1–4 можно
  перетащить на другой слот (swap), а сбросив в зону инвентаря — убрать
  из хотбара. Хотбар стал полноценным источником драга через собственный
  InventoryDragProvider (неактивный провайдер безопасно игнорирует чужие
  драги — guard на pointerup/move)
- **«Пропускать кат-сцены входа в локации»**: тумблер в настройках
  (вкладка «Управление») — отключает arrival-проходы камеры при входе в
  локации; сюжетные кат-сцены актов и сплэши взаимодействий не
  затрагиваются. Дефолт — выключено (первое впечатление — часть дизайна)

### Исправления
- Клик по слоту хотбара после drag'а гасится (wasDraggingRecently) —
  «схватить-отпустить» больше не расходует предмет

## v4.7.6 (2026-08-24) — «Режиссура входа: Уличные легенды»

### Новое
- **Arrival-кат-сцены для трёх локаций «Уличных легенд»** (режиссура входа
  в стиле эталонного STREET_ARRIVAL — 3 фазы: establishing wide → деталь
  окружения → handoff в exploration):
  - **Парк «Свет в окне напротив»**: рассветная тишь, взгляд на дом
    напротив («Третье окно слева — то самое»)
  - **Библиотека «Тихий час»**: пыль в луче света, последний стеллаж
    с чужой закладкой
  - **Подвал завода «Крысиные бега»**: гул труб, искрящийся щиток с
    camera-shake и лёгким глитчем
- Одноразовость: таймлайны играют только при первом визите в сессию
  (Set в cameraStateMachine) — повторные заходы за прогрессом квестов
  не прерывают исследование
- 8 юнит-тестов контракта таймлайнов (структура фаз, handoff-финал,
  русские overlay, валидные audioCue/lightCue, монотонность
  keyframes, camera-shake подвала)

## v4.7.5 (2026-08-24) — «Хотбар под рукой: drag & drop назначение»

### Новое
- **Перетаскивание в хотбар**: расходуемый предмет из инвентаря → слот
  QuickUseBar (1–4) = назначить. ПКМ-меню и клавиши 1–4 работают как
  раньше — DnD строго аддитивен
- Экипировка и расходуемые — оба типа drag-источников в сетке инвентаря
  (бейдж «⟷ тяни» на обоих)

### Стилизация
- Во время драга расходуемого все слоты хотбара «приглашают» пунктирной
  cyan-рамкой (quick-use-drop-armed); слот под курсором — пульс
  cyan-кольца; не расходуемый над хотбаром — rose-строб отказа
- Подсветка живёт в HUD-поддереве, драг — в панели инвентаря: связывает
  их DnD-зеркало (module-level стор + useSyncExternalStore, без
  prop-drilling и общего контекста; активен только во время драга)

### Архитектура
- DropTarget + {kind:'hotbar', slot}; data-dnd-hotbar на слотах —
  elementFromPoint-резолвер находит цели сквозь React-деревья
- 5 новых юнит-тестов (индексация хотбара, совместимость, зеркало)

## v4.7.4 (2026-08-24) — «Перетаскивай: Drag & Drop экипировки»

### Новое
- **Drag & Drop инвентаря** (последняя незакрытая фича HUD-аудита):
  предмет из сетки → слот экипировки = надеть; надетый предмет → зона
  инвентаря = снять. Единые pointer-события — мышь (порог 6px) и тач
  (лонг-пресс 250мс без сдвига, чтобы не конфликтовать со скроллом
  сетки); клик-выбор карточек не ломается (гашение click после драга)
- Клавиатурный путь (сетка-навигация + Enter) работает как раньше —
  DnD строго аддитивен

### Стилизация
- Drag-ghost: призрак карточки под курсором/пальцем — рамка редкости,
  наклон −2.5°, scale 1.06, глубокая тень, cyan-свечение
- Подсветка целей дропа: совместимый слот — пульсирующее cyan-кольцо;
  несовместимый под курсором — rose-строб отказа; зона инвентаря при
  снятии — dashed-контур
- Карточки-источники: cursor-grab/grabbing + hint-бейдж «⟷ тяни» при
  наведении; reduced-motion — статичная подсветка без пульсаций

### Производительность
- Позиция ghost пишется в DOM через transform на pointermove —
  ноль React-рендеров на кадр; ре-рендеры только на смену dragState
  (1× на драг) и dropTarget (при переходе между зонами)
- Чистая логика в inventoryDndLogic.ts — 10 юнит-тестов (поиск зоны
  по DOM-цепочке, совместимость слотов, пороги мышь/тач)

## v4.7.3 (2026-08-24) — «Худеем: −5570 строк кода и −6.8 МБ ассетов»

### Чистка
- **−5570 строк мёртвого UI-кода** (10 компонентов без единого живого
  импорта): MiniMap, WorldMapPanel, HudCompass, EnhancedAchievementSystem,
  EnhancedStatusDisplay, EnhancedActionBar, EnhancedLoadingScreen,
  EnhancedNotificationSystem, PhotoModeEnhanced, мёртвый дубль
  crafting/CraftingPanel — меньше кода в репо, быстрее сборка
- Удалены неиспользуемые public-файлы (−3.2 МБ): public/art/ (портреты
  генерируются процедурно), placeholder.png, deploy-vercel.md
- GameState (state/game.ts) — мёртвый тип с дрейфом полей удалён

### Производительность слабых устройств
- **moonlit_golf_1k.hdr**: box-2x downscale 2k-HDRI (6.7→3.1 МБ),
  генерация three.js RGBELoader + RLE-энкодер с roundtrip-проверкой;
  HeroEnvironment грузит 1k при deviceTier 'low' (−3.6 МБ на мобильных
  в ночных hero-сценах)

### Документация
- MIGRATIONS-контракт: когда нужен императивный шаг миграции сейва,
  а когда достаточно Zod-defaults (с процедурой инкремента SAVE_VERSION)

## v4.7.2 (2026-08-24) — «Репутация без сирот, оружие в руках, честные стаки»

### Исправления
- **Фракции без сирот**: legacy-фракции (streltsy / merchant_guild / it_guild
  / underground / forest_folk) маппятся на канонические (Гильдия /
  Сопротивление / ТОЛПА) — 6 NPC экспансии (Борис, Гарольд, снабженцы,
  контрабандисты) раньше не считались ни в одну фракцию. Мёртвый
  engine/factionReputation.ts удалён
- **maxStack в инвентаре**: стак больше не растёт сверх лимита каталога
  (30× кофе в слоте при maxStack 10) — доливка до лимита + разлив
  остатка по новым стекам, атомарный fail при нехватке места

### Новое
- **Слот оружия**: 4 предмета (Отладочный Клинок, Логическая Пушка,
  Резонатор Эмпатии, Рапира Стиха) с тематическими combatBonus; слот
  в EquipmentPanel (rose) и профиле; сейвы до v4.7.2 совместимы
  (weapon бэкфиллится null)
- **Честный фильтр инвентаря**: «Оружие» показывает только оружие,
  «Экипировка» — броню и аксессуары (раньше «Оружие» показывало всё)

# Changelog — ВОЛОДЬКА RPG
## v4.7.1 (2026-08-24) — «Один шёпот города, −26 МБ, тёплые руки геймпада»

### Производительность и размер
- **LOD-дедупликация персонажей (−26.4 МБ)**: все 40 файлов {npc}_lod1/_lod2.glb
  и volodka_lod1/lod2.glb были байт-идентичными копиями draco-варианта.
  Манифест переведён на честную схему «ближний LOD0 + дальний draco»:
  дистанции переключения сохранены, браузерный кэш дедуплицирует сеть
  до 1-2 уникальных загрузок на NPC (было 3). Валидатор LOD обновлён
  под дедуп-дизайн (было 40 фиктивных issues, теперь честный зелёный
  прогон); фейковые метаданные triangles 6000/2000 убраны из манифеста
- Кэш-заголовки для /models /textures /hdri /menu (сутки, не immutable —
  имена не хэшированы)

### Безопасность
- CSP + nosniff + Referrer-Policy + X-Frame-Options в vercel.json:
  script-src 'self' 'wasm-unsafe-eval' (WASM-декодеры Rapier/Draco/Basis),
  fonts.googleapis.com/gstatic для Cormorant/Manrope, blob-worker'ы
  разрешены, frame-ancestors 'none'

### Новое
- **«Шёпот города» в игре**: при стрессе ≥70 город шепчет игроку —
  кинематографичный оверлей (Cormorant italic, «дышащее» межбуквенное
  расстояние, свечение из размытия) на 9 секунд. Гейтинг с гистерезисом
  (новый шёпот только после падения стресса ≤60) и кулдауном 8 минут;
  сервер сам возвращает фолбэки — игра молча деградирует (7 юнит-тестов
  логики)
- **Геймпад-вибрация опасности**: телеграф спешела и фазовый переход
  босса — тяжёлый двойной гул gamepadRumbleDanger (dual-rumble с
  фолбэком на navigator.vibrate)

### Стилизация
- TelegraphIndicator переписан: градиентная плашка + бегущий блик
  «зарядки», ⚡ в пульсирующем кольце, нижняя линия «до удара»,
  подсказка о контр-окне видна и на мобильных («🛡 Защитись!»)
- Phase pips BossHealthBar: текущая фаза «дышит» цветом фазы
  (пульс opacity/scale/glow), пройденные горят статично

## v4.7.0 (2026-08-23) — «Активация мёртвых систем, живой мир, AI-контент»

Аудит 15 этапов выявил 20+ багов, включая 6 критичных: три полностью
написанные, но НИ РАЗУ не подключённые системы (фазы боссов, WoW-ИИ
крипов, DoT-хазарды), неработающие квест-маркеры миникарты, потеря
сложности при загрузке сейва, герцовка-зависимая инерция камеры.
Все исправлены и активированы.

### Активация мёртвых систем
- **Фазы боссов**: 3-фазные переходы 100/60/30% HP (множители урона
  ×1.0→×1.6, скорости, i-frames, «Призыв Теней»), pips синхронизированы
- **WoW-ИИ крипов**: line-of-sight (сегмент×AABB), leash-радиусы с
  возвратом, кайтинг стрелков 5–7м, погоня по nav mesh, stuck-детект
- **Хазарды**: data-driven damagePerTick/tickInterval (хардкод удалён)

### Новые системы
- **Телеграфирование спец-атак**: зарядка хода + индикатор «Готовит: …!»,
  контр-окно защиты ×0.4, тревожный стингер
- **Директор погоды**: детерминированные ливни/передышки/грозы по
  игровому времени, окна дождя в сухих сценах, дыхание снега
- **Стамина**: дрейн/реген/порог + тонкий HUD-индикатор; блок
  замедляет движение; клавиша Q
- **Визуальные хазард-зоны**: искры/лужа/шевроны/вода/огонь + HUD-канал
- **PWA**: регистрация service worker + офлайн-кэш ассетов

### FreeRouter AI-контент
- Городской тикер «ЭФИР» (/api/city-news) — AI-новости ночного радио
- Режим «Шёпот города» (matrix-quote?mode=whisper)
- Фикс max_tokens 400→900 (glm-5.2 reasoning съедал бюджет)

### Контент
- Пак «Уличные легенды»: 5 квестов (наблюдение/доставка/бои/сбор/
  расследование), 30 нод, 6 предметов — итого 142 квеста
- 18 NPC-сплэшей экспансии зарегистрированы (кинематографичные
  первые встречи не срабатывали)
- 38 нод AAA-экспансии получили ленивый пак (не загружались в рантайме)

### Критичные фиксы
- Сложность восстанавливается из сейва (difficultySettings дропался в
  applyCombinedPatch; фасад не был подписан на difficulty-стор)
- Квест-маркеры миникарты (мёртвое чтение markerWorldPos → getQuestMarker,
  edge-clamping, сворачивание в «таблетку»)
- Инерция камеры от rAF dt (144Гц = 2.4× быстрее вращение)
- Спешелы боссов через пайплайн защиты
- Один WoW-маркер над NPC (дедупликация), 12 stale-тестов исправлены,
  jsdom background-shorthand крэш

### Метрики
- TypeScript: 0 ошибок (tsc --noEmit)
- Тесты: 2182+ → все зелёные (было 12 падений, включая 6 pre-existing)
- Сборка: см. readme §Vercel Deploy

## v4.4.2 (2026-08-19) — "Полная оптимизация моделей: 493МБ → 135МБ"

Тотальная оптимизация 3D-ассетов через `@gltf-transform`. Игра стала грузиться в ~3.7 раза быстрее, dist/ уменьшен на 73% (−358МБ). Все оптимизации используют уже настроенные в лоадере декодеры (Draco + Meshopt + WebP через `gltfPipeline.ts`).

### Что сжато

**Статичные props (Draco + WebP):** геометрия → Draco, текстуры PNG → WebP.
- `server_fragment.glb`: 19.7МБ → 2.0МБ (×9.8)
- `digital_amulet.glb`: 9.6МБ → 0.9МБ (×10.7)
- `neural_filter.glb`: 8.8МБ → сжато
- `encrypted_scroll.glb`: 8.1МБ → сжато
- `poetic_compiler.glb`: 3.7МБ → 1.3МБ
- Всего: 5 моделей, 49.9МБ → ~6МБ

**Скелетные риги NPC (Meshopt + WebP):** Meshopt сохраняет skinned animation (Draco ломает).
- 21 риг (`_rigs/male_01..11`, `female_01..09`): 1.4–2.0МБ → 0.7–0.8МБ
- `fps_arms.glb`: 2.1МБ → 0.5МБ
- Всего: 22 модели, ~33МБ → ~16МБ

**Poly Haven props (Draco + WebP, gltf→glb):** 33 модели конвертированы из .gltf+.bin+.jpg в single-file .glb.
- `modular_urban_apartments_facade`: 48МБ → 1.2МБ (×39)
- `painted_wooden_table`: 8.7МБ → 0.13МБ (×65)
- `modular_fire_escape`: 20МБ → 0.58МБ (×35)
- Всего: 209.6МБ → 12.5МБ (−197МБ, 94%)
- Удалены 33 .gltf + 33 .bin + все textures/ папки. `polyhavenAssets.ts` обновлён (.gltf → .glb).

**PBR-текстуры пола/стен (JPG → WebP):** 28 текстур Poly Haven (asphalt, wood_floor, concrete, metal, plaster).
- normal maps: quality 92 (без артефактов для освещения)
- diff/rough/ao: quality 85
- Всего: 34МБ → 13МБ (−21МБ)
- `getPolyHavenMapUrl` обновлён (.jpg → .webp)

**Вегетация (Draco + WebP):** `pine_lod0.glb` 8.3МБ → 56КБ (×148 — текстуры были PNG 2048×2048). Удалены неиспользуемые `pine.draco.glb`, `pine.meshopt.glb`, `pine_lod1`, `pine_lod2`.

**art/ изображения (PNG → WebP):** 7 файлов (boot, портреты NPC, hero-bg). 19.4МБ → 2.3МБ.

### Итоговые размеры

| До | После | Экономия |
|---|---|---|
| dist/ 493МБ | dist/ 135МБ | −358МБ (−73%) |
| public/models/ 414МБ | public/models/ 105МБ | −309МБ (−75%) |
| public/textures/ 35МБ | public/textures/ 14МБ | −21МБ |
| public/art/ 20МБ | public/art/ 2.4МБ | −17МБ |

### Скрипты

Добавлены npm-скрипты для повторной оптимизации:
- `npm run assets:optimize-models` — props + риги + fps_arms + interiors
- `npm run assets:optimize-polyhaven` — polyhaven .gltf → .glb (draco+webp)
- `npm run assets:optimize-textures` — PBR-текстуры JPG → WebP

### Совместимость

- **GLTFLoader** уже поддерживает `EXT_texture_webp` автоматически (three.js регистрирует расширение по умолчанию).
- **Draco-декодер** настроен в `gltfPipeline.ts` (`DRACOLoader`, WASM, путь `/draco/gltf/`).
- **Meshopt-декодер** настроен там же (`MeshoptDecoder`, pure JS).
- **WebP** поддерживается всеми современными браузерами и `useTexture` из drei.
- Никаких runtime-изменений не требуется — только URL-свапы в config и бинарная замена GLB.

### Верификация

- `tsc7 --noEmit` — 0 ошибок.
- `vite build` — успешно (4454 модуля, 36с).
- `prune-deploy-assets` — отработал (40 файлов, 12МБ вырезано).
- `gltf-transform validate` — все оптимизированные GLB прошли валидацию.

### Что осталось (135МБ)

- `models/npcs/` 69МБ — ~100 NPC по 0.7МБ, все уже meshopt-compressed. Дальнейшее сжатие рискованно (skinned animation).
- `hdri/` 9.7МБ — HDR-окружение для IBL, уже 1k/2k.
- `textures/` 14МБ — PBR-текстуры, уже WebP.
- `index.html` 12МБ (gzip 3.4МБ) — singlefile bundle.

---

## v4.4.1 (2026-08-19) — "Харденинг деплоя, бой и локализация"

Целевые исправления критических багов рендера, боевой системы, локализации и блокировщиков деплоя на Vercel. Аудит проведён статическим анализом (без dev-сервера и браузера) тремя параллельными Explore-агентами по подсистемам 3D/физики, геймплея и UI/HUD/деплоя.

### Рендер

- **Shadow frustum坍塌 в 30×30 м** (`Lighting.tsx`): `config.dimensions` не заполняется генератором сцен (он flattens в `config.size = [width, depth]`), поэтому фрустум теневого направленного света всегда схлопывался в 15×15 м. В маленьких интерьерах — пиксельные тени, на краях уличных сцен — тени пропадали вовсе. Теперь fallback на `config.size`.
- **Утечка `SphereGeometry` в `GodRaysSunMesh`** (`GodRaysSunMesh.tsx`): геометрия из `useMemo` не диспоузилась при размонтировании (R3F авто-диспоузит только JSX-геометрии). Компонент перемонтируется на каждой смене сцены → по одной утечке за переход. Добавлен `useEffect(() => () => geometry.dispose(), [geometry])`.
- **`AtmosphericDust` в неправильных границах** (`AtmosphericDust.tsx`): та же ошибка `config.dimensions ?? [10,3,10]` → пыль занимала неправильный объём во всех сценах. Теперь fallback на `config.size`.

### Бой

- **`combatBonus` экипировки был мёртв в формулах урона** (`formulas.ts`): `getPlayerAttack` / `getPlayerDefense` / `getPlayerCritChance` читали `skills` напрямую и игнорировали `combatBonus` предметов. 13+ предметов (Ring of Focus, Armor of Empathy, и др.) показывали «+2 coding» в карточке, но бонус не влиял на урон. Теперь `applyEquipmentBonusToSkill` применяется к coding/logic/empathy/writing. Чтение `equippedItems` идёт из live-store (`getPlayerStore`) с try/catch — combat-снапшот намеренно редуцирован и не содержит экипировки.
- **Боссы игнорировали пользовательскую сложность** (`combatDifficulty.ts`, `enemyTurn.ts`, `bindApplicationLayers.ts`): basic attacks получали и legacy combatDifficulty (3-level localStorage, default `normal`=1.0), и difficultySlice (5-level, пользовательский, выставляется в SettingsPanel), а боссы — только combatDifficulty (=1.0), т.е. вообще не реагировали на выбор игрока. Унифицировано: `scaleEnemyDamageByDifficulty` предпочитает difficultySlice через зарегистрированный геттер в bootstrap-слое (без нарушения engine→store layering, безопасно для unit-тестов). Удалено дублирующее применение в `enemyTurn.ts`.

### Локализация и доступность

- `CombatDamageFx.tsx`: «CRIT» → «КРИТ».
- `useHUDController.ts`: «XP» → «Опыт» (остальные статы — Карма/Энергия/Стресс — уже были на русском).
- `SceneTopBarHud.tsx`: `aria-hidden="true"` → `role="region"` + `aria-label` (вся верхняя HUD-панель была скрыта от скринридеров).
- `EnvironmentalEffectsOverlay`, `BuffDebuffTracker`, `WorldSpaceLabels`: английские `aria-label` → русские.

### Деплой на Vercel

- **`vercel.json`**: `buildCommand` «vite build» → «npm run build:vercel» (vite build + `prune-deploy-assets`). Раньше `dist/` собирался как копия всего `public/` (~493 МБ) и ломал деплой. Prune убирает 184 МБ неподключённых ассетов → ~309 МБ. `installCommand` «bun install» → «npm install» (репозиторий использует npm, `package-lock.json` закоммичен; bun без `bun.lockb` недетерминирован).
- **Rapier WASM** закоммичен в `public/rapier/rapier_wasm3d_bg.wasm` (~1.5 МБ): раньше runtime HEAD-probe возвращал 404 → fallback на inline base64 (+2 МБ в HTML + 1.5 с таймаута на каждой загрузке).
- **`tsx`** добавлен в `devDependencies`: нужен для `prune-deploy-assets.ts` (раньше полагались на `npx`-скачивание в рантайме сборки).
- Добавлен npm-скрипт `build:vercel`.

### Верификация

- `tsc7 --noEmit` — 0 ошибок.
- `vite build` — успешно (4454 модуля, 37 с).
- `vitest run` для `combatDifficulty.test.ts` + `enemyTurn.test.ts` — 25/25 тестов проходят.
- `prune-deploy-assets.ts` — отработал, убрал 101 файл (184 МБ).

### Замечание

Предоставленный GitHub PAT признан невалидным (GitHub API возвращает 401). Изменения закоммичены локально; для пуша в `origin/main` требуется действующий PAT с правом `Contents: write` на `IETGLIM/Volodka`.

---

## v4.4.0 (2025-08-16) — "AAA Полировка: Боссы, Станы, Доступность"

Крупное обновление: экспертный аудит кодовой базы (150+ багов найдено), исправление критических игровых багов и добавление новых AAA-фич. Проведено в 15 этапов изучения кода с параллельными агентами по всем подсистемам.

### Критические исправления багов

**Боссы теперь доступны (Combat H1)**
- 3 босса (boss_neuro_sys, boss_dream_eater, boss_final_code) были определены, но никогда не triggered — мёртвый код
- boss_neuro_sys встроен в осаду хранилища (Акт 3, `act3_vault_siege`)
- boss_dream_eater встроен во вход в сон (Акт 5, `sleep_dream_entrance`)
- boss_final_code встроен в истинную концовку (Акт 7, `act7_true_end`)
- Достижения за победу над боссами теперь реально доступны

**Стан-способности работают (Combat H2, H3)**
- `skip_turn` с длительностью 1 удалялся ДО проверки пропуска хода — 8+ стихов-сил игрока не работали
- Проверка skip_turn теперь выполняется ДО tickBuffs (на входящем состоянии)
- `stun_immune` больше не удаляется при наложении нового `skip_turn` — иммунитет реально защищает от стан-лока
- incoming `skip_turn` блокируется при активном `stun_immune`

**Диалоги возврата исправлены (NPC B1)**
- 28 NPC имели сломанные возвратные диалоги — выбор «Расскажи что-нибудь новое» вёл к несуществующим узлам и ошибке «Не удалось загрузить диалог»
- `mkReturn` теперь принимает явный `entryId` (реальный `dialogueNodeId` NPC)
- Все 34 возвратных узла исправлены

**Кат-сцена Act1→Act2 (NPC B3)**
- `textAccentColor: 'var(--cyber-cyan)'` не парсился THREE.Color/canvas → заменён на hex `#22d3ee`

### Исправления производительности 3D

**Устранены утечки памяти**
- `ProceduralAtmosphere.ts`: `applyHeightDistanceFog` теперь мутирует существующий `FogExp2` in-place вместо `new FogExp2()` каждый кадр
- `ProceduralCharacter.tsx`: добавлена утилизация 6 геометрий + 4 материалов + DataTextures при unmount
- `AaaSurfaceShader.ts`: fallback-текстуры утилизируются через `disposeAaaSurfaceMaterial()` (материал + все uniform-текстуры)
- `HybridGlbLandmarks.tsx`: клонированные материалы утилизируются при unmount
- `ProceduralSdfWorldMesh.tsx`: useMemo deps исправлены — все параметры влияют на перегенерацию (раньше твик-панель не работала)

**Уменьшены per-frame аллокации**
- `ProceduralCharacter.tsx`: 8+ Vector3 clone/new за кадр заменены на scratch-refs

### Исправления HUD и аудио

- `AchievementPopup.tsx`: `charCodeAt(5)` на коротких id давал NaN → стабильный хеш через reduce
- `DamageFloatSystem.tsx`: опечатка «ПОКШЕНИЕ» → «ПОРАЖЕНИЕ»
- `CombatLogPanel.tsx`: `aria-label="Combat log"` → «Боевой журнал»
- `interactionSfx.ts`: throttle смешивал `ctx.currentTime` (секунды) и `performance.now()` (мс) → единая time origin
- `voiceLinePlayer.ts`: каждый диалог вызывал HTTP 404 на `/audio/vo/` → кэшированная HEAD-проверка, no-op при отсутствии VO
- Удалён мёртвый код: `CyberpunkMinimap.tsx` (922 строки, никогда не монтировался), `_activeFilterLabel` в Inventory

### Исправления NPC и диалогов

- `npcAmbientBarkSystem.ts`: погодные реплики больше не играют при `weatherEnabled === false`
- Спящие NPC больше не издают ambient-реплики (проверка schedule activity === 'sleep')
- Порог «союзника» выровнен: `npcRelationshipConstants` (65) и `shared/npcBark.ts` (раньше 70) теперь используют единый `NPC_RELATION_ALLY_THRESHOLD`

### Исправления состояния и производительности

- `worldSlice.ts`: meta-достижение `hidden_all_achievements` использует `runAfterStoreCommit` вместо `setTimeout(100)` (гонка сохранения устранена)
- `nightTimeHours`: IEEE 754 дрейф от `+ 0.01` → целочисленный `nightTimeTicks`-счётчик
- `useGameLifecycleManager.ts`: автобеседа на scene:enter/combat:end теперь дебаунсится (2с) вместо синхронного localStorage.setItem
- TTL-интервал (1с) теперь no-op вне exploration-фазы и при `document.hidden`
- `combinedState.ts`: устранён двойной flush фасада (микротаск + rAF боролись) — сравнение slice-refs перед инвалидацией кэша
- Тройная тряска камеры при крите устранена — `useCombatOrchestrator` больше не дублирует `AaaCombatCinematic`

### Новые AAA-фичи

**Quest Chain Unlock Toast**
- `QuestChainUnlockToast.tsx`: полированный тост при разблокировке цепочки квестов (золотая рамка, иконка, портрет NPC, название сцены, авто-закрытие 4с)

**Objective Complete VFX**
- `ObjectiveCompleteVfx.tsx`: при выполнении цели — анимированная галочка, 8-искровой золотой бёрст, золотая вспышка экрана, floating text «✓ Цель выполнена»

**Подарки NPC для всех (4b)**
- `NPC_GIFT_PREFERENCES` расширено с 7 до 29 NPC (все расширенные + ЧК/ТОЛПА)
- Каждому NPC — 5 уровней предпочтений (loved/liked/neutral/disliked/hated) по личности

**Milestone-диалоги отношений (4b)**
- Поле `relationMilestones` в NPCDefinition
- `npcRelationMilestones.ts`: эмитит `npc:relation_milestone` при пересечении порога (50 «Доверие», 80 «Близость»)
- 20 глубоких диалоговых узлов для Альберта, Заремы, Марии, Солныш
- Авто-открытие milestone-диалога при достижении порога

**Плавающий джойстик (4c)**
- `VirtualJoystick.tsx`: режим `floating` — тап в левой половине экрана → джойстик появляется под пальцем (как в Fortnite mobile)
- Fixed-режим сохранён как fallback

**HP damage preview + heartbeat (4c)**
- `CyberStatBar.tsx`: сегмент «отложенного урона» (как Dark Souls) — светло-красный дренируется за 500мс
- Низкий HP (<25%): пульсация box-shadow красным с интервалом 0.8с

**Mobile touch targets (4c)**
- Button: добавлен `touch`-вариант (h-11 = 44px)
- PanelWrapper: кнопка закрытия h-11 на мобиле (было 28px)
- Checkbox/Slider: увеличены до size-5

**Accessibility CSS (4d)**
- `ColorBlindFilters.tsx`: SVG Daltonization-фильтры (протанопия/дейтеранопия/тританопия) применяются к canvas
- High-contrast mode: твёрдые фоны, 2px границы, белый текст, отключение градиентов
- Global `:focus-visible` ring (cyan, 3px white в high-contrast)
- `--subtitle-scale` применяется к диалогам, субтитрам, ambient-подписям, thought-interjections

**Контент: 12 lore-записей (4e)**
- История Сети, старые поэты, тайна Гильдии, легенды ЧК, сонная болезнь, запретные строки, машина под городом, происхождение Марии

**Панель репутации фракций (4e)**
- `FactionReputationPanel.tsx`: агрегированная репутация по 5 фракциям (Сеть/Гильдия/Сопротивление/Нейтральные/ТОЛПА)
- Анимированные бары, tier-метки, счётчик встреченных NPC
- `factionReputationSelectors.ts`: memoized-селектор
- Интегрирована в Кодекс

**Босс-интро кинематика (4f-B)**
- `BossIntroCinematic.tsx`: 3-секундное леттербокс-интро перед битвой с боссом (глитч-эффект, имя босса, субтитр)
- `BossHealthBar.tsx`: полноэкранная полоса HP босса с фазовыми индикаторами и damage-preview
- `BossDefeatCinematic.tsx`: 2-секундный slow-mo + dissolve + «ПОВЕРЖЕН» при победе над боссом
- BOSS_INTRO_DATA: НЕЙРО-СИСТЕМА, ПОЖИРАТЕЛЬ СНОВ, ФИНАЛЬНЫЙ КОД

**8 новых побочных квестов (4f-A)**
- «Пропавший дневник» (Акт 2), «Эхо в канализации» (Акт 3), «Контрабанда стихов» (Акт 3)
- «Старая фотография» (Акт 4), «Сломанный механизм» (Акт 5), «Ночная рыбалка» (Акт 5)
- «Лагерный огонь» (Акт 6), «Последнее письмо» (Акт 7)
- 24 новых ambient-реплики для 6 NPC, 4 новых trigger-зоны (factory_roof, library_basement, underground_bunker)

### Технические детали
- 85+ файлов изменено, ~6000 строк добавлено, 15 новых файлов
- 0 ошибок TypeScript (tsc7 native typecheck)
- Все видимые тексты на русском
- 5 параллельных Explore-агентов изучили кодовую базу в 15 этапов
- Экспертный аудит: 47 багов в 3D, 25 в бою, 18 в NPC/диалогах, 20 в HUD/аудио, 18 в состоянии/перформансе

## v4.3.0 (2025-07-21) — "Прорыв: Disco Elysium механики + контент"

Крупное обновление: выход из цикла багфиксов, добавление трёх новых систем и значительное расширение контента Акта 1.

### Новые системы

**Кабинет Мыслей (Thought Cabinet)**
- 18 внутренних голосов Володьки с уникальными механическими эффектами
- 3 mutually exclusive пары: Постсоветская Ностальгия ↔ Киберпанк Будущее, Сопротивление Системе ↔ Адаптация к Системе, Одиночество как Щит ↔ Связи что Спасают
- Магазин в PlayerSlice, GameAction integration, 6 typed selectors
- Полноценная вкладка в Журнале с dual-pane UI (карточная сетка + панель деталей)
- Модификаторы навыков от экипированных мыслей интегрированы в dice-roll систему

**Dice-Roll проверки навыков**
- Механика 2d6 + модификатор vs DC (вдохновлена Disco Elysium)
- Критический успех (натуральный 12) и критический провал (натуральный 2)
- Seeded RNG для воспроизводимости
- Анимированный UI с 3D CSS-кубиками, terminal-style breakdown, cyberpunk-эффектами
- Интеграция в DialogueRenderer — проверки навыков теперь с броском кубиков
- Модификаторы от Thought Cabinet автоматически учитываются

### Расширенный контент Акта 1

**Диалоги с Альбертом** (30 нод, 1077 строк)
- Глубокие ветвления: философия, юмор, секреты, эмоциональные моменты
- 18 проверок навыков (DC 10-14) по всем 7 навыкам
- Karma-вариантные тексты, thought cabinet acquisition триггеры
- Секрет «Архив-7» при проверке Persuasion DC 14

**Комната Володьки** (28 нод, 998 строк)
- Интерактивное исследование: кровать, окно, стол, дверь, зеркало, постер, пол, потолок, мусорка, телефон
- Каждый объект — 2-4 абзаца литературного русского текста
- Проверки навыков (DC 10-12), скрытые находки, flags для будущих актов
- 10 новых trigger zones в narrativeExpansionTriggerZones

### Улучшения онбординга
- Скорость сборки стихов в Matrix-заставке увеличена на 60%
- Максимальная длительность пролога: 90с → 30с
- Проминентная пульсирующая кнопка «Пропустить» с обратным отсчётом
- Диалог «Новая Игра» с опцией «Пропустить пролог» (прямой переход к геймплею)

### Технические детали
- 31 файл изменён, 4399 строк добавлено, 130 удалено
- 0 ошибок TypeScript, чистая сборка за 35с
- Новый типографский файл: `src/shared/types/definitions/thoughtCabinet.ts`
- Новые GameAction типы: `thoughtCabinet/acquire`, `thoughtCabinet/equip`, `thoughtCabinet/unequip`
- NarrativePackRegistry расширен: `part1AlbertExpanded`, `act1RoomExpanded`
- Создан `AI_SESSION_CONTEXT.md` для непрерывности разработки

## v4.2.43 — 16 июля 2026

### Narrative routing — critical fixes

- **StoryRenderer.handleChoice**: заменена inline-логика на `executeStoryChoice` из
  `narrativeChoiceExecutor`. Старый код: (а) вызывал `setCurrentNodeId('start')` после
  `openNarrativeOverlay` без `return` — двойная мутация при new-game reset; (б) не
  маршрутизировал Act1-узлы через `presentNarrativeBeat`, поэтому explore-hub и hud-
  режим никогда не активировались из StoryRenderer. Оба дефекта устранены.

- **DialogueRenderer.handleChoice**: заменена inline-логика на `executeDialogueChoice`.
  Старый код не закрывал diegetic-нарратив (`closeDiegeticNarrative`), не обрабатывал
  explore-hub навигацию и не маршрутизировал Act1-диалоги через diegetic HUD.

- **StoryRenderer — guard двойного применения эффектов**: добавлен `appliedNodeIdRef`
  — применение `applyEffects` пропускается если узел уже был смонтирован с тем же id
  (StrictMode mount-cleanup-remount, быстрые переходы). До исправления карма/энергия/
  стресс могли удваиваться при открытии некоторых узлов в dev-режиме.

- **StoryGuidanceHUD**: `line-clamp-1` → `line-clamp-2` для текста цели — русские
  описания квестов часто не вмещаются в одну строку (обрезались без намёка на продолжение).

- Удалены мёртвые импорты из обоих рендереров (`openNarrativeOverlay`,
  `enterSceneFreeExplorationHub`, `EXPLORE_HUB_NODE_IDS`, `resolveExploreHubNavigation`,
  `useSetCurrentNodeId`).

## v4.2.42 — 17 июня 2026

### Golden path — terminal spine node
- **deriveGoldenPath**: terminal spine end (`act7_true_end`) excluded from `missingGoldenPathMarkers` when fallback cannot advance (new-game choice is not spine).

## v4.2.41 — 17 июня 2026

### Sprint 5 — Lint zero + E2E hardening (ROADMAP §8)
- **ESLint 0 warnings**: 353 → 0; убран `--max-warnings 362` из `package.json`; зачистка unused imports/vars, react-refresh file disables, intentional exhaustive-deps.
- **E2E typed bridge**: `callE2EBridge` + `e2eBridge` helpers в `e2e/helpers.ts`; `bootstrapExtensionScene` в `e2eBridge.ts`.
- **Extension scenes smoke**: `e2e/extension-scenes-smoke.spec.ts` — `pier_evening`, `city_square`.
- **ROADMAP**: §8 Sprint 5 чек-лист закрыт.

## v4.2.40 — 17 июня 2026

### Sprint 4 — Narrative UX + golden path (ROADMAP §8)
- **Golden path 0 warnings**: `deriveStorySpine` === `GOLDEN_PATH_STORY_SPINE`, `fallbackSpineSteps: []`, `missingGoldenPathMarkers: []` (метки уже в story graph; act*.ts не редактировались в этом спринте).
- **STORY_NODE_GUIDANCE**: публичный alias для `GOLDEN_PATH_BRANCH_HINTS`; 116/116 шагов спайна с HUD-подсказкой.
- **Тесты**: `goldenPathGuidance.test.ts` — derivation report + guidance coverage; act7 endings verified (poem text sacred).
- **ROADMAP**: §1 P1 и §8 Sprint 4 чек-лист закрыты.

## v4.2.39 — 17 июня 2026

### Sprint 3 — Graphics AAA (ROADMAP §8)
- **Wet street (high+)**: planar reflector на `street_night` и `city_square` при пресете «Высокое»/«Ультра»; tiered buffer (384 high / 512 ultra); gates: auto, reduced-motion, coarse-pointer.
- **Interior lighting**: `chk_campfire_night` (костёр + fill), `albert_backroom` (safehouse), `guild_mainframe` — ambient/fill в `Lighting.tsx` + усиленные point lights в extension defs.
- **LOD audit**: `SCENE_ENV_LOD` для 9 extension-сцен (finite cull radii вместо default 999).
- **Тесты**: `wetStreetScenes`, quality preset gates, extension LOD profiles.

## v4.2.38 — 17 июня 2026

### Sprint 2 — Art pipeline audit (ROADMAP §8)
- **assets:status**: блок «Sprint 2 audit» — manifest, Quaternius, Mixamo, RPM, AI3DGen Pro gaps в одном отчёте.
- **ROADMAP §8 Sprint 2**: чек-лист обновлён по аудиту (26/26 shipped, 20/20 Quaternius interim; Mixamo/RPM — блокеры на user downloads).

## v4.2.37 — 17 июня 2026

### AAA polish — selector stability
- **compositeSelectors**: стабильный `EMPTY_ACTIVE_TTL_FLAGS` вместо inline `{}` — React #185 / shallow snapshot regression fix.
- **ROADMAP §10**: auto-animate → tailwindcss-animate migration задокументирована.

## v4.2.36 — 17 июня 2026

### Poem TTL dialogue gates + PostFX boost
- **Условия `activeTTLFlag`**: `ChoiceCondition` + `checkStoryCondition` проверяют live TTL из `activeTTLFlags` (expiry-aware); контекст в DialogueRenderer / StoryRenderer.
- **Dialogue nodes**: `dialogue_truth_revealed` (Альберт + `truth_voice_active`), `dialogue_guiding_star_live` (уличный поэт + `guiding_star_active`), `dialogue_storm_wind_live` (коллега + `storm_wind_active`).
- **ExplorationPostFX**: `resolvePoemTTLPostFxBoost` — динамический bloom/vignette по категории poem world effect; reduced motion — ~35% усиления.
- **PoemWorldEffect**: убран CSS scanline overlay на `matrix_pulse` (PostFX-only путь).
- **Списки стихов**: `@formkit/auto-animate` удалён; `tailwindcss-animate` (`animate-in fade-in slide-in-from-bottom-2`) через `useNewlyCollectedPoemIds`.

## v4.2.35 — 17 июня 2026

### Open-source libraries — quick wins + ROADMAP §10
- **@formkit/auto-animate**: bounce-анимация при добавлении стиха в списки — `PoemListView` (книга стихов) и `PoemsTab` (журнал); хук `useAutoAnimateRef` с отключением при reduced motion.
- **drei Sparkles**: `IndustrialSparkles` — пыль/искры в `abandoned_factory` и `factory_basement` (mobile/lite/reduced-motion gates).
- **street_night fog**: усилен preset `VolumetricFog` + runtime config в `AtmosphericEffects` (noir плотнее).
- **Poem glitch demo**: CSS scanline overlay на `matrix_pulse` в `PoemWorldEffect` (замена deferred CustomShaderMaterial).
- **ROADMAP §10**: таблица fit/effort, phased plan XState (interaction first), честное предупреждение Ink=XL, CustomShaderMaterial ≠ drei export.

## v4.2.33 — 17 июня 2026

### Poem Synergies — ритм двух стихов
- **Rhythm combo**: второй стих в течение 5 с после первого активирует синергию (пары двунаправленные).
- **Конфиг** `poemSynergies.ts`: Штормовой Прорыв (poem_5+poem_8), Глас Слова (poem_1+poem_6), Городская Звезда (poem_3+poem_11), Связь Сердец (poem_4+poem_17), Шторм Мысли (poem_5+poem_14).
- **Store**: `lastUsedPoemId` / `lastUsedPoemTimestamp` в player slice; `poem/recordLastUsed` после успешной активации.
- **Проверки навыков**: TTL-флаги poem/synergy auto-pass и critical persuasion через `poemSkillCheckRules` + consume в DialogueRenderer.
- **UI**: toast «Синергия: …»; world VFX через `poem:synergy_triggered` → `poem:world_event`.
- **Тесты**: окно 5 с, bidirectional pairs, expired window, flag application и TTL reverse.

## v4.2.34 — 17 июня 2026

### Poem Reading Ritual — кинематографическое чтение перед силой стиха
- **PoemReadingCutscene**: затемнение + letterbox, строки стиха по одной (framer-motion), камера медленно подъезжает к лицу Володьки (`camera:poem_reading_start/end`), stinger из `poemWorldEffects` при старте чтения.
- **Оркестратор**: `requestPoemPowerActivation` — для `MAIN_POEM_IDS` сначала ритуал, затем `activatePoemPowerById` → синергия → world event; бонусные/скрытые стихи и бой — без полного ритуала.
- **Доступность**: настройка «Пропускать ритуал чтения стихов» (`skipPoemCutscenes`, localStorage); повторное чтение того же стиха за сессию — мгновенная активация.
- **Пропуск**: Space/клик после минимального времени; reduced motion — все строки сразу, короче.
- **Тесты**: skip setting, MAIN_POEM_IDS gate, orchestrator flow mock.

## v4.2.31 — 17 июня 2026

### Poem World Events — стих как событие мира
- **Слой world event поверх PoemPowerSystem**: при `poem:power_used` мост эмитит `poem:world_event` — VFX, аудио, эпиграф, narrative hint flags (TTL buffs сохранены).
- **Конфиг** `poemWorldEffects.ts`: категории (exploration / dialogue / combat / defense / social / utility), полные профили для poem_1, poem_3, poem_5, poem_10, poem_16; fallback для остальных сил.
- **Визуал**: ScreenEffects (flash, vignette, shake) + `PoemWorldEffect` (ambient tint, god rays, letterbox, 1-строчный эпиграф); reduced motion — без shake/chromatic/letterbox.
- **Аудио**: `SceneAudioController.onPoemWorldEvent` — stinger по `audioCue` из профиля.
- **Мир**: TTL-флаги `poem_hint_*_active` (exit_glow, npc_shimmer, interaction_pulse) на время эффекта.
- **Тесты**: resolver, bridge emission, reduced-motion skip для storm_break.

### Poem-gated content + exploration highlights
- **Dialogue**: ветки по `collectedPoem` — уличный поэт (poem_3), Альберт (poem_1), Зарема/Виктория (poem_11), Сталкер ЧК (poem_3).
- **Quests**: поле `requiredPoem` — `act6_secret_archive` (poem_11), `archive_of_forgotten` (poem_7), `library_lost_archive` (poem_9), `secrets_of_old_code` (poem_1).
- **Exploration**: `guiding_star_active` и `poem_hint_*` подсвечивают trigger zones (золотой god-ray; статичное свечение при reduced motion).
- **Тесты**: `poemExplorationHighlight`, `QuestTracker.canActivateQuest` (poem gate).

## v4.2.30 — 17 июня 2026

### Sprint 1 — Audio + mode integrity (AAA Audit §8)
- **Audio manifest**: explicit `SCENE_AUDIO_PROFILES` for 9 extension scenes (campfire, pier evening, factory roof, library basement, city square, bunker, guild mainframe, Zarema room, Albert backroom) — mood/reverb aligned with parent scenes.
- **Inheritance fallback**: `getSceneAudioProfile()` resolves via `SCENE_DERIVED_FROM` when no direct entry.
- **Scene unload**: `SceneAudioController.onSceneUnload()` — reset overlay duck, fade music (0.6s) + ambient crossfade (600ms) before next scene; no bleed.
- **Orchestrator dispose**: `useAudioOrchestrator` sets disposed guard + controller session teardown on unmount.
- **Tests**: audio manifest coverage (27/27 scenes); unload ducking + dialogue ↔ exploration transitions.
- **Verified**: `npm run check` + unit green.

## v4.2.29 — 17 июня 2026

### Sprint 0 — Production smoke + P0 (AAA Audit §8)
- **P0 fix**: `WakeUpSequence` — deferred `cutscene:overlay_end` / 9s timer no longer reopens `start` prologue after `explore_mode` (interaction splashes, corridor cutscenes). Gate: `shouldOpenAct1PrologueStory`.
- **E2E**: `waitForExplorationInputReady` dismisses stale `#story-speaker-start`; `enterCorridorViaPhysicalDoor` — bounded HUD poll + e2e bridge fallback.
- **Verified**: `npm run check` green; 1107 unit; assets 26/26 shipped; smoke + boot-pipeline + act1 e2e green (CI workers=1).

## v4.2.28 — 17 июня 2026

### AAA code polish pass
- **NPC aliases**: `dmitry` → `office_dmitry` — исправлены 6 dialogue nodes с `speakerId: 'dmitry'` (cross-ref test).
- **InteractionSplash resolver**: repeat-skip до boot lookup; профиль NPC из каталога без `preloadBootGameData()` в audit/tests.
- **Тесты (7 → 0 failures)**: `StoryGuidanceHUD` — mock `questStore`; `SettingsPanel` — preset `high` для GLB hint; `resolveInteractionSplash` — корректный `ExamineData`.
- **Lint**: `const` для неизменяемых LUT channel vars в `proceduralLutTextures.ts`.

## v4.2.27 — 17 июня 2026

### InteractionSplash — полное покрытие E-взаимодействий
- **Каталог** `interactionSplashes.ts`: пресет `door_hold` для дверей/переходов; `npc_*` шаблоны для всех story/expanded/CHK NPC (34 персонажа); дефолты по `interactionType` (`push`, `default`).
- **Резолвер** `resolveInteractionSplash.ts`: `inferZoneInteractionType` для зон без явного типа; NPC-профиль для talk-зон с `linkedNpcId`; `auditInteractionSplashCoverage` для инвентаризации.
- **Данные**: `npcSplashProfile` на всех NPC в npcDefinitions, expandedNPCs, CHK; `interactionType: 'examine'` на `cafe_table_free`.
- **Тесты**: инвентаризация — каждая interactable trigger zone + каждый NPC резолвят splash на первом визите (medium+ quality, без reduced motion).

## v4.2.26 — 17 июня 2026

### 3D заставки при взаимодействии (InteractionSplash)
- **Система InteractionSplash**: короткий кинематографический кадр (0.8–2.5 с) перед диалогом / осмотром — камера подъезжает к объекту или NPC, тонкие letterbox-полосы, затем UI.
- **Каталог** `interactionSplashes.ts`: пресеты `npc_orbit`, `prop_push_in`, `examine_close_up`, шаблоны Альберта, Заремы, бариста, серверных фрагментов и свитков.
- **Проп-зоны (5)**: `room_desk`, `office_server_room`, `factory_vault_neutral_fragment`, `library_poetry_stash`, `basement_server_rack` — `splashProfile` на trigger zone.
- **NPC (3)**: albert, zarema, cafe_barista — `npcSplashProfile` в npcDefinitions + каталог.
- **Пропуск**: reduced motion, пресет «Низкое», повторное взаимодействие (`interacted_*` / `met_*`).
- **Камера**: события `camera:interaction_splash_start/end`, переиспользование cutscene controller и CutsceneOverlay.
- **Тесты**: `resolveInteractionSplash.test.ts` — резолв профиля и условия пропуска.

## v4.2.25 — 17 июня 2026

### Prod smoke — Quaternius NPC scale, grounding, scene coverage (medium+)
- **Skinned bounds**: `measureCharacterGltfBounds` — unions Quaternius modular SkinnedMesh slices after skeleton update; fixes room-scale boots and floating feet on medium/high/ultra.
- **Runtime**: `GltfNPCModel` + `CesiumPlayerModel` use character bounds for `fitCharacterGltf` foot pivot (y = 0).
- **Catalog**: `quaterniusNpcSlots.ts` — 20 rig slots (hero + 19 story/CHK NPCs).
- **Tests**: `gltfScale.quaternius` (Albert GLB ~1.75 m, feet on ground), `npcQuaterniusProdSmoke` (19 shipped GLBs, schedule coverage, medium+ GLB gate).

### Golden path onboarding hints
- **GOLDEN_PATH_BRANCH_HINTS**: добавлены подсказки для 7 узлов позвоночника без `guidanceHint` — `go_to_cafe`, `street_bench`, `cafe_explore_mode`, `cafe_barista`, `office_explore_mode`, `park_explore_mode`, `act3_maria_truth_accepted`.

## v4.2.24 — 16 июня 2026

### NPC animation polish (Quaternius embedded clips + dialogue talk)
- **Clip resolution**: `npcClipResolution` — case-insensitive match for Quaternius PascalCase clips (`Idle`, `Walk`, `Wave`, `Idle_Neutral`) with Mixamo alias fallback.
- **Quaternius catalog**: `quaterniusAnimationCatalog.ts` — idle/walk/talk/sit/listen/gesture aliases for Ultimate Modular rigs.
- **Dialogue talk**: `useNpcAnimationController` crossfades to `talk` during Dialogue/Lock; `listen` during Align/Cutscene (was idle-only defer).
- **Schedule activity**: work/read/rest → sit (`Idle_Neutral` on Quaternius); patrol walk → `Walk`.
- **Retarget prep**: `humanoidRetargetProfile.ts` — Mixamo bone naming + Blender notes for when shipped clips override embedded.
- **GPU preload**: `getScheduleBackedNpcIdsForScene` — scene NPC GLB preload/evict derived from schedules + act overrides (all 20 Quaternius slots).
- **Tests**: `npcClipResolution`, interaction talk mapping, schedule-backed preload assertions.

## v4.2.23 — 16 июня 2026

### Consolidated asset pipeline (Kenney · Poly · RPM · Quaternius · Mixamo)
- **NPC priority**: Ready Player Me `npc_*.glb` > Quaternius CC0 > Khronos bootstrap — `npcModelRegistry` ships only files on disk; pending slots use procedural silhouettes.
- **Quaternius shipped**: Ultimate Modular Men/Women CC0 — hero Volodka LOD chain + 19 story/CHK NPC GLBs staged under `public/models/`; sources `male_01`…`female_09` in `assets-source/ai3dgen/npcs/`.
- **Quaternius CLI**: `npm run assets:quaternius-import` (`--download`, `--extract`, `--import`, `--status`) — maps 20 rigged slots to registry ids; bootstrap skips Khronos when sources exist.
- **RPM CLI**: `npm run assets:rpm-import` (`--list`, `--id`, `--apply-all`) — 20 avatar catalog; drop GLBs in `assets-source/ai3dgen/npcs/`.
- **Mixamo CLI**: `npm run assets:mixamo-import` — idle/walk/talk/sit clips for NPC activity + player arms.
- **Kenney + interiors**: `assets:freekit-stage` → citykit props + interior shells in 10 hero scenes (`SceneInteriorAssets`).
- **Status**: `npm run assets:status` reports manifest, AI3DGen, Mixamo, RPM, Quaternius, runtime registries.
- **Docs**: `assets-source/ai3dgen/README.md` (free sources table), `npcs/README.md`, `mixamo/README.md`, `ATTRIBUTION.md`.

## v4.2.22 — 16 июня 2026

### Mixamo animation pipeline (idle / walk / talk / sit)
- **Catalog**: `src/config/mixamoAnimationCatalog.ts` — four humanoid clips with NPC state mapping and Mixamo name aliases.
- **Import CLI**: `npm run assets:mixamo-import` (`--list`, `--status`, `--clip <id> --file <path>`) stages to `assets-source/mixamo/` + `public/models/animations/`; auto-updates `mixamoAnimationShipped.ts`.
- **Runtime**: `GltfNPCModel` drives GLB clips from schedule/patrol activity (walk, sit, talk) + dialogue events; `CesiumPlayerModel` prefers shipped Mixamo idle/walking.
- **Docs**: `assets-source/mixamo/README.md` (Adobe export settings), `ATTRIBUTION.md` Mixamo section, cross-link from AI3DGen README.
- **Tests**: catalog registry + `npcActivityAnimation` activity→state mapping.

## v4.2.21 — 16 июня 2026

### Kenney City Kit props + interior shells (Poly Pizza TODO)
- **Source**: 10 CC0 props in `assets-source/ai3dgen/props/` (Kenney Furniture + City Kit Roads + OpenGameArt campfire).
- **Interiors**: 10 Kenney building shells in `assets-source/ai3dgen/interiors/` — Poly Pizza download blocked without API; mapping documented for manual swap.
- **Pipeline**: `npm run assets:freekit-stage` → `public/models/props/citykit/` + `public/models/interiors/`.
- **Runtime**: `SceneInteriorAssets`, `sceneInteriorAssets.ts`, `kenney_city_*` props in `propModelRegistry` + `scenePropDressing` (street, café, pier, CHK, rooftop).
- **Catalog**: 20 entries in `ai3dgenAssetCatalog.ts` (props + interiors, `licenseTier: free`).
- **Docs**: `assets-source/ai3dgen/README.md`, `ATTRIBUTION.md` Kenney + Poly Pizza credits.

## v4.2.20 — 16 июня 2026

### Ready Player Me NPC pipeline (20 story avatars)
- **RPM_NPC_CATALOG**: 20 slots in `src/config/rpmNpcCatalog.ts` — source `npc_*.glb` → registry id → `public/models/npcs/{id}.glb`; aliases for Victoria→maria, Solnysh→alina source, Katya→kate, Zheka→zeka, Trofim→fisherman_trofim.
- **Import CLI**: `npm run assets:rpm-import` — `--list`, `--id npc_albert --file path.glb`, `--apply-all`; regenerates `rpmNpcShipped.generated.ts`.
- **Registry**: `npcModelRegistry` prefers shipped RPM over Khronos CC0; expanded + CHK Tolpa NPCs wired with target `modelPath`.
- **Bootstrap**: `assets:bootstrap` stages RPM sources when present and skips CC0 overwrite for those slots.
- **Docs**: `assets-source/ai3dgen/npcs/README.md` — RPM export, Blender cleanup, Mixamo retarget notes.
- CI never downloads RPM avatars (user account required).

## v4.2.18 — 16 июня 2026

### Story polish + remaining hero scene graphics
- **Act 7 endings**: unified karma thresholds (70/35), `musicCue` + `guidanceSceneLabel` on all three finales; wanderer ending aligned to `street_winter` (scene + ambient).
- **True-end epilogue**: `resolveTrueEndEpilogue` — guild/peace/revolution paths, Dmitry exile, Ritka song, final poem edge cases; traitor scar excludes exile.
- **Dialogue speakerId**: `part1-albert` (Albert/Zarema/Victoria/Dmitry) + exploration nodes for Victoria fragment and Albert lesson.
- **Hero scene graphics**: procedural ceiling/sky washes + LUT for `volodka_room`, `volodka_corridor`, `abandoned_factory`, `factory_basement`, `zarema_albert_room`, `street_winter` (sky dome); bloom profiles tuned.
- **Tests**: act7 ending consistency, epilogue edge cases, sky/LUT/profile regressions.

## v4.2.17 — 16 июня 2026

### Accessibility AAA (gamepad hints, reduced-motion bob, weather caps)
- **Gamepad hints**: `formatInteractionHintKey` / `useGamepadConnected` — interaction popup shows `[A]` when a controller is connected; touch still shows tap icon.
- **FirstPlayTutorial**: controls step switches to stick/LB/A layout when gamepad is detected.
- **FPS arms bob**: `FirstPersonHands` disables head-bob under effective reduced motion (matches exploration camera scale).
- **Weather particle caps**: `getParticleCount` accepts `reducedMotion` — rain, snow, dust, embers, steam, and exploration particles scale to 35% when reduced motion is on.
- **Tests**: `explorationUxPresentation`, `mobileParticleScale`.

## v4.2.16 — 16 июня 2026

### UX handoff polish (v4.2.14 follow-up)
- **Shared timings**: `EXPLORATION_HUD_HANDOFF` in `transitionTimings.ts` — guidance reveal (420ms) aligned with warm canvas fade; hub toast +60ms (480ms).
- **StoryGuidanceHUD**: uses shared constant; regression tests for overlay / kind-recovery / transition suppression.
- **Quality preset hints**: moved to `formatQualityPresetDetailRu` in `qualityPresets.ts` — clearer Russian copy, tier-driven GLB/reflector hints; auto→ultra nudge for wet reflections.
- **Tests**: `StoryGuidanceHUD.test.tsx`, `qualityPresetDetail.test.ts`, `transitionTimings.test.ts`; SettingsPanel visual-tab hint assertion.

## v4.2.15 — 16 июня 2026

### AAA graphics P2 (daytime interiors + procedural LUT)
- **ExplorationPostFX**: procedural 16³ LUT pass (`LUT3DEffect`) for neon scenes (`street_night`, `cafe_evening`, `sleep_dream`) and interior moods (`home_evening`, `library_day`, `office_day`).
- **office_day ceiling**: cold overcast HDR wash (`createOfficeDayOvercastSkyTexture`) — sterile fluorescent ambience.
- **library_day ceiling**: dusty amber reading-light dome (`createLibraryDayWarmSkyTexture`) — gothic archive mood.
- **home_evening ceiling**: warm amber wash with city-blue window spill (`createHomeEveningWarmSkyTexture`).
- **Visual profiles**: bloom scale boosts for `home_evening` (1.08), `library_day` (1.05), `office_day` (1.04); tuned color grade + bloom thresholds.
- **Tests**: `proceduralLutTextures`, expanded sky texture + scene profile assertions.

## v4.2.14 — 16 июня 2026

### AAA graphics + UX polish
- **street_night sky dome**: procedural synthwave rainy gradient (`createStreetNightSynthwaveSkyTexture`) + stronger IBL intensity for wet-neon mood.
- **cafe_evening ceiling wash**: procedural blue-neon HDR gradient on café ceiling for hazy interior ambience.
- **StoryGuidanceHUD**: 420ms reveal delay after narrative recovery / scene transition — no flash during overlay handoff.
- **Explore hub handoff**: location toast deferred 480ms after overlay close so it does not clash with transition HUD.
- **Settings onboarding**: quality preset hints — «GLB-модели: medium+», «Ultra: мокрые отражения на улице».
- **Tests**: jsdom fix for procedural sky textures; deferred hub toast; new street/café sky texture assertions.

## v4.2.13 — 16 июня 2026

### AAA audio + performance (post-deploy audit P2/P1)
- **Music ducking**: dialogue overlays keep more bed (72% music / 48% ambient) vs cinematic story (58% / 38%); smoother 450ms crossfade ramps.
- **Tension layer**: story overlay switches music intensity to `tension` (faster chord pacing); wired into `MusicEngine` via `subscribeMusicIntensityLayer`.
- **Performance auto-cap**: N8AO, ultra street reflector, animated galaxy stars, and god rays require explicit high/ultra — `auto` preset never enables heaviest GPU features even when heuristics resolve high.
- **Adaptive quality**: repeated FPS budget violations now step quality preset down one tier (auto → medium, ultra → high).
- **Accessibility**: reduced-motion hides HUD ambient particles and god rays; galaxy star drift disabled under reduced motion or auto preset.
- **Tests**: `musicIntensityLayers`, `qualityFeatureGates`, `adaptiveQualityDegrade`, pipeline auto-cap regression.

## v4.2.12 — 16 июня 2026

### Production GLB: distinct CC0 interim meshes
- **Hero**: Volodka LOD chain now stages Khronos RiggedFigure (was duplicate CesiumMan).
- **NPCs**: bootstrap assigns distinct CC0 silhouettes (Xbot, RobotExpressive, RiggedFigure pairs, etc.) — no triple Soldier/CesiumMan copies.
- **Quest/craft props**: each prop uses its own Khronos mesh (Lantern, DamagedHelmet, WaterBottle, Avocado, AntiqueCamera) instead of five Avocado clones.
- **Vegetation / café bundles**: pine LODs and café prop variants use distinct CC0 sources.
- **Attribution**: `public/models/ATTRIBUTION.md` and `npcModelRegistry` updated; run `npm run assets:bootstrap` to refresh on disk.

## v4.2.11 — 16 июня 2026

### P0: narrative blank dim fix
- **GameplayNarrativeOverlay**: show «Загрузка сцены…» while `showStoryOverlay` is true but `narrativeKind` is still null (avoids dark screen with no text during kind recovery).
- **useOrchestratorRuntime**: treat resolving narrative kind as an active overlay (pointer lock exit, panel dismiss).
- **Tests**: `OrchestratorGameplaySections.test.tsx` regression for recovery loading state.

## v4.2.10 — 16 июня 2026

### AAA graphics P1 (rooftop galaxy sunset, park haze, synthwave boost)
- **rooftop_edge sky dome**: procedural galaxy-sunset gradient with nebula wisps and slow-drifting horizon stars (`createRooftopSunsetGalaxySkyTexture` / `createRooftopHorizonStarGeometry`).
- **park_day sky dome**: overcast gothic haze dome (`createParkHazySkyTexture`) — closes the memorial park horizon without new assets.
- **Synthwave grade boost**: stronger LUT-style tuning and wet-neon bloom for `street_night` and `cafe_evening`; galaxy-sunset grade + bloom for `rooftop_edge`; warmer haze grade for `park_day`.
- **Visual profiles**: `rooftop_edge` forceFullPostFx + bloom 1.14; `park_day` bloom 1.06.
- **Tests**: procedural sky textures, scene visual profiles, rendering pipeline rooftop profile.

## v4.2.9 — 16 июня 2026

### AAA graphics P1 (dream galaxy sky + ethereal grade)
- **sleep_dream sky dome**: procedural galaxy gradient with nebula wisps and slow-drifting starfield (`GalaxySkyDome` in `SleepDreamVisual`; fog-exempt, no new asset files).
- **Dream color grade**: stronger magenta/cyan LUT-style tuning in exploration post-FX (hue, saturation, contrast, bloom threshold).
- **Visual profile**: `sleep_dream` bloom intensity scale 1.12 for ethereal glow on floating elements.
- **Tests**: `proceduralSkyTextures.test.ts`, `sceneVisualProfiles` dream bloom assertion.

## v4.2.8 — 16 июня 2026

### GLB model integration (scene rendering)
- **Manifest / dressing / trigger props**: all shipped GLB bundles render in exploration when quality preset allows (`allowsGlbAssetRendering` — hybrid/glb tiers only).
- **Scene prop dressing**: volodka room/corridor, café, factory, and basement placements for AI3DGen quest props (compiler, filter, amulet, server fragment).
- **Trigger zone props**: encrypted scroll, digital amulet, and server fragment wired to desk, vault, park patrol, office server, and basement rack zones; availability gated via `isTriggerZoneAvailable`.
- **NPC bootstrap**: distinct CC0 silhouettes for Maria (RiggedSimple), Tamara (CesiumMan), barista/colleague/viktor (Soldier).
- **GPU lifecycle**: office/factory scene ids registered for GLTF preload bookkeeping.

## v4.2.7 — 16 июня 2026

### AAA graphics P0 (synthwave grade, bloom, street reflector, N8AO)
- **Color grade**: stronger synthwave/neon tuning for `street_night`, `cafe_evening`, and `sleep_dream` in exploration post-FX.
- **Bloom**: higher wet-neon bloom on `street_night` and café evening scenes.
- **street_night profile**: N8AO (`enhancedAmbientOcclusion`) and bloom intensity scale 1.18; café bloom scale 1.15.
- **Ultra reflector**: planar `MeshReflectorMaterial` wet ground on `street_night` at ultra quality with rain-driven wetness ticks.
- **Tests**: scene visual profiles and rendering pipeline expectations updated.


## v4.2.6 — 15 июня 2026

### Asset pipeline (environment bundles + status tooling)
- **Shipped env bundles**: `env_cafe_props` and `veg_tree_pine` marked `shipped: true` with CC0 interim GLBs (BrainStem / Avocado) staged via `assets:bootstrap`.
- **Asset status**: `npm run assets:status` — manifest vs disk, AI3DGen catalog import progress, prop/NPC registry coverage.
- **AI3DGen CLI**: `assets:ai3dgen-import -- --status`; catalog entries for café props and park pine (`environment` / `vegetation` categories).
- **Pipeline folders**: `assets-source/ai3dgen/{characters,npcs,props,environments,vegetation}` scaffold for Pro imports.

## v4.2.5 — 15 июня 2026

### AAA polish pass (endings + accessibility)
- **True ending epilogue**: `resolveTrueEndEpilogue` appends up to 3 personalized lines to `act7_true_end` from ending flags, poem collection, and NPC fates (Зарема, Дмитрий, Виктория, ЧК, «Заря-М»).
- **ScreenEffects**: `useEffectiveReducedMotion` — shake/vignette/chromatic/slowmo off; combat flashes softened when reduced motion is on.
- **Tests**: `resolveTrueEndEpilogue.test.ts`.

## v4.2.4 — 15 июня 2026

### AAA polish pass (presentation profile)
- **Gameplay presentation profile**: helpers `isMotionFxProfile` / `shouldMountSceneTransitionFx` — level-up bursts, floating damage, and transition chrome hide during encounter beats and scene wipes (cleaner cinematic stack).
- **OrchestratorGameplaySections**: motion FX and scene-transition layers gated on profile instead of raw `mode`.
- **Exploration HUD**: `StoryGuidanceHUD`, `InteractionHintPopup`, `FirstPlayTutorial`, `AmbientAtmosphereCaption` use `isExplorationHudProfile` — no objective strip or E-hint over encounter/transition beats.
- **Guidance regression**: `goldenPathGuidance.test.ts` — every spine step must resolve to hint, NPC, or scene label (AAA onboarding for non-gamers).
- **Regression tests**: `useGameplayPresentationProfile.test.tsx`, `useSceneEnterEffect.test.tsx` — guard EventBus singleton hooks after production leak fix.

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

## v4.3.1 (2025-12) — "Активация orchestrator + критические багфиксы"

### Архитектура
- **main.tsx** восстановлен на импорт `@/app/AppBootRoot` — orchestrator-архитектура
  (R3F + Rapier + Zustand, ~340k LOC, 7-актная RPG) снова активна.
  До этого с коммита `92528db` исполнялась только короткая vanilla Three.js сказка (~7k LOC).
- `vite build`: 4432 модуля → 12 MB (gzip 3.4 MB), 0 ошибок typecheck.
- Guard'ы `isAssetEffectiveShipped()` в `CesiumPlayerModel`, `VolodkaRoomVisual`,
  `AuthoredInteriorShell` — отсутствие GLB-файлов больше не роняет сцену.

### Combat (критические баги)
- **Poem powers теперь учитывают affinity** — раньше 46 стиховых способностей игнорировали
  систему сродства (Persona-style 6 каналов: code/logic/empathy/intuition/writing/physical).
  Добавлен пост-процессинг в `playerUsePoemPower`.
- **`physical: 0.0` (иммунитет) → `0.3`** для 6 ghost/wraith врагов — базовые атаки
  перестали быть полностью бесполезными.
- **`getPlayerCritChance()`** вместо `computeCritChance(writing)` — теперь учитываются
  thought-cabinet бонусы к шансу крита.
- **`POEM_DAMAGE_CHANNEL` расширен 23 → 46 стихов** (добавлены act 4–7 стихи).
- `network_spy` special attack: id `'spy misinformation'` → `'spy_misinformation'`;
  описание «снижая интуицию» → «снижая карму» (соответствует эффекту).
- `AffinityMultiplier` тип: добавлено значение `0.3` («Почти иммунитет»).

### NPC / Диалоги
- **34 return-диалоговых узла** созданы в `src/data/dialogue/returnDialogues.ts`.
  Раньше 27 из 34 NPC ломались при повторном разговоре («Не удалось загрузить диалог»),
  потому что их `returnDialogueNodeId` указывал на несуществующие узлы.
- **10 NPC добавлены в `HERO_NPC_IDS`**: viktor, kira, boris, tamara, grisha,
  street_poet, marat_echo, guild_defector, chk_guest_devops, chk_guest_analyst.
  Теперь они получают hero-tier визуальную обработку.

### HUD / Accessibility
- **BuffDebuffTracker / SkillRechargeHUD**: исправлен замороженный обратный отсчёт
  кулдаунов — `useMemo([poemPowers])` с `Date.now()` никогда не пересчитывался.
  Добавлен 500 ms interval.
- **MobileActionButtons**: «Бег» → «Бег вкл» / «Бег выкл» (copy-paste bug).
- **CompassHUD**: `role="img"` + `aria-label` с текущим направлением (С/В/Ю/З).
- **DayNightCycleIndicator**: `role="img"` + `aria-label` с фазой и временем суток.

### Очистка
- Удалены 11 неиспользуемых npm-зависимостей: recharts, uuid, @hookform/resolvers,
  tailwindcss-animate, react-day-picker, embla-carousel-react, vaul, cmdk,
  react-hook-form, react-resizable-panels, input-otp.
- Удалены 8 неиспользуемых shadcn/ui обёрток: chart, calendar, carousel, resizable,
  form, command, drawer, input-otp.
