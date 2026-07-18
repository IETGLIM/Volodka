import type { RapierCollider, RapierRigidBody } from '@react-three/rapier';
import type { RapierCharacterController } from '@/engine/physics/rapierTypes';

/** Max KCC integration step — matches ~2× Rapier {@link RAPIER_PHYSICS_TIMESTEP}. */
export const MAX_PHYSICS_DT = 1 / 30;

/** Rapier world step in PhysicsSceneInner — keep in sync. */
export const RAPIER_PHYSICS_TIMESTEP = 1 / 60;

/** Cap sub-steps to avoid spiral-of-death on long freezes. */
export const MAX_PHYSICS_STEPS = 4;

export interface Vec3Displacement {
  x: number;
  y: number;
  z: number;
}

export interface KccSubstepResult {
  actualDisplacement: Vec3Displacement;
  isGrounded: boolean;
  collisionCount: number;
}

export function getPhysicsSubstepCount(dt: number): number {
  if (dt <= 0) return 1;
  const idealSteps = Math.max(1, Math.ceil(dt / MAX_PHYSICS_DT));
  return Math.min(idealSteps, MAX_PHYSICS_STEPS);
}

/**
 * Integrate KCC movement with fixed-timestep sub-steps so large frame deltas
 * cannot teleport the capsule through thin colliders.
 */
export function computeKccMovementSubstepped(
  controller: RapierCharacterController,
  collider: RapierCollider,
  rb: RapierRigidBody,
  desiredDisplacement: Vec3Displacement,
  dt: number,
): KccSubstepResult {
  if (dt <= 0) {
    return {
      actualDisplacement: { x: 0, y: 0, z: 0 },
      isGrounded: controller.computedGrounded(),
      collisionCount:
        typeof controller.numComputedCollisions === 'function'
          ? controller.numComputedCollisions()
          : 0,
    };
  }

  const stepCount = getPhysicsSubstepCount(dt);
  const totalActual: Vec3Displacement = { x: 0, y: 0, z: 0 };
  let isGrounded = false;
  let collisionCount = 0;

  for (let i = 0; i < stepCount; i++) {
    const subDisplacement: Vec3Displacement = {
      x: desiredDisplacement.x / stepCount,
      y: desiredDisplacement.y / stepCount,
      z: desiredDisplacement.z / stepCount,
    };

    controller.computeColliderMovement(collider, subDisplacement);
    const actual = controller.computedMovement();

    // M3: Validate KCC displacement — if computedMovement() returns NaN
    // (corrupted KCC internal state, e.g. during scene teardown), skip
    // this sub-step to prevent teleporting the player to infinity.
    const ax = Number.isFinite(actual.x) ? actual.x : 0;
    const ay = Number.isFinite(actual.y) ? actual.y : 0;
    const az = Number.isFinite(actual.z) ? actual.z : 0;

    const pos = rb.translation();
    rb.setTranslation({
      x: pos.x + ax,
      y: pos.y + ay,
      z: pos.z + az,
    }, true);

    totalActual.x += ax;
    totalActual.y += ay;
    totalActual.z += az;
    isGrounded = controller.computedGrounded();
    if (typeof controller.numComputedCollisions === 'function') {
      collisionCount = Math.max(collisionCount, controller.numComputedCollisions());
    }
  }

  return { actualDisplacement: totalActual, isGrounded, collisionCount };
}