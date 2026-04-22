import { describe, expect, it } from 'vitest';
import { INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER } from '@/lib/introVolodkaOpeningCutscene';
import { getExplorationPlayerGlbVisualUniformMultiplier } from '@/config/scenes';

describe('intro opening GLB visual uniform extra multiplier', () => {
  it('shrinks scene multiplier relative to gameplay (volodka_room)', () => {
    const base = getExplorationPlayerGlbVisualUniformMultiplier('volodka_room');
    const intro = base * INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER;
    expect(intro).toBeLessThan(base);
    expect(intro).toBeCloseTo(0.52 * 0.72, 5);
  });

  it('intro must not use default m=1 from an unrelated scene (would look larger than volodka gameplay)', () => {
    const defaultMul = getExplorationPlayerGlbVisualUniformMultiplier('kitchen_night');
    const volodkaMul = getExplorationPlayerGlbVisualUniformMultiplier('volodka_room');
    expect(defaultMul).toBe(1);
    expect(
      defaultMul * INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER,
    ).toBeGreaterThan(volodkaMul * INTRO_OPENING_PLAYER_GLB_VISUAL_UNIFORM_EXTRA_MULTIPLIER);
  });
});
