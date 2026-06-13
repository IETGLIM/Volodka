/* ─── Volodka RPG – AAA Cinematic Camera System ───
 *  Comprehensive camera engine with:
 *  - Critically-damped spring camera with roll support
 *  - Collision avoidance (raycast behind camera)
 *  - Dialogue cinematic shots (speaker-aware auto-switching)
 *  - Cutscene waypoint system with cubic bezier interpolation
 *  - Combat camera (wide FOV, impact zoom, screen shake)
 *  - Scene transition fly-through
 *  - Exploration enhancements (turn tilt, height smoothing, breathing idle)
 */

import * as THREE from 'three';
import {
  configureCameraCollisionRaycaster,
  isCameraCollisionHit,
} from '@/engine/camera/cameraCollisionLayers';
import { getExplorationCameraMotionScale } from '@/engine/player/playerLocomotionPresentation';

/* ════════════════════════════════════════════════════
 * CONSTANTS
 * ════════════════════════════════════════════════════ */

/* ── Spring camera ── */
const SPRING_STIFFNESS = 16; // higher = camera catches up to the player faster
const SPRING_DAMPING = 0.85;
const LOOK_AT_STIFFNESS = 16;
export const DEFAULT_FOV = 75;
const FOV_LERP_SPEED = 3;
const ROLL_LERP_SPEED = 4;

/* ── Dialogue ── */
const DIALOGUE_SHOT_INTERVAL = 3.5;
const DIALOGUE_FOV = 50;
const DIALOGUE_TIME_SCALE = 0.92;

/* ── Exploration enhancements ── */
const TURN_TILT_MAX = 0.025;          // max roll radians when turning
const TURN_TILT_SPEED = 3;            // how fast tilt responds
const HEIGHT_SMOOTH_SPEED = 5;        // how fast camera adjusts to height changes
const BREATHING_IDLE_DELAY = 3.0;     // seconds before breathing starts
const BREATHING_INTENSITY_MAX = 1.0;  // full breathing intensity
const BREATHING_FADE_IN_SPEED = 0.5;  // how fast breathing ramps in

/* ── Combat camera ── */
export const COMBAT_FOV = 85;
const COMBAT_ZOOM_FOV = 70;           // zoomed-in FOV on impact
const COMBAT_ZOOM_DURATION = 0.3;     // seconds the zoom holds
const COMBAT_ZOOM_RECOVER_SPEED = 2;  // how fast FOV recovers
const COMBAT_SHAKE_INTENSITY = 0.12;  // max shake offset
const COMBAT_SHAKE_DURATION = 0.4;    // seconds shake lasts

/* ── Scene transition ── */
const TRANSITION_FLY_DURATION = 1.2;  // seconds for fly-through
const TRANSITION_FLY_HEIGHT = 4.0;    // camera rises during transition

/* ── Cutscene ── */
const MIN_SEGMENT_DURATION = 0.001;   // guard against zero-duration infinite loop

/* ── Pre-allocated temp vectors (avoid GC) ── */
const _tempPos = new THREE.Vector3();
const _tempLook = new THREE.Vector3();
const _tempVel = new THREE.Vector3();
const _springForce = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camDirReverse = new THREE.Vector3();
const _bezierA = new THREE.Vector3();
const _bezierB = new THREE.Vector3();
const _bezierC = new THREE.Vector3();
const _bezierD = new THREE.Vector3();
const _bezierTemp = new THREE.Vector3();
const _shotRight = new THREE.Vector3();
const _shotPos = new THREE.Vector3();
const _shotLook = new THREE.Vector3();
const _shotMidpoint = new THREE.Vector3();
const _autoControlOut = new THREE.Vector3();
const _autoControlIn = new THREE.Vector3();
const _transitionPos = new THREE.Vector3();
const _transitionLookAt = new THREE.Vector3();
const _dialogueShotOut: CameraShot = {
  position: _shotPos,
  lookAt: _shotLook,
  fov: DIALOGUE_FOV,
};
const _cutsceneUpdateOut: { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } = {
  position: _tempPos,
  lookAt: _tempLook,
  fov: DEFAULT_FOV,
};
const _transitionUpdateOut = { position: _transitionPos, lookAt: _transitionLookAt };
const _explorationUpdateOut = { targetRoll: 0, targetHeight: 0 };

