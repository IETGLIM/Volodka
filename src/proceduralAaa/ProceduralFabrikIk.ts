/**
 * Pillar 5 — Procedural FABRIK IK + walk cycle (Unity Animation Rigging → Three.js).
 * Foot targets + raycast ground; limb chain solve.
 */

import * as THREE from 'three';
import type { ProceduralAaaParams } from './params';

export interface IkChain {
  joints: THREE.Vector3[];
  lengths: number[];
  totalLength: number;
}

export function createChain(points: THREE.Vector3[]): IkChain {
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = points[i]!.distanceTo(points[i + 1]!);
    lengths.push(len);
    total += len;
  }
  return {
    joints: points.map((p) => p.clone()),
    lengths,
    totalLength: total,
  };
}

/**
 * FABRIK — Forward And Backward Reaching Inverse Kinematics.
 * 1) Reach target from tip → root (forward)
 * 2) Re-anchor root → tip (backward)
 */
export function solveFabrik(
  chain: IkChain,
  target: THREE.Vector3,
  iterations = 8,
  tolerance = 0.002,
): void {
  const { joints, lengths, totalLength } = chain;
  if (joints.length < 2) return;

  const root = joints[0]!.clone();
  const dist = root.distanceTo(target);
  if (dist > totalLength) {
    // Stretch toward target
    for (let i = 0; i < lengths.length; i++) {
      const dir = target.clone().sub(joints[i]!).normalize();
      joints[i + 1]!.copy(joints[i]!).addScaledVector(dir, lengths[i]!);
    }
    return;
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Forward
    joints[joints.length - 1]!.copy(target);
    for (let i = joints.length - 2; i >= 0; i--) {
      const dir = joints[i]!.clone().sub(joints[i + 1]!).normalize();
      joints[i]!.copy(joints[i + 1]!).addScaledVector(dir, lengths[i]!);
    }
    // Backward
    joints[0]!.copy(root);
    for (let i = 0; i < lengths.length; i++) {
      const dir = joints[i + 1]!.clone().sub(joints[i]!).normalize();
      joints[i + 1]!.copy(joints[i]!).addScaledVector(dir, lengths[i]!);
    }
    if (joints[joints.length - 1]!.distanceTo(target) < tolerance) break;
  }
}

export interface WalkCycleState {
  phase: number;
  leftTarget: THREE.Vector3;
  rightTarget: THREE.Vector3;
  hip: THREE.Vector3;
}

export function createWalkState(origin = new THREE.Vector3(0, 0, 0)): WalkCycleState {
  return {
    phase: 0,
    leftTarget: origin.clone().add(new THREE.Vector3(-0.18, 0, 0)),
    rightTarget: origin.clone().add(new THREE.Vector3(0.18, 0, 0)),
    hip: origin.clone().add(new THREE.Vector3(0, 0.95, 0)),
  };
}

/**
 * Procedural walk: sinusoid foot arcs + hip bob — more grounded plant/lift.
 * footY from raycast (caller passes groundY).
 */
export function updateWalkCycle(
  state: WalkCycleState,
  dt: number,
  params: ProceduralAaaParams,
  facing: THREE.Vector3,
  groundYLeft: number,
  groundYRight: number,
): void {
  const speed = params.walkSpeed;
  state.phase += dt * speed * 2.05;
  const forward = facing.clone().normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const stride = 0.38;
  const stepH = params.ikStepHeight;

  // Ease plant: lift only on positive half, snap plant near zero swing
  const lRaw = Math.sin(state.phase);
  const rRaw = Math.sin(state.phase + Math.PI);
  const lLift = Math.max(0, lRaw) ** 1.35 * stepH;
  const rLift = Math.max(0, rRaw) ** 1.35 * stepH;
  // Slight forward bias while airborne
  const lFwd = lRaw * stride * 0.5 + (lLift > 0.001 ? 0.04 : 0);
  const rFwd = rRaw * stride * 0.5 + (rLift > 0.001 ? 0.04 : 0);

  const hipBase = state.hip.clone();
  // Smaller bob; dip on double-support
  const support = Math.abs(Math.sin(state.phase * 2));
  hipBase.y = 0.95 + support * 0.022 - (1 - support) * 0.01;

  state.leftTarget
    .copy(hipBase)
    .addScaledVector(right, -0.16)
    .addScaledVector(forward, lFwd);
  // Plant firmly when not lifting
  state.leftTarget.y = groundYLeft + (lLift < 0.004 ? 0 : lLift);

  state.rightTarget
    .copy(hipBase)
    .addScaledVector(right, 0.16)
    .addScaledVector(forward, rFwd);
  state.rightTarget.y = groundYRight + (rLift < 0.004 ? 0 : rLift);

  state.hip.copy(hipBase);
}

/** Idle torso breathe phase — returns updated phase. */
export function updateIdleBreathe(phase: number, dt: number, rate = 1.15): number {
  return phase + dt * rate;
}

/** Raycast helper against a list of meshes — returns ground Y or fallback. */
export function raycastGroundY(
  raycaster: THREE.Raycaster,
  origin: THREE.Vector3,
  meshes: THREE.Object3D[],
  fallback = 0,
): number {
  raycaster.set(origin.clone().setY(origin.y + 2), new THREE.Vector3(0, -1, 0));
  const hits = raycaster.intersectObjects(meshes, true);
  if (hits.length > 0) return hits[0]!.point.y;
  return fallback;
}
