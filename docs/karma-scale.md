# Шкала кармы (фаза C) — канон, записи, UI, фракции

## Источник истины

| Поле | Диапазон | Где живёт |
|------|-----------|-----------|
| **`playerState.karma`** | 0–100 | `usePlayerStore` / фасад `useGameStore`; начальное значение в `INITIAL_STATE` (`gameStore.ts`), `INITIAL_PLAYER` (`playerStore.ts`), `constants.ts` |

Все визуалы и условия читают **одно** число из стора. Два HUD-элемента ранее дублировали отображение одного и того же значения.

## UI (после выравнивания)

| Компонент | Роль |
|-----------|------|
| **`MoralCompassHUD`** | Основной индикатор: шкала, стрелка, число, краткая вспышка при заметном изменении кармы (`GameOrchestrator`) |
| **`HUD` (верхняя панель)** | Карма **не** дублируется отдельной полосой; подсказка указывает на компас внизу слева |

## Кто меняет `karma` (запись в стор)

| Источник | Механизм | Файлы / точки входа |
|----------|-----------|---------------------|
| **Сюжетные узлы** | `StoryEffect.karma` → `addStat('karma', …)` | `useStoryChoiceHandler`, `useStoryEngine`; данные: `storyNodes.ts`, `storyNodesExpansion.ts`, `verticalSliceStoryNodes.ts` |
| **Диалоги NPC** | `effect.karma` в узлах дерева | `DialogueEngine` → `addStat`; данные: `npcDefinitions.ts` |
| **Квесты** | `reward.karma` / `createReward` | `gameStore` при завершении шагов; `quests.ts` |
| **Предметы** | награда с `karma` | `items.ts` |
| **Достижения** | `reward.karma`, условия `type: 'karma'` | `achievements.ts` |
| **Стихи (мини-игра)** | ключевые слова → статы | `PoemMechanics.ts` |
| **AI / внешние подсказки** | поле в промпте (не пишет стор напрямую без клиента) | `ai-dialogue`, `ai-narrative` routes |
| **ConsequencesSystem** | `ConsequenceEffect.statChange.karma` | `applyConsequenceEffects` — в **текущих** `registerDefaultConsequences` **нет** изменений кармы (только тесты/кастомные регистрации могут добавить) |

Поиск по репозиторию (поддержка в актуальном виде):

```bash
rg "karma" src/data src/engine src/hooks src/state --glob "*.ts" --glob "*.tsx"
```

## Условия и ветки (пороги кармы)

| API | Назначение | Использование в данных |
|-----|------------|-------------------------|
| **`ChoiceCondition`** — `stat: 'karma'`, `min` / `max` | Сюжетные выборы (`StoryChoice.condition`) | **Пока ни один узел в `storyNodes*` не задаёт `stat: 'karma'`** — при необходимости ветвления по карме используйте этот путь (единый с `ConditionMatcher.matchChoiceCondition`) |
| **`DialogueCondition`** — `minKarma` / `maxKarma` | Условия линий в `npcDefinitions` / exploration | **В данных не встречается**; поддерживается в `matchDialogueCondition` для будущих диалогов |
| **Достижения** | `minValue` / `maxValue` для `type: 'karma'` | `achievements.ts` — **используется** |
| **`StatsEngine.getDerivedEffects`** | Подсказка при `karma > 70` | Текст: «Хорошая карма открывает путь к примирению»; ранее в `availableActions` добавлялся токен `redemption-path` **без потребителей** — убран |

Итог: **веток сюжета, жёстко завязанных на порог кармы через данные, сейчас нет**; высокая карма влияет на подсказку движка и на ачивки. Если появятся ветки — заводить через `ChoiceCondition` + `stat: 'karma'`.

## Фракции vs карма

| Система | Смысл | Диапазон / стор |
|---------|--------|-----------------|
| **`playerState.karma`** | Личная моральная шкала героя («как я поступаю») | 0–100, один глобальный счётчик |
| **Репутация фракций** (`factions.ts`, `factionStore`) | Отношение групп к герою («как меня видят по служебке / бару / снам») | −100…100 на фракцию, отдельно от кармы |

Не смешивать в копирайте панелей: **карма ≠ репутация IT**; в голове игрока может быть «одна мораль», но в коде это **два ортогональных слоя** (личное vs групповое).

## Сейв / загрузка

- Снимок включает `playerState` целиком (`persistedGameSnapshot`, `SAVE_KEY` в `gameStore`).
- При десериализации `playerStore.deserializePlayerState` карма **клампится** в 0–100.
- Регрессия: см. `src/state/karmaScale.test.ts`.