/* ════════════════════════════════════════════════════
 * SPRING CAMERA
 * Critically-damped spring for physically-based "weighty" feel.
 * ════════════════════════════════════════════════════ */

export interface SpringCameraState {
  /** Current position */
  position: THREE.Vector3;
  /** Current velocity */
  velocity: THREE.Vector3;
  /** Current look-at target */
  lookAt: THREE.Vector3;
  /** Current FOV */
  fov: number;
  /** Current roll (radians) for tilt effect */
  roll: number;
}

/** Create a new spring camera state */
export function createSpringCameraState(
  initialPos: THREE.Vector3,
  initialLookAt: THREE.Vector3,
): SpringCameraState {
  return {
    position: initialPos.clone(),
    velocity: new THREE.Vector3(),
    lookAt: initialLookAt.clone(),
    fov: DEFAULT_FOV,
    roll: 0,
  };
}

/**
 * Update spring camera toward a target position.
 * Critically-damped spring: settles fast without overshooting.
 */
export function updateSpringCamera(
  state: SpringCameraState,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  targetFov: number,
  delta: number,
  targetRoll: number = 0,
  stiffness: number = SPRING_STIFFNESS,
  damping: number = SPRING_DAMPING,
): void {
  const dt = Math.min(delta, 0.05);

  // ── Position spring (frame-rate independent exponential integration) ──
  const expStiffness = 1 - Math.exp(-stiffness * dt);
  const expDamping = 1 - Math.exp(-damping * dt);
  _springForce.copy(targetPos).sub(state.position);
  state.velocity.addScaledVector(_springForce, expStiffness);
  state.velocity.multiplyScalar(1 - expDamping);

  // Add velocity * dt directly (avoid clone for perf)
  _tempPos.copy(state.velocity).multiplyScalar(dt);
  state.position.add(_tempPos);

  // ── Look-at spring (exponential decay for smooth tracking) ──
  state.lookAt.lerp(targetLookAt, 1 - Math.exp(-LOOK_AT_STIFFNESS * dt));

  // ── FOV spring ──
  state.fov = THREE.MathUtils.lerp(state.fov, targetFov, 1 - Math.exp(-FOV_LERP_SPEED * dt));

  // ── Roll spring ──
  state.roll = THREE.MathUtils.lerp(state.roll, targetRoll, 1 - Math.exp(-ROLL_LERP_SPEED * dt));
}

/* ════════════════════════════════════════════════════
 * CAMERA COLLISION AVOIDANCE
 * Pulls camera in front of walls so it doesn't clip.
 * ════════════════════════════════════════════════════ */

export function resolveCameraCollision(
  raycaster: THREE.Raycaster,
  sceneChildren: THREE.Object3D[],
  lookTarget: THREE.Vector3,
  desiredPos: THREE.Vector3,
  margin: number = 0.25,
  minDistance: number = 0.8,
  out: THREE.Vector3 = desiredPos,
): THREE.Vector3 {
  _camDir.copy(desiredPos).sub(lookTarget);
  const fullDistance = _camDir.length();

  if (fullDistance < 0.01) {
    out.copy(desiredPos);
    return out;
  }

  _camDir.divideScalar(fullDistance); // normalize

  configureCameraCollisionRaycaster(raycaster);

  // Forward raycast: from lookTarget toward desiredPos
  raycaster.set(lookTarget, _camDir);
  raycaster.far = fullDistance + 0.01;
  raycaster.near = 0.05; // low near distance to detect walls close to the player when zoomed in

  const hits = raycaster.intersectObjects(sceneChildren, true);
  for (const hit of hits) {
    if (!isCameraCollisionHit(hit.object)) continue;
    if (hit.distance < fullDistance - margin) {
      const safeDistance = Math.max(minDistance, hit.distance - margin);
      out.copy(lookTarget).addScaledVector(_camDir, safeDistance);
      return out;
    }
  }

  // Reverse raycast: if the camera is inside geometry (e.g., dialogue in a small room),
  // cast a ray FROM the desired position BACK toward the lookTarget to detect if
  // the camera is inside a wall. If so, pull it toward the lookTarget.
  raycaster.set(desiredPos, _camDirReverse.copy(_camDir).negate());
  raycaster.far = fullDistance;
  raycaster.near = 0.01;

  const reverseHits = raycaster.intersectObjects(sceneChildren, true);
  for (const hit of reverseHits) {
    if (!isCameraCollisionHit(hit.object)) continue;
    if (hit.distance < fullDistance) {
      // Camera is inside or very close to a wall — pull it toward the lookTarget
      // Place the camera just in front of the wall (toward the player)
      const safeDistance = Math.max(minDistance, fullDistance - hit.distance - margin);
      out.copy(lookTarget).addScaledVector(_camDir, safeDistance);
      return out;
    }
  }

  out.copy(desiredPos);
  return out;
}

