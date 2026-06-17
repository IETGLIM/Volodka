import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/story';
import {
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_STORY_SPINE,
  STORY_NODE_GUIDANCE,
  STORY_NODE_TO_NPC_ID,
  STORY_NODE_TO_SCENE_LABEL,
} from '@/data/goldenPath';
import { getGoldenPathDerivationReport } from '@/engine/guidedStory/buildGuidedStoryPath';

const TERMINAL_SPINE_NODE = 'act7_true_end';

function resolveGuidanceSource(nodeId: string): 'hint' | 'npc' | 'scene' | 'none' {
  const node = STORY_NODES[nodeId];
  if (node?.guidanceHint || GOLDEN_PATH_BRANCH_HINTS[nodeId]) return 'hint';
  if (STORY_NODE_TO_NPC_ID[nodeId]) return 'npc';
  if (STORY_NODE_TO_SCENE_LABEL[nodeId]) return 'scene';
  return 'none';
}

describe('golden path guidance coverage (AAA onboarding)', () => {
  it('STORY_NODE_GUIDANCE aliases GOLDEN_PATH_BRANCH_HINTS', () => {
    expect(STORY_NODE_GUIDANCE).toBe(GOLDEN_PATH_BRANCH_HINTS);
  });

  it('derived spine matches manual spine with no fallback steps', () => {
    const report = getGoldenPathDerivationReport(STORY_NODES);
    expect(report.storySpine).toEqual(GOLDEN_PATH_STORY_SPINE);
    expect(report.fallbackSpineSteps).toEqual([]);
    expect(report.missingGoldenPathMarkers).toEqual([]);
    expect(report.ambiguousGoldenPathNodes).toEqual([]);
  });

  it('every spine step has a human-readable objective (hint, NPC, or scene label)', () => {
    const gaps = GOLDEN_PATH_STORY_SPINE.filter(
      (nodeId) => nodeId !== TERMINAL_SPINE_NODE && resolveGuidanceSource(nodeId) === 'none',
    );

    expect(
      gaps,
      `Add guidanceHint, GOLDEN_PATH_BRANCH_HINTS, STORY_NODE_TO_NPC_ID, or STORY_NODE_TO_SCENE_LABEL for:\n${gaps.join('\n')}`,
    ).toEqual([]);
  });
});
