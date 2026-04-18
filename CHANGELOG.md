# Changelog

## [Unreleased]

### Build / repository

- **Vercel: «This repository exceeded its LFS budget»**: клон репозитория тянет объекты **Git LFS** (см. **`.gitattributes`**: `*.glb`, `*.fbx`, `*.zip`); при исчерпании квоты хранилища/трафика GitHub LFS сборка на Vercel падает. Варианты: оплатить **Data packs** в [GitHub → Billing](https://github.com/settings/billing); или один раз вынести бинарники из LFS в обычный Git (**`git lfs migrate export`**, затем **`git push --force-with-lease`**) — см. **`FREE_HOSTING.md`**. **Сделано для `main`:** **`git lfs migrate export --include='*.glb,*.fbx,*.zip' --everything`**, очищен **`.gitattributes`** (без `filter=lfs`), пуш с **`--force-with-lease`** на **`origin/main`**.

### Added

- **`src/app/error.tsx`**, **`src/app/global-error.tsx`**: границы ошибок App Router (сегмент и корень при падении **`layout`**); кнопка **`reset`**, в development — текст ошибки в UI.

- **Browserbase Functions — дымовой тест деплоя**: каталог **`browserbase-functions/volodka-smoke`** (`defineFn` **`volodka-smoke`**) — Playwright по CDP к сессии Browserbase: открытие **`baseUrl`**, проверка заголовка с **«ВОЛОДЬКА»**, ожидание **`canvas`**, проверка **WebGL**; скрипты в корневом **`package.json`**: **`bb:volodka-smoke:dev`**, **`bb:volodka-smoke:publish`**; в **`.gitignore`** — **`browserbase-functions/**/.env`**, **`.browserbase`**.

- **Масштаб персонажей под локацию (3D)**: в **`SceneConfig`** поле **`explorationCharacterModelScale`**, функция **`getExplorationCharacterModelScale(sceneId)`** в **`config/scenes.ts`**; множитель применяется к визуалу NPC **`(definition.scale ?? 1) * …`** и к модели игрока (**`PhysicsPlayer`** `visualModelScale`); тесты **`scenes.explorationScale.test.ts`**. Значения заданы для улиц (крупнее), комнат/офиса/кафе (компактнее), парка, библиотеки, сна, боя и др.

- **Атмосфера и полировка 3D-исследования**: **`src/lib/explorationAtmosphere.ts`** — погода по сцене/часу (`street_winter` → снег, ночная улица → туман/морось) и фоновый стресс на улице; тесты **`explorationAtmosphere.test.ts`**; в **`GameOrchestrator`** тик **`addStress`** в режиме обхода для **`street_night` / `street_winter`**.
- **Постобработка и частицы в `<Canvas>`**: **`ExplorationPostFX`** (N8AO + bloom + vignette + шум; облегчённый стек на **`useMobileVisualPerf`**), **`ExplorationParticles`** (снег / дождь / искры на **`abandoned_factory`** и **`battle`**), **`ExplorationFootprints`** (декали-следы по событию **`exploration:footstep`**); интеграция в **`RPGGameCanvas`**.
- **Шина событий**: **`exploration:footstep`**; **`game:saved`** с опциональным **`source: 'auto' | 'manual'`**; **`game:loaded`** эмитится из **`loadGame`** после успешной загрузки.
- **Сохранения**: **`saveGame(options?)`** в **`gameStore`** пишет в **`localStorage`** и эмитит **`game:saved`**; **`useAutoSave`** передаёт **`{ source: 'auto' }`**; UX в **`GameOrchestrator`** — отдельные тосты ручного сохранения и короткая подпись для авто/загрузки; убран ложный интервал **`game:saved`** из **`CoreLoop`** (персистентность только через стор/хуки).

- **Перфоманс 3D**: **`PanelDistrictBuildings`** — пять коллайдеров Rapier + **один `InstancedMesh`** на фасады панельного квартала; **`ExplorationFrameStats`** (FPS, **`gl.info.render`**) по **`?exploreStats=1`** или **`localStorage`** **`volodka_exploration_stats=1`**; тест **`PanelDistrictBuildings.test.ts`**; **`SceneColliders` `InstancedWalls`** — реальный **`InstancedMesh`** для невидимых объёмов камеры вместо N отдельных мешей.

- **Правило Cursor**: **`.cursor/rules/git-changelog-workflow.mdc`** — после содержательных правок обновлять **`CHANGELOG.md`** (`[Unreleased]`), делать коммит и при необходимости **`git push`**.

- **RPG-прототипы (глубина сессии)**: зависимость **`three-pathfinding`**; **`src/lib/explorationNavMesh.ts`** — navmesh по размеру пола и поиск пути; **`NPC.tsx`** / **`NPCSystem`** / **`RPGGameCanvas`** — патруль по **waypoints** с обходом через углы пути (при отсутствии сетки — прямой бег); **`BattleClickLayer`** — бой по **клику/тапу** на примитивах на сцене **`battle`**, урон **`rollStrikeDamage`** от **`logic` / `coding` / `intuition`** (**`src/lib/combatDamage.ts`**, тесты); **`InteractiveObjectConfig.requiredSkills`** в **`scenes.ts`** (кафе **`cafe_jack_portable`**), проверки в **`GameOrchestrator`** и **`src/lib/interactiveSkillRequirements.ts`**; в офисе у коллеги реплика с **`minSkill: persuasion`** и узел **`colleague_persuasion_line`** в **`DIALOGUE_NODES`**; **`DialogueRenderer`** передаёт **`DIALOGUE_NODES`** в **`processDialogueChoice`** и **`evaluateCondition`** для доступности выборов; у **`battle_burntrap`** заданы **waypoints** для демонстрации маршрута.

- **Расписания NPC (рутины)**: в **`ScheduleEngine`** расширены слоты **`albert`**, **`zarema`**, **`cafe_barista`** — смена **sceneId**, позиций и **activity** (`work`, `read`, `rest`, `walk`, `talk`, `sleep`); алиасы **`zarema_home` / `albert_home`** на каноническое расписание; **`getNPCsForScene(sceneId, timeOfDay)`** и **`getNpcExplorationPosition`** в **`npcDefinitions`** подставляют гостей по часу; миникарта, квест-маркеры и **`TutorialOverlay`** учитывают **`exploration.timeOfDay`**; иконки активности в **`NPC.tsx`**; тесты **`src/engine/ScheduleEngine.test.ts`**.
- **Вечерняя квартира (`home_evening`) и `object:interact`**: в **`scenes.ts`** десять **`interactiveObjects`** (радио, книга со стихом, вода, блокнот, чай, шоколад, окно, холодильник, телефон, растение) и новое имя сцены в UI; **`src/lib/homeApartmentInteract.ts`** — тексты осмотра и **«Использовать»** (радио через **`sound:play`** и флаг **`home_radio_played`**, вода и быт со статьами/стрессом, книга через **`collectPoem`** / **`poemMechanics`** и событие квеста **`poem_collected`**); **`GameOrchestrator`** обрабатывает **`object:interact`** для этой сцены с **`emitQuestEvent`**; **`HomeEveningColliders`** в **`PhysicsSceneColliders`** и **`SceneColliders`** — пол и периметр 14×14 без дублирующих кухонных блоков, чтобы коллизии совпадали с интерактивными коробками.
- **Золотой путь сюжета**: `src/data/goldenPath.ts` — каноническая линия к финалу **`ending_creator`**, скелет узлов (`GOLDEN_PATH_STORY_SPINE`), развилки (`GOLDEN_PATH_BRANCH_HINTS`), квестовый хребет и опционально **`poetry_collection`**; экспорт из `src/data/index.ts`; регрессионные проверки в **`src/data/goldenPath.test.ts`**.
- **Мир отвечает на вход в зону**: у **`TriggerZone`** поля **`enterToast`** / **`enterToastCooldownMs`** (`rpgTypes`, `shared/types/rpg`); в **`InteractiveTrigger`** при пересечении границы AABB → **`eventBus.emit('ui:exploration_message')`** с кулдауном по триггеру; в **`triggerZones.ts`** — тосты на части сюжетных триггеров и две атмосферные зоны (**`ambience_street_plaza`**, **`ambience_memorial_open`**).
- **Шаги по поверхности в 3D**: **`usePlayerFootsteps`** (raycast вниз, интервал от скорости и бега), **`footstepMaterials.ts`** (материал из **`userData.footstepMaterial`** или имени коллайдера **`fs:{wood|concrete|…}`**), расширение **`AudioEngine`** (SFX / процедурный beep); пол **`PhysicsSceneColliders`**, **`RoomEnvironment`**, **`RPGGameCanvas`** размечают пол/пропы именами **`footstepColliderName(...)`**.

- **`scripts/list-glb-animations.mjs`**: проверка `animations` в JSON-чанке каждого `.glb` в `public/models-external`.
- **Расписание NPC**: `src/engine/ScheduleEngine.ts` (`ScheduleEntry`, `getCurrentScheduleEntry`), слоты для albert / zarema / kitchen_maria / cafe_barista; в исследовании **`exploration.timeOfDay`** и **`advanceTime`** в `gameStore` и `src/client/store/worldStore.ts`; `NPCSystem` фильтрует NPC по сцене и расписанию, опционально **`RigidBody` kinematic** для телепорта; иконки активности в `<Html>`; недоступный по расписанию диалог → **`eventBus` `ui:exploration_message`**.
- **Квесты в 3D**: индикаторы `!` / `?` над NPC (`src/lib/npcQuestMarker.ts`, `src/store/questStore.ts`), данные из **`gameStore`**.
- **Карма в UI и диалогах**: `MoralCompassHUD.tsx`; подсветка игрока в **`PhysicsPlayer`** по порогам кармы; в **`DialogueEngine`** условия **`minKarma` / `maxKarma`** (типы в `rpgTypes` / `shared/types/rpg`).
- **Лут и навыки**: `LootNotification` / `SkillUpNotification`, события **`loot:reward`**, **`skill:level_up`**, **`sound:play`** в `EventBus`; выдача предмета из `addSkill` / `addItem` с уведомлениями; тип тоста **`system`** в `useEffectNotifications`.
- **Радиальное меню объектов**: `RadialMenu.tsx`, `InteractiveTriggers.tsx` (поиск ближайшего объекта), в **`RPGGameCanvas`** по **E** → **`object:interact`**.
- **Миникарта**: проп **`questMarkers`** (`MiniMap.tsx`), расчёт в **`GameOrchestrator`** по активным квестам и **`getNextTrackedObjective`**.
- **Аудио**: `src/engine/AudioEngine.ts`, хук **`useAudio.ts`**; **`AmbientMusicPlayer`**: **`forceBattleMusic`** при стрессе > 80 или сцене **`battle`**; фон в **`MenuScreen`** / **`IntroScreen`** через `audioEngine` (опциональные файлы в `/audio/ui/`).
- **Туториал 3D**: `TutorialOverlay.tsx`, флаги **`tutorial_seen_movement`**, **`tutorial_seen_interact`**, **`tutorialsDisabled`** в `playerState.flags`.
- **SFX по шине**: **`sound:play`** → **`AudioEngine.playSfx`** (поиск `/audio/ui/sfx_{type}.mp3` и `/audio/ui/{type}.mp3`, при отсутствии — короткий beep); подписка в **`useGameAudioProfile`**; для прокачки навыка отдельный тип **`skill`** в **`SkillUpNotification`**.
- **Объекты в 3D**: глобальный обработчик **`object:interact`** в **`GameOrchestrator`** по **`getInteractiveObjectsForScene`** (осмотр / взять с **`addItem`** / выбросить с **`removeItem`** / тосты **`ui:exploration_message`**).
- **Импорт стора мира**: **`src/store/worldStore.ts`** реэкспортирует **`useWorldStore`**, **`useExploration`**, **`useGameMode`** из **`src/client/store/worldStore.ts`**.
- **Контент диалога**: у баристы ветка **`barista_kindred`** с условием **`minKarma: 55`**.

### Changed

- **`vercel.json`**: для **`/models-external/(.*)`** задан **`Cache-Control: public, max-age=31536000, immutable`** (как для **`/models/`**), чтобы GLB из **`public/models-external`** кешировались на CDN.

- **3D-интерьеры квартир (обход)**: **`VolodkaRoomVisual`**, **`VolodkaCorridorVisual`**, **`HomeEveningVisual`** — мебель и пропы (столы, диван, шкафы, кровать, обувница, батарея, плафоны, ковры, кухонный угол, торшер) для читаемой «обстановки»; в комнате Володьки объекты по координатам совпадают с **`VolodkaRoomColliders`**.

- **`FollowCamera`**: переиспользование **`Raycaster`** и векторов в **`checkCameraCollision`**, плюс **`frameTargetRef` / `frameDesiredCamRef`** в **`useFrame`**; то же для **`SimpleFollowCamera`** — меньше краткоживущих объектов при обходе с коллизиями камеры.

- **Перфоманс кадра (частицы и шаги)**: **`ExplorationParticles`** — без **`Math.random`** и **`performance.now`** в **`useFrame`** (предвычисленные **`Float32Array`**, фаза от **`clock.getElapsedTime()`**); **`OptimizedSceneEnvironment` / `Snowflakes`** — джиттер скорости падения вынесен из кадра, respawn позиций без **`Math.random`** в цикле; **`usePlayerFootsteps`** — переиспользуемые **`rapier.Vector3`** для луча вместо аллокаций на шаг; **`PhysicsPlayer` / `GLBPlayerModel`** — один **`Vector3`**-scratch для **`Box3.getSize`**; **`InteractiveTrigger` / `WorldItem`** — покачивание по **`clock`**, не по **`Date.now()`**.

- **Инкрементальный аудит утечек / удержания ресурсов (обзор)**: проверены типичные источники — **`window` / `document` listeners** (в т.ч. **`FollowCamera`**, **`RadialMenu`**, **`GameOrchestrator`**, **`IntroScreen`**, **`useGamePhysics`**) — везде есть снятие в **`useEffect` cleanup**; **`requestAnimationFrame` / `setInterval`** в **`AsciiCyberBackdrop`**, **`RainCanvasLayer`**, **`useAmbientMusic`** (интервал + **`stopAmbient`** при unmount с **`audioContext.close()`**), **`GameOrchestrator`** (street stress tick) — с очисткой; **`eventBus.on`** в хуках и оверлеях — возвращаемый **`unsub`** в cleanup. **`FollowCamera`**: пул **`Raycaster`** и переиспользуемые **`Vector3`** в **`checkCameraCollision`** и в **`useFrame`** (в т.ч. **`SimpleFollowCamera`**) — без аллокаций на кадр при коллизиях / лерпе. Кэш **`useGLTF`** у игрока намеренно не очищается при unmount (обмен на повторную загрузку; см. комментарий в **`PhysicsPlayer`**).

- **Кросс-функциональная полировка (геймдизайн UI + архитектура)**: визуал оверлеев исследования (**`TutorialOverlay`**, **`MoralCompassHUD`**, **`RadialMenu`**, **`MiniMap`**) выровнен под **`game-fm-layer`**, **`intro-recall-frame`** и градиентные акценты как в меню/интро; подпись glitch-перехода смены 3D-сцены — русский термин + **`SCENE_VISUALS`**.name; **`SceneManager`** — публичное имя **`getSceneVisualConfig`** для атмосферы (старый **`getSceneConfig`** экземпляра — deprecated alias, чтобы не путать с **`getSceneConfig`** из **`@/config/scenes`**).

- **Локомоция под локацию (3D)**: в **`SceneConfig`** поле **`explorationLocomotionScale`**, **`getExplorationLocomotionScale(sceneId)`**; **`PhysicsPlayer`** умножает ходьбу/бег/прыжок; **`usePlayerFootsteps`** нормирует интервал шагов от фактической скорости ходьбы; **`NPC`** / **`NPCSystem`** — скорость патруля по waypoints и в **`patrolRadius`**; проводка из **`RPGGameCanvas`** и **`PhysicsRPGCanvas`**; тесты в **`scenes.explorationScale.test.ts`**.

- **`NPC.tsx`**: дистанционный **LOD** для NPC с **`modelPath`**: дальше **~17 m** — капсула-импостор вместо GLB (гистерезис с **~12 m**); при диалоге всегда полная модель; убран **`useGLTF.clear`** при размонтировании загрузчика, чтобы не сбрасывать общий кэш при LOD у соседних NPC; **mid-shadow LOD** — при полном GLB дальше **~4.5–6.5 m** (зона гистерезиса) у мешей **`castShadow=false`**, ближе и в диалоге — как раньше.

- **`usePlayerFootsteps`**: при шаге эмит **`exploration:footstep`** (позиция и yaw для декалей).
- **`RPGGameCanvas`**: тени **`directionalLight`** 256×256 на мобильном / **`useMobileVisualPerf`**; панельные короба заменены на **`PanelDistrictBuildings`**.
- **`HUD`**: **`motion.div`** с **`layout`** для плавной перестройки панели.
- **`useGameSessionFlow`**, **`useActionHandler`**, **`useTimedMessage`**: сохранение без дублирующего **`emit`** из сессии; опциональная длительность у **`showMessage`**.

- **`PhysicsPlayer`**: движение на **Kinematic Character Controller** Rapier с **`kinematicPosition`**, шаги через **`usePlayerFootsteps`**; согласованы коллайдеры сцен с явными **`CuboidCollider`** и префиксом материала для шагов.

- **Масштаб и пол в 3D**: GLB Володьки автоподгоняется по bounding box к **`PLAYER_GLB_TARGET_VISUAL_METERS`** и множителю **`explorationCharacterModelScale`** комнаты; капсула Rapier масштабируется тем же коэффициентом; единый пол/коллизии из **`PhysicsSceneColliders`** (**`PhysicsFloor`**); спавн ног **`PLAYER_FEET_SPAWN_Y`** в квартире и сторе.

- **Локации и лор (квартира / бар)**: сцены **`volodka_room`** и **`volodka_corridor`** (комната → коридор → **`home_evening`**; двери и интерактивы); старт **`exploration`** в **`gameStore`** / **`worldStore`** и **`explore_mode`** → **`volodka_room`**; **`RPGGameCanvas`** — пол 3.5×12 для коридора, камера ближе в узких комнатах, **`PhysicsPlayer`** сбрасывается по **`sceneId`** и берёт **`initialRotation`** из стора; **`cafe_evening`** — бар **«Синяя яма»**; NPC **Альберт** / **Заремушка**, **`pit_timur`**; **`blue_pit`** — служебная сцена. Подписи в **`SceneManager`**, **`scenes.ts`**, тесты **`npcExplorationIntegrity`**, **`explorationAtmosphere`**, **`scenes.explorationScale`**.
- **`PhysicsSceneColliders`**, **`SceneColliders`**: для **`home_evening`** используются **`HomeEveningColliders`** вместо **`KitchenColliders`**, без лишних препятствий «кухни» поверх интерактивных объектов.
- **`NPC_DEFINITIONS`**: заменены GLB без клипов анимации / с одним A-pose; у всех целевых NPC поле **`animations`** и константы имён клипов; **`scenes.ts`** / **`modelUrls.ts`** приведены в соответствие.
- **`NPC.tsx`**, **`RPGGameCanvas.tsx`**, **`PhysicsRPGCanvas.tsx`**: интеграция расписания, тика времени внутри `<Canvas>`, радиальное меню.
- **`GameOrchestrator.tsx`**: HUD кармы, лут/скилл-оверлеи, туториал, маркеры квестов на миникарте, боевой режим музыки; размер миникарты из **`getSceneConfig(currentSceneId).size`**; обработка **`object:interact`**; **glitch**-переход при смене 3D-локации по **`lastSceneTransition`**.
- **`HUD.tsx`**: кнопка **💡** переключает флаг **`tutorialsDisabled`** (подсказки 3D).

### Removed

### Fixed

- **Консоль / аудио / камера / ввод**: **`AudioEngine.playSfx`** для **`footstep_*`** сразу процедурный шаг без запросов **`/audio/ui/sfx_footstep_*.mp3`** (убраны 404). **Иконка**: **`public/icon.svg`**, **`metadata.icons`** в **`app/layout.tsx`**, редирект **`/favicon.ico` → `/icon.svg`** в **`next.config.ts`**. **`FollowCamera`**: зум на **`wheel`** с **`gl.domElement`**, **`passive: false`** и **`preventDefault`**; коллизии камеры без чередования кадров (**`COLLISION_THROTTLE_FRAMES = 1`**), чтобы убрать джиттер. **`RPGGameCanvas`**: **`hemisphereLight`** через **`color` / `groundColor` / `intensity`** (меньше предупреждений R3F/Three о deprecated args); **`Canvas`** **`tabIndex`**, **`onPointerDown`** → фокус для клавиатуры после клика по сцене. **`useGamePhysics`**: не перехватывать WASD, если фокус в **`input` / `textarea` / contentEditable** (чинило «управление мёртвое» после UI).

- **`ConsequencesSystem` / EventBus**: подписки на события сохраняются в **`consequenceBusUnsubs`**; **`resetConsequences()`** вызывает отписки перед сбросом состояния — иначе при повторном **`initConsequencesSystem`** (тесты, HMR) обработчики накапливались (утечка подписок + двойное применение последствий). Тест **`ConsequencesSystem.test.ts`**.

- **Исследование квартиры / коридор — «чёрный экран»**: в **`RPGGameCanvas`** не монтировался интерьер (стены/потолок были только в **`OptimizedSceneEnvironment`** для VN). Добавлены **`VolodkaCorridorVisual`**, **`VolodkaRoomVisual`**, **`HomeEveningVisual`** и подключены по **`sceneId`**; туман для узких локаций расширен (**near / far**), пол слегка осветлён с лёгким **emissive**; **`ExplorationPostFX`** получает **`compactIndoor`** (без **N8AO** в квартире — иначе кадр «съедался» в чёрное).

- **`PhysicsPlayer` (лаги + визуал)**: убраны **`setState` в `useFrame`** для поворота (теперь **`rotationRef`** + поворот **`modelRef`** в кадре без React commit ~60 Гц); **`setIsMoving`** только при смене движения; в **`useFrame`** для блокировки диалога используется **`isLockedRef`**, чтобы не залипать на устаревшем замыкании; подписка на карму — дискретные зоны **`high` / `mid` / `low`**, без ререндера на каждое изменение числа; **`useGLTF.clear`** у игрока убран (как у NPC) — меньше повторных загрузок и мигания; **`Suspense`**-fallback при загрузке GLB — пустой **`group`**, чтобы процедурная заглушка не оставалась под моделью; визуал вынесен в именованный **`PlayerVisualRoot`**. **`usePlayerControls`**: игнор **`keydown` с `e.repeat`** для WASD/стрелок, чтобы удержание клавиш не вызывало лишние **`forceUpdate`**.

- **`RPGGameCanvas` / обход и физика**: внутрь **`<Physics>`** добавлен **`PhysicsSceneColliders`** (как в **`PhysicsRPGCanvas`**): пол и стены Rapier для KCC, шагов и коллизий игрока; ранее монтировались только меши **`SceneColliderSelector`** (в основном слой для raycast камеры), без **`RigidBody`** окружения. Убран отдельный визуальный box-пол сверху — визуал и кубоид пола уже в **`PhysicsFloor`** внутри **`PhysicsSceneColliders`**, без z-fight с «вторым» полом.

- **`StressIndicator`**: глитч-полоса при стрессе > 80 без **`Date.now()`** в **`style.transform`** (ломало стабильность ререндера) — **`motion.div`** с циклической анимацией **`x`**.

- **`gameStore.saveGame`**: после успешной записи в **`localStorage`** эмитируется **`game:saved`** с **`timestamp`** и **`source`** из **`SaveGameOptions`** (по умолчанию **`manual`**), чтобы **`GameOrchestrator`** и **`useAutoSave`** снова получали тосты и различие авто/ручного сохранения.
- **`/api/ai-stream`**: разбор ответа SDK через **`completion.choices?.[0]`**, без исключения при отсутствии **`choices`**.

- **Аудит TypeScript / сборки**: **`tsconfig.json`** — в **`exclude`** добавлены **`_volodka_upstream_check`** и **`.next`**; ленивый клиент **`z-ai-web-dev-sdk`** в **`ai-dialogue`** / **`ai-narrative`** типизирован через **`create()`** и минимальный интерфейс **`chat.completions`**, без **`ReturnType<typeof default>`** (несовместим с экспортом класса); **`SceneAudio`** / **`PositionalAudioComponent`** — вызов **`setVolume`** через **`unknown`** (типы **`PositionalAudio`** vs **`Audio<GainNode>`**); **`LootNotification`** — ref таймера как **`number | null`** под **`window.setTimeout`**; **`MemoryDebug`** — **`ref`** и анимация линии для **`Line`** из **drei** на **`Line2`** + **`LineMaterial`**; **`StoryEffect`** (**`types.ts`**, **`shared/types/game.ts`**) — прямые дельты навыков (**`logic`**, **`coding`**, **`empathy`** и др.); **`storyNodesExpansion`** — эффект NPC через **`npcId`/`npcChange`**, **`createSkillCheckChoice`** с **`keyof PlayerSkills`**; **`useCoreLoopPhase`** — подписка по **`Object.entries`** и **`satisfies Partial<Record<keyof EventMap, …>>`**; мок **`processChoiceCycle`** в **`useStoryChoiceHandler.test.tsx`** возвращает объект цикла; разбор ответа narrative после **`unknown`** completion.
- **`getExplorationCharacterModelScale` / `getExplorationLocomotionScale`**: для **`sceneId`**, которого нет в **`SCENE_CONFIG`**, возвращается **1**, а не множители из запасного **`kitchen_night`** (совпадает с контрактом тестов и ожидаемым поведением при опечатке id).

- **`DialogueRenderer`**: в **`processDialogueChoice`** передавался пустой объект узлов — переходы по **`next`** из **`DIALOGUE_NODES`** не находились; теперь подставляется **`DIALOGUE_NODES`**, условия выборов проверяются через **`evaluateCondition`**.

- **`storyNodes` / квест «Первое чтение»**: при входе в **`blue_cat_cafe`** сразу закрывается цель **`go_to_cafe`** (до этого **`location_visited`** мог сработать до активации квеста); ветка **`maria_curious`** теперь даёт **`meet_someone`** и стартует **`maria_connection`**, как остальные ответы Виктории.

- **`PhysicsPlayer` / `GLBPlayerModel`**: отказ от глубокого клона сцены игрока для skinned **`Volodka.glb`** (меш снова виден); при одном клипе в файле он проигрывается и при движении.

- **`PhysicsPlayer` / масштаб по bbox**: если высота AABB по Y **< 0.55 m** (нереалистично для целого персонажа), считаем bbox битым и берём **`PLAYER_VISUAL_HEIGHT_FALLBACK_M`** вместо маленького делителя — иначе **`PLAYER_GLB_TARGET_VISUAL_METERS / h`** раздувает модель (ноги по краям кадра, комната «щелью»).

- **`PhysicsPlayer` / масштаб GLB (Volodka.glb)**: ветка **`hRaw > 22` → fallback** ошибочно подменяла делитель при **большом** bbox по вертикали (~234 единицы файла): масштаб получался ~в **100×** больше нужного. Большой **`hRaw`** снова идёт в формулу как есть; fallback только при **`hRaw < 0.55`**.

---

## [0.2.6] - 2026-04-17

### Fixed

- **`RPGGameCanvas`**: пол для Rapier — явный горизонтальный **`CuboidCollider`** вместо **`colliders="cuboid"`** на повёрнутом **`mesh`** (иначе коллизия не совпадала с визуалом и персонаж проваливался); **`Physics`** обёрнут в **`Suspense`** для корректной загрузки WASM.

---

## [0.2.5] - 2026-04-17

### Added

- **`useQuestProgress.npcMap.test.ts`**: квесты с событием **`npc_talked`** согласованы с **`QUEST_DEFINITIONS`** и **`NPC_DEFINITIONS`**; экспорт **`EVENT_OBJECTIVE_MAP`** из **`useQuestProgress`** для проверок.

### Changed

- **`package.json`**: зависимости **`@react-three/postprocessing`**, **`postprocessing`** (эффекты в **`CameraEffects`** / 3D-канвас).

### Fixed

- **`NeonSign.tsx`**, **`FloatingHolographicFragments.tsx`**, **`TerminalWindowOverlay.tsx`**: именованный **`export`**, без которого Turbopack считал модуль пустым и сборка на Vercel падала.

---

## [0.2.4] - 2026-04-17

### Added

- **`npcExplorationIntegrity.test.ts`**: проверка `explore_mode`, наличия GLB для всех `modelPath` NPC в `public/models-external`, соответствия `storyNodeId` / `cutsceneId` в триггерах данным сюжета и катсцен.

### Changed

- **`storyNodes.ts`**: добавлены узлы **`kitchen_table`**, **`kitchen_fridge`**, **`kitchen_window`**, **`cafe_*`**, **`office_*`**, **`street_bench`**, **`street_bench_view`**, **`memorial_main`**, **`park_gazebo`**, **`rooftop_edge`**, **`room_table`**, **`room_bookshelf`** — id совпадают с **`triggerZones.ts`**, выход обратно в **`explore_mode`** после короткого бита (раньше при E на триггере в 3D граф не находил узел и откатывался к **`start`**).

### Fixed

- **ESLint (react-hooks)**: синхронизация **`activeCutsceneIdRef`** в **`useGameRuntime`** через **`useEffect`**; обновление **`configRef`** / колбэков-рефов в **`useAmbientMusic`**; **`usePoemLineTypewriter`** — рефы и сброс строк через эффекты / **`queueMicrotask`**; **`InteractiveTrigger`** — раздельный расчёт зон и маркеров без мутации ref-объекта; **`WorldItem`** — близость через **`useMemo`**; сброс маркеров триггеров и текстур комнаты через **`queueMicrotask`** где нужно; **`GameOrchestratorSubcomponents`** — строка с `//` в JSX; игнор **`_volodka_upstream_check/**`** в **`eslint.config.mjs`**.

---

## [0.2.3] - 2026-04-16

### Added

- **3D «панельный» двор**: на `street_night` / `street_winter` в `RPGGameCanvas` — тёмный неоновый пол, силуэты панелек (коллайдеры), расширенный туман.

### Changed

- **Старт игры**: после сброса / новой игры режим по умолчанию **`exploration`**, узел **`explore_mode`**, первая локация **`street_night`** (VN по кнопке HUD или через сюжетные триггеры).
- **`explore_mode`** в `storyNodes`: сцена узла выровнена с хабом обхода — **`street_night`**.
- **`useGameScene`**: события квестов по локации (`location_visited`) в режиме обхода считаются по **`exploration.currentSceneId`**, а не по сцене узла сюжета.
- **`GameOrchestrator`**: визуал обхода на улице — чуть сильнее glitch / неоновый оттенок.

### Fixed

- **`useGameRuntime`**: при **`explore_mode`** вызывается **`sceneManager.transitionTo`** по фактической 3D-сцене (`explorationCurrentSceneId`), без **`travelToScene`**, чтобы не откатывать локацию после перемещения игрока.
- **`GameOrchestrator`**: удалён дублирующий `useEffect` с тем же нарративным `travelToScene` — достаточно эффекта в `useGameRuntime`.

---

## [0.2.2] - 2026-04-16

### Added

- **`ExplorationMobileHud.tsx`** — тач-оверлей для режима 3D-обхода на узких экранах: направления, прыжок, кнопка действия (аналог E); подсказка по орбите камеры.
- **`usePlayerControls`** (`useGamePhysics.ts`): опция **`virtualControlsRef`** — виртуальный ввод объединяется с клавиатурой по OR.
- **`PhysicsPlayer`**: проп **`virtualControlsRef`** для связи с тач-панелью.

### Changed

- **`GameOrchestrator`**: при фазе `game` и режиме **`visual-novel`**, если текущий узел не **`explore_mode`**, вызывается **`travelToScene(currentSceneId, { narrativeDriven: true })`** — локация **`exploration.currentSceneId`** синхронизируется со сценой сюжета без траты энергии и без проверки «локация закрыта».
- Кнопка HUD **«3D»**: переход в обход через **`travelToScene(..., { narrativeDriven: true })`**, затем **`explore_mode`** и **`exploration`**.
- **`RPGGameCanvas`**: оборачивает Canvas и мобильный HUD; на мобиле передаёт **`virtualControlsRef`** в **`PhysicsPlayer`**.

---

## [0.2.1] - 2026-04-16

Сводный релиз для деплоя на Vercel: накопленные правки UI/данных/физики и рефакторинг сцены, плюс выравнивание сюжетного оверлея с диалогами.

### Added

- `PanelErrorBoundary` в `GameOrchestratorSubcomponents.tsx`: изоляция ошибок lazy-панелей (`next/dynamic`) и экрана наследия; обёртки в `GameOrchestrator.tsx`.
- Вертикальный слайс главы 1: узлы сюжета в `src/data/verticalSliceStoryNodes.ts`, слияние в общий граф через `VERTICAL_SLICE_STORY_NODES` в `src/data/storyNodes.ts`, экспорт `VERTICAL_SLICE_ENTRY_NODE_ID` из `src/data/index.ts`.
- NPC слайса (Альберт, Александр) в `src/data/npcDefinitions.ts`; стартовые отношения в `INITIAL_NPC_RELATIONS` (`src/data/constants.ts`).
- Скрипт архивации экспертного обзора: `npm run expert:archive` (`package.json`, `scripts/export-expert-review-archive.ps1`); в `.gitignore` добавлены шаблоны для локальных zip и временной папки в `archives/`.
- Процедурная атмосферная музыка по сценам (Web Audio, без семплов): `src/lib/atmosphereMusicGenres.ts` — жанры `ambient`, `chiptune_8bit`, `brutal_heavy` и `getAtmosphereGenreForScene`; в `useAmbientMusic.ts` — ветвление синтеза (chiptune: square и арпеджио; brutal_heavy: короткие saw + WaveShaper и шумовые акценты; ambient: пады как раньше), `playBackgroundLayer` вынесен в `useCallback`, в цикле `setInterval` используются `configRef` и refs колбэков, чтобы после смены сцены подтягивались актуальные `sceneId` и обработчики; `AmbientMusicPlayer` в `GameOrchestrator.tsx` (включение в фазе `game`, без активной катсцены); тест `src/lib/atmosphereMusicGenres.test.ts`.
- `MiniMap` в `GameOrchestrator.tsx` для `gameMode === 'exploration'`: позиция из стора, размер сцены, подпись из `SCENE_VISUALS`, NPC через `getNPCsForScene` и позиции из `exploration.npcStates`.
- `src/config/modelUrls.ts`: `isValidPlayerGlbPath`, `getDefaultPlayerModelPath()` (fallback игрока, переопределение через `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`); тест `src/config/modelUrls.test.ts`.
- `PhysicsExplorationRoomVisual` в `RoomEnvironment.tsx` — визуал комнаты для Rapier-канваса по `sceneId` (пока `zarema_albert_room`); сцена `zarema_albert_room` добавлена в `SceneId` (`src/data/types.ts`, `src/shared/types/game.ts`).
- **`src/components/game/scene-atmospheres/`** — вынесенные атмосферные слои и пресеты сцен (`SceneAtmosphere`, `GlobalNeoNoirLayer`, улица/зима/кафе/кухня/офис/клуб/парк/крыша/серверная/дом/сон/бой и др.), `hashSceneId`, реэкспорт из `index.ts`.
- **`CyberSkillCheckResult.tsx`** — общий баннер результата проверки навыка (клип-путь, неон); используется в `DialogueRenderer` и `StoryRenderer`.
- **`usePoemLineTypewriter.ts`** — хук посимвольной печати массива строк для стихов/прозы (паузы между строками, `onFinished`).
- Поле **`faction?: string`** у квестов (`Quest` / `ExtendedQuest` в `types.ts`) — группировка в журнале; для IT-цепочек в `quests.ts` заданы подписи вида «Работа · IT».
- У стихов **`bonus?: boolean`**, хелперы **`isBonusPoem`**, константа **`MAIN_ARCHIVE_POEM_COUNT`**, экспорт из `data/index.ts`; основная коллекция в книге — без бонусных, скрытые — по `isBonusPoem`.

### Removed

- `Player.tsx`: дублировал `PhysicsPlayer` (своя клавиатура, кламп позиции, без GLB); основной 3D-режим — `PhysicsPlayer` + `FollowCamera`.
- Устаревший альтернативный интерфейс `GameUI.tsx`: не использовался в коде; актуальная композиция — `HUD` и `EnergyBar` из `GameOrchestratorSubcomponents` в `GameOrchestrator`.
- Устаревшее диалоговое окно `DialogueWindow.tsx` (включая неиспользуемый `DialogueManager`): в проекте нигде не импортировалось; единый UI — `DialogueRenderer.tsx` + `DialogueEngine`.
- **`SSHTerminal.tsx`** — дубликат IT-терминала без связи с квестами; каноничный терминал — **`ITTerminal.tsx`** (комментарий в шапке модуля).
- **`StoryPanel.tsx`** — не использовался; сюжет рендерится **`StoryRenderer`**.
- **`PoemReveal.tsx`** — логика объединена с потоком в **`PoemComponents.tsx`** / общий хук печати.

### Changed

- `NPC.tsx` (`GLTFModel` / `GLTFLoader`): для GLB/GLTF включены скелетные анимации через `useAnimations` и состояние `idle` / `walk` / `talk`; выбор клипа по `NPCDefinition.animations`, по умолчанию `Idle`/`Walk`/`Talk` и по подстрокам в имени клипа; плавное переключение `fadeOut`/`fadeIn`; перед загрузкой проверяется путь (`/models/…`, расширение `.glb`/`.gltf`); fallback-модель обёрнута в `useMemo`; при размонтировании вызывается `useGLTF.clear`; убрано синусоидальное покачивание корня для загруженной сцены (остаётся у стилизованных fallback-моделей).
- `Inventory.tsx`: тултип предмета учитывает `resize` / `visualViewport`; сетка слотов расширяется по рядам, если в инвентаре больше 24 стеков; заглушки «Использовать» / «Выбросить» для выбранного слота (disabled до реализации логики).
- `TriggerSystem` (`InteractiveTrigger.tsx`): проверка AABB в `useFrame` с throttling только для маркеров «нажми E»; `wasInside` в ref; без `setTimeout`; сброс состояния при смене сцены; клавиша E сначала активирует триггер `requiresInteraction` в зоне (`RPGGameCanvas`), затем NPC; `WorldItem` — индикатор близости без отложенного `setState`, комментарий про instancedMesh при росте числа предметов.
- `useActionHandler` / `useStoryChoiceHandler`: поле `playerSkills` типизировано как `PlayerSkills` (в `GameOrchestrator` убрано двойное `as unknown as Record<string, number>`); JSDoc для `energySystem` (прокидывается в сюжетный обработчик для стоимости выбора и skill check).
- Новая игра после сброса стора стартует с узла `VERTICAL_SLICE_ENTRY_NODE_ID`, а не `start` (`src/hooks/useGameSessionFlow.ts`); тесты обновлены (`src/hooks/useGameSessionFlow.test.tsx`).
- `CinematicEffects.tsx`: `SceneTransition` — фазы перехода на `async`/`await` с единым флагом отмены вместо трёх `setTimeout` (меньше рассинхрона при быстрой смене пропсов); `SplitScreen` — пружинная анимация при смене `ratio`, контейнер с `overflow-hidden`, панели без `flex-1` для предсказуемой доли; комментарий к сочетанию `export default` и именованного `CinematicOverlay`.
- `RPGGameCanvas.tsx` / `PhysicsRPGCanvas.tsx`: вместо `Player` — `PhysicsPlayer` с `getDefaultPlayerModelPath()`; камера — `FollowCamera` (орбита мышью, зум); в `PhysicsPlayer` — прыжок по Space через `PHYSICS_CONSTANTS.JUMP_FORCE`.
- `useGamePhysics.ts` (`usePlayerControls`): опциональный `onInteractPress` при первом нажатии взаимодействия вместо опроса `setInterval` в `PhysicsPlayer`.
- `PhysicsRPGCanvas.tsx` (`PhysicsGameModeSwitcher`): гравитация от стресса и `panicMode` через проп `gravity` у `<Physics>`; постобработка учитывает `panicMode`; отладочные `gridHelper`/`axesHelper` только при `NEXT_PUBLIC_PHYSICS_DEBUG_HELPERS=1`; вместо постоянного `ZaremaAlbertRoom` — `PhysicsExplorationRoomVisual` по сцене; заглушка `EmotionalGravityController` удалена.
- `docs/MODEL_INTEGRATION.md`: пример игрока переведён на `PhysicsPlayer`.
- **`SceneRenderer.tsx`**: компактный корень, докблок про разделение слоёв (`AsciiCyberBackdrop` vs дождь в 3D-атмосферах), подключение **`scene-atmospheres`**.
- **`QuestsPanel.tsx`**: группировка квестов по **`faction`**, бейджи наград (статы, навыки, предметы, флаги), доработки кибер-UI.
- **`createReward`** в `quests.ts`: spread исходных полей награды, `??` для массивов — не затираются кастомные поля награды.
- **`RPGGameCanvas.tsx`**: пресеты размера пола по типу локации, опциональный проп **`groundGeometryArgs`**, тип **`RpgGroundGeometryArgs`**; модульный комментарий; убран неиспользуемый импорт `NPC_DEFINITIONS`.
- **`RoomEnvironment.tsx`**: процедурные **`CanvasTexture`** для пола/обоев (без HTTP к отсутствующим `/textures/*`), комментарии про переход на файлы из `public/`; доработки жизненного цикла текстур.
- **`RainCanvasLayer.tsx`**, **`SceneComponents.tsx`**: согласованность с новой структурой сцен / комментарии.
- **`PoetryBook.tsx`**: учёт **`MAIN_ARCHIVE_POEM_COUNT`** / разделения основной коллекции и бонусных стихов.
- **`PoemComponents.tsx`**: рефакторинг потока мини-игр/интро стихов с **`usePoemLineTypewriter`**.
- **`StoryRenderer.tsx`**: баннер skill check по событию **`eventBus` `skill:check`** (согласовано с `useStoryChoiceHandler`); **`SpeakerTag`** для обычных спикеров — циан/slate вместо фиолета.
- **`DialogueRenderer.tsx`**: импорт **`CyberSkillCheckResult`** из общего модуля.
- **`GameOrchestrator.tsx`**: флаг видимости сюжета переименован в **`showStoryOverlay`** (не путать с удалённым `StoryPanel`).
- **`useGameUiLayout.ts`** / **`useActionHandler.ts`**: возврат и прокид **`showStoryOverlay`**.

### Fixed

- `DialogueRenderer`: очистка интервала печати через `useRef` + сброс при новом `startTyping` и при размонтировании; `dialogueContext` строится из пропа `playerState` (без `getState()`); `startDialogue` вызывается из `useEffect` без неиспользуемого `filteredChoices`; удалён неиспользуемый `history`; текст реплики при печати берётся из `displayedText`; `CyberDialogueChoice` обёрнут в `memo`.
- Навыки из эффектов диалога/сюжета/стихов: вместо приведения к `'writing'` используется `asTrainablePlayerSkill` (`src/lib/trainablePlayerSkill.ts`) в `DialogueRenderer`, `useDialogProcessor`, `useGameRuntime`, `useStoryChoiceHandler`; типы `addSkill` в `useActionHandler` / `useDialogProcessor` / `useGameRuntime` приведены к `keyof PlayerSkills`.
- Исправлена функция `getGameStore`: возвращает `getState()` доменного и монолитного Zustand-стора (`src/client/store/index.ts`, `src/store/gameStore.ts`).
- Добавлена защита от отрицательных очков навыков в `addSkillPoints` (`src/client/store/playerStore.ts`, `src/store/gameStore.ts`).
- Добавлены пояснения к `setCurrentNode` / `visitNode` и JSDoc у `visitNode`, чтобы избежать лишних двойных обновлений при смене узла.
- Добавлено предупреждение в консоль при неизвестном ID предмета в `addItem` (`src/client/store/inventoryStore.ts`, `src/store/gameStore.ts`).
- Удалён дублирующий компонент `AnimeCutsceneOverlay`; заставки рендерятся через `AnimeCutscene` в `GameOrchestrator`.
- Удалена некорректная папка `src/app/undefined` (артефакт маршрутизации).
- `AsciiCyberBackdrop`: сброс массива капель при старте эффекта, обрезка `drops` при уменьшении `rainCount` (смена `staticMode`/плотности), явный порядок зависимостей `useEffect` с `npcsHere` (`src/components/game/AsciiCyberBackdrop.tsx`).
- `ChromaticAberration` (DOM в `CinematicEffects.tsx`): ограничение пикового смещения в px при высокой `intensity`, обёртка с `overflow-hidden` и `clip-path: inset(0)` против артефактов у краёв экрана.