/* ════════════════════════════════════════════════════
 * DIALOGUE CINEMATIC SHOTS
 * Speaker-aware shot selection with auto-switching.
 * ════════════════════════════════════════════════════ */

export type DialogueShotType = 'overShoulder' | 'closeUpNPC' | 'closeUpPlayer' | 'twoShot' | 'wideShot';

/** Who is currently speaking in the dialogue */
export type DialogueSpeaker = 'npc' | 'player' | 'narrator' | 'unknown';

export interface CameraShot {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
}

const SHOT_SEQUENCE: DialogueShotType[] = [
  'overShoulder',
  'closeUpNPC',
  'overShoulder',
  'closeUpPlayer',
  'twoShot',
  'closeUpNPC',
];

/**
 * Get the best shot type based on who is speaking.
 * Speaker-aware: NPC speaking → closeUpNPC, player choosing → closeUpPlayer.
 */
export function getDialogueShotForSpeaker(speaker: DialogueSpeaker): DialogueShotType {
  switch (speaker) {
    case 'npc': return 'closeUpNPC';
    case 'player': return 'closeUpPlayer';
    case 'narrator': return 'wideShot';
    default: return 'overShoulder';
  }
}

/**
 * Compute a cinematic dialogue camera shot.
 * Each shot type has a different position and framing.
 */
export function getDialogueShot(
  type: DialogueShotType,
  playerPos: THREE.Vector3,
  npcPos: THREE.Vector3,
  _npcRotation: number = 0,
): CameraShot {
  const dir = _tempLook.copy(npcPos).sub(playerPos);
  dir.y = 0;
  const dist = dir.length();
  if (dist > 0.01) dir.divideScalar(dist);

  _shotRight.set(-dir.z, 0, dir.x);

  switch (type) {
    case 'overShoulder':
      _shotPos.copy(playerPos)
        .addScaledVector(dir, -1.2)
        .addScaledVector(_shotRight, 0.6);
      _shotPos.y += 1.7;
      _shotLook.copy(npcPos);
      _shotLook.y += 1.5;
      _dialogueShotOut.fov = 55;
      break;

    case 'closeUpNPC':
      _shotPos.copy(npcPos)
        .addScaledVector(dir, 1.2)
        .addScaledVector(_shotRight, 0.3);
      _shotPos.y += 1.7;
      _shotLook.copy(npcPos);
      _shotLook.y += 1.6;
      _dialogueShotOut.fov = 45;
      break;

    case 'closeUpPlayer':
      _shotPos.copy(playerPos)
        .addScaledVector(dir, -1.0)
        .addScaledVector(_shotRight, -0.3);
      _shotPos.y += 1.7;
      _shotLook.copy(playerPos);
      _shotLook.y += 1.6;
      _dialogueShotOut.fov = 45;
      break;

    case 'twoShot':
      _shotMidpoint.copy(playerPos).add(npcPos).multiplyScalar(0.5);
      _shotPos.copy(_shotMidpoint)
        .addScaledVector(dir, -3.0)
        .addScaledVector(_shotRight, 1.5);
      _shotPos.y += 2.0;
      _shotLook.copy(_shotMidpoint);
      _shotLook.y += 1.3;
      _dialogueShotOut.fov = 60;
      break;

    case 'wideShot':
      _shotMidpoint.copy(playerPos).add(npcPos).multiplyScalar(0.5);
      _shotPos.copy(_shotMidpoint).addScaledVector(dir, -5.0);
      _shotPos.y += 2.5;
      _shotLook.copy(_shotMidpoint);
      _shotLook.y += 1.0;
      _dialogueShotOut.fov = DIALOGUE_FOV;
      break;

    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }

  return _dialogueShotOut;
}

