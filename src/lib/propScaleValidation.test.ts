import { describe, expect, it } from 'vitest';

import type { PropDefinition } from '@/data/propsTypes';

import { validatePropGlbScale } from './propScaleValidation';

describe('validatePropGlbScale', () => {
  it('skips procedural props (no glbPath)', () => {
    const def: PropDefinition = {
      id: 'desk_volodka',
      category: 'furniture',
    };
    expect(validatePropGlbScale(def, '/models/x.glb', 2, 0.5)).toBe('skipped-procedural');
  });

  it('skips when exemptFromScaleValidation', () => {
    const def: PropDefinition = {
      id: 'stylized',
      category: 'decor',
      glbPath: '/models/khronos_cc0_Fox.glb',
      exemptFromScaleValidation: true,
    };
    expect(validatePropGlbScale(def, def.glbPath!, 900, 0.5)).toBe('skipped-exempt');
  });

  it('delegates to character scale validator for GLB props', () => {
    const def: PropDefinition = {
      id: 'z',
      category: 'tech',
      glbPath: '/models/khronos_cc0_CesiumMan.glb',
    };
    const r = validatePropGlbScale(def, def.glbPath!, 0.5, 0.2);
    expect(r).not.toBe('skipped-procedural');
    expect(r).not.toBe('skipped-exempt');
    expect(r).toBe('ok');
  });

  it('returns error when bbox×uniform exceeds character ceiling (CI guard for битые проп-GLB)', () => {
    const def: PropDefinition = {
      id: 'oversized_prop',
      category: 'furniture',
      glbPath: '/models/khronos_cc0_RiggedFigure.glb',
    };
    const r = validatePropGlbScale(def, def.glbPath!, 200, 0.5);
    expect(r).not.toBe('ok');
    expect(r).not.toBe('skipped-procedural');
    expect(r).not.toBe('skipped-exempt');
    expect(typeof r).toBe('object');
    if (typeof r === 'object' && 'error' in r) {
      expect(r.error).toMatch(/выше допустимого|пола|потолка/i);
    }
  });
});
