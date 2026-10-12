/* ─── N8AO mount gate — центральная политика включения ambient occlusion ───
 *
 * История (v4.45.2): N8AO был отключён целиком — его пасс выдавал NaN на
 * SwiftShader (софтверный рендер песочницы), отравляя весь кадр после
 * композера (чёрный экран на ultra). Расследование v4.48.7:
 *
 *   1. NaN воспроизводится ТОЛЬКО на софтверных растеризаторах
 *      (SwiftShader/llvmpipe): дегенеративная глубина (небо/далёкая плоскость)
 *      → вырожденные кросс-произведения при реконструкции нормалей →
 *      normalize(0) = NaN. На реальных GPU глубина дискретизирована иначе.
 *   2. Защита в два слоя (см. nanScrubEffect.ts):
 *      а) ГЕЙТ: на софтверном рендере N8AO не монтируется вовсе;
 *      б) СКРАБ: NaN-guard-эффект в следующем EffectPass детерминированно
 *         заменяет NaN/Inf на безопасные значения ДО остальных эффектов —
 *         даже если какой-то экзотический GPU воспроизведёт баг.
 *   3. Отладочный обход гейта: localStorage 'volodka:force-n8ao' = '1'
 *      монтирует N8AO даже на софтверном рендере — для живой проверки
 *      скраба в песочнице и будущих расследований.
 *
 * Остальные гейты — из очереди судей (приоритет №4):
 *   - пресет: high/ultra (allowsHeavyGfxFeature — существующая политика);
 *   - мобильные (coarsePointer): AO — фуллскрин-MRT на tiled GPU, риск для
 *     цели 60 fps — держим выключенным;
 *   - visualLite (пользовательский «облегчённый визуал»): тяжёлые фичи off.
 */

import { allowsHeavyGfxFeature, type HeavyGfxFeatureOptions } from './qualityFeatureGates';
import { getCachedWebGlGpuProbe } from './gpuQualityProbe';
import type { QualityPresetId } from './qualityPresets';

/** Debug override key: '1' forces N8AO mount even on software renderers. */
export const N8AO_FORCE_FLAG_KEY = 'volodka:force-n8ao';

let cachedForceFlag: boolean | null = null;

/** SSR-safe, exception-safe localStorage read (cached per session). */
export function isN8aoForceFlagEnabled(): boolean {
  if (cachedForceFlag !== null) return cachedForceFlag;
  cachedForceFlag = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      cachedForceFlag = window.localStorage.getItem(N8AO_FORCE_FLAG_KEY) === '1';
    }
  } catch {
    // Privacy mode / storage disabled — flag stays off.
  }
  return cachedForceFlag;
}

/** Test-only reset of the cached force flag. */
export function resetN8aoForceFlagForTests(): void {
  cachedForceFlag = null;
}

export interface N8aoMountGateOptions extends HeavyGfxFeatureOptions {
  /** Selected quality preset (not the resolved auto tier). */
  selectedPreset: QualityPresetId;
  /** Resolved preset id — 'auto' never enables heavy features. */
  resolvedPresetId: string;
  /** Пользовательский «облегчённый визуал». */
  visualLite: boolean;
  /** Software rasterizer probe (SwiftShader/llvmpipe/…). */
  isSoftwareRenderer: boolean;
}

/**
 * Structural mount decision for the N8AO pass. When false, N8AO is NOT
 * mounted at all (not even disabled) — the composer children rebuild on
 * structural changes, so a flip re-creates the pipeline correctly.
 */
export function shouldMountN8ao(options: N8aoMountGateOptions): boolean {
  const {
    selectedPreset,
    resolvedPresetId,
    visualLite,
    isSoftwareRenderer,
    coarsePointer,
  } = options;

  // Preset policy first (high/ultra only, auto → never).
  if (!allowsHeavyGfxFeature(selectedPreset, 'n8ao', { coarsePointer })) return false;

  // Resolved tier guard: preset.id must also be high/ultra (mirrors the
  // isHighOrUltraTier gate used by the rest of the postfx pipeline).
  if (resolvedPresetId !== 'high' && resolvedPresetId !== 'ultra') return false;

  // User preference: lite visuals exclude all heavy features.
  if (visualLite) return false;

  // Mobile (coarse pointer): fullscreen AO pass risks the 60fps budget
  // on tiled GPUs. The generic allowsHeavyGfxFeature does not gate 'n8ao'
  // by coarsePointer — we do it here deliberately.
  if (coarsePointer) return false;

  // Software rasterizer: N8AO emits NaN there (v4.45.2 evidence) — keep
  // it off unless the debug force flag is set (sandbox QA of the scrub).
  if (isSoftwareRenderer && !isN8aoForceFlagEnabled()) return false;

  return true;
}

/** Convenience: probe-based gate — reads the cached WebGL GPU probe. */
export function shouldMountN8aoWithProbe(
  options: Omit<N8aoMountGateOptions, 'isSoftwareRenderer'>,
): boolean {
  return shouldMountN8ao({
    ...options,
    isSoftwareRenderer: getCachedWebGlGpuProbe().isSoftwareRenderer,
  });
}