/* ════════════════════════════════════════════════════
 * DIALOGUE SHOT CONTROLLER
 * Auto-switches between shot types, with speaker awareness.
 * ════════════════════════════════════════════════════ */

export interface DialogueShotController {
  currentShotIndex: number;
  timer: number;
  currentShot: DialogueShotType;
  transitionProgress: number;
  /** Current speaker — affects shot selection */
  currentSpeaker: DialogueSpeaker;
  /** Last dialogue node ID — triggers shot change on node change */
  lastDialogueNodeId: string;
  /** Whether speaker-aware override is active */
  speakerOverrideActive: boolean;
}

export function createDialogueShotController(): DialogueShotController {
  return {
    currentShotIndex: 0,
    timer: 0,
    currentShot: SHOT_SEQUENCE[0],
    transitionProgress: 1,
    currentSpeaker: 'unknown',
    lastDialogueNodeId: '',
    speakerOverrideActive: false,
  };
}

/**
 * Update dialogue shot controller.
 * Auto-switches at interval OR on dialogue node change.
 * Speaker-aware: overrides shot when speaker changes.
 */
export function updateDialogueShotController(
  controller: DialogueShotController,
  delta: number,
  speaker?: DialogueSpeaker,
  dialogueNodeId?: string,
): DialogueShotType {
  controller.timer += delta;

  // Transition in
  if (controller.transitionProgress < 1) {
    controller.transitionProgress = Math.min(1, controller.transitionProgress + delta * 2);
  }

  // Update speaker if provided
  if (speaker) {
    controller.currentSpeaker = speaker;
  }

  // Check for dialogue node change — trigger shot switch
  if (dialogueNodeId && dialogueNodeId !== controller.lastDialogueNodeId) {
    controller.lastDialogueNodeId = dialogueNodeId;
    // Speaker-aware shot selection on node change
    if (controller.currentSpeaker !== 'unknown') {
      controller.currentShot = getDialogueShotForSpeaker(controller.currentSpeaker);
      controller.speakerOverrideActive = true;
    } else {
      controller.currentShotIndex = (controller.currentShotIndex + 1) % SHOT_SEQUENCE.length;
      controller.currentShot = SHOT_SEQUENCE[controller.currentShotIndex];
    }
    controller.timer = 0;
    controller.transitionProgress = 0;
  }

  // Auto-switch shot at interval (when no speaker override)
  if (controller.timer >= DIALOGUE_SHOT_INTERVAL) {
    controller.timer = 0;
    // If speaker is known, cycle with speaker preference
    if (controller.currentSpeaker !== 'unknown' && controller.speakerOverrideActive) {
      // Alternate between speaker shot and two-shot for variety
      controller.currentShot = controller.currentShot === 'twoShot'
        ? getDialogueShotForSpeaker(controller.currentSpeaker)
        : 'twoShot';
    } else {
      controller.currentShotIndex = (controller.currentShotIndex + 1) % SHOT_SEQUENCE.length;
      controller.currentShot = SHOT_SEQUENCE[controller.currentShotIndex];
    }
    controller.transitionProgress = 0;
    controller.speakerOverrideActive = controller.currentSpeaker !== 'unknown';
  }

  return controller.currentShot;
}

/** Reset dialogue shot controller (on dialogue start) */
export function resetDialogueShotController(controller: DialogueShotController): void {
  controller.currentShotIndex = 0;
  controller.timer = 0;
  controller.currentShot = SHOT_SEQUENCE[0];
  controller.transitionProgress = 0;
  controller.currentSpeaker = 'unknown';
  controller.lastDialogueNodeId = '';
  controller.speakerOverrideActive = false;
}

