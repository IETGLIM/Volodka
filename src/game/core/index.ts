export { initGameCore } from '@/game/core/gameCoreBootstrap';
export { dispatchQuestEvent, runQuestCompletionScan, EVENT_OBJECTIVE_MAP } from '@/game/core/questEvents';
export type { QuestEvent, QuestEventType } from '@/game/core/questTypes';
export { EXPLORATION_QUESTS_KARMA_HINT_LINE_RU } from '@/game/core/explorationHints';
export { explorationInteractionRegistry, registerBaseInteractions } from '@/game/core/registerBaseInteractions';
