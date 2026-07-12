import { describe, expect, it } from 'vitest';
import {
  formatGameTimeOfDay,
  formatRealClockTime,
  getBlinkDotMotion,
  getFlashOverlayTransition,
} from '@/engine/photo/photoModePresentation';

describe('photoModePresentation', () => {
  it('formatGameTimeOfDay renders HH:MM', () => {
    expect(formatGameTimeOfDay(14.5)).toBe('14:30');
  });

  it('formatRealClockTime pads hours and minutes', () => {
    const date = new Date(2025, 0, 1, 9, 5);
    expect(formatRealClockTime(date)).toBe('09:05');
  });

  it('getBlinkDotMotion disables animation when reduced motion is on', () => {
    expect(getBlinkDotMotion(true).animate).toBeUndefined();
    expect(getBlinkDotMotion(false).animate).toBeDefined();
  });

  it('getFlashOverlayTransition is instant with reduced motion', () => {
    expect(getFlashOverlayTransition(true).duration).toBe(0);
    expect(getFlashOverlayTransition(false).duration).toBeGreaterThan(0);
  });
});
