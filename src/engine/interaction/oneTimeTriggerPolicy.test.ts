import { describe, expect, it } from 'vitest';
import type { TriggerZone } from '@/data/triggerZones';
import { shouldDeferOneTimeMark, zoneHasLinkedContent } from './oneTimeTriggerPolicy';

const baseZone: TriggerZone = {
  id: 'test_zone',
  sceneId: 'volodka_room',
  position: [0, 0, 0],
  size: [1, 1, 1],
};

describe('oneTimeTriggerPolicy', () => {
  it('defers one-time mark for examine zones with linked dialogue', () => {
    const zone: TriggerZone = {
      ...baseZone,
      isOneTime: true,
      linkedDialogueNodeId: 'explore_room_window',
      examineData: {
        title: 'Окно',
        description: 'test',
        detailText: 'test',
      },
    };

    expect(zoneHasLinkedContent(zone)).toBe(true);
    expect(shouldDeferOneTimeMark(zone)).toBe(true);
  });

  it('does not defer one-time mark for examine-only zones without linked content', () => {
    const zone: TriggerZone = {
      ...baseZone,
      isOneTime: true,
      examineData: {
        title: 'Полка',
        description: 'test',
        detailText: 'test',
      },
    };

    expect(shouldDeferOneTimeMark(zone)).toBe(false);
  });

  it('does not defer when zone is not one-time', () => {
    const zone: TriggerZone = {
      ...baseZone,
      linkedDialogueNodeId: 'explore_corridor_door',
      examineData: {
        title: 'Дверь',
        description: 'test',
        detailText: 'test',
      },
    };

    expect(shouldDeferOneTimeMark(zone)).toBe(false);
  });
});
