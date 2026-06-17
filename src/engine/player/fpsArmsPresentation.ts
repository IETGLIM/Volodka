/** Khronos / Soldier interim rigs in legacy 100+ unit exports. */
export const FULL_BODY_INTERIM_MIN_HEIGHT_UNITS = 8;
/** Arms-only FPS GLBs are well under humanoid height (metres). Soldier interim ≈1.8 m. */
export const FPS_ARMS_ONLY_MAX_HEIGHT_M = 1.0;
/** Scale for Khronos-style FPS arm rigs (procedural finger coords). */
export const FPS_PROCEDURAL_RIG_SCALE = 0.012;

/** Interim full-body rigs → hide mesh, procedural finger caps at FPS_PROCEDURAL_RIG_SCALE. */
export function resolveFpsArmsProceduralOnly(
  boundsHeightY: number,
  hasFingerDetail: boolean,
): boolean {
  if (boundsHeightY > FULL_BODY_INTERIM_MIN_HEIGHT_UNITS) return true;
  if (boundsHeightY > FPS_ARMS_ONLY_MAX_HEIGHT_M) return true;
  return !hasFingerDetail;
}

export function resolveFpsArmsRigScale(proceduralOnly: boolean): number {
  return proceduralOnly ? FPS_PROCEDURAL_RIG_SCALE : 1;
}
