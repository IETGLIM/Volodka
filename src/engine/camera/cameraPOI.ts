/* ─── Volodka RPG – Camera Point-of-Interest (POI) System ───
 *  Allows external systems to smoothly orient the camera toward
 *  a specific point of interest (e.g., a key item, NPC, or landmark).
 *
 *  Usage:
 *    import { setCameraPOITarget } from '@/engine/camera/cameraPOI';
 *    setCameraPOITarget(new THREE.Vector3(1, 1.5, -3));
 *
 *  The FollowCamera reads getCameraPOI() each frame and lerps yaw
 *  toward the POI. After POI_DURATION seconds, the POI auto-clears.
 */

import * as THREE from 'three';

/** How long the camera holds on a POI before clearing (seconds) */
const POI_DURATION = 2.0;

/** How fast the camera yaw lerps toward the POI (higher = snappier) */
export const POI_LERP_SPEED = 3.0;

/** Module-level POI state */
let poiTarget: THREE.Vector3 | null = null;
let poiTimer: number = 0;

/**
 * Set a POI target for the camera to orient toward.
 * Overwrites any previous POI.
 */
export function setCameraPOITarget(position: THREE.Vector3): void {
  poiTarget = position.clone();
  poiTimer = 0;
}

/**
 * Get the current POI target (null if none active).
 * Advances the timer by dt.
 */
export function getCameraPOI(dt: number): THREE.Vector3 | null {
  if (!poiTarget) return null;

  poiTimer += dt;
  if (poiTimer >= POI_DURATION) {
    poiTarget = null;
    poiTimer = 0;
    return null;
  }

  return poiTarget;
}

/**
 * Immediately clear any active POI.
 */
export function clearCameraPOI(): void {
  poiTarget = null;
  poiTimer = 0;
}

/**
 * Check if a POI is currently active.
 */
export function isCameraPOIActive(): boolean {
  return poiTarget !== null;
}
