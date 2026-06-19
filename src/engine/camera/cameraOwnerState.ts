/**
 * Central camera ownership — who drives camera.position each frame.
 * Priority (high → low): cutscene > wakeUp > cinematicFreeze > transition > followCamera
 */

export type CameraOwner =
  | 'followCamera'
  | 'wakeUp'
  | 'timeline'
  | 'cutscene'
  | 'transition'
  | 'cinematicFreeze';

const OWNER_PRIORITY: Record<CameraOwner, number> = {
  cutscene: 5,
  wakeUp: 4,
  timeline: 4,
  cinematicFreeze: 3,
  transition: 2,
  followCamera: 1,
};

let currentOwner: CameraOwner = 'followCamera';

export function getCameraOwner(): CameraOwner {
  return currentOwner;
}

export function acquireCameraOwnership(owner: CameraOwner): boolean {
  if (currentOwner === owner) return true;
  if (OWNER_PRIORITY[owner] >= OWNER_PRIORITY[currentOwner]) {
    currentOwner = owner;
    return true;
  }
  return false;
}

export function releaseCameraOwnership(owner: CameraOwner): void {
  if (currentOwner === owner) {
    currentOwner = 'followCamera';
  }
}

export function canWriteCamera(owner: CameraOwner): boolean {
  return currentOwner === owner;
}

export function isCameraOwnedBy(owner: CameraOwner): boolean {
  return currentOwner === owner;
}

/** True when FollowCamera should skip its useFrameTick (external owner driving). */
export function shouldFollowCameraYield(): boolean {
  return !canFollowCameraDriveFrame();
}

/** FollowCamera drives cutscene/transition/cinematicFreeze/followCamera; wakeUp is external. */
export function canFollowCameraDriveFrame(): boolean {
  const owner = getCameraOwner();
  switch (owner) {
    case 'followCamera':
    case 'cutscene':
    case 'transition':
    case 'cinematicFreeze':
      return true;
    case 'wakeUp':
    case 'timeline':
      return false;
    default: {
      const _exhaustive: never = owner;
      return _exhaustive;
    }
  }
}

/** @deprecated Use acquireCameraOwnership */
export function registerCameraOwner(owner: CameraOwner): void {
  acquireCameraOwnership(owner);
}

/** @deprecated Use releaseCameraOwnership */
export function releaseCameraOwner(owner: CameraOwner): void {
  releaseCameraOwnership(owner);
}

/** Test helper — reset module state between unit tests. */
export function resetCameraOwnershipForTests(): void {
  currentOwner = 'followCamera';
}
