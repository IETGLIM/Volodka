/**
 * Exploration third-person camera baseline.
 * Kept separate from physics constants to avoid cross-domain coupling.
 */
export const CAMERA_CONSTANTS = {
  CAMERA_DISTANCE: 5,
  CAMERA_HEIGHT: 2,
  CAMERA_SMOOTHING: 0.1,
} as const;