/** Set the current speaker for the dialogue controller */
export function setDialogueSpeaker(controller: DialogueShotController, speaker: DialogueSpeaker): void {
  if (controller.currentSpeaker !== speaker) {
    controller.currentSpeaker = speaker;
    // Immediately cut to speaker-appropriate shot
    controller.currentShot = getDialogueShotForSpeaker(speaker);
    controller.speakerOverrideActive = true;
    controller.transitionProgress = 0;
    controller.timer = 0;
  }
}

/* ════════════════════════════════════════════════════
 * EXPLORATION ENHANCEMENTS
 * ════════════════════════════════════════════════════ */

export interface ExplorationCameraState {
  /** Smoothed height (for stairs/slopes) */
  smoothedHeight: number;
  /** Time since player last moved significantly */
  idleTimer: number;
  /** Current breathing intensity (fades in after idle delay) */
  breathingIntensity: number;
  /** Previous yaw for detecting turning */
  prevYaw: number;
  /** Current turn rate (for tilt) */
  turnRate: number;
  /** Smoothed turn rate */
  smoothedTurnRate: number;
}

export function createExplorationCameraState(): ExplorationCameraState {
  return {
    smoothedHeight: 0,
    idleTimer: 0,
    breathingIntensity: 0,
    prevYaw: 0,
    turnRate: 0,
    smoothedTurnRate: 0,
  };
}

/**
 * Update exploration camera state.
 * Returns the target roll for tilt effect and updated state.
 */
export function updateExplorationState(
  state: ExplorationCameraState,
  playerPos: THREE.Vector3,
  currentYaw: number,
  playerVelocity: THREE.Vector3,
  delta: number,
  moveBlend = 0,
): { targetRoll: number; targetHeight: number } {
  const dt = Math.min(delta, 0.05);
  const motionScale = getExplorationCameraMotionScale(moveBlend);

  // ── Height smoothing (for stairs/slopes) ──
  state.smoothedHeight = THREE.MathUtils.lerp(
    state.smoothedHeight,
    playerPos.y,
    1 - Math.exp(-HEIGHT_SMOOTH_SPEED * dt),
  );

  // ── Turn tilt ──
  let yawDelta = currentYaw - state.prevYaw;
  // Wrap angle
  while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
  while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;

  state.turnRate = yawDelta / dt;
  state.smoothedTurnRate = THREE.MathUtils.lerp(
    state.smoothedTurnRate,
    state.turnRate,
    1 - Math.exp(-TURN_TILT_SPEED * dt),
  );
  state.prevYaw = currentYaw;

  // Roll proportional to turn rate (negative = tilt into turn)
  const targetRoll = -THREE.MathUtils.clamp(
    state.smoothedTurnRate * 0.003,
    -TURN_TILT_MAX,
    TURN_TILT_MAX,
  ) * motionScale.turnTiltScale;

  // ── Idle breathing ──
  const speed = playerVelocity.length();
  if (speed < 0.1) {
    state.idleTimer += dt;
  } else {
    state.idleTimer = 0;
  }

  // Breathing fades in after idle delay
  if (state.idleTimer >= BREATHING_IDLE_DELAY) {
    const fadeIn = Math.min(1, (state.idleTimer - BREATHING_IDLE_DELAY) * BREATHING_FADE_IN_SPEED);
    state.breathingIntensity = fadeIn * BREATHING_INTENSITY_MAX * motionScale.breathingScale;
  } else {
    state.breathingIntensity = Math.max(0, state.breathingIntensity - dt * 2);
  }

  _explorationUpdateOut.targetRoll = targetRoll;
  _explorationUpdateOut.targetHeight = state.smoothedHeight;
  return _explorationUpdateOut;
}

/**
 * Apply enhanced breathing idle animation.
 * More pronounced than the basic version — kicks in after standing still.
 */
/** Mutates `position` in place — caller must pass a fresh target each frame. */
export function applyEnhancedBreathingIdle(
  position: THREE.Vector3,
  time: number,
  intensity: number,
): void {
  if (intensity < 0.001) return;

  // Breathing: subtle Y oscillation (1-2mm at full intensity)
  const breathY = Math.sin(time * 1.8) * 0.002 * intensity;
  // Gentle sway: XZ drift (0.5mm)
  const swayX = Math.sin(time * 0.6) * 0.0005 * intensity;
  const swayZ = Math.cos(time * 0.8) * 0.0005 * intensity;

  position.x += swayX;
  position.y += breathY;
  position.z += swayZ;
}

