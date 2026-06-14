import { describe, expect, it } from 'vitest';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';
import { resolveSceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';

describe('resolveSceneRenderingPipeline', () => {
  it('keeps full post-FX on hero scenes even when visualLite (medium preset)', () => {
    const pipe = resolveSceneRenderingPipeline(
      'volodka_room',
      QUALITY_PRESETS.medium,
      true,
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.isHero).toBe(true);
  });

  it('uses lite post-FX on non-hero scenes when visualLite', () => {
    const pipe = resolveSceneRenderingPipeline(
      'rooftop_edge',
      QUALITY_PRESETS.medium,
      true,
    );
    expect(pipe.useLitePostFx).toBe(true);
    expect(pipe.useAmbientOcclusion).toBe(false);
  });

  it('skips AO on hero scenes when enhancedAmbientOcclusion is off', () => {
    const pipe = resolveSceneRenderingPipeline(
      'street_night',
      QUALITY_PRESETS.high,
      false,
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.useAmbientOcclusion).toBe(false);
    expect(pipe.aoIntensity).toBeGreaterThan(2.5);
  });

  it('skips AO on ultra when profile disables enhancedAmbientOcclusion', () => {
    const pipe = resolveSceneRenderingPipeline(
      'volodka_room',
      QUALITY_PRESETS.ultra,
      false,
    );
    expect(pipe.useAmbientOcclusion).toBe(false);
  });

  it('standard scenes keep full post on high when visualLite is off', () => {
    const pipe = resolveSceneRenderingPipeline(
      'rooftop_edge',
      QUALITY_PRESETS.high,
      false,
    );
    expect(pipe.useLitePostFx).toBe(false);
  });
});
