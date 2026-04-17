import { describe, expect, it } from 'vitest';
import { EVENT_OBJECTIVE_MAP } from '@/hooks/useQuestProgress';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { QUEST_DEFINITIONS } from '@/data/quests';

/** Должны совпадать с условиями `npc_talked` в `EVENT_OBJECTIVE_MAP`. */
const NPC_IDS_USED_IN_NPC_TALKED_QUESTS = [
  'cafe_college_girl',
  'dream_quester',
  'dream_lillian',
  'dream_galaxy',
] as const;

describe('Quest events ↔ NPC ids', () => {
  it('every npc_talked mapping references an existing quest and objective', () => {
    const rows = EVENT_OBJECTIVE_MAP.npc_talked ?? [];
    expect(rows.length).toBeGreaterThan(0);
    for (const { questId, objectiveId } of rows) {
      const q = QUEST_DEFINITIONS[questId];
      expect(q, `Unknown questId: ${questId}`).toBeDefined();
      expect(q!.objectives.some((o) => o.id === objectiveId), `${questId} missing objective ${objectiveId}`).toBe(true);
    }
  });

  it('NPC ids used in npc_talked conditions exist in NPC_DEFINITIONS', () => {
    for (const id of NPC_IDS_USED_IN_NPC_TALKED_QUESTS) {
      expect(NPC_DEFINITIONS[id], `Missing NPC for quest mapping: ${id}`).toBeDefined();
    }
  });

  it('each npc_talked condition only matches defined npc ids', () => {
    const rows = EVENT_OBJECTIVE_MAP.npc_talked ?? [];
    for (const { condition } of rows) {
      if (!condition) continue;
      for (const id of Object.keys(NPC_DEFINITIONS)) {
        if (condition({ npcId: id })) {
          expect(NPC_DEFINITIONS[id], `Matched unknown npcId: ${id}`).toBeDefined();
        }
      }
    }
  });
});
