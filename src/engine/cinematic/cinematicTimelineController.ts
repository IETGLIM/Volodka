/**
 * Pure timeline playback — phase index, camera interpolation, actor sync.
 */

import * as THREE from 'three';
import {
  applyHandoffCamera,
  easeInOutCubic,
  lerpWakeCamera,
  type WakeCameraWaypoint,
} from '@/engine/wakeup/wakeUpCinematic';
import type { CameraWaypointData } from '@/shared/types/camera';
import type {
  CinematicActorKeyframe,
  CinematicActorMotion,
  CinematicTimelineActorFrame,
  CinematicTimelineCameraFrame,
  CinematicTimelineDef,
  CinematicTimelinePhase,
  CinematicTimelineRuntimeOptions,
  CinematicTimelineUpdateResult,
  CinematicOverlayConfig,
} from './cinematicTimelineTypes';

const _lookTarget = new THREE.Vector3();
const _actorPos = new THREE.Vector3();
const _actorRot = new THREE.Euler();
const _handoffFrom = {
  position: new THREE.Vector3(),
  lookAt: new THREE.Vector3(),
  fov: 54,
};

export interface CinematicTimelineState {
  def: CinematicTimelineDef;
  elapsed: number;
  phaseIndex: number;
  isPlaying: boolean;
  isComplete: boolean;
  anchor: THREE.Vector3;
  npcId?: string;
  skipMotion: boolean;
  prevCamera: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number };
  handoffCaptured: boolean;
  lastOverlayPhaseId: string | null;
}

function waypointFromData(data: CameraWaypointData, anchor: THREE.Vector3): WakeCameraWaypoint {
  return {
    position: new THREE.Vector3(...data.position).add(anchor),
    lookAt: new THREE.Vector3(...data.lookAt).add(anchor),
    fov: data.fov,
    duration: data.duration,
    controlPoint: data.controlPoint
      ? new THREE.Vector3(...data.controlPoint).add(anchor)
      : undefined,
  };
}

function resolvePhaseCamera(
  phase: CinematicTimelinePhase,
  anchor: THREE.Vector3,
  prevEnd: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number },
): {
  from: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number };
  to: WakeCameraWaypoint | null;
  handoffTarget: CameraWaypointData | null;
} {
  switch (phase.camera.mode) {
    case 'hold': {
      const at = waypointFromData(phase.camera.at, anchor);
      return {
        from: { position: at.position, lookAt: at.lookAt, fov: at.fov },
        to: null,
        handoffTarget: null,
      };
    }
    case 'handoff':
      return { from: prevEnd, to: null, handoffTarget: phase.camera.target };
    case 'waypoint': {
      const to = waypointFromData(phase.camera.to, anchor);
      const from = phase.camera.from
        ? (() => {
            const wp = waypointFromData(phase.camera.from!, anchor);
            return { position: wp.position, lookAt: wp.lookAt, fov: wp.fov };
          })()
        : prevEnd;
      return { from, to, handoffTarget: null };
    }
    default: {
      const _exhaustive: never = phase.camera;
      return _exhaustive;
    }
  }
}

