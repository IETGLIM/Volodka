import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';
import { shouldUseGlbNpc, shouldUseGlbPlayer } from '@/engine/graphics/glbRenderMode';

describe('glbRenderMode', () => {
  it('enables hero GLB on high and ultra only', () => {
    expect(shouldUseGlbPlayer(QUALITY_PRESETS.low)).toBe(false);
    expect(shouldUseGlbPlayer(QUALITY_PRESETS.medium)).toBe(false);
    expect(shouldUseGlbPlayer(QUALITY_PRESETS.high)).toBe(true);
    expect(shouldUseGlbPlayer(QUALITY_PRESETS.ultra)).toBe(true);
  });

  it('enables NPC GLB at full LOD when preset is hybrid or glb', () => {
    expect(shouldUseGlbNpc(QUALITY_PRESETS.low, 'full')).toBe(false);
    expect(shouldUseGlbNpc(QUALITY_PRESETS.medium, 'full')).toBe(true);
    expect(shouldUseGlbNpc(QUALITY_PRESETS.medium, 'impostor')).toBe(false);
    expect(shouldUseGlbNpc(QUALITY_PRESETS.ultra, 'full')).toBe(true);
  });
});
