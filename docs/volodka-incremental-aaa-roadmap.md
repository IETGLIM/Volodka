# Volodka — инкрементальная дорожная карта к AAA Production Ready

Цель: **честный** production-уровень для memorial / vertical slice — без деклараций «100/100», пока критерии ниже не закрыты. План разбит на этапы и шаги; каждый этап завершается проверяемым артефактом (тесты, чеклист, или согласованный diff).

## Критерий готовности (Definition of Done для проекта)

- **Сюжет:** `goldenPath` + narrative-тесты зелёные; ключевой happy-path проходим без мёртвых ссылок на узлы/квесты.
- **Состояние:** сохранение/загрузка и persist не ломают прогресс; миграции покрывают смену версий.
- **Интерактив:** каждый зарегистрированный `interactionId` из сцен имеет исполнителя в реестре или явный fallback; условия квестов согласованы с `registerBaseInteractions` / графами обхода.
- **Карма/статы:** изменения идут через единые пути (`StoryEffect`, `useStoryChoiceHandler` / `usePlayerActions`, `ConsequencesSystem` / диалоги) без «тихих» расхождений с HUD.
- **3D:** стабильный FPS на целевом desktop; на mobile — сниженные эффекты и читаемый HUD (см. `useMobileVisualPerf`, `ExplorationMobileHud`).
- **CI:** `tsc`, `vitest`, `asset-budget`, `test:player-animations`, `lint`, `build` — как в `.github/workflows/ci.yml`.
- **Документация:** аудит и roadmap не противоречат друг другу по статусу готовности.

## Карта систем (якорные файлы)

| Домен | Назначение | Ключевые пути |
|-------|------------|---------------|
| Узлы сюжета / эффекты | Текст, выборы, `karma` в `StoryEffect` | `src/data/storyNodes.ts`, `src/data/types.ts` |
| Квесты | Активация, цели, граф обхода | `src/data/quests.ts`, `src/game/quests/QuestEngine.ts`, `src/game/quests/explorationQuestGraphs.ts`, `src/game/core/explorationQuestGraph.ts` |
| Интерактив обхода | Реестр взаимодействий | `src/game/core/registerBaseInteractions.ts`, `src/game/interactions/*.ts`, `src/ui/game/InteractiveTrigger.tsx` |
| Хуки (фасады) | UI → store без прямого монолита | `src/hooks/usePlayerActions.ts`, `usePlayerState.ts`, `useWorldActions.ts`, `useWorldState.ts`, `useQuestActions.ts`, `useQuestState.ts`, `useStoryChoiceHandler.ts`, `useGameRuntime.ts` |
| Физика / сцена | Rapier, коллайдеры, Canvas | `src/hooks/useGamePhysics.ts`, `src/ui/game/RPGGameCanvas.tsx`, `src/ui/game/PhysicsSceneColliders.tsx`, `src/config/scenes.ts` |
| Карма / последствия | Пост-выбор, диалоги | `src/engine/ConsequencesSystem.ts`, `src/engine/DialogueEngine.ts`, HUD Karma |
| Мобильный слой | Breakpoints, perf, подсказки | `src/hooks/use-mobile.ts`, `useMobileVisualPerf.ts`, `src/ui/game/TutorialOverlay.tsx`, `ExplorationMobileHud.tsx` |
| Стриминг / GLB | Чанки, кэш | `src/ui/3d/exploration/StreamingChunk.tsx`, `src/lib/gltfModelCache.ts`, `src/engine/streaming/*` |

---

## Фаза 0 — Инвентаризация и единая правда о статусе

| Шаг | Действие | Готово |
|-----|----------|--------|
| 0.1 | Зафиксировать карту систем (таблица выше) + этот документ | ☑ |
| 0.2 | Синхронизировать формулировки готовности в `docs/volodka-aaa-expert-audit-2026-04-25.md` с executive summary (без противоречия «100/100») | ☑ |
| 0.3 | Прогон локально: `npx tsc --noEmit`, `npm test` | ☐ *выполнить перед мержем очередной порции* |

**Артефакт:** этот файл + согласованный аудит.

---

## Фаза 1 — Интерактив: реестр ↔ конфиг сцен ↔ хуки

| Шаг | Действие | Готово |
|-----|----------|--------|
| 1.1 | Выгрузить список `interactiveObjects` / `interactionId` из `src/config/scenes.ts` (и связанных визуалов) | ☐ *`interactionId` живут в `triggerZones.ts`; `interactiveObjects` — отдельный слой (книги/NPC/E в `RPGGameCanvas`)* |
| 1.2 | Сверить с `explorationInteractionRegistry` в `registerBaseInteractions.ts` + `InteractionRegistry` | ☑ |
| 1.3 | Точки входа UI: `InteractiveTrigger`, `explorationController`, `useGameRuntime` — нет ли обхода фасадов туда, где нужен `useWorldActions` | ☐ *E→`tryExecute` использует `useGameStore.getState()` в контексте — ок для фазы 1; миграция на фасады — позже* |
| 1.4 | Тесты покрытия: `explorationInteractionCoverage.test.ts` (триггеры + графы квестов + allowlist сирот) | ☑ |

**Артефакт:** таблица «сцена → объект → handler → квест/узел» в комментарии к PR или раздел ниже (по желании вести здесь).

### Сводка фазы 1 (2026-04-27)

| `interactionId` (триггер) | Сцена | Реестр |
|---------------------------|-------|--------|
| `npc_intro` | `zarema_albert_room` | `registerBaseInteractions` → диалог Заремы + intro quest |
| `quest_zarema_hearth` | `zarema_albert_room` | граф `HEARTH_EXPLORATION_QUEST_GRAPH` |
| `volodka_rack_hack` | `volodka_room` | консоль + wire hack + `RACK_FORCE_EXPLORATION_QUEST_GRAPH` |