function sampleActorKeyframes(
  motion: Extract<CinematicActorMotion, { mode: 'in_place' }>,
  localT: number,
  anchor: THREE.Vector3,
  out: CinematicTimelineActorFrame,
): void {
  const keys = motion.keyframes;
  out.clip = motion.clip;

  if (keys.length === 0) {
    out.position.set(anchor.x, anchor.y, anchor.z);
    out.rotation.set(0, 0, 0);
    out.facingY = 0;
    return;
  }

  if (keys.length === 1) {
    applyActorKeyframe(keys[0], anchor, out);
    return;
  }

  let i = 0;
  while (i < keys.length - 1 && localT > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const span = Math.max(b.t - a.t, 0.0001);
  const segT = easeInOutCubic(Math.max(0, Math.min(1, (localT - a.t) / span)));

  _actorPos.set(
    a.position[0] + (b.position[0] - a.position[0]) * segT,
    a.position[1] + (b.position[1] - a.position[1]) * segT,
    a.position[2] + (b.position[2] - a.position[2]) * segT,
  );
  _actorPos.add(anchor);
  out.position.copy(_actorPos);

  if (a.rotation && b.rotation) {
    _actorRot.set(
      a.rotation[0] + (b.rotation[0] - a.rotation[0]) * segT,
      a.rotation[1] + (b.rotation[1] - a.rotation[1]) * segT,
      a.rotation[2] + (b.rotation[2] - a.rotation[2]) * segT,
    );
    out.rotation.copy(_actorRot);
  } else {
    out.rotation.set(0, 0, 0);
  }

  const facingA = a.facingY ?? a.rotation?.[1] ?? 0;
  const facingB = b.facingY ?? b.rotation?.[1] ?? facingA;
  out.facingY = facingA + (facingB - facingA) * segT;
}

function applyActorKeyframe(
  key: CinematicActorKeyframe,
  anchor: THREE.Vector3,
  out: CinematicTimelineActorFrame,
): void {
  out.position.set(
    anchor.x + key.position[0],
    anchor.y + key.position[1],
    anchor.z + key.position[2],
  );
  if (key.rotation) {
    out.rotation.set(key.rotation[0], key.rotation[1], key.rotation[2]);
  } else {
    out.rotation.set(0, 0, 0);
  }
  out.facingY = key.facingY ?? key.rotation?.[1] ?? 0;
}

function resolveActorFrame(
  motion: CinematicActorMotion,
  localT: number,
  anchor: THREE.Vector3,
): CinematicTimelineActorFrame | null {
  switch (motion.mode) {
    case 'none':
      return null;
    case 'root_motion':
      return {
        clip: motion.clip,
        position: anchor.clone(),
        rotation: new THREE.Euler(0, 0, 0),
        facingY: 0,
      };
    case 'in_place': {
      const frame: CinematicTimelineActorFrame = {
        clip: motion.clip,
        position: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        facingY: 0,
      };
      sampleActorKeyframes(motion, localT, anchor, frame);
      return frame;
    }
    default: {
      const _exhaustive: never = motion;
      return _exhaustive;
    }
  }
}

export function createCinematicTimelineState(
  def: CinematicTimelineDef,
  options: CinematicTimelineRuntimeOptions = {},
): CinematicTimelineState {
  const anchor = new THREE.Vector3(...(options.anchor ?? def.anchor?.position ?? [0, 0, 0]));
  return {
    def,
    elapsed: 0,
    phaseIndex: 0,
    isPlaying: false,
    isComplete: false,
    anchor,
    npcId: options.npcId ?? def.anchor?.npcId,
    skipMotion: options.skipMotion ?? false,
    prevCamera: {
      position: new THREE.Vector3(),
      lookAt: new THREE.Vector3(0, 1, 0),
      fov: 54,
    },
    handoffCaptured: false,
    lastOverlayPhaseId: null,
  };
}

export function startCinematicTimelineState(state: CinematicTimelineState): void {
  state.elapsed = 0;
  state.phaseIndex = 0;
  state.isPlaying = true;
  state.isComplete = false;
  state.handoffCaptured = false;
  state.lastOverlayPhaseId = null;
}

export function skipCinematicTimelineState(state: CinematicTimelineState): void {
  const total = state.def.phases.reduce((sum, p) => sum + p.duration, 0);
  state.elapsed = total;
  state.phaseIndex = Math.max(0, state.def.phases.length - 1);
  state.isPlaying = false;
  state.isComplete = true;
}

export function getCinematicTimelineTotalDuration(def: CinematicTimelineDef): number {
  return def.phases.reduce((sum, phase) => sum + phase.duration, 0);
}

function findPhaseAtElapsed(
  phases: CinematicTimelinePhase[],
  elapsed: number,
): { index: number; localT: number; phaseStart: number } {
  let acc = 0;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    if (elapsed < acc + phase.duration) {
      return { index: i, localT: (elapsed - acc) / phase.duration, phaseStart: acc };
    }
    acc += phase.duration;
  }
  const last = Math.max(0, phases.length - 1);
  return { index: last, localT: 1, phaseStart: acc - (phases[last]?.duration ?? 0) };
}

