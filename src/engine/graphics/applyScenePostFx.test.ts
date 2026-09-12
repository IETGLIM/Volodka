import { describe, expect, it } from 'vitest';
import type { Texture } from 'three';
import {
  applyScenePostFx,
  computeBloomRuntime,
  computeChromaticRuntime,
  computeGradeRuntime,
  computeVignetteRuntime,
  setEffectPassEnabled,
  type ScenePostFxApplyInput,
  type ScenePostFxTargets,
} from '@/engine/graphics/applyScenePostFx';
import { resolveScenePostFxProfile } from '@/engine/graphics/scenePostFxProfiles';
import type { SceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import type { PoemPostFxBoost } from '@/engine/poemWorld/poemPostFxBoost';

const NO_BOOST: PoemPostFxBoost = { bloomIntensity: 0, vignetteDarkness: 0 };

function makeRendering(overrides: Partial<SceneRenderingPipeline> = {}): SceneRenderingPipeline {
  return {
    useLitePostFx: false,
    useAmbientOcclusion: true,
    aoIntensity: 2.5,
    aoRadius: 0.45,
    bloomIntensityScale: 1,
    shadowMapScale: 1,
    isHero: false,
    ...overrides,
  };
}

function makeTargets() {
  return {
    bloom: { intensity: 0, luminanceMaterial: { threshold: 1, smoothing: 0 } },
    vignette: { offset: 0, darkness: 0, eskil: false, blendMode: { opacity: { value: 1 } } },
    hueSaturation: { hue: 0, saturation: 0 },
    brightnessContrast: { brightness: 0, contrast: 0 },
    chromatic: { uniforms: new Map([['offset', { value: { x: 0, y: 0 } }]]) },
    scanline: { blendMode: { opacity: { value: 1 } } },
    noise: { blendMode: { opacity: { value: 0 } } },
    lut: { lut: null as unknown as Texture },
    toneMapping: { mode: 0 },
    n8ao: { enabled: false, configuration: { aoRadius: 0, intensity: 0, color: '' } },
    godRays: { blendMode: { opacity: { value: 0.5 } } },
    composer: { passes: [] as unknown[] },
    smaaEffect: null,
    godRaysEffect: null,
  } as unknown as ScenePostFxTargets & {
    bloom: { intensity: number; luminanceMaterial: { threshold: number; smoothing: number } };
    vignette: { offset: number; darkness: number; eskil: boolean; blendMode: { opacity: { value: number } } };
    hueSaturation: { hue: number; saturation: number };
    brightnessContrast: { brightness: number; contrast: number };
    chromatic: { uniforms: Map<string, { value: { x: number; y: number } }> };
    scanline: { blendMode: { opacity: { value: number } } };
    noise: { blendMode: { opacity: { value: number } } };
    lut: { lut: unknown };
    toneMapping: { mode: number };
    n8ao: { enabled: boolean; configuration: { aoRadius: number; intensity: number; color: string } };
    godRays: { blendMode: { opacity: { value: number } } };
    composer: { passes: unknown[] };
  };
}

function makeInput(overrides: Partial<ScenePostFxApplyInput> = {}): ScenePostFxApplyInput {
  return {
    profile: resolveScenePostFxProfile('street_night'),
    rendering: makeRendering(),
    useAmbientOcclusion: true,
    noirMode: false,
    userBrightnessOffset: 0,
    vignetteEnabled: true,
    filmGrainEnabled: true,
    toneMappingMode: 3,
    isUltraPreset: true,
    noiseOpacity: 0.018,
    stress: 0,
    energy: 100,
    poemBoost: NO_BOOST,
    chromaticEligible: true,
    chromaticStressRampEligible: false,
    godRaysMounted: false,
    smaaWanted: true,
    ...overrides,
  };
}

describe('computeBloomRuntime', () => {
  it('full: база + стресс × масштаб профиля, порог с эмиссивным бустом и полом 0.45', () => {
    const profile = resolveScenePostFxProfile('street_night'); // boost 0.14
    const r = computeBloomRuntime(false, profile, 1.08, 0.5, NO_BOOST);
    expect(r.intensity).toBeCloseTo((0.62 + 0.05) * 1.08, 10);
    expect(r.threshold).toBe(0.45); // max(0.45, 0.52 - 0.14)
    expect(r.smoothing).toBe(0.48);
  });

  it('full: поэм-буст добавляется к интенсивности', () => {
    const profile = resolveScenePostFxProfile('battle');
    const r = computeBloomRuntime(false, profile, 1, 0, { bloomIntensity: 0.2, vignetteDarkness: 0 });
    expect(r.intensity).toBeCloseTo(1.1, 10);
  });

  it('lite: фиксированные константы (0.45 / 0.75 / 0.9)', () => {
    const r = computeBloomRuntime(true, null, 1.08, 0.9, { bloomIntensity: 0.1, vignetteDarkness: 0 });
    expect(r.intensity).toBeCloseTo(0.55 * 1.08, 10);
    expect(r.threshold).toBe(0.75);
    expect(r.smoothing).toBe(0.9);
  });
});

describe('computeVignetteRuntime', () => {
  const profile = resolveScenePostFxProfile('street_night'); // {0.4, 0.3}

  it('full: стресс>60 и низкая энергия затемняют края порогово', () => {
    const r = computeVignetteRuntime(profile, {
      noirMode: false, stress: 100, energy: 25, poemBoost: NO_BOOST,
    });
    // effective = min(0.3 * 0.55, 0.75) = 0.165; stressThreshold = 1; energyFactor = 0.75
    expect(r.darkness).toBeCloseTo(Math.min(0.165 + 0.18 + 0.06, 0.75), 10);
    expect(r.offset).toBeCloseTo(Math.max(0.4 - 0.2 - 0.06, 0.1), 10);
  });

  it('full: noire-модификатор затемняет и ограничивается 0.95 до масштаба', () => {
    const r = computeVignetteRuntime(profile, {
      noirMode: true, stress: 0, energy: 100, poemBoost: NO_BOOST,
    });
    // effective = min(min(0.3+0.15, 0.95) * 0.55, 0.75) = 0.2475
    expect(r.darkness).toBeCloseTo(0.2475, 10);
    expect(r.offset).toBeCloseTo(0.4, 10);
  });

  it('lite: фиксированная форма + поэм-буст, без стресс/энергии', () => {
    const r = computeVignetteRuntime(profile, {
      lite: true, noirMode: true, stress: 100, energy: 0, poemBoost: { bloomIntensity: 0, vignetteDarkness: 0.04 },
    });
    expect(r.offset).toBe(0.38);
    expect(r.darkness).toBeCloseTo(Math.min(0.28 * 0.55 + 0.04, 0.75), 10);
  });
});

describe('computeChromaticRuntime', () => {
  it('базовый характер + стресс-рампа (high, стресс 100)', () => {
    const profile = resolveScenePostFxProfile('street_night'); // {0.25, 0.8}
    const r = computeChromaticRuntime(profile, { eligible: true, stressRampEligible: true, stress: 100 });
    expect(r.totalAmount).toBeCloseTo(0.25 + 0.8, 10);
    expect(r.offsetX).toBeCloseTo(1.05 * 0.012, 10);
    expect(r.offsetY).toBeCloseTo(1.05 * 0.009, 10);
  });

  it('не eligible — нулевое смещение (identity)', () => {
    const profile = resolveScenePostFxProfile('battle');
    const r = computeChromaticRuntime(profile, { eligible: false, stressRampEligible: false, stress: 100 });
    expect(r.totalAmount).toBe(0);
    expect(r.offsetX).toBe(0);
    expect(r.offsetY).toBe(0);
  });

  it('рампа нелинейная: стресс 70 → 0', () => {
    const profile = resolveScenePostFxProfile('battle'); // stressMax 1.0
    const r = computeChromaticRuntime(profile, { eligible: true, stressRampEligible: true, stress: 70 });
    expect(r.totalAmount).toBeCloseTo(0.1, 10);
  });
});

describe('computeGradeRuntime', () => {
  it('noir: приглушает насыщенность, усиливает контраст, вычитает глобальную редукцию', () => {
    const profile = resolveScenePostFxProfile('street_night');
    const r = computeGradeRuntime(profile, { noirMode: true, userBrightnessOffset: -0.03 });
    expect(r.hue).toBe(0.04);
    expect(r.saturation).toBeCloseTo(Math.min(0.12 - 0.35, 0), 10);
    expect(r.contrast).toBeCloseTo(Math.max(0, (0.28 + 0.15) - 0.03), 10);
    expect(r.brightness).toBeCloseTo(0.02 + 0.06 - 0.03, 10);
  });
});

describe('applyScenePostFx', () => {
  it('full: пишет блум/виньетку/грейд/LUT/N8AO/тонмаппинг из профиля', () => {
    const t = makeTargets();
    applyScenePostFx(t, makeInput({
      profile: resolveScenePostFxProfile('street_night'),
      rendering: makeRendering({ bloomIntensityScale: 1.08, aoIntensity: 3.1, aoRadius: 0.55 }),
    }));

    expect(t.bloom.intensity).toBeCloseTo((0.62 + 0) * 1.08, 10);
    expect(t.bloom.luminanceMaterial.threshold).toBe(0.45);
    expect(t.bloom.luminanceMaterial.smoothing).toBe(0.48);

    // hero×ultra → eskil
    expect(t.vignette.eskil).toBe(true);
    expect(t.vignette.darkness).toBeCloseTo(Math.min(0.3 * 0.55, 0.75), 10);
    expect(t.vignette.offset).toBeCloseTo(0.4, 10);

    expect(t.hueSaturation.hue).toBe(0.04);
    expect(t.hueSaturation.saturation).toBeCloseTo(0.12, 10);
    expect(t.brightnessContrast.contrast).toBeCloseTo(Math.max(0, 0.28 - 0.03), 10);

    expect(t.toneMapping.mode).toBe(3);

    expect(t.n8ao.enabled).toBe(true);
    expect(t.n8ao.configuration.aoRadius).toBe(0.55);
    expect(t.n8ao.configuration.intensity).toBe(3.1);
    expect(t.n8ao.configuration.color).toBe('#0a0a14');

    // хроматика: база без рампы
    const offset = t.chromatic.uniforms.get('offset')!.value as { x: number; y: number };
    expect(offset.x).toBeCloseTo(0.25 * 0.012, 10);
    expect(offset.y).toBeCloseTo(0.25 * 0.009, 10);
  });

  it('гасит сканлайны/зерно вне профильных сцен через opacity', () => {
    const t = makeTargets();
    applyScenePostFx(t, makeInput({ profile: resolveScenePostFxProfile('battle'), isUltraPreset: true }));
    expect(t.scanline.blendMode.opacity.value).toBe(0);
    expect(t.noise.blendMode.opacity.value).toBe(0);
  });

  it('включает зерно только при filmGrainEnabled', () => {
    const t = makeTargets();
    applyScenePostFx(t, makeInput({ filmGrainEnabled: false }));
    expect(t.noise.blendMode.opacity.value).toBe(0);
    const t2 = makeTargets();
    applyScenePostFx(t2, makeInput({ filmGrainEnabled: true, isUltraPreset: true, noiseOpacity: 0.018 }));
    expect(t2.noise.blendMode.opacity.value).toBe(0.018);
  });

  it('LUT-swap: LUT-сцена получает кэшированную текстуру, обычная — нейтральную', async () => {
    const { getCachedProceduralLut3DTexture, getNeutralProceduralLut3DTexture } = await import('@/engine/graphics/proceduralLutTextures');
    const t = makeTargets();
    applyScenePostFx(t, makeInput({ profile: resolveScenePostFxProfile('city_square') }));
    expect(t.lut.lut).toBe(getCachedProceduralLut3DTexture('cyber_noir'));

    const t2 = makeTargets();
    applyScenePostFx(t2, makeInput({ profile: resolveScenePostFxProfile('battle') }));
    expect(t2.lut.lut).toBe(getNeutralProceduralLut3DTexture());
  });

  it('lite: фиксированные BC/виньетка, eskil выключен даже для hero×ultra', () => {
    const t = makeTargets();
    applyScenePostFx(t, makeInput({
      profile: resolveScenePostFxProfile('volodka_room'),
      rendering: makeRendering({ useLitePostFx: true }),
      isUltraPreset: true,
      userBrightnessOffset: -0.03,
    }));
    expect(t.brightnessContrast.brightness).toBeCloseTo(0.06 - 0.03, 10);
    expect(t.brightnessContrast.contrast).toBe(-0.02);
    expect(t.vignette.eskil).toBe(false);
    expect(t.vignette.offset).toBe(0.38);
    // bloom — lite-константы
    expect(t.bloom.luminanceMaterial.threshold).toBe(0.75);
    expect(t.bloom.luminanceMaterial.smoothing).toBe(0.9);
  });

  it('GodRays: точечный pass.enabled для single-effect пасса + opacity 0 вне сцен', () => {
    const godRaysEffect = { blendMode: { opacity: { value: 0.55 } } };
    const pass = { enabled: true, effects: [godRaysEffect] };
    const t = makeTargets();
    (t as { godRays: unknown }).godRays = godRaysEffect;
    (t as { composer: unknown }).composer = { passes: [pass] };
    (t as { godRaysEffect: unknown }).godRaysEffect = godRaysEffect;

    // Сцена без godrays → пасс выключен, opacity 0
    applyScenePostFx(t, makeInput({ profile: resolveScenePostFxProfile('battle'), godRaysMounted: true }));
    expect(pass.enabled).toBe(false);
    expect(godRaysEffect.blendMode.opacity.value).toBe(0);

    // godrays-сцена + mounted → пасс включён
    applyScenePostFx(t, makeInput({ profile: resolveScenePostFxProfile('street_night'), godRaysMounted: true }));
    expect(pass.enabled).toBe(true);
  });

  it('setEffectPassEnabled: слитый пасс (2+ эффекта) не трогается', () => {
    const effectA = {};
    const effectB = {};
    const pass = { enabled: true, effects: [effectA, effectB] };
    const composer = { passes: [pass] };
    expect(setEffectPassEnabled(composer, effectA, false)).toBe(false);
    expect(pass.enabled).toBe(true);
  });

  it('setEffectPassEnabled: single-effect пасс переключается, отсутствие пасса — false', () => {
    const effect = {};
    const pass = { enabled: true, effects: [effect] };
    const composer = { passes: [pass, { enabled: true, effects: [{}] }] };
    expect(setEffectPassEnabled(composer, effect, false)).toBe(true);
    expect(pass.enabled).toBe(false);
    expect(setEffectPassEnabled(composer, { missing: true }, true)).toBe(false);
    expect(setEffectPassEnabled(null, effect, true)).toBe(false);
  });
});
