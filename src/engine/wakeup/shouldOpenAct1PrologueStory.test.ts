import { describe, expect, it } from 'vitest';
import { shouldOpenAct1PrologueStory } from './shouldOpenAct1PrologueStory';

describe('shouldOpenAct1PrologueStory', () => {
  it('opens only at start before explore_mode is visited', () => {
    expect(
      shouldOpenAct1PrologueStory({
        currentNodeId: 'start',
        showStoryOverlay: false,
        visitedNodes: [],
      }),
    ).toBe(true);
  });

  it('blocks when explore_mode is already visited', () => {
    expect(
      shouldOpenAct1PrologueStory({
        currentNodeId: 'start',
        showStoryOverlay: false,
        visitedNodes: ['start', 'explore_mode'],
      }),
    ).toBe(false);
  });

  it('blocks when player already left the start node', () => {
    expect(
      shouldOpenAct1PrologueStory({
        currentNodeId: 'corridor_door',
        showStoryOverlay: false,
        visitedNodes: ['start'],
      }),
    ).toBe(false);
  });

  it('blocks when start overlay is already open', () => {
    expect(
      shouldOpenAct1PrologueStory({
        currentNodeId: 'start',
        showStoryOverlay: true,
        visitedNodes: [],
      }),
    ).toBe(false);
  });

  it('blocks after e2e bridge promotes closed overlay hub', () => {
    expect(
      shouldOpenAct1PrologueStory({
        currentNodeId: 'explore_mode',
        showStoryOverlay: false,
        visitedNodes: ['start', 'explore_mode'],
      }),
    ).toBe(false);
  });
});
