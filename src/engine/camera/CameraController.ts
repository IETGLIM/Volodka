import { followCameraCollisionDamp, followCameraSmoothDamp } from '@/lib/followCameraDamp';

export type ExplorationCameraMode = 'exploration' | 'dialogue';

export type CameraFollowParams = {
  distance: number;
  height: number;
  smoothness: number;
  shoulderOffset: number;
  lookAtHeightOffset: number;
};

/**
 * Pure damping factors shared with `FollowCamera` (orbit + collision pull).
 * Orbit construction stays in `FollowCamera` until a full extract is justified.
 */
export const cameraDamp = {
  smooth: followCameraSmoothDamp,
  collision: followCameraCollisionDamp,
} as const;
