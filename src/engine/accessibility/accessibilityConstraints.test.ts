import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_NUMERIC_RANGES,
  clampInRange,
  clampNumericAccessibilitySetting,
  createSubtitleScale,
  createTextSpeed,
} from './accessibilityConstraints';
import { parseColorBlindMode, VALID_COLOR_BLIND_MODES } from './accessibilityTypes';

describe('accessibilityConstraints', () => {
  it('clamps numeric settings using ACCESSIBILITY_NUMERIC_RANGES', () => {
    expect(clampInRange(2.5, 'textSpeed')).toBe(ACCESSIBILITY_NUMERIC_RANGES.textSpeed.max);
    expect(clampInRange(0.1, 'subtitleScale')).toBe(ACCESSIBILITY_NUMERIC_RANGES.subtitleScale.min);
    expect(clampInRange(1.1, 'locomotionSpeed')).toBe(1.1);
  });

  it('falls back when numeric input is not finite', () => {
    expect(clampInRange('not-a-number', 'textSpeed', createTextSpeed(1.25))).toBe(1.25);
  });

  it('validates color blind modes via VALID_COLOR_BLIND_MODES', () => {
    expect(parseColorBlindMode('protanopia')).toBe('protanopia');
    expect(parseColorBlindMode('none')).toBe('none');
    expect(parseColorBlindMode('invalid')).toBe('none');
    expect(clampInRange('deuteranopia', 'colorBlindMode')).toBe('deuteranopia');
    expect(VALID_COLOR_BLIND_MODES).toContain('tritanopia');
  });

  it('creates branded numeric settings through factories', () => {
    const scale = createSubtitleScale(1.3);
    expect(scale).toBe(1.3);
    expect(createSubtitleScale(99)).toBe(ACCESSIBILITY_NUMERIC_RANGES.subtitleScale.max);
  });

  it('exposes clampNumericAccessibilitySetting for presentation hooks', () => {
    expect(clampNumericAccessibilitySetting('textSpeed', 99)).toBe(2);
  });
});
