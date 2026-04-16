# Архив для экспертного разбора кода

## Как собрать

Из корня репозитория:

```bash
pwsh -File scripts/export-expert-review-archive.ps1
```

или:

```bash
npm run expert:archive
```

В каталоге `archives/` появится файл `expert-review-src-<дата>_<время>.zip`: полный **`src/`** плюс корневые **`package.json`**, **`tsconfig.json`**, **`next.config.ts`**, **`vitest.config.ts`**, при наличии — **`worklog.md`** и др.

Содержимое **без** `node_modules`, `.next`, секретов.

## С чего начать ревью (ориентир)

| Область | Пути |
|--------|------|
| Состояние игры | `src/store/gameStore.ts` |
| Оркестрация UI | `src/components/game/GameOrchestrator.tsx`, `GameOrchestratorSubcomponents.tsx` |
| Хуки сессии / сюжет / диалог | `src/hooks/useGameSessionFlow.ts`, `useActionHandler.ts`, `useDialogProcessor.ts`, `useGameScene.ts`, `useGameRuntime.ts`, `useStoryChoiceHandler.ts`, `useDialogueFlow.ts` |
| Данные сюжета и слайс | `src/data/storyNodes.ts`, `verticalSliceStoryNodes.ts`, `npcDefinitions.ts`, `quests.ts`, `types.ts` |
| Движок | `src/engine/` (`CoreLoop`, `SceneManager`, `DialogueEngine`, …) |
| API / AI | `src/app/api/`, `src/lib/ai-*.ts`, `src/services/` |
| Валидация контента | `src/validation/contentValidator.test.ts` |

Полный список модулей — внутри архива в дереве `src/`.
