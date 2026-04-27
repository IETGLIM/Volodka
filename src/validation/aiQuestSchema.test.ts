import { describe, expect, it } from 'vitest';
import { parseAIQuestPayload, extendedQuestFromAISchema } from './aiQuestSchema';

const minimalValid = {
  id: 'ai_side_coffee_001',
  title: 'Кофе для мысли',
  description: 'Выпить кофе и не сгореть на смене.',
  type: 'side' as const,
  status: 'active' as const,
  objectives: [
    {
      id: 'order',
      text: 'Заказать американо',
      completed: false,
      currentValue: 0,
    },
  ],
  reward: { mood: 2, skillPoints: 1 },
};

describe('parseAIQuestPayload', () => {
  it('accepts a minimal valid AI quest', () => {
    const r = parseAIQuestPayload(minimalValid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.quest.id).toBe('ai_side_coffee_001');
      expect(r.quest.objectives[0].completed).toBe(false);
      expect(r.quest.reward.itemRewards).toEqual([]);
    }
  });

  it('rejects reserved built-in quest id', () => {
    const r = parseAIQuestPayload({ ...minimalValid, id: 'main_goal' });
    expect(r.success).toBe(false);
  });

  it('rejects unknown linkedStoryNodeId, startNode, and completeNode', () => {
    const badLink = parseAIQuestPayload({
      ...minimalValid,
      objectives: [{ ...minimalValid.objectives[0], linkedStoryNodeId: 'not_a_real_story_node_xyz' }],
    });
    expect(badLink.success).toBe(false);

    const badStart = parseAIQuestPayload({ ...minimalValid, startNode: 'not_a_node' });
    expect(badStart.success).toBe(false);

    const badEnd = parseAIQuestPayload({ ...minimalValid, completeNode: 'also_missing' });
    expect(badEnd.success).toBe(false);
  });

  it('rejects invalid enum and missing objectives', () => {
    const badType = parseAIQuestPayload({ ...minimalValid, type: 'boss' });
    expect(badType.success).toBe(false);

    const noObjs = parseAIQuestPayload({ ...minimalValid, objectives: [] });
    expect(noObjs.success).toBe(false);
  });

  it('allows null discoveryCondition', () => {
    const r = extendedQuestFromAISchema.safeParse({
      ...minimalValid,
      discoveryCondition: null,
    });
    expect(r.success).toBe(true);
  });
});
