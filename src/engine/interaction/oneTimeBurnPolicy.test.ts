import { describe, expect, it } from 'vitest';
import { shouldDeferOneTimeBurn } from './oneTimeBurnPolicy';

describe('shouldDeferOneTimeBurn', () => {
  it('defers burn for one-time examine zones with linked dialogue', () => {
    expect(
      shouldDeferOneTimeBurn({
        isOneTime: true,
        examineData: { title: 'Окно' },
        linkedDialogueNodeId: 'explore_room_window',
      }),
    ).toBe(true);
  });

  it('burns immediately for one-time examine without linked content', () => {
    expect(
      shouldDeferOneTimeBurn({
        isOneTime: true,
        examineData: { title: 'Стих' },
      }),
    ).toBe(false);
  });

  it('burns immediately for one-time zones without examine panel', () => {
    expect(
      shouldDeferOneTimeBurn({
        isOneTime: true,
        linkedStoryNodeId: 'some_node',
      }),
    ).toBe(false);
  });
});
