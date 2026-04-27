# Фаза D — портреты NPC (3D vs 2D)

## Инвентаризация

| Слой | Что есть | Примечание |
|------|-----------|------------|
| **3D** | `NPC_DEFINITIONS` → `modelPath`, GLB в `public/models-external/` | Персонаж в обходе; не дублируется как «фото» в UI. |
| **Диалог (2D)** | `DialogueRenderer` + `HolographicPortrait` | Один блок шапки: портрет (растр **или** голограмма) + имя + роль. |
| **3D-оверлеи** | Процедурные/канвас-текстуры (`MatrixRainScreenMesh`, комнаты) | Отдельных спрайтов лиц NPC в 3D-слое нет. |

## Решение (канон)

1. По умолчанию портрет диалога = **голограмма**: монограмма по первой букве/цифре имени (`npcDialogueInitial`) + градиент/неон по `npcId` (`HOLO_BY_NPC_ID` в `src/lib/npcDialoguePresentation.ts`), иначе нейтральный fallback.
2. Для ключевых NPC при появлении готового ассета — **`dialoguePortraitUrl`** в `NPCDefinition`: путь от корня сайта под **`public/`** (например `/images/npc/zarema.png`). Файл проверяется в `contentValidator.test.ts` (`NPC_PORTRAIT_FILE_MISSING`).
3. **`dialogueRole`** — короткая строка под именем; для любого сюжетного выбора с **`dialogueNpcId`** поле **обязательно** (тот же валидатор).

Подробнее и правила расширения: `docs/adp-inventory-karma-portraits.md` (раздел «Портреты NPC»).

## Проверки

- `dialogueNpcId` в `STORY_NODES` → существующий ключ `NPC_DEFINITIONS`, у записи есть объект **`dialogueTree`**, непустое **`name`**, непустое **`dialogueRole`** (`src/validation/contentValidator.test.ts`).
- Рантайм: `DialogueEngine.startDialogue` вызывается из `DialogueRenderer` при открытии; сюжетный вход — `useStoryChoiceHandler` + `openDialogueFromStory` в `useDialogueFlow` (там же проверка наличия `dialogueTree`).

## Связанные файлы

- `src/data/npcDefinitions.ts`, `src/data/rpgTypes.ts`
- `src/lib/npcDialoguePresentation.ts`
- `src/hooks/useDialogueFlow.ts`, `src/ui/game/DialogueRenderer.tsx`, `src/ui/game/GameOrchestrator.tsx`
