import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT2 } from '@/data/story/act2';

describe('Act II golden path markers', () => {
  it('marks act2_maria_search golden branch to meeting place', () => {
    const node = STORY_NODES_ACT2.act2_maria_search;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_maria_meeting_place');
  });

  it('marks act2_transition cafe spine golden branch', () => {
    const node = STORY_NODES_ACT2.act2_transition;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_albert_hint');
  });
});
