import { describe, expect, it } from 'vitest';
import {
  estimateCharacterBoundingProduct,
  validateCharacterScale,
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
    const r = validateCharacterScale('/models/khronos_cc0_RiggedFigure.glb', 0.2, 0.015);
    expect(r).not.toBe('ok');
    if (r !== 'ok') expect(r.actualHeightM).toBeLessThan(MIN_CHARACTER_BOUNDING_PRODUCT);
  });

  it('Khronos Fox obeys MAX like other models; CesiumMan still hits MAX when огромный bbox', () => {
    expect(validateCharacterScale('/models/khronos_cc0_Fox.glb', 0.2, 0.9)).toBe('ok');
    expect(validateCharacterScale('/models/khronos_cc0_Fox.glb', 600, 0.5)).not.toBe('ok');
    expect(validateCharacterScale('/models/khronos_cc0_CesiumMan.glb', 500, 0.9)).not.toBe('ok');
  });
});
