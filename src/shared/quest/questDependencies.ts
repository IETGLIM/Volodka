import type { QuestState } from '@/shared/types/game';
import type { QuestDefinition } from '@/shared/types/game';
import { resolveQuestDependencyStatus } from './questFailureBypass';

export function areQuestDependenciesMet(
  questId: string,
  quests: readonly QuestState[],
  getDefinition: (id: string) => QuestDefinition | undefined,
): { met: boolean; missing: string[] } {
  const definition = getDefinition(questId);
  if (!definition?.requiresQuests || definition.requiresQuests.length === 0) {
    return { met: true, missing: [] };
  }

  const missing: string[] = [];

  for (const reqId of definition.requiresQuests) {
    const reqQuest = quests.find((q) => q.questId === reqId);
    // A failed prerequisite is treated as "bypassed" (met) so a failed
    // canRetry:false critical-path quest does not permanently lock downstream
    // quests. The failure is still recorded in flags for narrative consequences.
    const status = resolveQuestDependencyStatus(reqQuest);
    if (status === 'unmet') {
      const reqDef = getDefinition(reqId);
      missing.push(reqDef?.title ?? reqId);
    }
  }

  return { met: missing.length === 0, missing };
}
