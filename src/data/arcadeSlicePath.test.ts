import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/storyNodes';
import {
  ARCADE_SLICE_STORY_SPINE,
  VERTICAL_SLICE_ENTRY_NODE_ID,
  VERTICAL_SLICE_STORY_NODES,
} from '@/data/verticalSliceStoryNodes';

describe('arcadeSlicePath', () => {
  it('entry node exists in STORY_NODES', () => {
    expect(STORY_NODES[VERTICAL_SLICE_ENTRY_NODE_ID]).toBeDefined();
  });

  it('all vertical slice nodes are merged into STORY_NODES', () => {
    for (const id of Object.keys(VERTICAL_SLICE_STORY_NODES)) {
      expect(STORY_NODES[id], `missing ${id}`).toBeDefined();
    }
  });

  it('spine nodes exist and minigame refs resolve', () => {
    for (const id of ARCADE_SLICE_STORY_SPINE) {
      const node = STORY_NODES[id];
      expect(node, `spine node ${id}`).toBeDefined();
      if (node.type === 'minigame' && node.minigame) {
        expect(STORY_NODES[node.minigame.successNext], `${id} successNext`).toBeDefined();
        expect(STORY_NODES[node.minigame.failNext], `${id} failNext`).toBeDefined();
      }
    }
  });

  it('vs_slice_conflict choices lead to valid nodes', () => {
    const conflict = STORY_NODES.vs_slice_conflict;
    expect(conflict?.choices?.length).toBe(3);
    for (const c of conflict?.choices ?? []) {
      expect(STORY_NODES[c.next], c.text).toBeDefined();
    }
  });

  it('no self-loop autoNext on slice nodes', () => {
    for (const node of Object.values(VERTICAL_SLICE_STORY_NODES)) {
      if (node.autoNext) {
        expect(node.autoNext).not.toBe(node.id);
      }
    }
  });
});
