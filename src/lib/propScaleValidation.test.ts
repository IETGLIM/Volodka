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
      glbPath: '/models/toon_cat_free.glb',
      exemptFromScaleValidation: true,
    };
    expect(validatePropGlbScale(def, def.glbPath!, 900, 0.5)).toBe('skipped-exempt');
  });

  it('delegates to character scale validator for GLB props', () => {
    const def: PropDefinition = {
      id: 'z',
      category: 'tech',
      glbPath: '/models/destiny_2_character_bust.glb',
    };
    const r = validatePropGlbScale(def, def.glbPath!, 0.5, 0.2);
    expect(r).not.toBe('skipped-procedural');
    expect(r).not.toBe('skipped-exempt');
    expect(r).toBe('ok');
  });
});
