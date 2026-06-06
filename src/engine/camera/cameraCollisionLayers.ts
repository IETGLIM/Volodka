/* ─── Volodka RPG – camera collision Three.js layer ─── */
/* Layer 5 — separate from visualization layers 0–4 (see VisualizationLayers.tsx). */

import type * as THREE from 'three';
import { Layers } from 'three';

/** Raycast target layer for camera wall avoidance (not used for rendering). */
export const CAMERA_COLLISION_LAYER = 5;

const _collisionLayerMask = new Layers();
_collisionLayerMask.set(CAMERA_COLLISION_LAYER);

/** Enable the camera-collision layer on an object and all mesh descendants. */
export function enableCameraCollisionLayer(object: THREE.Object3D): void {
  object.layers.enable(CAMERA_COLLISION_LAYER);
  object.traverse((child) => {
    if (child.layers?.enable) {
      child.layers.enable(CAMERA_COLLISION_LAYER);
    }
  });
}

/** Restrict a raycaster to camera-collision geometry only. */
export function configureCameraCollisionRaycaster(raycaster: THREE.Raycaster): void {
  raycaster.layers.set(CAMERA_COLLISION_LAYER);
}

/** True when the hit object participates in camera collision. */
export function isCameraCollisionHit(object: THREE.Object3D): boolean {
  return object.layers.test(_collisionLayerMask);
}
