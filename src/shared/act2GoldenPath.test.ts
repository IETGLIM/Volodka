import { describe, expect, it } from 'vitest';
import { STORY_NODES_SCENE_EXPLORE_HUBS } from '@/data/story/sceneExploreHubs';
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

  it('marks act2_maria_meeting_place golden branch to network initiation', () => {
    const node = STORY_NODES_ACT2.act2_maria_meeting_place;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_network_initiation');
    expect(golden[0]?.condition?.minKarma).toBe(30);
  });

  it('marks act2_network_initiation golden branch to oath', () => {
    const node = STORY_NODES_ACT2.act2_network_initiation;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_network_oath');
  });

  it('office_explore_mode hub golden branch leads to start_diagnosis', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.office_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('start_diagnosis');
  });
});
