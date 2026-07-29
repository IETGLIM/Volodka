/**
 * Wake-up intro timing, camera paths, and easing — shared by 3D sequence + overlay.
 */

import * as THREE from 'three';
import { LOOK_HEIGHT } from '@/engine/camera/cameraConstants';

export const WAKEUP_PHASE = {
  terminal: 4.6,   // longer terminal hold — show-don't-tell room beat
  rise: 4.0,
  standing: 2.8,   // hold on lived-in apartment silhouette
  walking: 5.2,
  sitting: 3.2,
  settle: 2.2,     // pause before monitor push-in
  monitor: 6.2,
  handoff: 3.0,
} as const;

export const WAKEUP_TOTAL =
  WAKEUP_PHASE.terminal +
  WAKEUP_PHASE.rise +
  WAKEUP_PHASE.standing +
  WAKEUP_PHASE.walking +
  WAKEUP_PHASE.sitting +
  WAKEUP_PHASE.settle +
  WAKEUP_PHASE.monitor +
  WAKEUP_PHASE.handoff;

export const WAKEUP_FALLBACK_MS = (WAKEUP_TOTAL + 2) * 1000;

export const BED_POSITION = new THREE.Vector3(0.5, 0.01, 2.4);
export const STAND_POSITION = new THREE.Vector3(0.3, 0.01, 1.5);
export const DESK_POSITION = new THREE.Vector3(0.0, 0.01, -1.0);
export const CHAIR_POSITION = new THREE.Vector3(0.0, 0.01, -1.3);
/** Third-person handoff behind the desk — matches exploration orbit framing. */
export const DESK_EXPLORATION_CAM = {
  position: new THREE.Vector3(0.0, LOOK_HEIGHT + 0.25, 1.15),
  lookAt: new THREE.Vector3(0, LOOK_HEIGHT, -1.0),
  fov: 54,
};

const FAR_CORNER = new THREE.Vector3(-2.2, 2.6, -3.0);

export interface WakeCameraWaypoint {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  duration: number;
  controlPoint?: THREE.Vector3;
}

export const WAKEUP_CAMERA_WAYPOINTS: WakeCameraWaypoint[] = [
  {
    position: new THREE.Vector3(0.15, 1.08, -2.15),
    lookAt: new THREE.Vector3(0, 1.02, -2.48),
    fov: 36,
    duration: WAKEUP_PHASE.terminal,
  },
  {
    position: new THREE.Vector3(1.55, 1.25, 2.85),
    lookAt: new THREE.Vector3(0.5, 0.75, 2.35),
    fov: 48,
    duration: WAKEUP_PHASE.rise,
    controlPoint: new THREE.Vector3(0.9, 1.4, 1.2),
  },
  {
    position: new THREE.Vector3(-1.65, 1.35, 1.75),
    lookAt: new THREE.Vector3(0.35, 0.95, 1.55),
    fov: 52,
    duration: WAKEUP_PHASE.standing,
    controlPoint: new THREE.Vector3(-0.4, 1.5, 2.2),
  },
  {
    position: new THREE.Vector3(1.45, 1.55, 0.6),
    lookAt: new THREE.Vector3(0.05, 0.85, -0.6),
    fov: 56,
    duration: WAKEUP_PHASE.walking,
    controlPoint: new THREE.Vector3(0.8, 1.7, 1.4),
  },
  {
    position: new THREE.Vector3(1.85, 1.28, -0.35),
    lookAt: new THREE.Vector3(0, 0.72, -1.35),
    fov: 50,
    duration: WAKEUP_PHASE.sitting,
    controlPoint: new THREE.Vector3(1.2, 1.1, -0.9),
  },
  {
    position: new THREE.Vector3(0.35, 1.58, -0.15),
    lookAt: new THREE.Vector3(0, 0.95, -2.2),
    fov: 54,
    duration: WAKEUP_PHASE.settle,
    controlPoint: new THREE.Vector3(0.9, 1.45, -0.8),
  },
  // Phase: monitor — camera pushes in close to the screen, showing poem lines
  // and the "sync soon" notification. Tight fov for a cinematic close-up.
  {
    position: new THREE.Vector3(0.0, 1.15, -0.8),
    lookAt: new THREE.Vector3(0, 1.1, -2.5),
    fov: 28,
    duration: WAKEUP_PHASE.monitor,
    controlPoint: new THREE.Vector3(0.15, 1.3, -1.5),
  },
];

export const WAKEUP_CAMERA_START = {
  position: FAR_CORNER,
  lookAt: WAKEUP_CAMERA_WAYPOINTS[0].lookAt.clone(),
  fov: WAKEUP_CAMERA_WAYPOINTS[0].fov,
};

