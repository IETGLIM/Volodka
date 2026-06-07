import { describe, it, expect, vi } from 'vitest';
import type { StoryNode } from '@/shared/types/game';
import {
  deriveGoldenPath,
  deriveStorySpine,
  deriveQuestSpine,
  buildStorySpineIndex,
  collectAmbiguousGoldenPathNodes,
  resetGoldenPathDerivationWarningsForTests,
} from '@/engine/story/deriveGoldenPath';

const MINI_GRAPH: Record<string, StoryNode> = {
  start: {
    id: 'start',
    text: 'Start',
    sceneId: 'volodka_room',
    guidanceHint: 'Begin here',
    choices: [
      { text: 'Explore', next: 'hub', goldenPath: true },
      { text: 'Side', next: 'side_a' },
    ],
  },
  hub: {
    id: 'hub',
    text: 'Hub',
    sceneId: 'volodka_room',
    choices: [
      { text: 'Continue', next: 'act2', goldenPath: true },
      { text: 'Loop', next: 'hub' },
    ],
  },
  side_a: {
    id: 'side_a',
    text: 'Side',
    sceneId: 'volodka_room',
    choices: [{ text: 'Back', next: 'start' }],
  },
  act2: {
    id: 'act2',
    text: 'Act 2',
    sceneId: 'volodka_room',
    guidanceHint: 'Act two begins',
    choices: [{ text: 'End', next: null }],
  },
};

describe('deriveGoldenPath', () => {
  it('follows goldenPath choices without manual spine', () => {
    const { spine, missingMarkers } = deriveStorySpine(MINI_GRAPH);
    expect(spine).toEqual(['start', 'hub', 'act2']);
    expect(missingMarkers).toEqual([]);
  });

  it('merges guidanceHint into branch hints', () => {
    const derived = deriveGoldenPath(MINI_GRAPH);
    expect(derived.branchHints.start).toBe('Begin here');
    expect(derived.branchHints.act2).toBe('Act two begins');
  });

  it('falls back to manual spine when goldenPath is missing', () => {
    const nodes: Record<string, StoryNode> = {
      start: {
        id: 'start',
        text: 'Start',
        sceneId: 'volodka_room',
        choices: [{ text: 'Go', next: 'next' }],
      },
      next: {
        id: 'next',
        text: 'Next',
        sceneId: 'volodka_room',
        choices: [{ text: 'Done', next: null }],
      },
    };
    const { spine, missingMarkers, fallbackSteps } = deriveStorySpine(nodes, {
      fallbackStorySpine: ['start', 'next'],
    });
    expect(spine).toEqual(['start', 'next']);
    expect(missingMarkers).toEqual(['start']);
    expect(fallbackSteps).toEqual(['start']);
  });

  it('separates ambiguous goldenPath from missing markers and warns in dev', () => {
    resetGoldenPathDerivationWarningsForTests();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const nodes: Record<string, StoryNode> = {
      fork: {
        id: 'fork',
        text: 'Fork',
        sceneId: 'volodka_room',
        choices: [
          { text: 'A', next: 'left', goldenPath: true },
          { text: 'B', next: 'right', goldenPath: true },
        ],
      },
      left: {
        id: 'left',
        text: 'Left',
        sceneId: 'volodka_room',
        choices: [{ text: 'Done', next: null }],
      },
      right: {
        id: 'right',
        text: 'Right',
        sceneId: 'volodka_room',
        choices: [{ text: 'Done', next: null }],
      },
    };

    expect(collectAmbiguousGoldenPathNodes(nodes)).toEqual([
      { nodeId: 'fork', targets: ['left', 'right'] },
    ]);

    const { spine, missingMarkers } = deriveStorySpine(nodes, {
      startNodeId: 'fork',
      fallbackStorySpine: ['fork', 'left'],
    });
    expect(spine).toEqual(['fork', 'left']);
    expect(missingMarkers).toEqual([]);

    const derived = deriveGoldenPath(nodes, {
      startNodeId: 'fork',
      fallbackStorySpine: ['fork', 'left'],
    });
    expect(derived.ambiguousGoldenPathNodes).toEqual([
      { nodeId: 'fork', targets: ['left', 'right'] },
    ]);

    if (import.meta.env.DEV) {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('story node "fork" has 2 choices marked goldenPath'),
      );
      deriveGoldenPath(nodes, { startNodeId: 'fork', fallbackStorySpine: ['fork', 'left'] });
      expect(warnSpy).toHaveBeenCalledTimes(1);
    }

    warnSpy.mockRestore();
  });

  it('orders main quests by spineOrder then linked node index', () => {
    const index = buildStorySpineIndex(['start', 'hub', 'act2']);
    const quests = [
      {
        id: 'q_late',
        title: 'Late',
        description: '',
        questType: 'main' as const,
        objectives: [],
        linkedStoryNodeId: 'act2',
      },
      {
        id: 'q_early',
        title: 'Early',
        description: '',
        questType: 'main' as const,
        objectives: [],
        linkedStoryNodeId: 'start',
      },
    ];
    expect(deriveQuestSpine(quests, index, [])).toEqual(['q_early', 'q_late']);
  });
});
