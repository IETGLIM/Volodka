/* ─── Global scene readability tuning ───
 *  Noir mood is preserved; these lifts prevent pitch-black exploration. */

export const SCENE_VISIBILITY = {
  /** Multiplier on per-scene ambientIntensity from scene config */
  ambientScale: 1.55,
  /** Hemisphere light multiplier (outdoor / indoor) */
  outdoorHemisphereMul: 1.65,
  indoorHemisphereMul: 1.05,
  /** Subtle fill present in every exploration scene */
  baseAmbientIntensity: 0.28,
  /** Scene-config point lights */
  pointLightScale: 1.35,
  /** Post-FX brightness offset (added to per-scene grade) */
  postFxBrightnessLift: 0.06,
  /** Slightly lower contrast so shadows aren't crushed */
  postFxContrastReduction: 0.03,
  /** ACES exposure in ExplorationPostFX */
  toneExposure: 1.22,
  /** Vignette darkness multiplier (lower = lighter edges) */
  vignetteDarknessScale: 0.55,
  /** Push fog away from the camera */
  fogNearScale: 1.2,
  fogFarScale: 1.4,
  /** Lift fog / background hex toward mid-tones (0–1) */
  fogColorLift: 0.22,
} as const;

/** Lighten a hex color toward white for fog/background readability */
export function liftHexColor(hex: string, amount: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
  if (normalized.length !== 6) return hex;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const lift = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);

  const toHex = (n: number) => lift(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
