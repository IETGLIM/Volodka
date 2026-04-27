# ADP: инвентарь, карма, портреты NPC (слой RPG / UI)

Краткая запись решений для поддержки: **где источник правды**, что не дублировать, куда смотреть при расширении.

## Инвентарь

| Вопрос | Решение |
|--------|---------|
| Каталог предметов | `src/data/items.ts` — единый реестр `itemId`, описания, награды с `karma` и т.д. |
| Согласованность с миром | `contentValidator.test.ts` — `itemId` у `interactiveObjects` / `WORLD_ITEMS`; квестовые награды не ссылаются на «левые» id. |
| UI | `Inventory.tsx` + кнопка в `HUD.tsx`: панель скрыта, пока рюкзак пуст; клавиша I открывает панель независимо от видимости кнопки. |
| Мутации (архитектура) | `useInventoryActions` — фасад над `useGameStore`; будущий перенос на `inventoryStore` не меняет контракт UI. |

**Правило:** новый предмет = запись в `items.ts` + все ссылки в данных (квесты, сцены, валидатор) в одном PR.

## Карма

| Вопрос | Решение |
|--------|---------|
| Источник правды | Одно число `playerState.karma` (0–100), `playerStore` / `gameStore`; кламп при десериализации. |
| UI | `PlayerOrbitHeader` (левый верх): карма как **мана** — линейный ресурс 0–100, подпись `mana // karma`. `MoralCompassHUD` (низ слева, с md): стрелка-«компас» + вспышки при заметном изменении; на узком экране компас скрыт, вспышки остаются. |
| Семантика vs фракции | Карма — личная мораль; репутация фракций (`factionStore`) — ортогональный слой. Не смешивать в копирайте панелей. |
| Пороги и ветки | Поддержка `ChoiceCondition` / `minKarma` в данных заложена; ветвление сюжета по карме в данных минимально — см. `docs/karma-scale.md`. |
| Изменения из геймплея | `StoryEffect`, диалоги, `reward.karma` в квестах/предметах/ачивках; сводка источников — `docs/karma-scale.md`. |

**Правило:** не читать карму из «параллельных» полей; новый источник ±кармы — одна трасса в стор + строка в `karma-scale.md` при нетривиальной логике.

## Портреты NPC (шапка диалога)

| Вопрос | Решение |
|--------|---------|
| Данные | `NPCDefinition` в `src/data/rpgTypes.ts`: `dialogueRole` (короткая роль), `dialoguePortraitUrl` — опционально, путь под `public/` (например `/images/npc/...png`). |
| Отображение | `getNpcDialoguePresentation` (`src/lib/npcDialoguePresentation.ts`) → `DialogueRenderer`: растровый портрет **или** «голограмма» (инициал + градиент по `npcId` из `HOLO_BY_NPC_ID`, иначе fallback). |
| Контент-валидация | Для веток с `dialogueNpcId` в данных ожидается заданный `dialogueRole` (см. `contentValidator` / комментарии в `rpgTypes`). |

**Правило:** новый спикер с ветками VN — завести акцент в `HOLO_BY_NPC_ID` *или* отдать растровый URL; не плодить вторую систему портретов вне `npcDialoguePresentation` + `DialogueRenderer`.

## Связанные файлы (быстрый поиск)

- Карма: `MoralCompassHUD.tsx`, `StatsEngine.ts`, `karmaScale.test.ts`, `docs/karma-scale.md`
- Инвентарь: `items.ts`, `Inventory.tsx`, `HUD.tsx`, `useInventoryActions.ts`
- Портреты: `npcDefinitions.ts` (данные), `npcDialoguePresentation.ts`, `DialogueRenderer.tsx`
