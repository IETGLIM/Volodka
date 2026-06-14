import { QUEST_DEFINITIONS } from '@/data/quests';
import { getPoemById } from '@/data/gameDataLoader';
import { showPoemToast, showQuestToast } from '@/components/game/NotificationToasts';
import { formatQuestCompletionRewards } from '@/shared/utils/questRewards';

/** Visible HUD feedback after the first_reading celebration flow closes. */
export function emitFirstReadingCompletionFeedback(): void {
  const questDef = QUEST_DEFINITIONS.find((d) => d.id === 'first_reading');
  if (questDef) {
    showQuestToast(
      `«${questDef.title}» выполнено — ${formatQuestCompletionRewards(questDef)}`,
    );
  }

  const poem = getPoemById('poem_2');
  if (poem) {
    showPoemToast(`Стих в сборнике: «${poem.title}»`);
  }
}
