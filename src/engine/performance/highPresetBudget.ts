/**
 * Locked High-preset performance envelope for mid-laptop AAA target.
 * Adaptive degrade must not gut atmosphere below these floors.
 */

export const HIGH_PRESET_BUDGET = {
  targetFps: 60,
  /** Soft warn band — sustained dips here trigger softWork thinning, not PostFX kill. */
  warnFps: 52,
  /** Hard floor — only then may High drop effectsScale (PostFX stays on). */
  criticalFps: 42,
  maxDpr: 1.5,
  effectsScale: 0.78,
  maxDrawDistanceM: 78,
  minEffectsScaleUnderPressure: 0.45,
} as const;

export type HighFpsSample = {
  fps: number;
  ok: boolean;
  band: 'target' | 'warn' | 'critical';
};

export function classifyHighPresetFps(fps: number): HighFpsSample {
  if (fps >= HIGH_PRESET_BUDGET.targetFps) {
    return { fps, ok: true, band: 'target' };
  }
  if (fps >= HIGH_PRESET_BUDGET.warnFps) {
    return { fps, ok: true, band: 'warn' };
  }
  if (fps >= HIGH_PRESET_BUDGET.criticalFps) {
    return { fps, ok: false, band: 'warn' };
  }
  return { fps, ok: false, band: 'critical' };
}

/** Rolling average helper for runtime FPS probes / judge evidence. */
export function averageFps(samples: readonly number[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}