/* ════════════════════════════════════════════════════
 * CUTSCENE CAMERA
 * Waypoint-based camera with cubic bezier interpolation.
 * ════════════════════════════════════════════════════ */

export interface CameraWaypoint {
  /** Camera position at this waypoint */
  position: THREE.Vector3;
  /** Look-at target at this waypoint */
  lookAt: THREE.Vector3;
  /** FOV at this waypoint */
  fov: number;
  /** Duration to travel FROM previous waypoint TO this one (seconds) */
  duration: number;
  /** Bezier control handle (optional, auto-computed if omitted) */
  controlPoint?: THREE.Vector3;
}

export interface CutsceneController {
  /** Waypoints defining the cutscene path */
  waypoints: CameraWaypoint[];
  /** Current segment index (between waypoint[i] and waypoint[i+1]) */
  currentSegment: number;
  /** Progress through current segment (0-1) */
  segmentProgress: number;
  /** Whether the cutscene is complete */
  isComplete: boolean;
  /** Whether the cutscene is playing */
  isPlaying: boolean;
  /** Total elapsed time */
  elapsed: number;
  /** Current computed camera state */
  currentPosition: THREE.Vector3;
  currentLookAt: THREE.Vector3;
  currentFov: number;
}

export function createCutsceneController(
  waypoints: CameraWaypoint[],
): CutsceneController {
  if (waypoints.length === 0) {
    // Fallback: single point
    const pos = new THREE.Vector3(0, 2, 5);
    return {
      waypoints: [{ position: pos, lookAt: new THREE.Vector3(), fov: DEFAULT_FOV, duration: 0 }],
      currentSegment: 0,
      segmentProgress: 0,
      isComplete: true,
      isPlaying: false,
      elapsed: 0,
      currentPosition: pos.clone(),
      currentLookAt: new THREE.Vector3(),
      currentFov: DEFAULT_FOV,
    };
  }

  return {
    waypoints,
    currentSegment: 0,
    segmentProgress: 0,
    isComplete: false,
    isPlaying: false,
    elapsed: 0,
    currentPosition: waypoints[0].position.clone(),
    currentLookAt: waypoints[0].lookAt.clone(),
    currentFov: waypoints[0].fov,
  };
}

/**
 * Start playing a cutscene.
 */
export function startCutscene(controller: CutsceneController): void {
  controller.isPlaying = true;
  controller.isComplete = false;
  controller.currentSegment = 0;
  controller.segmentProgress = 0;
  controller.elapsed = 0;
}

/**
 * Stop/cancel a cutscene.
 */
export function stopCutscene(controller: CutsceneController): void {
  controller.isPlaying = false;
  controller.isComplete = true;
}

/**
 * Update cutscene controller.
 * Uses cubic bezier interpolation between waypoints for smooth camera moves.
 */
export function updateCutsceneController(
  controller: CutsceneController,
  delta: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } | null {
  if (!controller.isPlaying || controller.isComplete) return null;

  const dt = Math.min(delta, 0.05);
  controller.elapsed += dt;

  const waypoints = controller.waypoints;

  const getSegmentDuration = (segmentIndex: number): number =>
    Math.max(waypoints[segmentIndex + 1]?.duration ?? 1, MIN_SEGMENT_DURATION);

  // Advance progress
  controller.segmentProgress += dt / getSegmentDuration(controller.currentSegment);

  // Move to next segment if current is done
  let safetyIterations = 0;
  const maxSegmentAdvances = waypoints.length;
  while (
    controller.segmentProgress >= 1
    && controller.currentSegment < waypoints.length - 1
    && safetyIterations < maxSegmentAdvances
  ) {
    safetyIterations++;
    controller.segmentProgress -= 1;
    controller.currentSegment++;
    if (controller.currentSegment >= waypoints.length - 1) {
      // Cutscene complete
      controller.isComplete = true;
      controller.isPlaying = false;
      const last = waypoints[waypoints.length - 1];
      _cutsceneUpdateOut.position = last.position;
      _cutsceneUpdateOut.lookAt = last.lookAt;
      _cutsceneUpdateOut.fov = last.fov;
      return _cutsceneUpdateOut;
    }
  }

  // Interpolate position using cubic bezier
  const from = waypoints[controller.currentSegment];
  const to = waypoints[controller.currentSegment + 1];
  const t = easeInOutCubic(controller.segmentProgress);

  const pos = bezierInterpolate(
    from.position,
    from.controlPoint ?? computeAutoControlPoint(from.position, to.position, 'out', _autoControlOut),
    to.controlPoint ?? computeAutoControlPoint(from.position, to.position, 'in', _autoControlIn),
    to.position,
    t,
  );

  _tempLook.lerpVectors(from.lookAt, to.lookAt, t);

  const fov = THREE.MathUtils.lerp(from.fov, to.fov, t);

  controller.currentPosition.copy(pos);
  controller.currentLookAt.copy(_tempLook);
  controller.currentFov = fov;

  _cutsceneUpdateOut.position = controller.currentPosition;
  _cutsceneUpdateOut.lookAt = controller.currentLookAt;
  _cutsceneUpdateOut.fov = fov;
  return _cutsceneUpdateOut;
}

