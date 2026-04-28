# Визуальный / UI аудит и бэклог «AAA-ощущения» (веб)

Документ для **прохода аудита и приоритизации**, не замена [volodka-aaa-expert-audit-2026-04-25.md](./volodka-aaa-expert-audit-2026-04-25.md). Канон референсов: [visual-reference-mapping.md](./visual-reference-mapping.md) + [narrative-style-bible.md](./narrative-style-bible.md).

## 1. Матрица поверхностей UI

**Легенда:** токены — использование `--game-ui-*` / `game-panel-skin--*`; **PRM** — `prefers-reduced-motion`; **Lite** — ветка `useMobileVisualPerf` / `visualLite` (см. [perf-exploration-notes.md](./perf-exploration-notes.md)).

| Поверхность | Файлы (якорь) | Токены / скин | PRM / a11y | Lite / риск | Заметки / пробелы |
| ----------- | ------------- | ------------- | ---------- | ------------- | ----------------- |
| HUD (статы, полосы) | [HUD.tsx](../src/ui/game/HUD.tsx) | Частично: `glowColor` → `var(--game-ui-glow-*)` | Проверить анимации полос | HUD не Canvas — обычно ок | Остальной JSX — точечный аудит hardcoded `rgba` |
| PlayerOrbitHeader | [PlayerOrbitHeader.tsx](../src/ui/game/PlayerOrbitHeader.tsx) | Волна 2: бордеры/тени на токенах (см. CHANGELOG) | Портрет + полосы | Компакт на узкой ширине | Сверка с ART §портрет |
| MoralCompassHUD | [MoralCompassHUD.tsx](../src/ui/game/MoralCompassHUD.tsx) | Токены бордеров (волна 2) | Компас — не крутить зря при PRM | `md` layout | Согласовать с Karma в копирайте |
| DialogueRenderer (VN) | [DialogueRenderer.tsx](../src/ui/game/DialogueRenderer.tsx) | `--game-ui-terminal-*`, holo glow | Framer-motion — уважать PRM где возможно | N/A (оверлей не 3D) | Много tailwind literal — кандидат на токены |
| DialogueRenderer (обход, noir) | тот же файл, `explorationLayout` | `--game-ui-noir-*`, портрет noir | То же | То же | Жёсткие `amber`/`zinc` классы — частично осознанный комикс-нуар; документировать vs токен |
| StoryRenderer / CyberChoiceCard | [StoryRenderer.tsx](../src/ui/game/StoryRenderer.tsx) | `--game-ui-story-dream/poem/cyan-*` | Кликабельность карточек | Переполнение на мобиле | Заблокированные выборы — читаемость |
| QuestsPanel | [QuestsPanel.tsx](../src/ui/game/QuestsPanel.tsx) | `game-panel-skin--floating` + glitch | Чекбокс forced-colors в globals | `backdrop-blur` — цена на слабых GPU | — |
| JournalPanel | [JournalPanel.tsx](../src/ui/game/JournalPanel.tsx) | `game-panel-skin--journal` | То же | То же | — |
| Inventory | [Inventory.tsx](../src/ui/game/Inventory.tsx) | `game-panel-skin--inventory` | То же | Длинные списки | — |
| PoetryBook | [PoetryBook.tsx](../src/ui/game/PoetryBook.tsx) | `game-panel-skin--poetry` | То же | То же | Якорь «авторский» слой |
| ExplorationBriefingOverlay | [ExplorationBriefingOverlay.tsx](../src/ui/game/ExplorationBriefingOverlay.tsx) | `game-panel-skin--briefing` | — | Показ в обходе | Согласовать тон с брифом локации |
| Лоадер Matrix + cyber UI | [GameClient.tsx](../src/app/GameClient.tsx) (`MiniMatrixRain`, `CyberpunkLoadingFallback`) | Отдельные inline cyan / motion | **Да:** `resolveMatrixRainTiming` слушает PRM | Слабые CPU — throttling есть | Не дублировать с полноэкранным glitch |
| ItGlitchPulseOverlay | [ItGlitchPulseOverlay.tsx](../src/ui/game/ItGlitchPulseOverlay.tsx) | Проверить на общие токены | Ослабить при PRM (бэклог) | Пульс на мобиле | Единый порог частоты с `HackingWireMinigameOverlay` |
| HackingWireMinigameOverlay | [HackingWireMinigameOverlay.tsx](../src/ui/3d/exploration/HackingWireMinigameOverlay.tsx) | Согласовать с cyan терминалом | — | Полноэкран | Не конкурировать с постом 3D одновременно |
| LevelUpCinematicOverlay | [LevelUpCinematicOverlay.tsx](../src/ui/game/LevelUpCinematicOverlay.tsx) | Glitch-стилистика | PRM | Краткость | См. CHANGELOG |
| Interaction hint / feedback | `InteractionHintOverlay`, listeners | Частично через шину UI | — | Touch HUD | [exploration-interaction-feedback.md](./exploration-interaction-feedback.md) |

**Метод оценки покрытия токенами:** для каждой строки пройти diff на предмет «заметных» hex/rgba вне `globals.css` / без `var(--game-ui-` — зафиксировать счётчик в комментарии к релизу (автоматизация опциональна).

## 2. Матрица сцен обхода × IBL × кибер-пост

Источники: [explorationIblProfiles.ts](../src/lib/explorationIblProfiles.ts), [explorationPostFxState.ts](../src/lib/explorationPostFxState.ts) (`EXPLORATION_CYBER_GRADE_SCENE_IDS`), [SCENE_CONFIG](../src/config/scenes.ts).

