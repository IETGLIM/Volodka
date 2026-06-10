# Архитектура — ВОЛОДЬКА RPG

> Карта систем проекта для инженеров. Актуально для v3.2.0.

## Слои

```
┌─────────────────────────────────────────────────────────────┐
│ UI (React + Radix/Tailwind)                                 │
│   GamePage → GameOrchestrator → панели/HUD (React.lazy)     │
├─────────────────────────────────────────────────────────────┤
│ 3D (React Three Fiber)                                      │
│   RPGGameCanvas → PhysicsSceneInner (Rapier) →              │
│   SceneColliderSelector / PhysicsPlayer / FollowCamera /    │
│   NPCSystem / PatrollingCreeps / DynamicProps / PostFX      │
├─────────────────────────────────────────────────────────────┤
│ Engine (без React)                                          │
│   EventBus · GameActionDispatcher · CombatSystem ·          │
│   GuidedStoryManager · QuestTracker · PoemPowerSystem ·     │
│   MusicEngine/AudioEngine · camera strategies ·             │
│   visualSettings/AudioSettings                              │
├─────────────────────────────────────────────────────────────┤
│ Data (декларативный контент)                                │
│   story/act1–7 · quests · dialogue · poems · npcDefinitions │
│   triggerZones · creepPatrols · dynamicProps ·              │
│   sceneDefinitions · goldenPath                             │
├─────────────────────────────────────────────────────────────┤
│ Store (Zustand slices) + save (Zod-схема, two-phase write,  │
│   автовосстановление из backup)                             │
└─────────────────────────────────────────────────────────────┘
```

## Ключевые контракты

### EventBus (`src/engine/EventBus.ts`)
Типизированный pub/sub. Правило: **только на границах слоёв** (3D→DOM, engine→UI).
- Дедупликация: FNV-хэш (event + примитивные поля), 64 слота, окно `DEDUP_WINDOW_MS`;
  боевые/сценовые события в `DEDUP_EXEMPT` всегда проходят.
- Приоритеты: Engine → Orchestrator → UI → FX → Debug (FIFO внутри уровня).
- Снапшоты слушателей на время dispatch; `createScope()` для пакетной отписки
  в оркестраторах; `dispose()` обрывает in-flight dispatch через generation.

