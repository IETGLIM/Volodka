import { describe, expect, it } from 'vitest';
import { GOLDEN_PATH_QUEST_SPINE, GOLDEN_PATH_STORY_SPINE, ACT1_SOLNYSH_QUEST_SPINE } from '@/data/goldenPath';
import { QUESTS_ACT1 } from './act1';
import { QUESTS_ACT2 } from './act2';
import { QUESTS_ACT3 } from './act3';
import { QUESTS_ACT4 } from './act4';
import { QUESTS_ACT5 } from './act5';
import { QUESTS_ACT6 } from './act6';
import { QUESTS_ACT7 } from './act7';
import { QUESTS_SOLNYSH } from './solnyshQuests';

const ACT_QUEST_PACKS = [
  { act: 1, quests: [...QUESTS_ACT1, ...QUESTS_SOLNYSH] },
  { act: 2, quests: QUESTS_ACT2 },
  { act: 3, quests: QUESTS_ACT3 },
  { act: 4, quests: QUESTS_ACT4 },
  { act: 5, quests: QUESTS_ACT5 },
  { act: 6, quests: QUESTS_ACT6 },
  { act: 7, quests: QUESTS_ACT7 },
] as const;

describe('golden path quest spine (acts 2–7)', () => {
  it('defines every GOLDEN_PATH_QUEST_SPINE id in quest packs', () => {
    const allIds = new Set(ACT_QUEST_PACKS.flatMap((pack) => pack.quests.map((q) => q.id)));
    for (const questId of GOLDEN_PATH_QUEST_SPINE) {
      expect(allIds.has(questId), `missing quest pack entry for ${questId}`).toBe(true);
    }
  });

  it('golden-path quests reference story nodes on the canonical spine', () => {
    const spineSet = new Set(GOLDEN_PATH_STORY_SPINE);
    const sideQuestIds = new Set<string>(ACT1_SOLNYSH_QUEST_SPINE);
    const questById = new Map(
      ACT_QUEST_PACKS.flatMap((pack) => pack.quests).map((quest) => [quest.id, quest]),
    );

    for (const questId of GOLDEN_PATH_QUEST_SPINE) {
      if (sideQuestIds.has(questId)) continue;
      const quest = questById.get(questId);
      if (!quest) continue;
      const linked = [quest.linkedStoryNodeId, ...(quest.linkedStoryNodeIds ?? [])].filter(
        (id): id is string => Boolean(id),
      );
      if (linked.length === 0) continue;
      expect(
        linked.some((id) => spineSet.has(id)),
        `quest ${questId} should reference a golden-path node`,
      ).toBe(true);
    }
  });
});
