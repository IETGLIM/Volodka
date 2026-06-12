import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT1 } from '@/data/story/act1';

describe('Act I golden path markers', () => {
  it('marks cafe spine nodes with single goldenPath choices', () => {
    const cases: Array<{ nodeId: string; next: string }> = [
      { nodeId: 'go_to_cafe', next: 'street_bench' },
      { nodeId: 'maria_curious', next: 'cafe_enter' },
      { nodeId: 'cafe_barista', next: 'office_alexander' },
    ];

    for (const { nodeId, next } of cases) {
      const node = STORY_NODES_ACT1[nodeId];
      const golden = node.choices.filter((c) => c.goldenPath === true);
      expect(golden, nodeId).toHaveLength(1);
      expect(golden[0]?.next, nodeId).toBe(next);
    }
  });

  it('marks colleague_persuasion_line golden branch to office_alexander', () => {
    const node = STORY_NODES_ACT1.colleague_persuasion_line;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('office_alexander');
  });

  it('corridor_explore_mode golden branch leads to kitchen_table', () => {
    const node = STORY_NODES_ACT1.corridor_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('kitchen_table');
  });

  it('marks balcony_thought golden branch to go_to_cafe', () => {
    const node = STORY_NODES_ACT1.balcony_thought;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('go_to_cafe');
  });

  it('marks friday_arrives golden branch to go_to_cafe', () => {
    const node = STORY_NODES_ACT1.friday_arrives;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('go_to_cafe');
  });
});