### GameActionDispatcher (`src/engine/GameActionDispatcher.ts`)
Engine-модули не импортируют store. Мутации — типизированные `GameAction`
(quest/*, player/*, poem/*, story/*, …), чтение — `GameStoreSnapshot`,
мост регистрируется store-ом на старте (`registerGameActionBridge`).

### Сцены (`src/config/sceneDefinitions.ts` → генератор)
`SceneDefinition` — единственный источник правды: размеры, спавн, doorways/exits,
коллайдеры (floors/walls/obstacles/ceilings), свет, туман.
`sceneDefinitionGenerator.ts` производит SCENE_CONFIG и физику:
- **Периметр**: `generateBoundaryWallSegments` режет стены проёмами по doorways
  и ставит утопленный backstop (дверная ниша; выйти из карты нельзя).
- Definition-стены, лежащие на периметре, отфильтровываются (нет двойных стен).
- `CameraCollisionProxies` зеркалит ту же геометрию на layer 5 для рейкастов камеры.

### Физика игрока (`PhysicsPlayer.tsx`)
Kinematic Character Controller (Rapier): capsule r=0.3, autostep 30 см,
snap-to-ground 15 см, `applyImpulsesToDynamicBodies` (масса 75) — поэтому
`DynamicProps` (банки/ящики) толкаются без доп. кода. Fallback-цепочка:
Rapier WASM упал → SimplePlayer (clamp по границам, без коллизий).

### Бой и крипы
Бой пошаговый (`CombatSystem.startCombat(enemyType)`), 11 типов врагов.
`PatrollingCreeps.tsx` + `src/data/creepPatrols.ts`: видимые враги, FSM
patrol→chase→engaged→cooldown, конус зрения проецируется на землю.
Поэтические TTL-флаги модифицируют восприятие (см. ниже).

### Поэтическая магия (`PoemPowerSystem.ts`)
Стихи Владимира Лебедева (**тексты неприкосновенны**, `src/data/poems.ts`):
- в бою — `POEM_COMBAT_ABILITIES` (кулдауны, баффы/дебаффы);
- в исследовании — TTL-флаги в store (`activeTTLFlags`), напр.
  `guiding_star_active` (poem_3) сжимает конусы зрения крипов до 45%.
Новые мировые эффекты стихов = чтение одного TTL-флага в кадровом цикле.

### Сюжет и golden path
- Узлы: `src/data/story/act1–7.ts`, грузятся лениво narrative-паками
  (`narrativePackRegistry`, bootstrap = act1).
- Канонический путь: `GOLDEN_PATH_STORY_SPINE` (до `act7_true_end`) + derivation
  из меток `choice.goldenPath` (`deriveGoldenPath.ts`); валидатор контента
  (`npm run validate:content`) сверяет оба источника.
- Прогресс: `GuidedStoryManager` (visitedNodes, флаги, npc:talked) +
  `QuestTracker` (objectives: location/npc/flag/item/poem/minigame).

### Настройки
- `engine/visualSettings.ts` — postFX, яркость, тряска, сенса, invertY,
  сканлайны, частицы; кэшированный снапшот + window-событие; React-биндинг
  `useVisualSettings` (useSyncExternalStore).
- `engine/audio/AudioSettings.ts` — громкости и глобальный mute.
- `engine/graphics/qualityPresets.ts` — low/medium/high/ultra (+auto):
  DPR, тени, postFX, LOD bias, Draco/Meshopt, `npcRenderMode`
  (procedural-NPC на low), visualLite.

### Сейвы (`store/slices/saveStorage.ts`)
Zod-схема (SAVE_VERSION=1), two-phase write + rollback, backup-ключ.
`resolveSaveFromStorage` → `empty | ok | recovered-from-backup | corrupt`;
битый основной сейв → автозагрузка backup + уведомление; ключи не затираются.

## Сборка и бюджеты

- `vite/chunks.ts` — ручная стратегия чанков. **Инвариант: entry-граф меню не
  должен достигать three/актов.** Для этого выделены `boot-shared`
  (engine/performance, visualSettings), `data-loader` (gameDataLoader +
  narrativePackRegistry), `data-golden-path` (zero-deps таблицы) и
  `content-validator` (статически импортирует barrel всех актов — никогда не
  колоцировать с boot-модулями).
- `config/performanceBudgets.json` + `scripts/check-bundle-budgets.mjs` —
  gzip-бюджеты по tier'ам (boot/game-start/lazy), hard-fail в CI.
- `scripts/validate-gltf-assets.ts` — наличие и glTF-магия всех рантайм-GLB
  (props/NPC/FPS-руки/external) + shipped-ассеты манифеста.

## Команды

```bash
npm run dev              # дев-сервер :3000
npm run check            # lint + typecheck + validate + build + budgets
npm run test:unit        # vitest (node env, 144 теста)
npm run test:e2e         # Playwright smoke
npm run validate:content # квесты/история/стихи/golden path
npm run assets:validate  # GLB на диске и валидны
```

## Правила для контрибьюторов (и агентов)

1. Тексты стихов в `src/data/poems.ts` не редактируются.
2. EventBus — только между слоями; внутри слоя — прямые вызовы/props.
3. Engine не импортирует store — только GameActionDispatcher.
4. Новый контент — данные, не код: квест = запись в `quests/actN.ts`,
   враг на сцене = запись в `creepPatrols.ts`, предмет = `dynamicProps.ts`.
5. Любая правка проходит `npm run check` перед коммитом.
