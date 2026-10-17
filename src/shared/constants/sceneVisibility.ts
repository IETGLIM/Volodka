/* ─── Global scene readability tuning ───
 *  Noir mood is preserved; these lifts prevent pitch-black exploration. */

export const SCENE_VISIBILITY = {
  /** Multiplier on per-scene ambientIntensity from scene config.
   *  FIX (v4.56): 1.55 → 2.1 — игрок: «уровень сырой и кривой, кромешная тьма».
   *  Noir-настроение сохраняется ламповыми цветами и виньеткой, а не чёрнотой. */
  ambientScale: 2.1,
  /** Hemisphere light multiplier (outdoor / indoor) */
  outdoorHemisphereMul: 1.9,
  indoorHemisphereMul: 1.35,
  /** Subtle fill present in every exploration scene.
   *  FIX (v4.56): 0.28 → 0.4 — базовая читаемость во всех сценах. */
  baseAmbientIntensity: 0.4,
  /** Scene-config point lights */
  pointLightScale: 1.5,
  /** Post-FX brightness offset (added to per-scene grade).
   *  FIX (v4.56): 0.06 → 0.1 */
  postFxBrightnessLift: 0.1,
  /** Slightly lower contrast so shadows aren't crushed */
  postFxContrastReduction: 0.04,
  /** ACES exposure in ExplorationPostFX.
   *  FIX (v4.56): 1.22 → 1.34 — поднимаем средние тона. */
  toneExposure: 1.34,
  /** Vignette darkness multiplier (lower = lighter edges).
   *  FIX (v4.56): 0.55 → 0.42 — края экрана не гаснут в черноту. */
  vignetteDarknessScale: 0.42,
  /** Push fog away from the camera */
  fogNearScale: 1.3,
  fogFarScale: 1.55,
  /** Lift fog / background hex toward mid-tones (0–1).
   *  FIX (v4.56): 0.22 → 0.32 — туман читается как дымка, а не как стена. */
  fogColorLift: 0.32,
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
