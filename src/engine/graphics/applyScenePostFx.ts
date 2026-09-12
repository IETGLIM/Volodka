/**
 * Императивное применение пер-сценного профиля пост-обработки — этап 98.
 *
 * Раньше смена сцены меняла pipelineKey → ремaунт всего EffectComposer'а и
 * 8–10 перекомпиляций шейдеров (250–2000 мс stall). Теперь:
 *  1) дети композера — фиксированный суперсед пассов с константными props
 *     (любое изменение props обёртки @react-three/postprocessing пересоздаёт
 *     инстанс эффекта через args-мемо);
 *  2) все пер-сценные вариации — императивная запись в инстансы эффектов
 *     через refs (сеттеры postprocessing 6.39) + pass.enabled / LUT-swap;
 *  3) композер ремaунтится только при смене renderer'а (glInstanceKey).
 *
 * Модуль без React-импортов: чистые рантайм-хелперы покрываются unit-тестами,
 * applier принимает узкие структурные типы вместо конкретных классов.
 */

import type { Texture } from 'three';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import {
  getCachedProceduralLut3DTexture,
  getNeutralProceduralLut3DTexture,
} from '@/engine/graphics/proceduralLutTextures';
import type { ScenePostFxProfile } from '@/engine/graphics/scenePostFxProfiles';
import type { SceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import type { PoemPostFxBoost } from '@/engine/poemWorld/poemPostFxBoost';

/* ─── Узкие структурные типы (поверхность сеттеров postprocessing 6.39) ─── */

export interface BlendModeLike {
  opacity: { value: number };
}

export interface BlendModeHostLike {
  blendMode: BlendModeLike;
}

export interface BloomLike {
  intensity: number;
  luminanceMaterial: { threshold: number; smoothing: number };
}

export interface VignetteLike {
  offset: number;
  darkness: number;
  eskil: boolean;
  blendMode: BlendModeLike;
}

export interface HueSaturationLike {
  hue: number;
  saturation: number;
}

export interface BrightnessContrastLike {
  brightness: number;
  contrast: number;
}

export interface ChromaticAberrationLike {
  uniforms: Map<string, { value: unknown }>;
}

/** Нейтральная LUT-текстура — тождественное преобразование. */
export interface LutLike {
  lut: Texture;
}

export interface ToneMappingLike {
  mode: number;
}

export interface N8aoConfigurationLike {
  aoRadius: number;
  intensity: number;
  color: string;
}

export interface N8aoLike {
  enabled: boolean;
  configuration: N8aoConfigurationLike;
}

export interface GodRaysLike {
  blendMode: BlendModeLike;
}

export interface ComposerPassLike {
  enabled?: boolean;
  effects?: unknown[];
}

export interface ComposerLike {
  passes: unknown[];
}

/** Все точки императивного применения. null = пасс не смонтирован (lite-ветка/гейт). */
export interface ScenePostFxTargets {
  bloom: BloomLike | null;
  vignette: VignetteLike | null;
  hueSaturation: HueSaturationLike | null;
  brightnessContrast: BrightnessContrastLike | null;
  chromatic: ChromaticAberrationLike | null;
  /** Сканлайны управляются через blendMode.opacity (вкл/выкл без ремaунта). */
  scanline: BlendModeHostLike | null;
  /** Зерно управляется через blendMode.opacity. */
  noise: BlendModeHostLike | null;
  lut: LutLike | null;
  toneMapping: ToneMappingLike | null;
  n8ao: N8aoLike | null;
  godRays: GodRaysLike | null;
  composer: ComposerLike | null;
  /** Инстанс SMAAEffect для точечного включения его EffectPass. */
  smaaEffect: unknown;
  /** Инстанс GodRaysEffect для точечного включения его EffectPass. */
  godRaysEffect: unknown;
}

export interface ScenePostFxApplyInput {
  profile: ScenePostFxProfile;
  rendering: SceneRenderingPipeline;
  /** Финальный гейт N8AO: rendering.useAmbientOcclusion && shouldUseDenseSceneAmbientOcclusion(...). */
  useAmbientOcclusion: boolean;
  noirMode: boolean;
  userBrightnessOffset: number;
  vignetteEnabled: boolean;
  filmGrainEnabled: boolean;
  /** ToneMappingMode.AGX / ACES_FILMIC (число — без импорта enum в тесты). */
  toneMappingMode: number;
  /** ultra-пресет: eskil-виньетка hero-сцен. */
  isUltraPreset: boolean;
  /** Плотность зерна по тирам: ultra 0.018, high 0.035. */
  noiseOpacity: number;
  /** Виталы — только для стартовых значений; дальше уточняет покадровый тик. */
  stress: number;
  energy: number;
  poemBoost: PoemPostFxBoost;
  /** Хроматика: базовый гейт (softOk/тир/настройка/reduced-motion). */
  chromaticEligible: boolean;
  /** Стресс-рампа хроматики — только high-пресет. */
  chromaticStressRampEligible: boolean;
  /** GodRays смонтирован (ultra-структура + готовый sun mesh). */
  godRaysMounted: boolean;
  /** SMAA смонтирован и должен быть включён. */
  smaaWanted: boolean;
}

/* ─── Чистые рантайм-хелперы (формулы байт-в-байт из прежнего рендера) ─── */

export interface BloomRuntime {
  intensity: number;
  threshold: number;
  smoothing: number;
}

/**
 * Рантайм-параметры блума.
 * lite = фиксированные значения lite-ветки; full = профиль сцены +
 * стресс/стихотворный буст, масштаб профиля сцены (hero 1.08/1.14).
 */
export function computeBloomRuntime(
  lite: boolean,
  profile: ScenePostFxProfile | null,
  bloomIntensityScale: number,
  stressFactor: number,
  poemBoost: PoemPostFxBoost,
): BloomRuntime {
  if (lite || !profile) {
    return {
      intensity: (0.45 + poemBoost.bloomIntensity) * bloomIntensityScale,
      threshold: 0.75,
      smoothing: 0.9,
    };
  }
  return {
    intensity:
      (profile.bloom.intensity + stressFactor * 0.1 + poemBoost.bloomIntensity)
      * bloomIntensityScale,
    threshold: Math.max(0.45, profile.bloom.threshold - profile.bloomEmissiveBoost),
    smoothing: profile.bloom.smoothing,
  };
}

export interface VignetteRuntime {
  offset: number;
  darkness: number;
}

/** Стресс-реактивная виньетка: пороговое затемнение со стресса > 60 + вклад энергии.
 * lite-ветка — фиксированные значения без стресс-реактивности (parity с прежним кодом). */
export function computeVignetteRuntime(
  profile: ScenePostFxProfile,
  opts: { lite?: boolean; noirMode: boolean; stress: number; energy: number; poemBoost: PoemPostFxBoost },
): VignetteRuntime {
  if (opts.lite) {
    return {
      offset: 0.38,
      darkness: Math.min(0.28 * SCENE_VISIBILITY.vignetteDarknessScale + opts.poemBoost.vignetteDarkness, 0.75),
    };
  }
  const effectiveVignetteDarkness = Math.min(
    (opts.noirMode ? Math.min(profile.vignette.darkness + 0.15, 0.95) : profile.vignette.darkness)
      * SCENE_VISIBILITY.vignetteDarknessScale,
    0.75,
  );
  // Стресс-фактор пороговый (не линейный) — заметный кинематографичный ключ при высоком напряжении.
  const stressThresholdFactor = Math.max(0, (opts.stress - 60) / 40);
  // Низкая энергия затемняет края (прокси здоровья — измотанный герой видит темнее).
  const energyFactor = Math.max(0, 1 - (opts.energy ?? 100) / 100);

  return {
    darkness: Math.min(
      effectiveVignetteDarkness
        + stressThresholdFactor * 0.18
        + energyFactor * 0.08
        + opts.poemBoost.vignetteDarkness,
      0.75,
    ),
    offset: Math.max(
      profile.vignette.offset - stressThresholdFactor * 0.2 - energyFactor * 0.08,
      0.1,
    ),
  };
}

export interface ChromaticRuntime {
  totalAmount: number;
  offsetX: number;
  offsetY: number;
}

/** Хроматическая аберрация: базовый пер-сценный характер + стресс-рампа (только high). */
export function computeChromaticRuntime(
  profile: ScenePostFxProfile,
  opts: { eligible: boolean; stressRampEligible: boolean; stress: number },
): ChromaticRuntime {
  const stressChromaticAmount = opts.stressRampEligible
    ? profile.chromatic.stressMax * Math.max(0, (opts.stress - 70) / 30) // 0 при стрессе ≤70, 1 при 100
    : 0;
  const baseChromaticAmount = opts.eligible ? profile.chromatic.baseAmount : 0;
  const totalChromaticAmount = baseChromaticAmount + stressChromaticAmount;
  return {
    totalAmount: totalChromaticAmount,
    offsetX: totalChromaticAmount * 0.012,
    offsetY: totalChromaticAmount * 0.009,
  };
}

export interface GradeRuntime {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
}

/** Цветокоррекция: noire-модификаторы + глобальные константы SCENE_VISIBILITY + пользовательская яркость. */
export function computeGradeRuntime(
  profile: ScenePostFxProfile,
  opts: { noirMode: boolean; userBrightnessOffset: number },
): GradeRuntime {
  return {
    hue: profile.colorGrade.hue,
    saturation: opts.noirMode
      ? Math.min(profile.colorGrade.saturation - 0.35, 0)
      : profile.colorGrade.saturation,
    contrast: Math.max(
      0,
      (opts.noirMode ? profile.colorGrade.contrast + 0.15 : profile.colorGrade.contrast)
        - SCENE_VISIBILITY.postFxContrastReduction,
    ),
    brightness:
      profile.colorGrade.brightness
      + SCENE_VISIBILITY.postFxBrightnessLift
      + opts.userBrightnessOffset,
  };
}

/* ─── Точечное включение EffectPass по инстансу эффекта ─── */

/**
 * Включает/выключает EffectPass, содержащий ровно указанный эффект.
 * Слитые пассы (несколько эффектов в одном EffectPass) точечно переключать
 * нельзя — заденет соседей; в этом случае функция безопасно возвращает false.
 * CONVOLUTION-эффекты (GodRays, SMAA, Bloom, DOF) всегда живут в собственном пассе.
 */
export function setEffectPassEnabled(
  composer: ComposerLike | null,
  effect: unknown,
  enabled: boolean,
): boolean {
  if (!composer || !effect) return false;
  for (const pass of composer.passes) {
    if (!pass || typeof pass !== 'object') continue;
    const effects = (pass as ComposerPassLike).effects;
    if (!Array.isArray(effects) || effects.length !== 1 || effects[0] !== effect) continue;
    const passLike = pass as { enabled?: boolean };
    if (typeof passLike.enabled !== 'boolean') return false;
    if (passLike.enabled !== enabled) passLike.enabled = enabled;
    return true;
  }
  return false;
}

/* ─── Императивное применение профиля ─── */

/**
 * Применяет профиль сцены ко всем смонтированным пассам. Идемпотентна:
 * вызывается на монтировании, на scene:transition_start (targetSceneId, под
 * визиром SceneTransitionVeil) и на изменение пользовательских настроек.
 * Покадрово стресс/энергия/поэм-буст уточняют bloom/vignette/chromatic тиком.
 */
export function applyScenePostFx(
  targets: ScenePostFxTargets,
  input: ScenePostFxApplyInput,
): void {
  const { profile, rendering } = input;
  const lite = rendering.useLitePostFx;
  const stressFactor = input.stress / 100;

  // ── Bloom: порог/сглаживание — чисто пер-сценные; интенсивность — стартовая (уточняется тиком). ──
  const bloom = targets.bloom;
  if (bloom) {
    const bloomRuntime = computeBloomRuntime(
      lite,
      profile,
      rendering.bloomIntensityScale,
      stressFactor,
      input.poemBoost,
    );
    bloom.intensity = bloomRuntime.intensity;
    bloom.luminanceMaterial.threshold = bloomRuntime.threshold;
    bloom.luminanceMaterial.smoothing = bloomRuntime.smoothing;
  }

  // ── Vignette: eskil (только full×hero×ultra), стартовая форма, вкл/выкл через opacity. ──
  const vignette = targets.vignette;
  if (vignette) {
    vignette.eskil = !lite && input.isUltraPreset && profile.isHeroPostFx;
    const vignetteRuntime = computeVignetteRuntime(profile, {
      lite,
      noirMode: input.noirMode,
      stress: input.stress,
      energy: input.energy,
      poemBoost: input.poemBoost,
    });
    vignette.offset = vignetteRuntime.offset;
    vignette.darkness = vignetteRuntime.darkness;
    vignette.blendMode.opacity.value = input.vignetteEnabled ? 1 : 0;
  }

  // ── Цветокоррекция: lite — фиксированный BC (без HueSaturation); full — профиль сцены. ──
  if (lite) {
    if (targets.brightnessContrast) {
      targets.brightnessContrast.brightness =
        SCENE_VISIBILITY.postFxBrightnessLift + input.userBrightnessOffset;
      targets.brightnessContrast.contrast = -0.02;
    }
  } else {
    const grade = computeGradeRuntime(profile, {
      noirMode: input.noirMode,
      userBrightnessOffset: input.userBrightnessOffset,
    });
    if (targets.hueSaturation) {
      targets.hueSaturation.hue = grade.hue;
      targets.hueSaturation.saturation = grade.saturation;
    }
    if (targets.brightnessContrast) {
      targets.brightnessContrast.brightness = grade.brightness;
      targets.brightnessContrast.contrast = grade.contrast;
    }
  }

  // ── Chromatic aberration: мутируем uniform offset на месте (без аллокаций). ──
  const chromatic = targets.chromatic;
  if (chromatic) {
    const chromaticRuntime = computeChromaticRuntime(profile, {
      eligible: input.chromaticEligible,
      stressRampEligible: input.chromaticStressRampEligible,
      stress: input.stress,
    });
    const offsetUniform = chromatic.uniforms.get('offset');
    const offsetValue = offsetUniform?.value as { x: number; y: number } | undefined;
    if (offsetValue && typeof offsetValue.x === 'number') {
      offsetValue.x = chromaticRuntime.offsetX;
      offsetValue.y = chromaticRuntime.offsetY;
    }
  }

  // ── Scanline / Noise: вкл/выкл через opacity. ──
  if (targets.scanline) {
    targets.scanline.blendMode.opacity.value = profile.wantsScanlines ? 1 : 0;
  }
  if (targets.noise) {
    targets.noise.blendMode.opacity.value =
      profile.wantsNoise && input.filmGrainEnabled ? input.noiseOpacity : 0;
  }

  // ── LUT: чистый uniform-swap (все процедурные LUT 16³ UnsignedByte → без redefine). ──
  if (targets.lut) {
    targets.lut.lut = profile.lutKind
      ? getCachedProceduralLut3DTexture(profile.lutKind)
      : getNeutralProceduralLut3DTexture();
  }

  // ── Tone mapping: режим переключается сеттером (AgX ↔ ACES). ──
  // exposure НЕ пишем: ToneMappingEffect в postprocessing 6.39 не имеет
  // exposure — проп исторически no-op, поведение сохранено байт-в-байт.
  if (targets.toneMapping) {
    targets.toneMapping.mode = input.toneMappingMode;
  }

  // ── N8AO: пер-сценный гейт + конфигурация (Proxy-сеттеры n8ao). ──
  const n8ao = targets.n8ao;
  if (n8ao) {
    n8ao.enabled = input.useAmbientOcclusion;
    n8ao.configuration.aoRadius = rendering.aoRadius;
    n8ao.configuration.intensity = rendering.aoIntensity;
    n8ao.configuration.color = profile.aoColor;
  }

  // ── GodRays: точечное включение собственного EffectPass + нулевая opacity вне сцен. ──
  const godRaysWanted = input.godRaysMounted && !!profile.godRaysSun;
  setEffectPassEnabled(targets.composer, targets.godRaysEffect, godRaysWanted);
  if (targets.godRays && !godRaysWanted) {
    targets.godRays.blendMode.opacity.value = 0;
  }

  // ── SMAA: точечное включение (если пасс слит — setEffectPassEnabled вернёт false,
  //     SMAA остаётся всегда включённым, что эквивалентно прежнему поведению). ──
  setEffectPassEnabled(targets.composer, targets.smaaEffect, input.smaaWanted);
}
