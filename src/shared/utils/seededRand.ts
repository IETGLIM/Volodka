/**
 * Deterministic pseudo-random number generator.
 * Uses the same formula as GLSL's fract(sin(dot(...))).
 * Avoids hydration mismatch between SSR and client rendering.
 */
export function seededRand(seed: number): number {
  const s = Number.isFinite(seed) ? seed : 0;
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
}
