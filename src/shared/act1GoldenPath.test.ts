import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT1 } from '@/data/story/act1';

describe('Act I golden path markers', () => {
  it('marks cafe spine nodes with single goldenPath choices', () => {
    const cases: Array<{ nodeId: string; next: string }> = [
      { nodeId: 'go_to_cafe', next: 'street_bench' },
      { nodeId: 'maria_curious', next: 'maria_chip_trust' },
      { nodeId: 'cafe_barista', next: 'office_alexander' },
    ];

    for (const { nodeId, next } of cases) {
      const node = STORY_NODES_ACT1[nodeId];
      const golden = node.choices.filter((c) => c.goldenPath === true);
      expect(golden, nodeId).toHaveLength(1);
      expect(golden[0]?.next, nodeId).toBe(next);
    }
  });

  it('marks colleague_persuasion_line golden branch to balcony_thought', () => {
    const node = STORY_NODES_ACT1.colleague_persuasion_line;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('balcony_thought');
  });

  it('corridor_explore_mode golden branch leads to kitchen_table', () => {
    const node = STORY_NODES_ACT1.corridor_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('kitchen_table');
  });

  it('marks balcony_thought golden branch to friday_arrives', () => {
    const node = STORY_NODES_ACT1.balcony_thought;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('friday_arrives');
  });

  it('marks friday_arrives golden branch to act2_transition', () => {
    const node = STORY_NODES_ACT1.friday_arrives;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_transition');
  });
});
