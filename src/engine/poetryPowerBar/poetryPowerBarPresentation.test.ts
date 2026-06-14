import { describe, expect, it } from 'vitest';
import {
  buildSlotTooltipReadyLine,
  getEmptySlotCount,
  getShortcutKey,
  truncatePowerDisplayName,
} from '@/engine/poetryPowerBar/poetryPowerBarPresentation';

describe('poetryPowerBarPresentation', () => {
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
