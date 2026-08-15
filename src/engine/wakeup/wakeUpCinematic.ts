/**
 * Wake-up intro timing, camera paths, and easing — shared by 3D sequence + overlay.
 */

import { PerspectiveCamera, Vector3 } from 'three';
import { PLAYER_METRIC } from '@/config/metricScaleCoherence';

export const WAKEUP_PHASE = {
  terminal: 4.6,   // longer terminal hold — show-don't-tell room beat
  rise: 4.0,
  standing: 2.8,   // hold on lived-in apartment silhouette
  walking: 5.2,
  sitting: 3.2,
  settle: 2.2,     // pause before monitor push-in
  monitor: 6.2,
  handoff: 3.5,
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

// FIX S12-A1 + S15-PROLOGUE-PERFECTION: BED_POSITION теперь НА матрасе gothicBed
// GLB at [1.78,0,2.05] scale 0.92 — матрас поверхность y=0.52-0.58 в зависимости от LOD.
// y=0.55 — сидит на матрасе, не внутри. Ранее 0.35 было внутри текстуры — Володька появлялся
// стоя внутри кровати. Теперь лежа с rotation 1.2 rad (~69deg) — глаза открываются лежа.
// y=0.55 + footY коррекция = визуально на матрасе.
export const BED_POSITION = new Vector3(1.78, 0.55, 2.05);
// Поза сидя на краю кровати — для естественного вставания, а не телепорта стоя
export const BED_SIT_EDGE = new Vector3(1.15, 0.55, 2.05);
// STAND_POSITION — центр комнаты, 1.5м от двери (z=3.5), 1.13м от кровати.
// Оставлен [0.0,0.01,1.5] но добавлен safe margin от кресла.
export const STAND_POSITION = new Vector3(0.0, 0.01, 1.2);
// DESK_POSITION — у стола, чуть дальше от кресла чтобы не проходить сквозь
export const DESK_POSITION = new Vector3(0.0, 0.01, -0.85);
// CHAIR_POSITION — кресло теперь в [0,0,-1.7], персонаж садится в [0,0.01,-1.15]
// чтобы не клиповать сквозь спинку кресла. Ранее [0,0.01,-1.3] был внутри.
export const CHAIR_POSITION = new Vector3(0.0, 0.01, -1.15);
/** Third-person handoff behind the desk — matches exploration orbit framing. */
export const DESK_EXPLORATION_CAM = {
  position: new Vector3(0.0, PLAYER_METRIC.eyeHeightM - 0.05, 1.15),
  lookAt: new Vector3(0, PLAYER_METRIC.seatedEyeHeightM + 0.02, -1.0),
  fov: 54,
};

const FAR_CORNER = new Vector3(-2.2, 2.6, -3.0);

export interface WakeCameraWaypoint {
  position: Vector3;
  lookAt: Vector3;
  fov: number;
  duration: number;
  controlPoint?: Vector3;
}

export const WAKEUP_CAMERA_WAYPOINTS: WakeCameraWaypoint[] = [
  {
    position: new Vector3(0.15, 1.08, -2.15),
    lookAt: new Vector3(0, 1.02, -2.48),
    fov: 36,
    duration: WAKEUP_PHASE.terminal,
    controlPoint: new Vector3(-1.35, 2.35, -2.95),
  },
  {
    position: new Vector3(1.42, 1.22, 2.72),
    // FIX S12-A1: rise-phase lookAt now frames the new BED_POSITION [1.78, 0.35, 2.05]
    // (was [0.48, 0.78, 2.32] which framed the OLD bed at [0.5, 0.01, 2.4]).
    // y=0.55 looks slightly above the mattress surface so the avatar's torso
    // is centered in frame as it rises.
    lookAt: new Vector3(1.78, 0.55, 2.05),
    fov: 46,
    duration: WAKEUP_PHASE.rise,
    controlPoint: new Vector3(1.05, 1.58, 0.85),
  },
  {
    position: new Vector3(-1.42, 1.48, 1.68),
    // FIX S13-11: standing-phase lookAt now frames the new STAND_POSITION
    // [0.0, 0.01, 1.5] (center of room, between bed and desk).
    lookAt: new Vector3(0.0, PLAYER_METRIC.eyeHeightM - 0.08, 1.5),
    fov: 50,
    duration: WAKEUP_PHASE.standing,
    controlPoint: new Vector3(-0.25, 1.72, 2.18),
  },
  {
    position: new Vector3(1.32, 1.58, 0.52),
    lookAt: new Vector3(0.05, PLAYER_METRIC.eyeHeightM - 0.12, -0.6),
    fov: 54,
    duration: WAKEUP_PHASE.walking,
    controlPoint: new Vector3(0.62, 1.78, 1.36),
  },
  {
    position: new Vector3(1.62, 1.32, -0.38),
    lookAt: new Vector3(0, PLAYER_METRIC.seatedEyeHeightM - 0.05, -1.34),
    fov: 48,
    duration: WAKEUP_PHASE.sitting,
    controlPoint: new Vector3(1.18, 1.22, -0.92),
  },
  {
    position: new Vector3(0.32, 1.58, -0.22),
    lookAt: new Vector3(0, PLAYER_METRIC.seatedEyeHeightM, -2.2),
    fov: 52,
    duration: WAKEUP_PHASE.settle,
    controlPoint: new Vector3(0.82, 1.48, -0.82),
  },
  // Phase: monitor — camera pushes in close to the screen, showing poem lines
  // and the "sync soon" notification. Tight fov for a cinematic close-up.
  {
    position: new Vector3(0.0, 1.14, -0.84),
    lookAt: new Vector3(0, 1.1, -2.5),
    fov: 28,
    duration: WAKEUP_PHASE.monitor,
    controlPoint: new Vector3(0.12, 1.28, -1.55),
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

/** Y rotation so a humanoid model (GLB / procedural lite facing +Z at yaw 0)
 *  faces the movement direction (dx, dz).
 *
 *  Model forward after yaw θ is (sin θ, 0, cos θ). Solving for θ that aims at
 *  (dx, dz) gives θ = atan2(dx, dz) — same convention as playerMainMovement /
 *  SimplePlayer (`livePlayerRotationRef`). CesiumPlayerModel applies no extra π.
 *
 *  Note: we use `0 + dx` style only where needed to avoid -0 atan2 quirks on
 *  the negated form; the direct atan2(dx, dz) path is the canonical one.
 */
export function facingYFromDirection(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

export function facingYBetween(from: Vector3, to: Vector3): number {
  return facingYFromDirection(to.x - from.x, to.z - from.z);
}

export function clampToVolodkaRoom(v: Vector3): Vector3 {
  v.x = Math.max(-2.3, Math.min(2.3, v.x));
  v.z = Math.max(-3.3, Math.min(3.3, v.z));
  v.y = Math.max(0.5, Math.min(2.8, v.y));
  return v;
}

function quadraticBezier(a: Vector3, c: Vector3, b: Vector3, t: number): Vector3 {
  const u = 1 - t;
  return new Vector3(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
}

export function lerpWakeCamera(
  fromPos: Vector3,
  fromLook: Vector3,
  fromFov: number,
  wp: WakeCameraWaypoint,
  t: number,
  outPos: Vector3,
  outLook: Vector3,
  clampRoom?: boolean,
): number {
  const e = easeInOutCubic(t);
  if (wp.controlPoint) {
    outPos.copy(quadraticBezier(fromPos, wp.controlPoint, wp.position, e));
    const lookCtrl = new Vector3().lerpVectors(fromLook, wp.lookAt, 0.45);
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
  fromPos: Vector3,
  fromLook: Vector3,
  fromFov: number,
  camera: PerspectiveCamera,
  targetCam?: { position: Vector3; lookAt: Vector3; fov: number },
  clampRoom?: boolean,
): void {
  const dest = targetCam ?? DESK_EXPLORATION_CAM;
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(fromPos, dest.position, e);
  if (clampRoom) clampToVolodkaRoom(camera.position);
  const look = new Vector3().lerpVectors(fromLook, dest.lookAt, e);
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
