import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/storyNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import {
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_TARGET_ENDING_NODE_ID,
} from '@/data/goldenPath';

describe('goldenPath data', () => {
  it('spine nodes exist in STORY_NODES', () => {
    for (const { nodeId } of GOLDEN_PATH_STORY_SPINE) {
      expect(STORY_NODES[nodeId], `missing story node: ${nodeId}`).toBeDefined();
    }
  });

  it('quest spine ids exist in QUEST_DEFINITIONS', () => {
    for (const id of GOLDEN_PATH_QUEST_SPINE) {
      expect(QUEST_DEFINITIONS[id], `missing quest: ${id}`).toBeDefined();
    }
    for (const id of GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS) {
      expect(QUEST_DEFINITIONS[id], `missing optional quest: ${id}`).toBeDefined();
    }
  });

  it('branch hints point to existing next nodes and choices match story data', () => {
    for (const { atNodeId, choose, nextNodeId } of GOLDEN_PATH_BRANCH_HINTS) {
      expect(STORY_NODES[nextNodeId]).toBeDefined();
      const node = STORY_NODES[atNodeId];
      expect(node?.choices?.some((c) => c.text === choose && c.next === nextNodeId)).toBe(true);
    }
  });

  it('target ending node is an ending type', () => {
    const end = STORY_NODES[GOLDEN_PATH_TARGET_ENDING_NODE_ID];
    expect(end?.type).toBe('ending');
  });
});
