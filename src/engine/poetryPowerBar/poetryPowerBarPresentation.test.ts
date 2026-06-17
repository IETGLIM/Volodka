import { describe, expect, it } from 'vitest';
import {
  buildCollectedWithPowers,
  buildSlotTooltipReadyLine,
  getDisplayPowers,
  getEmptySlotCount,
  getShortcutKey,
  truncatePowerDisplayName,
} from '@/engine/poetryPowerBar/poetryPowerBarPresentation';

const EIGHT_POEM_IDS = [
  'poem_1',
  'poem_2',
  'poem_3',
  'poem_4',
  'poem_5',
  'poem_6',
  'poem_7',
  'poem_8',
] as const;

describe('poetryPowerBarPresentation', () => {
  it('buildCollectedWithPowers keeps every collected poem with a power', () => {
    const entries = buildCollectedWithPowers(EIGHT_POEM_IDS);
    expect(entries).toHaveLength(8);
    expect(entries.map((entry) => entry.poemId)).toEqual([...EIGHT_POEM_IDS]);
  });

  it('getDisplayPowers does not drop powers beyond the first five', () => {
    const entries = buildCollectedWithPowers(EIGHT_POEM_IDS);
    const displayed = getDisplayPowers(entries);
    expect(displayed).toHaveLength(8);
    expect(displayed[5]?.poemId).toBe('poem_6');
    expect(displayed[7]?.poemId).toBe('poem_8');
  });

  it('maps slot shortcuts and empty slots', () => {
    expect(getShortcutKey(0)).toBe('1');
    expect(getShortcutKey(4)).toBe('5');
    expect(getShortcutKey(5)).toBeNull();
    expect(getEmptySlotCount(3)).toBe(2);
  });

  it('builds tooltip and display helpers', () => {
    expect(buildSlotTooltipReadyLine('2')).toContain('[2]');
    expect(truncatePowerDisplayName('Свет во тьме')).toBe('Свет');
  });
});
