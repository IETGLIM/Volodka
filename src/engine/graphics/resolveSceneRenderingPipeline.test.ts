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

  it('keeps full post-FX on rooftop_edge when visualLite (cinematic profile)', () => {
    const pipe = resolveSceneRenderingPipeline(
      'rooftop_edge',
      QUALITY_PRESETS.medium,
      true,
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.bloomIntensityScale).toBe(1.14);
  });

  it('uses lite post-FX on standard scenes when visualLite', () => {
    const pipe = resolveSceneRenderingPipeline(
      'chk_forest_zorge',
      QUALITY_PRESETS.medium,
      true,
    );
    expect(pipe.useLitePostFx).toBe(true);
    expect(pipe.useAmbientOcclusion).toBe(false);
  });

  it('enables AO on hero scenes when profile has enhancedAmbientOcclusion', () => {
    const pipe = resolveSceneRenderingPipeline(
      'volodka_room',
      QUALITY_PRESETS.high,
      false,
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.useAmbientOcclusion).toBe(true);
    expect(pipe.aoIntensity).toBeGreaterThan(2.5);
  });

  it('enables AO on street_night at explicit ultra', () => {
    const pipe = resolveSceneRenderingPipeline(
      'street_night',
      QUALITY_PRESETS.ultra,
      false,
      'ultra',
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.useAmbientOcclusion).toBe(true);
  });

  it('skips AO on auto even when resolved preset is ultra', () => {
    const pipe = resolveSceneRenderingPipeline(
      'street_night',
      QUALITY_PRESETS.ultra,
      false,
      'auto',
    );
    expect(pipe.useAmbientOcclusion).toBe(false);
  });

  it('enables AO on ultra when profile has enhancedAmbientOcclusion', () => {
    const pipe = resolveSceneRenderingPipeline(
      'volodka_room',
      QUALITY_PRESETS.ultra,
      false,
    );
    expect(pipe.useAmbientOcclusion).toBe(true);
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
