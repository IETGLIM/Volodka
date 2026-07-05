import { describe, expect, it } from 'vitest';
import { QUESTS_ACT1 } from './act1';

describe('first_reading quest (Act I title poem)', () => {
  const quest = QUESTS_ACT1.find((q) => q.id === 'first_reading');

  it('is defined in Act I quest pack', () => {
    expect(quest).toBeDefined();
  });

  it('tracks poem_2 title poem and read_poem_2 flag for wake-up retroactive sync', () => {
    expect(quest!.objectives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'poem_collected', target: 'poem_2' }),
        expect.objectContaining({ type: 'flag_set', target: 'read_poem_2' }),
      ]),
    );
  });

  it('links to explore_mode hub after wake routing', () => {
    expect(quest!.linkedStoryNodeId).toBe('explore_mode');
  });
});
