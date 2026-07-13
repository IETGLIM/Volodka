import { describe, expect, it } from 'vitest';
import { QUESTS_ACT1 } from './act1';

describe('first_reading quest (Act I title poem)', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'first_reading');

  it('is defined in Act I quest pack', () => {
    expect(quest).toBeDefined();
  });

  it('requires interacted_desk flag (examine desk) to find the poem', () => {
    expect(quest!.objectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'find_title_poem', type: 'flag_set', target: 'interacted_desk' }),
      ]),
    );
  });

  it('requires poem_2 collection (from bookshelf) to read the poem', () => {
    expect(quest!.objectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'read_title_poem', type: 'poem_collected', target: 'poem_2' }),
      ]),
    );
  });

  it('does NOT auto-complete on wake-up (no read_poem_2 flag objective)', () => {
    // The old objective used flag_set target 'read_poem_2' which was auto-set
    // on wake-up. The new objectives require actual player interaction.
    const hasOldAutoFlag = quest!.objectives.some(
      (o) => o.type === 'flag_set' && o.target === 'read_poem_2',
    );
    expect(hasOldAutoFlag).toBe(false);
  });

  it('links to explore_mode hub after wake routing', () => {
    expect(quest!.linkedStoryNodeId).toBe('explore_mode');
  });
});
