import { MathUtils } from 'three';
import {
  getAccessibilityLocomotionSpeed,
  isEffectiveReducedMotion,
} from '@/engine/accessibility/accessibilitySettings';
import { WALK_SPEED, RUN_SPEED } from '@/engine/player/playerConstants';

/**
 * Hermite smoothstep — clamped linear remap with C1 continuity at both edges.
 * Used to drive the continuous walk↔run blend weight from actual hSpeed so
 * the AnimationAction weights ramp smoothly across the walk→run speed band
 * instead of snapping 0/1 on the binary `running` input flag.
 *
 * NOTE: animation-side only. The KCC physics speed itself stays binary
 * (WALK_SPEED / RUN_SPEED) per the project invariants — only the visual
 * blend between the walk and run AnimationActions becomes continuous.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

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

export const WALK_CLIP_TIME_SCALE = 1.05;
export const RUN_CLIP_TIME_SCALE = 1.45;
const MOVE_BLEND_DAMP = 4;

export function dampMoveBlend(
  current: number,
  target: number,
  dt: number,
): number {
  return MathUtils.damp(current, target, MOVE_BLEND_DAMP, dt);
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

/**
 * Resolve the locomotion clip presentation for a given anim state + hSpeed.
 *
 * `runWeight` is now CONTINUOUS: a smoothstep over [WALK_SPEED, RUN_SPEED]
 * driven by the actual horizontal speed. The blend band starts AT walk-speed
 * and tops out AT run-speed, so:
 *   - hSpeed ≤ WALK_SPEED (4) → runWeight = 0 (pure walk, no run contamination)
 *   - hSpeed ≥ RUN_SPEED (7) → runWeight = 1 (pure run)
 *   - WALK_SPEED < hSpeed < RUN_SPEED → smooth crossfade (only during accel)
 *
 * This ensures normal walking at WALK_SPEED is 100% walk clip (the previous
 * band `smoothstep(WALK*0.7, RUN*0.85, hSpeed)` started at 2.8 — below walk
 * speed — so walking was contaminated with ~32% run clip). Animation-side
 * only — KCC physics velocity stays binary.
 *
 * The hSpeed defaults to 0 so non-locomotion callers (cinematic rebinds,
 * procedural-lite fallback) get a safe walk-only weight without breaking.
 */
export function resolveLocomotionClipState(
  anim: string,
  hSpeed: number = 0,
): LocomotionClipPresentation {
  if (anim !== 'walk' && anim !== 'run') {
    return {
      locomotionActive: false,
      walkTimeScale: 0,
      runTimeScale: 0,
      runWeight: 0,
    };
  }
  const runWeight = smoothstep(WALK_SPEED, RUN_SPEED, hSpeed);
  return {
    locomotionActive: true,
    walkTimeScale: WALK_CLIP_TIME_SCALE,
    runTimeScale: RUN_CLIP_TIME_SCALE,
    runWeight,
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
  // Start earlier and peak ~22% so stair/ramp climbs read as intentional effort.
  if (riseRatio < 0.06) return 1;
  const t = Math.min(1, (riseRatio - 0.06) / 0.18);
  return 1 - t * 0.22;
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
