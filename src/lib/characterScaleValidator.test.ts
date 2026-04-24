import { describe, expect, it } from 'vitest';
import {
  estimateCharacterBoundingProduct,
  validateCharacterScale,
  GLB_BASE_NAMES_EXEMPT_FROM_MIN_VISUAL_HEIGHT,
  MAX_CHARACTER_BOUNDING_PRODUCT,
  MIN_CHARACTER_BOUNDING_PRODUCT,
} from './characterScaleValidator';

describe('characterScaleValidator', () => {
  it('estimateCharacterBoundingProduct multiplies bbox by uniform', () => {
    expect(estimateCharacterBoundingProduct(2, 0.875)).toBeCloseTo(1.75, 5);
  });

  it('validateCharacterScale returns ok inside raw product band', () => {
    expect(validateCharacterScale('/models/x.glb', 10, 0.2)).toBe('ok');
  });

  it('validateCharacterScale rejects above MAX raw product', () => {
    const r = validateCharacterScale('/models/x.glb', 200, 0.5);
    expect(r).not.toBe('ok');
    if (r !== 'ok') expect(r.actualHeightM).toBeGreaterThan(MAX_CHARACTER_BOUNDING_PRODUCT);
  });

  it('validateCharacterScale rejects below MIN raw product for non-exempt basename', () => {
    const r = validateCharacterScale('/models/college_girl.glb', 0.2, 0.015);
    expect(r).not.toBe('ok');
    if (r !== 'ok') expect(r.actualHeightM).toBeLessThan(MIN_CHARACTER_BOUNDING_PRODUCT);
  });

  it('exempt basenames skip MIN check only', () => {
    const bust = [...GLB_BASE_NAMES_EXEMPT_FROM_MIN_VISUAL_HEIGHT][0];
    expect(validateCharacterScale(`/models/${bust}`, 0.2, 0.9)).toBe('ok');
    expect(validateCharacterScale(`/models/${bust}`, 500, 0.9)).not.toBe('ok');
  });

  it('toon cat exempt skips MAX bound', () => {
    expect(validateCharacterScale('/models/toon_cat_free.glb', 600, 0.5)).toBe('ok');
  });
});
