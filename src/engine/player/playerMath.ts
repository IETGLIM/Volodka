import * as THREE from 'three';
import type { RapierRigidBody } from '@react-three/rapier';

/** Lerp angle with wraparound — smooth rotation without 360 jumps */
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}

/** Snap rigid body to probed ground when at/below floor level and falling. */
export function enforceFloor(
  rb: RapierRigidBody,
  vel: THREE.Vector3,
  groundY: number,
  tolerance = 0.02,
): boolean {
  if (!rb.isValid()) return false;
  const pos = rb.translation();
  if (pos.y <= groundY + tolerance && vel.y < 0) {
    rb.setTranslation({ x: pos.x, y: groundY, z: pos.z }, true);
    vel.y = 0;
    return true;
  }
  return false;
}