/** Compute an auto control point for bezier when none is specified */
function computeAutoControlPoint(
  from: THREE.Vector3,
  to: THREE.Vector3,
  type: 'in' | 'out',
  out: THREE.Vector3,
): THREE.Vector3 {
  out.lerpVectors(from, to, 0.33);
  if (type === 'out') {
    // Arc upward for a cinematic fly feel
    out.y += 1.5;
  } else {
    out.y += 0.8;
  }
  return out;
}

/** Cubic bezier interpolation between 4 control points */
function bezierInterpolate(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
): THREE.Vector3 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  _bezierA.copy(p0).multiplyScalar(mt3);
  _bezierB.copy(p1).multiplyScalar(3 * mt2 * t);
  _bezierC.copy(p2).multiplyScalar(3 * mt * t2);
  _bezierD.copy(p3).multiplyScalar(t3);

  return _bezierTemp.copy(_bezierA).add(_bezierB).add(_bezierC).add(_bezierD);
}

/** Smooth ease-in-out cubic curve */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ════════════════════════════════════════════════════
 * COMBAT CAMERA
 * Wider FOV, impact zoom, screen shake.
 * ════════════════════════════════════════════════════ */

export interface CombatCameraState {
  /** Current FOV target (changes on impact) */
  targetFov: number;
  /** Zoom recovery timer */
  zoomTimer: number;
  /** Screen shake state */
  shake: {
    active: boolean;
    elapsed: number;
    intensity: number;
    /** Reused each frame; returned as shakeOffset when active */
    offset: THREE.Vector3;
  };
}

export function createCombatCameraState(): CombatCameraState {
  return {
    targetFov: COMBAT_FOV,
    zoomTimer: 0,
    shake: {
      active: false,
      elapsed: 0,
      intensity: 0,
      offset: new THREE.Vector3(),
    },
  };
}

/** Trigger an impact zoom (called on hit/heavy event) */
export function triggerCombatImpact(state: CombatCameraState, intensity: number = 1.0): void {
  state.targetFov = COMBAT_ZOOM_FOV;
  state.zoomTimer = COMBAT_ZOOM_DURATION;
  // Also trigger screen shake
  state.shake.active = true;
  state.shake.elapsed = 0;
  state.shake.intensity = COMBAT_SHAKE_INTENSITY * intensity;
}

/** Trigger screen shake without zoom (for lighter events) */
export function triggerCombatShake(state: CombatCameraState, intensity: number = 0.5): void {
  state.shake.active = true;
  state.shake.elapsed = 0;
  state.shake.intensity = COMBAT_SHAKE_INTENSITY * intensity;
}

/**
 * Update combat camera state.
 * Returns shake offset to apply to camera position.
 */
