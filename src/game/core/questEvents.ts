import { useGameStore } from '@/state/gameStore';
import { QUEST_DEFINITIONS, isObjectiveSatisfied } from '@/data/quests';
import { FACTIONS, type FactionId } from '@/data/factions';
import type { QuestEvent, QuestEventType } from './questTypes';

export type { QuestEvent, QuestEventType } from './questTypes';

/** Карта: тип события → (questId, objectiveId). Экспорт для тестов целостности `npc_talked`. */
export const EVENT_OBJECTIVE_MAP: Partial<
  Record<
    QuestEventType,
    Array<{
      questId: string;
      objectiveId: string;
      condition?: (data: Record<string, unknown>) => boolean;
    }>
  >
> = {
  poem_collected: [
    { questId: 'main_goal', objectiveId: 'write_poems' },
    { questId: 'poetry_collection', objectiveId: 'write_poems' },
  ],
  poem_written: [
    { questId: 'first_words', objectiveId: 'write_poem' },
    { questId: 'night_owl', objectiveId: 'write_nights' },
  ],
  npc_talked: [
    { questId: 'maria_connection', objectiveId: 'talk_maria', condition: (d) => d.npcId === 'cafe_college_girl' },
    { questId: 'maria_connection', objectiveId: 'exchange_contacts', condition: (d) => d.npcId === 'cafe_college_girl' },
    { questId: 'lost_memories', objectiveId: 'meet_stranger', condition: (d) => d.npcId === 'dream_quester' },
    { questId: 'lost_memories', objectiveId: 'speak_to_lillian', condition: (d) => d.npcId === 'dream_lillian' },
    { questId: 'star_connection', objectiveId: 'meet_astra', condition: (d) => d.npcId === 'dream_galaxy' },
    { questId: 'incident_scroll_4729', objectiveId: 'invoke_techlead', condition: (d) => d.npcId === 'office_alexander' },
    { questId: 'incident_scroll_4729', objectiveId: 'seal_with_colleague', condition: (d) => d.npcId === 'office_colleague' },
    { questId: 'vault_backup_trial', objectiveId: 'listen_oracle_dmitry', condition: (d) => d.npcId === 'office_dmitry' },
    { questId: 'dependency_sigil', objectiveId: 'consult_crypt_warden', condition: (d) => d.npcId === 'office_artyom' },
  ],
  location_visited: [
    { questId: 'first_reading', objectiveId: 'go_to_cafe', condition: (d) => d.locationId === 'cafe_evening' },
    { questId: 'coffee_affair', objectiveId: 'visit_cafe', condition: (d) => d.locationId === 'cafe_evening' },
    { questId: 'lost_memories', objectiveId: 'reach_lake', condition: (d) => d.locationId === 'dream' },
  ],
};

/** Скан активных квестов и `completeQuest` + репутация фракции (без дублирования наград из стора). */
export function runQuestCompletionScan(): void {
  const { activeQuestIds, questProgress, completedQuestIds, completeQuest, updateFactionReputation } =
    useGameStore.getState();

  for (const id of activeQuestIds) {
    if (completedQuestIds.includes(id)) continue;
    const def = QUEST_DEFINITIONS[id];
    if (!def) continue;
    const prog = questProgress[id] || {};
    const allDone = def.objectives.every((obj) => {
      const cur = prog[obj.id] ?? obj.currentValue ?? 0;
      return isObjectiveSatisfied(obj, cur);
    });
    if (!allDone) continue;

    completeQuest(id);
    for (const [factionId, faction] of Object.entries(FACTIONS)) {
      if (faction.quests.includes(id)) {
        updateFactionReputation(factionId as FactionId, 10);
        break;
      }
    }
  }
}

export function dispatchQuestEvent(event: QuestEvent): void {
  const { activeQuestIds, incrementQuestObjective } = useGameStore.getState();
  const mappings = EVENT_OBJECTIVE_MAP[event.type];
  if (!mappings) return;

  mappings.forEach(({ questId, objectiveId, condition }) => {
    if (!activeQuestIds.includes(questId)) return;
    if (condition && !condition(event.data)) return;
    incrementQuestObjective(questId, objectiveId);
  });

  runQuestCompletionScan();
}
