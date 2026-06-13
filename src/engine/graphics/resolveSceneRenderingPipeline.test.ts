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
      'library_day',
      QUALITY_PRESETS.medium,
      true,
    );
    expect(pipe.useLitePostFx).toBe(true);
    expect(pipe.useAmbientOcclusion).toBe(false);
  });

  it('enables AO on high preset for hero scenes', () => {
    const pipe = resolveSceneRenderingPipeline(
      'street_night',
      QUALITY_PRESETS.high,
      false,
    );
    expect(pipe.useLitePostFx).toBe(false);
    expect(pipe.useAmbientOcclusion).toBe(true);
    expect(pipe.aoIntensity).toBeGreaterThan(2.5);
  });

  it('enables AO on ultra for any scene with enhancedAmbientOcclusion profile', () => {
    const pipe = resolveSceneRenderingPipeline(
      'volodka_room',
      QUALITY_PRESETS.ultra,
      false,
    );
    expect(pipe.useAmbientOcclusion).toBe(true);
  });

  it('factory stays lite when not hero-forced', () => {
    const pipe = resolveSceneRenderingPipeline(
      'abandoned_factory',
      QUALITY_PRESETS.high,
      false,
    );
    expect(pipe.useLitePostFx).toBe(true);
  });
});
