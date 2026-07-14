import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';
import { resolvePoemWorldEffect } from '@/engine/poemWorld/poemWorldEffectResolver';

vi.mock('@/engine/fx/screenFxTriggers', () => ({
  triggerFlash: vi.fn(),
  triggerShake: vi.fn(),
  triggerVignette: vi.fn(),
  triggerChromaticAberration: vi.fn(),
}));

import {
  triggerChromaticAberration,
  triggerFlash,
  triggerShake,
  triggerVignette,
} from '@/engine/fx/screenFxTriggers';
import { executePoemWorldVisuals } from '@/engine/poemWorld/executePoemWorldVisuals';

describe('executePoemWorldVisuals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('storm_break triggers shake and chromatic when motion is allowed', () => {
    executePoemWorldVisuals(resolvePoemWorldEffect('poem_5'), { reducedMotion: false });
    expect(vi.mocked(triggerFlash)).toHaveBeenCalled();
    expect(vi.mocked(triggerShake)).toHaveBeenCalled();
    expect(vi.mocked(triggerChromaticAberration)).toHaveBeenCalled();
  });

  it('storm_break skips shake and chromatic when reduced motion is on', () => {
    executePoemWorldVisuals(resolvePoemWorldEffect('poem_5'), { reducedMotion: true });
    expect(vi.mocked(triggerFlash)).toHaveBeenCalled();
    expect(vi.mocked(triggerShake)).not.toHaveBeenCalled();
    expect(vi.mocked(triggerChromaticAberration)).not.toHaveBeenCalled();
  });

  it('letterbox_truth triggers vignette when motion is allowed', () => {
    executePoemWorldVisuals(resolvePoemWorldEffect('poem_1'), { reducedMotion: false });
    expect(vi.mocked(triggerVignette)).toHaveBeenCalled();
  });

  it('handles all visual presets without throwing', () => {
    const presets: PoemWorldEffectProfile['visualPreset'][] = [
      'letterbox_truth',
      'god_rays_gold',
      'storm_break',
      'shield_pulse',
      'warm_echo',
      'matrix_pulse',
    ];
    for (const visualPreset of presets) {
      expect(() =>
        executePoemWorldVisuals(
          { ...resolvePoemWorldEffect('poem_1'), visualPreset },
          { reducedMotion: false },
        ),
      ).not.toThrow();
    }
  });
});
