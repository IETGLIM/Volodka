/** Contextual first_reading quest hint — shared by StoryGuidanceHUD + EmergencyHelp. */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';

/**
 * Returns a short Russian cue for the early-game desk/monitor/shelf loop,
 * or null when the quest is inactive / already past those steps.
 */
export function getFirstReadingHint(): string | null {
  try {
    const snap = getGameSnapshot();
    if (snap.playerState.progression.currentAct !== 1) return null;
    const quest = snap.quests.find(
      (q) => q.questId === 'first_reading' && q.status === 'active',
    );
    if (!quest) return null;

    const deskDone = snap.playerState.flags['interacted_desk'] === true;
    if (!deskDone) return 'Подойди к рабочему столу и нажми [E]';

    const hasPoem2 = snap.collectedPoems.includes('poem_2');
    const monitorRead = snap.playerState.flags['terminal_poem_read'] === true;
    if (!monitorRead && !hasPoem2) {
      return 'Активируй монитор на столе [E] — стих мерцает на экране';
    }
    if (!hasPoem2) {
      return 'Стихотворение можно найти на книжной полке слева от стола';
    }
    return null;
  } catch {
    return null;
  }
}
