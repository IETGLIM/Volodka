
/* ─── Volodka RPG – Mobile particle / fog scaling ───
 *  Single source for reducing particle counts and fog plane layers
 *  on mobile viewports and low-DPR visualLite profiles.
 *
 *  Used by weather, atmospheric, and fog systems in R3F scenes.
 *  Pair with useIsMobileVisual() + useMobileVisualPerf() from use-mobile.
 */

/** Particle count multiplier on mobile viewports (< 1024px) */
export const MOBILE_PARTICLE_MULTIPLIER = 0.3;

/** Particle count multiplier when visualLite is active (narrow viewport or DPR < 1.5) */
export const VISUAL_LITE_PARTICLE_MULTIPLIER = 0.25;

/** Max volumetric fog planes on mobile */
export const MOBILE_FOG_PLANE_MAX = 3;

/** Max volumetric fog planes when visualLite is active */
export const VISUAL_LITE_FOG_PLANE_MAX = 2;

function particleMultiplier(isMobile: boolean, visualLite?: boolean): number {
  if (!isMobile && !visualLite) return 1;
  return visualLite ? VISUAL_LITE_PARTICLE_MULTIPLIER : MOBILE_PARTICLE_MULTIPLIER;
}

/** Scale a base particle count for the current mobile/visual profile. Always ≥ 1. */
export function getParticleCount(
  base: number,
  isMobile: boolean,
  visualLite?: boolean,
): number {
  const scaled = base * particleMultiplier(isMobile, visualLite);
  return Math.max(1, Math.round(scaled));
}

/** Scale volumetric fog plane count — caps layers to reduce mobile overdraw. Always ≥ 1. */
export function getFogPlaneCount(
  base: number,
  isMobile: boolean,
  visualLite?: boolean,
): number {
  if (!isMobile && !visualLite) return base;
  const cap = visualLite ? VISUAL_LITE_FOG_PLANE_MAX : MOBILE_FOG_PLANE_MAX;
  return Math.max(1, Math.min(base, cap));
}
