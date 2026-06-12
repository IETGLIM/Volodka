import { getQuestDefinitions } from '@/data/gameDataLoader';
import { NPC_QUEST_BARKS } from '@/data/npcQuestBarks';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { QuestDefinition } from '@/shared/types/game';

function firstIncompleteObjective(
  def: QuestDefinition,
  completed: Record<string, boolean>,
): (typeof def.objectives)[number] | undefined {
  return def.objectives.find((objective) => !completed[objective.id]);
}

/** Proximity bark hint when the player has an active side quest involving this NPC. */
export function resolveNpcQuestBark(npcId: string): string | null {
  const quests = getGameSnapshot().quests;
  const definitions = getQuestDefinitions();

  for (const entry of NPC_QUEST_BARKS[npcId] ?? []) {
    const questState = quests.find((q) => q.questId === entry.questId && q.status === 'active');
    if (!questState) continue;

    const definition = definitions.find((d) => d.id === entry.questId);
    if (!definition || definition.questType !== 'side') continue;

    if (entry.objectiveId && questState.objectives[entry.objectiveId]) continue;

    return entry.text;
  }

  for (const questState of quests) {
    if (questState.status !== 'active') continue;

    const definition = definitions.find((d) => d.id === questState.questId);
    if (!definition || definition.questType !== 'side') continue;

    const incomplete = firstIncompleteObjective(definition, questState.objectives);
    if (!incomplete) continue;

    if (incomplete.type === 'npc_talked' && incomplete.target === npcId) {
      return incomplete.poemPowerHint ?? incomplete.description;
    }

    if (
      definition.questGiverNpcId === npcId
      && definition.hint
      && incomplete.id === definition.objectives[0]?.id
    ) {
      return definition.hint;
    }
  }

  return null;
}
