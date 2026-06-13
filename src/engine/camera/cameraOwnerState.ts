/**
 * Central camera ownership — who drives camera.position each frame.
 */

export type CameraOwner =
  | 'exploration'
  | 'wakeUp'
  | 'cutscene'
  | 'transition'
  | 'cinematicFreeze';

let currentOwner: CameraOwner = 'exploration';

export function getCameraOwner(): CameraOwner {
  return currentOwner;
}

export function registerCameraOwner(owner: CameraOwner): void {
  currentOwner = owner;
}

export function releaseCameraOwner(owner: CameraOwner): void {
  if (currentOwner === owner) {
    currentOwner = 'exploration';
  }
}

export function isCameraOwnedBy(owner: CameraOwner): boolean {
  return currentOwner === owner;
}

/** True when FollowCamera should yield its useFrameTick update. */
export function shouldFollowCameraYield(): boolean {
  return currentOwner === 'wakeUp' || currentOwner === 'cutscene';
}
