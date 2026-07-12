import { describe, expect, it } from 'vitest';
import { isTriggerZoneAvailable } from '@/data/triggerZones';

describe('isTriggerZoneAvailable hiddenUntilPoemFlag', () => {
  const zone = {
    id: 'library_hidden_poem',
    sceneId: 'library_day' as const,
    position: [0, 0, 0] as [number, number, number],
    size: [1, 1, 1] as [number, number, number],
    hiddenUntilPoemFlag: 'child_gaze_active',
  };

  it('hides zone until child_gaze TTL is live', () => {
    expect(isTriggerZoneAvailable(zone, {}, 1, {})).toBe(false);
    expect(
      isTriggerZoneAvailable(zone, {}, 1, {
        child_gaze_active: {
          key: 'child_gaze_active',
          poemId: 'poem_7',
          expiryTimestamp: Date.now() + 10_000,
        },
      }),
    ).toBe(true);
  });
});
