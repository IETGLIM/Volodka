import { rememberCoreQuestCompleted, rememberCoreQuestStarted } from '@/game/memory/MemoryEngine';

import type { Quest } from './types';
import { useQuestStore } from './questStore';

/** Старт квеста из геймплея + отладочный лог (Step 9). */
export function startQuestWithLog(quest: Quest): void {
  useQuestStore.getState().startQuest(quest);
  rememberCoreQuestStarted(quest.id, quest.title, quest.description);
  console.log(`[Quest] Started: ${quest.id}`);
}

/**
 * After an interaction runs, advance any active `interact` objectives that target this interaction id.
 */
export function handleInteractionForQuests(interactionId: string): void {
  const questIds = Object.keys(useQuestStore.getState().quests);

  for (const questId of questIds) {
    const quest = useQuestStore.getState().quests[questId];
    if (!quest || quest.status !== 'active') continue;

    for (const obj of quest.objectives) {
      if (obj.completed || obj.type !== 'interact') continue;
      if (obj.targetId !== interactionId) continue;

      const required = obj.requiredCount ?? 1;
      const current = obj.currentCount ?? 0;
      const { completeObjective, incrementObjectiveCount } = useQuestStore.getState();

      if (current + 1 >= required) {
        completeObjective(quest.id, obj.id);
        console.log(`[Quest] Objective completed: ${obj.id}`);
        const after = useQuestStore.getState().quests[quest.id];
        if (after?.status === 'completed') {
          rememberCoreQuestCompleted(after.id, after.title, after.description, 'neutral');
          console.log(`[Quest] Completed: ${quest.id}`);
        }
      } else {
        incrementObjectiveCount(quest.id, obj.id);
        console.log(`[Quest] Objective progress: ${quest.id}/${obj.id} ${current + 1}/${required}`);
      }
    }
  }
}
