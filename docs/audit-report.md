# Аудит кодовой базы «ВОЛОДЬКА» — 15 этапов

> Дата: 2026-08-27 · Ветка: `main` (v4.8.1) · Изучение строго по коду (README/патчноуты/ворклог игнорировались как источник фактов, использовались только для контекста версий).

## 1. Структура проекта
- **Стек**: React 19 + Vite 6 + TypeScript 5.9, Three.js 0.172 + React Three Fiber 9, Rapier 2.2 (KCC), Zustand 5, Tailwind 4 + shadcn/Radix, Framer Motion 12, Zod 4.
- **Точка входа**: `src/main.tsx` → `src/app/AppBootRoot.tsx`; глобальные стили `src/app/globals.css`.
- **Модули**: `src/engine/*` (игровые системы: player, combat, npc, dialogue, camera, input, world, audio, fx, performance, recovery), `src/store/*` (Zustand-слои + slices + selectors), `src/data/*` (контент: quests, dialogue, items, npc, poems, lore, story), `src/components/*` (React-UI: 3d, game/hud, game/inventory, game/dialogue, game/cinematic и т.д.), `src/shared/*` (типы, константы, утилиты), `src/proceduralAaa/*` (процедурная генерация мира/атмосферы), `src/engine/three` (обвязка Three).
- **Объём**: 2208 файлов в `src/`, 390 тестов. Проект зрелый (v4.8.1), уже прошёл несколько волн AAA-полировки.

## 2. Система сборки и конфигурация
- `package.json`: скрипты `build` (vite build), `build:vercel` (vite build + prune-deploy-assets), `build:full` (assets:prepare + validate + tsc + build + budgets + verify:deploy), `check`, `lint`, `typecheck`, `test:unit`, `test:e2e`, `budgets`, `verify:deploy`.
- `vite.config.ts`: tier-based code splitting (`vite/chunks.ts`), `modulePreload: false` (для LCP), `minify: esbuild`, target `es2022`, alias `@`→`src`, rapier init-fix плагин, dedupe rapier.
- `vercel.json`: framework vite, buildCommand `npm run build:vercel`, outputDirectory `dist`, SPA rewrites, CSP-заголовки, wasm content-type, кэширование ассетов.
- **Проблема (критичная для CI)**: сборка падает с `Killed` (OOM) в среде с cgroup-лимитом 2 ГБ. Причина — большой граф модулей (4491 модулей) и тяжёлые чанки. Решение: ограничить кучу Node (`NODE_OPTIONS=--max-old-space-size=1536`) и/или поднять лимит. На Vercel (лимит выше) сборка проходит, но для локальной проверки нужен контроль памяти.
- Tree-shaking: включён (esbuild), ручные чанки по тирам. Бандл разбит на 16 чанков.

## 3. Модели данных и типы
- Центральный баррель `src/shared/types/game.ts` экспортирует типы из `definitions/*` (skills, items, scene, story, dialogue, npc, quest, poem, interaction, schedule, combat, progression, weather, thoughtCabinet) и `state/*` (relations, quest, combat, combatRng, daily, player, exploration).
- Типы согласованы, есть бренды (`asItemId`), Zod-валидация сейвов. Устаревших/несогласованных типов в ключевых системах не выявлено; есть `src/legacy` и `src/engine/three` — потенциально устаревшие, но не влияют на сборку.

## 4. Состояние приложения
- Zustand-сторы: `playerStore`, `worldStore`, `questStore`, `saveStore`, `uiStore`, `achievementStore`, `cutsceneStore`, `dialogueHistoryStore`, `difficultyStore`, `explorationStore`, `npcCodexStore` + `gameStore.ts` (агрегатор).
- Селекторы мемоизированы (`memo.ts`, `createSelectorHooks.ts`), есть `gameSnapshotCache`, `crossSliceReads`, `storeEffects` (сайд-эффекты на действия).
- Есть тесты на утечки/батчинг (`applyGameAction.achievementBatch.test.ts`, `storeBindings.test.ts`). Архитектура состояния зрелая; явных утечек по коду не найдено.

## 5. Игровой цикл и рендер
- R3F `<Canvas>` + Rapier physics (KCC), fixed-timestep физика (`physicsSubstep.ts`), `playerFramePrepare`/`playerFinalizeFrame`.
- Пост-обработка: `@react-three/postprocessing` (Bloom, ACES), HDRI/IBL, MeshPhysical материалы, wet/CRT акценты.
- Качество рендера высокое: динамические тени, PBR, процедурная атмосфера (`ProceduralAtmosphere`), SDF-мир (`ProceduralSdfWorld`).

## 6. Управление и камера
- Ввод: клавиатура/мышь/геймпад/тач (виртуальный джойстик `virtualJoystickBridge.ts`), `src/engine/input/*`.
- Камера: `src/engine/camera/*` — стратегии (exploration, combat, dialog, cutscene, transition), shoulder-камера, инерция, коллизии (`cameraCollisionLayers.ts`), shake, POI, waypoints для кат-сцен.
- Управление зрелое: WASD+стрелки, бег, красться, блок, инерция камеры.