**Без триггера (намеренно в allowlist теста):** `zarema_resonance_ping` — при желании добавить `TriggerZone` или вызов из кода.

---

## Фаза 2 — Сюжет, квесты, карма

| Шаг | Действие | Готово |
|-----|----------|--------|
| 2.1 | Проход `StoryEffect` vs `useStoryChoiceHandler.applyStoryEffect` | ☑ *добавлены `pathShift` → `setPlayerPath` (`playerStore`) и прямые дельты навыков; тест `storyEffectCoverage.test.ts`* |
| 2.2 | `ConsequencesSystem` vs флаги сюжета | ☑ *`read_at_cafe` не выставлялся в данных — заменено на `performed_live` (`after_reading`)* |
| 2.3 | `goldenPath.test.ts` + `narrativePoetryIntegrity.test.ts` | ☑ *прогон после изменений* |
| 2.4 | Фракции / квесты | ☐ *в `quests.ts` поле `faction` — строка для UI, не `FactionId`; отдельная сверка с `factionStore` по желанию* |

---

## Фаза 3 — Физика, стриминг, 3D-полировка

| Шаг | Действие | Готово |
|-----|----------|--------|
| 3.1 | Коллайдеры hero-path vs спавн | ☑ *инварианты пола из `PhysicsSceneColliders` (volodka_room / corridor / zarema) ↔ `spawnPoint` — `explorationHeroStreamingIntegrity.test.ts`* |
| 3.2 | Стриминг: соседи, чанки, GLB на диске | ☑ *тот же файл + существующие `SceneStreamingCoordinator.test.ts`; `rapierBodyKeys` в манифесте — ориентир для HUD/отладки, основная физика — `PhysicsSceneColliders`* |
| 3.3 | Бюджет GLB + eviction | ☑ *гейт CI: `npm run asset-budget`, LRU в `gltfModelCache`; целевые лимиты устройств — ручной профиль + `useMobileVisualPerf`* |

---

## Фаза 4 — Мобильные устройства

| Шаг | Действие | Готово |
|-----|----------|--------|
| 4.1 | Единый breakpoint (`MOBILE_MAX_WIDTH_MEDIA` в `use-mobile` + `useMobileVisualPerf`) — нет расхождений | ☑ |
| 4.2 | Тач-управление и подсказки (`TutorialOverlay`, `ExplorationMobileHud`) на hero-сцене; инвариант `explorationTutorialHints` — `explorationMobileHeroHints.test.ts` | ☑ |
| 4.3 | Ручной чеклист (ниже); прогон на устройствах — перед релизом мемориала; изменения mobile-слоя — пункт в CHANGELOG | ☑ *чеклист зафиксирован* |

### Чеклист 4.3 (1–2 устройства, узкий экран или coarse pointer)

- Меню → старт hero-маршрута (`volodka_room`): оверлей туториала читаем, тач-подсказки согласованы с `ExplorationMobileHud`.
- Обход: джойстик/тач-панель отзывчивы, камера не «убегает» при первом касании.
- Переход в сцену с Заремой (`zarema_albert_room`): подсказки не пустые, диалог/триггеры доступны.
- При включённом system **reduce motion**: облегчённые эффекты (`useMobileVisualPerf`) без ложного включения тача на широком desktop с fine pointer (см. `mobileBreakpoints.test.tsx`).

---

## Фаза 5 — Production gates

| Шаг | Действие | Готово |
|-----|----------|--------|
| 5.1 | Решение по smoke: основной CI без Browserbase; ручной workflow `volodka-smoke.yml` + `docs/volodka-room-smoke.md` | ☑ |
| 5.2 | API: Zod + лимит тела для `/api/ai-dialogue`; лимит `Content-Length` для `/api/models/upload` (включённый флаг + bearer по-прежнему) | ☑ |
| 5.3 | Чеклист релиза мемориала (ниже); тег версии — вручную при публикации | ☑ *чеклист* |

### Чеклист 5.3 (релиз мемориала)

- `npx tsc --noEmit`, `npm test`, `npm run build` локально или по последнему зелёному CI на `main`.
- Пройти чеклист `docs/volodka-room-smoke.md` (и при необходимости ручной Browserbase smoke на прод-URL).
- Обновить `CHANGELOG.md`: секция версии вместо только `[Unreleased]`, кратко — пользовательские изменения.
- Тег git: `git tag -a vX.Y.Z -m "…"` и push тегов; на Vercel — production deploy с этой ревизией.

---

## История изменений документа

- **2026-04-27:** аудит `volodka-aaa-expert-audit` синхронизирован с кодом (API, CI/smoke, persist); README и `.gitignore` (zip-снимок в корне).
- **2026-04-27:** фаза 5 — решение по Browserbase smoke, API-лимиты и Zod для `ai-dialogue`, чеклист релиза 5.3.
- **2026-04-27:** фаза 4 — единый mobile breakpoint, тесты `mobileBreakpoints.test.tsx` + `explorationMobileHeroHints.test.ts`, чеклист 4.3.
- **2026-04-27:** фаза 3 — интегритет hero streaming + спавн в коллайдерах (`explorationHeroStreamingIntegrity.test.ts`).
- **2026-04-27:** фаза 2 — эффекты сюжета, последствия, тест покрытия ключей `StoryEffect`.
- **2026-04-27:** создан документ, фазы 0–5 и карта систем.