export function updateCinematicTimelineState(
  state: CinematicTimelineState,
  delta: number,
  cameraOut: THREE.PerspectiveCamera,
): CinematicTimelineUpdateResult | null {
  if (!state.isPlaying || state.isComplete) return null;

  const dt = Math.min(delta, 0.05);
  state.elapsed += dt;

  const { phases } = state.def;
  if (phases.length === 0) {
    state.isComplete = true;
    state.isPlaying = false;
    return null;
  }

  const total = getCinematicTimelineTotalDuration(state.def);
  if (state.elapsed >= total) {
    state.isComplete = true;
    state.isPlaying = false;
    state.elapsed = total;
  }

  const { index, localT } = findPhaseAtElapsed(phases, state.elapsed);
  state.phaseIndex = index;
  const phase = phases[index];

  const cameraFrame: CinematicTimelineCameraFrame = {
    position: cameraOut.position,
    lookAt: _lookTarget,
    fov: cameraOut.fov,
  };

  const camSpec = resolvePhaseCamera(phase, state.anchor, state.prevCamera);
  const isHandoff = phase.camera.mode === 'handoff';

  if (isHandoff) {
    if (!state.handoffCaptured) {
      state.handoffCaptured = true;
      _handoffFrom.position.copy(cameraOut.position);
      cameraOut.getWorldDirection(_lookTarget);
      _handoffFrom.lookAt.copy(cameraOut.position).add(_lookTarget);
      _handoffFrom.fov = cameraOut.fov;
    }
    const targetWaypoint = waypointFromData(camSpec.handoffTarget!, state.anchor);
    applyHandoffCamera(
      easeInOutCubic(localT),
      _handoffFrom.position,
      _handoffFrom.lookAt,
      _handoffFrom.fov,
      cameraOut,
      { position: targetWaypoint.position, lookAt: targetWaypoint.lookAt, fov: targetWaypoint.fov },
    );
    cameraFrame.position.copy(cameraOut.position);
    cameraOut.getWorldDirection(_lookTarget);
    cameraFrame.lookAt.copy(cameraOut.position).add(_lookTarget);
    cameraFrame.fov = cameraOut.fov;
  } else if (camSpec.to) {
    const segT = easeInOutCubic(localT);
    cameraFrame.fov = lerpWakeCamera(
      camSpec.from.position,
      camSpec.from.lookAt,
      camSpec.from.fov,
      camSpec.to,
      segT,
      cameraOut.position,
      _lookTarget,
    );
    cameraFrame.position.copy(cameraOut.position);
    cameraFrame.lookAt.copy(_lookTarget);
    cameraOut.lookAt(_lookTarget);
    cameraOut.updateProjectionMatrix();
  } else {
    cameraOut.position.copy(camSpec.from.position);
    cameraOut.lookAt(camSpec.from.lookAt);
    cameraOut.fov = camSpec.from.fov;
    cameraOut.updateProjectionMatrix();
    cameraFrame.position.copy(camSpec.from.position);
    cameraFrame.lookAt.copy(camSpec.from.lookAt);
    cameraFrame.fov = camSpec.from.fov;
  }

  state.prevCamera.position.copy(cameraFrame.position);
  state.prevCamera.lookAt.copy(cameraFrame.lookAt);
  state.prevCamera.fov = cameraFrame.fov;

  const actor = resolveActorFrame(phase.actor, localT, state.anchor);

  let overlay: CinematicOverlayConfig | null = null;
  if (phase.overlay && state.lastOverlayPhaseId !== phase.id) {
    overlay = phase.overlay;
    state.lastOverlayPhaseId = phase.id;
  }

  return {
    phaseId: phase.id,
    phaseIndex: index,
    phaseLocalT: localT,
    camera: cameraFrame,
    actor,
    overlay,
    isComplete: state.isComplete,
    isHandoff,
  };
}

export function setCinematicTimelineAnchor(
  state: CinematicTimelineState,
  anchor: THREE.Vector3,
): void {
  state.anchor.copy(anchor);
}
