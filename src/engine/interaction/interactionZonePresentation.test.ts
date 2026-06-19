import { describe, expect, it } from 'vitest';
import { shouldOpenLinkedStoryDirectly } from './interactionZonePresentation';

describe('shouldOpenLinkedStoryDirectly', () => {
  it('opens story-linked doors on first interact', () => {
    expect(
      shouldOpenLinkedStoryDirectly({
        interactionType: 'open',
        linkedStoryNodeId: 'corridor_door',
      }),
    ).toBe(true);
  });

  it('keeps examine flow for open zones with dialogue-only links', () => {
    expect(
      shouldOpenLinkedStoryDirectly({
        interactionType: 'open',
        linkedStoryNodeId: undefined,
      }),
    ).toBe(false);
  });

  it('keeps examine flow for non-door interactions', () => {
    expect(
      shouldOpenLinkedStoryDirectly({
        interactionType: 'examine',
        linkedStoryNodeId: 'street_bench',
      }),
    ).toBe(false);
  });
});