export function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** Y rotation so a humanoid model (GLB facing +Z, with FORWARD_OFFSET=π applied
 *  by CesiumPlayerModel to face -Z) faces the movement direction (dx, dz).
 *
 *  Derivation: CesiumPlayerModel applies total rotation = facingY + π.
 *  For a +Z-facing model, the rotation to face (dx, dz) is atan2(dx, dz).
 *  So we need facingY + π = atan2(dx, dz), i.e. facingY = atan2(dx, dz) - π
 *  = atan2(-dx, -dz) (by the atan2 identity atan2(y,x) - π = atan2(-y,-x)).
 *
 *  Note: we use `0 - dx` instead of `-dx` to avoid producing -0 (negative zero),
 *  which would make atan2(-0, -1) return -π instead of π. (Task 5-B #5.)
 *
 *  Previously this returned atan2(dx, -dz), which has the sign of dx flipped —
 *  the avatar walked backwards for X-dominant movement. */
export function facingYFromDirection(dx: number, dz: number): number {
  return Math.atan2(0 - dx, 0 - dz);
}

export function facingYBetween(from: THREE.Vector3, to: THREE.Vector3): number {
  return facingYFromDirection(to.x - from.x, to.z - from.z);
}

export function clampToVolodkaRoom(v: THREE.Vector3): THREE.Vector3 {
  v.x = Math.max(-2.3, Math.min(2.3, v.x));
  v.z = Math.max(-3.3, Math.min(3.3, v.z));
  v.y = Math.max(0.5, Math.min(2.8, v.y));
  return v;
}

function quadraticBezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
}

export function lerpWakeCamera(
  fromPos: THREE.Vector3,
  fromLook: THREE.Vector3,
  fromFov: number,
  wp: WakeCameraWaypoint,
  t: number,
  outPos: THREE.Vector3,
  outLook: THREE.Vector3,
  clampRoom?: boolean,
): number {
  const e = easeInOutCubic(t);
  if (wp.controlPoint) {
    outPos.copy(quadraticBezier(fromPos, wp.controlPoint, wp.position, e));
    const lookCtrl = new THREE.Vector3().lerpVectors(fromLook, wp.lookAt, 0.45);
    outLook.copy(quadraticBezier(fromLook, lookCtrl, wp.lookAt, e));
  } else {
    outPos.lerpVectors(fromPos, wp.position, e);
    outLook.lerpVectors(fromLook, wp.lookAt, e);
  }
  if (clampRoom) clampToVolodkaRoom(outPos);
  return fromFov + (wp.fov - fromFov) * e;
}

/** Blend from a cinematic position toward a destination camera spec (handoff phase).
 *  If `targetCam` is provided, interpolates toward that; otherwise falls back
 *  to the default desk exploration camera. */
export function applyHandoffCamera(
  t: number,
  fromPos: THREE.Vector3,
  fromLook: THREE.Vector3,
  fromFov: number,
  camera: THREE.PerspectiveCamera,
  targetCam?: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number },
  clampRoom?: boolean,
): void {
  const dest = targetCam ?? DESK_EXPLORATION_CAM;
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(fromPos, dest.position, e);
  if (clampRoom) clampToVolodkaRoom(camera.position);
  const look = new THREE.Vector3().lerpVectors(fromLook, dest.lookAt, e);
  camera.lookAt(look);
  camera.fov = fromFov + (dest.fov - fromFov) * e;
  camera.updateProjectionMatrix();
}

export function choreographyPhase(elapsed: number): {
  phase: 'terminal' | 'bed' | 'stand' | 'walk' | 'sit';
  localT: number;
} {
  const d = WAKEUP_PHASE;
  const t1 = d.terminal;
  const t2 = t1 + d.rise;
  const t3 = t2 + d.standing;
  const t4 = t3 + d.walking;

  if (elapsed < t1) {
    return { phase: 'terminal', localT: elapsed / t1 };
  }
  if (elapsed < t2) {
    return { phase: 'bed', localT: (elapsed - t1) / d.rise };
  }
  if (elapsed < t3) {
    return { phase: 'stand', localT: (elapsed - t2) / d.standing };
  }
  if (elapsed < t4) {
    return { phase: 'walk', localT: (elapsed - t3) / d.walking };
  }
  return {
    phase: 'sit',
    localT: Math.min(1, (elapsed - t4) / (d.sitting + d.settle)),
  };
}

export function handoffStartTime(): number {
  return WAKEUP_TOTAL - WAKEUP_PHASE.handoff;
}
