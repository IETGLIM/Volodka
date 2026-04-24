import { EXPLORATION_QUESTS_KARMA_HINT_LINE_RU } from '@/game/core/explorationHints';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';

const EXPLORATION_FIRST_DIALOGUE_QUEST_KARMA_FLAG = 'exploration_first_dialogue_quest_karma_hint_v1';

export function startExplorationDialogueHintService(): () => void {
  let prevGameMode = useGameStore.getState().gameMode;
  const unsub = useGameStore.subscribe((state) => {
    const gm = state.gameMode;
    if (gm === 'dialogue' && prevGameMode === 'exploration') {
      if (!state.hasFlag(EXPLORATION_FIRST_DIALOGUE_QUEST_KARMA_FLAG)) {
        state.setFlag(EXPLORATION_FIRST_DIALOGUE_QUEST_KARMA_FLAG);
        eventBus.emit('ui:exploration_message', { text: EXPLORATION_QUESTS_KARMA_HINT_LINE_RU });
      }
    }
    prevGameMode = gm;
  });
  return unsub;
}