export function updateCombatCamera(
  state: CombatCameraState,
  delta: number,
  cameraPosition: THREE.Vector3,
): { shakeOffset: THREE.Vector3; effectiveFov: number } {
  const dt = Math.min(delta, 0.05);
  let effectiveFov = state.targetFov;

  // ── Zoom recovery ──
  if (state.zoomTimer > 0) {
    state.zoomTimer -= dt;
    if (state.zoomTimer <= 0) {
      state.zoomTimer = 0;
      state.targetFov = COMBAT_FOV;
    }
  } else {
    // Smoothly recover to combat FOV
    effectiveFov = THREE.MathUtils.lerp(state.targetFov, COMBAT_FOV, 1 - Math.exp(-COMBAT_ZOOM_RECOVER_SPEED * dt));
    state.targetFov = effectiveFov;
  }

  // ── Screen shake ──
  state.shake.offset.set(0, 0, 0);
  if (state.shake.active) {
    state.shake.elapsed += dt;
    const progress = state.shake.elapsed / COMBAT_SHAKE_DURATION;

    if (progress >= 1) {
      state.shake.active = false;
    } else {
      const decay = 1 - progress;
      const magnitude = state.shake.intensity * decay;
      state.shake.offset.set(
        (Math.random() - 0.5) * 2 * magnitude,
        (Math.random() - 0.5) * magnitude,
        (Math.random() - 0.5) * magnitude * 0.5,
      );
    }
  }

  return { shakeOffset: state.shake.offset, effectiveFov };
}

/* ════════════════════════════════════════════════════
 * SCENE TRANSITION CAMERA
 * Brief cinematic fly-through when changing scenes.
 * ════════════════════════════════════════════════════ */

export interface SceneTransitionState {
  /** Whether a transition is active */
  active: boolean;
  /** Progress through transition (0-1) */
  progress: number;
  /** Start position (before transition) */
  startPos: THREE.Vector3;
  /** Start look-at (before transition) */
  startLookAt: THREE.Vector3;
  /** Target position (after transition) */
  endPos: THREE.Vector3;
  /** Target look-at (after transition) */
  endLookAt: THREE.Vector3;
  /** Mid-point height for arc */
  flyHeight: number;
}

export function createSceneTransitionState(): SceneTransitionState {
  return {
    active: false,
    progress: 0,
    startPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    endLookAt: new THREE.Vector3(),
    flyHeight: TRANSITION_FLY_HEIGHT,
  };
}

/** Start a scene transition fly-through */
export function startSceneTransition(
  state: SceneTransitionState,
  currentCamPos: THREE.Vector3,
  currentLookAt: THREE.Vector3,
  targetCamPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
): void {
  state.active = true;
  state.progress = 0;
  state.startPos.copy(currentCamPos);
  state.startLookAt.copy(currentLookAt);
  state.endPos.copy(targetCamPos);
  state.endLookAt.copy(targetLookAt);
}

/** Cancel an in-flight scene transition (unmount / scene change cleanup). */
export function cancelSceneTransition(state: SceneTransitionState): void {
  state.active = false;
  state.progress = 0;
}

/**
 * Update scene transition camera.
 * Returns interpolated camera position and look-at during transition.
 * Returns null when transition is complete.
 */
export function updateSceneTransition(
  state: SceneTransitionState,
  delta: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } | null {
  if (!state.active) return null;

  const dt = Math.min(delta, 0.05);
  state.progress += dt / TRANSITION_FLY_DURATION;

  if (state.progress >= 1) {
    state.active = false;
    state.progress = 1;
    _transitionUpdateOut.position = state.endPos;
    _transitionUpdateOut.lookAt = state.endLookAt;
    return _transitionUpdateOut;
  }

  const t = easeInOutCubic(state.progress);

  _transitionPos.lerpVectors(state.startPos, state.endPos, t);
  _transitionPos.y += state.flyHeight * 4 * t * (1 - t);

  _transitionLookAt.lerpVectors(state.startLookAt, state.endLookAt, t);

  return _transitionUpdateOut;
}

/* ════════════════════════════════════════════════════
 * TIME SCALE CONTROL
 * ════════════════════════════════════════════════════ */

let globalTimeScale = 1.0;

export function setGlobalTimeScale(scale: number): void {
  globalTimeScale = scale;
}

export function getGlobalTimeScale(): number {
  return globalTimeScale;
}

export function applyTimeScale(delta: number): number {
  return delta * globalTimeScale;
}
