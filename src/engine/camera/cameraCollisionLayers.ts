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

/* ─── Реестр прокси-мешей (FIX perf: 60 FPS) ───
 * Раньше камеры каждый кадр делали ДВА рекурсивных raycast по всему
 * графу сцены (тысячи Object3D), чтобы найти десяток невидимых
 * стен-прокси. Теперь прокси регистрируются здесь при монтировании
 * (единственный источник — CameraCollisionProxies), и raycast идёт
 * по плоскому списку без рекурсии. Пустой реестр → старый путь
 * (для тестов/совместимости). */
const cameraCollisionProxies = new Set<THREE.Object3D>();
let cameraCollisionProxyArray: THREE.Object3D[] = [];

export function registerCameraCollisionProxy(object: THREE.Object3D): void {
  cameraCollisionProxies.add(object);
  cameraCollisionProxyArray = Array.from(cameraCollisionProxies);
}

export function unregisterCameraCollisionProxy(object: THREE.Object3D): void {
  cameraCollisionProxies.delete(object);
  cameraCollisionProxyArray = Array.from(cameraCollisionProxies);
}

/** Snapshot плоского списка прокси (не мутировать!). */
export function getCameraCollisionProxyList(): readonly THREE.Object3D[] {
  return cameraCollisionProxyArray;
}
