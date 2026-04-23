/**
 * Игровые типы: единый источник — `src/data/types.ts`.
 * Раньше здесь дублировался большой блок; расходились поля (`ChoiceLogEntry`, `QuestObjective.mapHint`, …).
 * Импорты `import type { … } from '@/shared/types/game'` сохраняются через реэкспорт.
 */
export * from '@/data/types';
