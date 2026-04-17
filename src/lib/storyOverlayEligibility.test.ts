import { describe, expect, it } from 'vitest';
import { storyNodeShowsStoryOverlay } from '@/lib/storyOverlayEligibility';
import type { StoryNode } from '@/data/types';

describe('storyNodeShowsStoryOverlay', () => {
  it('returns false for explore_mode and empty nodes', () => {
    expect(storyNodeShowsStoryOverlay(undefined)).toBe(false);
    expect(
      storyNodeShowsStoryOverlay({
        id: 'explore_mode',
        type: 'narration',
        scene: 'office_morning',
        act: 1,
        text: '',
      } as StoryNode),
    ).toBe(false);
  });

  it('returns true when there is text or choices', () => {
    expect(
      storyNodeShowsStoryOverlay({
        id: 'x',
        type: 'narration',
        scene: 'kitchen_night',
        act: 1,
        text: 'Hello',
      } as StoryNode),
    ).toBe(true);
    expect(
      storyNodeShowsStoryOverlay({
        id: 'y',
        type: 'narration',
        scene: 'kitchen_night',
        act: 1,
        text: '',
        choices: [{ text: 'Go', next: 'z' }],
      } as StoryNode),
    ).toBe(true);
  });
});