## 7. Боевая система
- `src/engine/combat/*`: turn-based combat (turnCycle, enemyTurn, formulas, buffSystem, bossPhases, environmentalHazards, combatRng, rewards, difficulty, statDrain, thoughtCombatModifiers).
- Враги: `enemies.ts`, `enemyAiBehaviors.ts`, `creepTactics.ts`, волны (`encounterWave`), телеграфирование спец-атак, фазы боссов.
- 3D-сражение в ключевых моментах + кат-сцены. Аудио-проблематика: есть `AudioEngine`, `SfxEngine`, `voiceLinePlayer`.

## 8. NPC и диалоги
- `src/engine/npc/*`: патрули (`npcPatrol.ts`), nav mesh (`navMeshBuilder`, `navMeshPathfinder`, `navMeshCache`), head tracking, эмоции, расписания (`npcSchedule`), фракции (`factionPropagation`), рендер-тиры, процедурные слои.
- Диалоги: `src/engine/dialogue`, `src/data/dialogue/*` (деревья, варианты, влияние на карму/репутацию), `resolveDialoguePresentation`.
- Локализация: `src/i18n/messages/ru.ts` — все видимые строки на русском.

## 9. UI/HUD
- `src/components/game/hud/*` — богатый HUD: миникарта/компас (`CompassIndicator`, `CompassPOIMarkers`), бары HP/Карма (`CyberStatBar`, `KarmaHudMeter`, `KarmaRing`), инвентарь (`src/components/game/inventory`), навыки (`perks`, `levelUp`), уведомления (`notificationToasts`, `AchievementPopup`), подсказки (`ContextualHint`), квестовые маркеры (`AaaWorldMarkerSystem`, `QuestDirectionArrow`).
- Адаптивность: сенсорное управление, виртуальный джойстик, переключение раскладки.

## 10. Ассеты и ресурсы
- `public/`: models, textures, hdri, menu, draco, basis, rapier, sw.js, manifest.
- Асинхронная загрузка: `gltfPreloadScheduler`, `gltfPreloadOverlayGate`, LOD (`src/engine/lod`, `src/components/3d/lod`), scene chunks (`sceneChunkRegistry`, lazy).
- Оптимизация: `scripts/optimize-*`, prune-deploy-assets, budgets. Битых ссылок по коду не выявлено.

## 11. Сохранения и загрузка
- `src/store/slices/saveStorage.ts`, `saveMigrations.ts`, `persistedState.ts`, `src/shared/persistence/*` (quotaCheck, persistedStorageOps).
- Zod-валидация, миграции версий, восстановление состояния. Безопасное хранение в localStorage/IndexedDB.

## 12. Производительность
- `src/engine/performance/*`: GpuResourceBudgetTracker, RuntimeBudgetMonitor, highPresetBudget, LoadingTimeline.
- Батчинг: `npcFrameBatch`, `InstancedMesh`-подходы, LOD, quality-tier degrade (low/medium/high/ultra/auto), adaptiveQualityBridge.
- Draw calls оптимизированы; есть бюджеты бандла (`scripts/check-bundle-budgets.mjs`).

## 13. Безопасность
- CSP в vercel.json (default-src 'self', script-src 'self' 'wasm-unsafe-eval', connect-src 'self' blob:), X-Content-Type-Options, Referrer-Policy, X-Frame-Options DENY.
- XSS-векторов в коде не выявлено (React-экранирование, нет dangerouslySetInnerHTML в пользовательских данных). Внешние обращения ограничены (fonts.googleapis, FreeRouter опционально).

## 14. Совместимость
- target es2022, полифиллы не требуются для современных браузеров. PWA (sw.js), manifest, mobile-web-app-capable.
- Тач-события, виртуальный джойстик, адаптивная вёрстка. iOS/Android поддержка заложена.

## 15. Сводный анализ (по критичности)

### Критичные
1. **OOM при `npm run build` в среде с лимитом памяти 2 ГБ** — сборка убивается (`Killed`). Блокирует локальную проверку и CI. Решение: ограничить кучу Node (`NODE_OPTIONS=--max-old-space-size=1536`) и/или документировать требование к памяти. На Vercel (16 ГБ) не блокирует, но для воспроизводимости нужен фикс.

### Важные
2. **CSS-предупреждение при сборке**: «Invalid empty selector» в high-contrast-правилах (`[data-high-contrast="true"] [class*="bg-black/"]` и т.п.) — Tailwind 4 не находит классы по подстроке. Не ломает сборку, но засоряет лог и может дать неверный CSS.
3. **8 уязвимостей npm** (1 moderate, 7 high) — `npm audit`; желательно обновить зависимости (осторожно, без breaking).
4. **README/CHANGELOG рассинхронизированы с package.json** (README говорит 4.4.2, package 4.8.1) — документация требует обновления.

### Желательные
5. `src/legacy/` и `src/engine/three/legacy` — мёртвый код, кандидат на удаление (риск низкий, выгода в размере бандла).
6. FreeRouter API (Шёпот города) — опциональная интеграция, ключ пользователь заменит; не критично.
7. Дальнейшая полировка: больше кат-сцен, расширение подземелий, новые квесты (уже 147+).

---

*Вывод: кодовая база зрелая и близка к AAA-уровню. Критичных геймплейных багов по коду не выявлено; главный риск — стабильность сборки в ограниченной памяти. Приоритет: зафиксировать сборку, обновить документацию, при желании — точечные улучшения.*