| `sceneId` | В `SCENE_CONFIG` | IBL preset (десктоп) | `environmentIntensity` | Кибер-грейд поста |
| --------- | ----------------- | -------------------- | ------------------------ | ----------------- |
| `volodka_room` | да | city | 0.46 | да |
| `blue_pit` | да | city | 0.46 | да |
| `office_morning` | да | city | 0.46 | да |
| `district` | да | city | 0.54 | да |
| `mvd` | да | city | 0.54 | да |
| `street_night` | да | city | 0.48 | нет |
| `street_winter` | да | city | 0.48 | нет |
| `zarema_albert_room` | да | apartment | 0.42 | нет |
| `kitchen_night` | да | apartment | 0.42 | нет |
| `volodka_corridor` | да | warehouse | 0.38 | нет |
| `kitchen_dawn`, `home_morning`, `home_evening`, `cafe_evening`, `memorial_park`, `rooftop_night`, `library`, `green_zone`, `president_hotel`, `dream`, `battle` | да | **default** warehouse | 0.36 | нет |

**Сцены из `SceneId`, не попавшие в таблицу выше:** в типах есть `server_room`, `gallery_opening`, `underground_club`, `old_library`, `abandoned_factory`, `psychologist_office`, `train_station` и др. — при появлении в `SCENE_CONFIG` повторить строку матрицы (IBL + кибер-флаг).

**Риски мобилы:** при `visualLite` или `introCutsceneActive` IBL отключается (`preset: null`) — чеклист [exploration-postfx-art-checklist.md](./exploration-postfx-art-checklist.md); Bloom/DOF/зерно режутся в `ExplorationPostFX` / `useMobileVisualPerf`.

## 3. Метрики «ощущения качества» (веб, честно)

| Метрика | Как снимать | Ориентир |
| ------- | ----------- | -------- |
| FPS обхода | Diagnostics HUD / ручной профайлер на hero (`volodka_room`, `district`) | Стабильность важнее пикового; зафиксировать устройство |
| ПостFX чеклист | Ручной проход по [exploration-postfx-art-checklist.md](./exploration-postfx-art-checklist.md) | Все пункты либо ok, либо в бэклог с `sceneId` |
| Покрытие UI-токенами | Подсчёт «явных» цветов в ключевых компонентах (см. §1) | Рост % по релизам; не блокер если осознанный исключение в ART |
| Lighthouse / a11y | Spot на странице с игрой (оверлеи открыты/закрыты) | Наблюдение; не эквивалент консольному cert |
| Размер клиента | `check:next-static-budget`, CI | Уже в pipeline |

## 4. Приоритизированный бэклог (P0 / P1 / P2)

### P0 — целостность и читаемость

1. **Один акцент «шума»:** не открывать одновременно полноэкранный glitch, hacking overlay и максимальный Bloom без сценарной причины — зафиксировать правило в `GameOrchestrator` / шине (см. [visual-reference-mapping.md](./visual-reference-mapping.md)).
2. **PRM:** убедиться, что `MiniMatrixRain` и пульс `ItGlitchPulseOverlay` не игнорируют системные настройки (дождь уже учитывает — см. `GameClient.tsx`; доп. оверлеи — проверить).
3. **Noir vs cyber скачок:** при закрытии обходного диалога и возврате в VN не ломается ли визуальный ритм — ручной сценарный проход; при необходимости пункт в нарративе ([narrative-style-bible.md](./narrative-style-bible.md) §5).

### P1 — выравнивание токенов и ART

4. **DialogueRenderer:** вынести повторяющиеся noir/cyber цвета в `--game-ui-*` там, где нет потери намеренного «бумажного» контраста; оставить комментарий ART там, где literal осознан.
5. **GameClient лоадер:** сопоставить hardcoded cyan с `--game-ui-rgb-cyan*` для единства с панелями.
6. **Новые сцены с неоном:** при добавлении `sceneId` с плотными экранами — включить в `EXPLORATION_CYBER_GRADE_SCENE_IDS` по чеклисту поста.

### P2 — полировка и инструменты

7. **Линт/скрипт:** опциональный grep-отчёт `rgba\(|#[0-9a-fA-f]{3,8}` в `src/ui/game` без `var(--game-ui` — как не-блокирующий CI шаг.
8. **Документация сцен:** для `memorial_park`, `library` и др. с default IBL — если ART требует `park`/`lobby`, завести явную ветку в `getExplorationIblProfile` + строку здесь.
9. **E2E визуальный smoke:** по желанию — скриншотные тесты 1–2 оверлеев (дорого, не P0).

## 5. Метод аудита (кратко)

1. Один полный проход: старт → лоадер → VN → обход hero → NPC диалог (noir) → журнал/квесты/инвентарь/стихи.
2. Для каждой строки §2: 30 с обхода на десктопе и на эмуляции узкой ширины — записать FPS и «перегруз» поста.
3. Зафиксировать находки в issue/PR с ссылкой на строку этой матрицы.

## Связанные документы

- [visual-reference-mapping.md](./visual-reference-mapping.md)  
- [ui-skin-tokens.md](./ui-skin-tokens.md)  
- [exploration-postfx-art-checklist.md](./exploration-postfx-art-checklist.md)  
- [volodka-incremental-aaa-roadmap.md](./volodka-incremental-aaa-roadmap.md)  
