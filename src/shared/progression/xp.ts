/** XP curve — shared by store slices and combat formulas (no store import). */

export function calculateXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}
