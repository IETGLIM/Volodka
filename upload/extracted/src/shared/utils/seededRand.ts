/**
 * Deterministic pseudo-random number generator.
 * Uses the same formula as GLSL's fract(sin(dot(...))).
 * Avoids hydration mismatch between SSR and client rendering.
 */
export function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
