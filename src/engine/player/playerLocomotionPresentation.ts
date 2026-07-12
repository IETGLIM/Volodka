import * as THREE from 'three';
import {
  getAccessibilityLocomotionSpeed,
  isEffectiveReducedMotion,
} from '@/engine/accessibility/accessibilitySettings';

export type LocomotionAnimState = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'combat';

export interface LocomotionClipPresentation {
  locomotionActive: boolean;
  walkTimeScale: number;
  runTimeScale: number;
  /** 0 = walk clip only, 1 = run clip only */
  runWeight: number;
}

export interface MovementIntentInput {
  keys: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    run: boolean;
    jump: boolean;
    hasMovement: boolean;
  };
  virtual?: {
    forward: number;
    backward: number;
    left: number;
    right: number;
    run: number;
    jump: number;
    moveMagnitude?: number;
  } | null;
}

export interface MovementIntent {
  fwd: number;
  bwd: number;
  lft: number;
  rgt: number;
  running: boolean;
  jumping: boolean;
  keyboardDrivesMove: boolean;
  /** 0–1 speed scale for analog stick / touch */
  analogSpeedScale: number;
  isMoving: boolean;
}

export interface ExplorationCameraMotionScale {
  breathingScale: number;
  turnTiltScale: number;
  bobScale: number;
}

const WALK_CLIP_TIME_SCALE = 1.05;
const RUN_CLIP_TIME_SCALE = 1.45;
const MOVE_BLEND_DAMP = 4;

export function dampMoveBlend(
  current: number,
  target: number,
  dt: number,
): number {
  return THREE.MathUtils.damp(current, target, MOVE_BLEND_DAMP, dt);
}

export function updateMoveBlendRef(
  moveBlendRef: { current: number } | undefined,
  target: number,
  dt: number,
): void {
  if (!moveBlendRef) return;
  moveBlendRef.current = dampMoveBlend(moveBlendRef.current, target, dt);
}

export type RunWalkCrossfadeTarget = 'walk_to_run' | 'run_to_walk';

/** Only crossfade walk↔run when runWeight crosses the run threshold (avoids per-frame jitter). */
export function resolveRunWalkCrossfadeTarget(
  prevRunWeight: number,
  nextRunWeight: number,
): RunWalkCrossfadeTarget | null {
  const prevIsRun = prevRunWeight >= 1;
  const nextIsRun = nextRunWeight >= 1;
  if (prevIsRun === nextIsRun) return null;
  return nextIsRun ? 'walk_to_run' : 'run_to_walk';
}

export interface LockedLocomotionInput {
  externalActive: boolean;
  vx: number;
  vz: number;
  gamePhase: string;
}

export interface LockedLocomotionPresentation {
  anim: LocomotionAnimState;
  moveBlendTarget: number;
  hSpeed: number;
}

/** Shared idle/walk/combat presentation for locked movement (PhysicsPlayer + SimplePlayer). */
export function resolveLockedLocomotionPresentation(
  input: LockedLocomotionInput,
): LockedLocomotionPresentation {
  const hSpeed = Math.hypot(input.vx, input.vz);
  if (input.gamePhase === 'combat') {
    return {
      anim: 'combat',
      moveBlendTarget: hSpeed > 0.15 ? 1 : 0,
      hSpeed,
    };
  }
  if (input.externalActive && hSpeed > 0.12) {
    return {
      anim: 'walk',
      moveBlendTarget: 1,
      hSpeed,
    };
  }
  return {
    anim: 'idle',
    moveBlendTarget: 0,
    hSpeed,
  };
}

export function resolveLocomotionClipState(anim: string): LocomotionClipPresentation {
  if (anim !== 'walk' && anim !== 'run') {
    return {
      locomotionActive: false,
      walkTimeScale: 0,
      runTimeScale: 0,
      runWeight: 0,
    };
  }
  return {
    locomotionActive: true,
    walkTimeScale: WALK_CLIP_TIME_SCALE,
    runTimeScale: RUN_CLIP_TIME_SCALE,
    runWeight: anim === 'run' ? 1 : 0,
  };
}

export function resolveMovementIntent(input: MovementIntentInput): MovementIntent {
  const keyboardDrivesMove = input.keys.hasMovement;
  const mergeVirtual = !keyboardDrivesMove;
  const virtual = input.virtual;

  const fwd = (input.keys.forward ? 1 : 0) + (mergeVirtual ? (virtual?.forward ?? 0) : 0);
  const bwd = (input.keys.backward ? 1 : 0) + (mergeVirtual ? (virtual?.backward ?? 0) : 0);
  const lft = (input.keys.left ? 1 : 0) + (mergeVirtual ? (virtual?.left ?? 0) : 0);
  const rgt = (input.keys.right ? 1 : 0) + (mergeVirtual ? (virtual?.right ?? 0) : 0);

  const dirX = rgt - lft;
  const dirZ = fwd - bwd;
  const isMoving = Math.hypot(dirX, dirZ) > 0.01;

  const axisPeak = Math.max(fwd, bwd, lft, rgt);
  const analogSpeedScale = keyboardDrivesMove
    ? 1
    : Math.min(1, virtual?.moveMagnitude ?? axisPeak);

  return {
    fwd,
    bwd,
    lft,
    rgt,
    running: input.keys.run || (virtual?.run ?? 0) > 0,
    jumping: input.keys.jump || (virtual?.jump ?? 0) > 0,
    keyboardDrivesMove,
    analogSpeedScale: isMoving ? Math.max(analogSpeedScale, 0.2) : 0,
    isMoving,
  };
}

/** Slow horizontal speed when climbing steep slopes (KCC vertical displacement). */
export function computeSlopeLocomotionScale(
  actualDx: number,
  actualDy: number,
  actualDz: number,
  grounded: boolean,
): number {
  if (!grounded) return 1;
  const horizontal = Math.hypot(actualDx, actualDz);
  if (horizontal < 0.001) return 1;
  const riseRatio = Math.abs(actualDy) / horizontal;
  if (riseRatio < 0.08) return 1;
  const t = Math.min(1, (riseRatio - 0.08) / 0.17);
  return 1 - t * 0.15;
}

export function getAccessibilityLocomotionScale(): number {
  return getAccessibilityLocomotionSpeed();
}

export function getExplorationCameraMotionScale(
  moveBlend: number,
): ExplorationCameraMotionScale {
  if (isEffectiveReducedMotion()) {
    return { breathingScale: 0, turnTiltScale: 0, bobScale: 0 };
  }
  const locomotionDamp = 1 - Math.min(1, moveBlend) * 0.75;
  return {
    breathingScale: locomotionDamp,
    turnTiltScale: 1,
    bobScale: locomotionDamp,
  };
}
