/* ─── Max Payne OTS shoulder offset helper ─── */

import type { Vector3 } from 'three';
import { SHOULDER_OFFSET_X } from './cameraConstants';

/**
 * Nudge camera position + look pivot along camera-right for over-the-shoulder.
 * Yaw convention matches explorationStrategy spherical offset:
 *   offset.xz ∝ (sin(yaw), cos(yaw)) → right = (cos(yaw), -sin(yaw)).
 */
export function applyShoulderOffset(
  targetPos: Vector3,
  targetLook: Vector3,
  yaw: number,
  shoulderX: number = SHOULDER_OFFSET_X,
): void {
  if (Math.abs(shoulderX) < 1e-6) return;
  const rx = Math.cos(yaw) * shoulderX;
  const rz = -Math.sin(yaw) * shoulderX;
  targetPos.x += rx;
  targetPos.z += rz;
  targetLook.x += rx;
  targetLook.z += rz;
}
