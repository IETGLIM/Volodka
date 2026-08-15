import { Object3D } from 'three';
import { armMeshHasFingerDetail } from '@/components/3d/fpsFingerEnhancement';
import { measureGltfBounds } from '@/engine/assets/gltfScale';

/** Legacy Khronos exports before root 0.01 normalization (~100+ unit extent). */
export const FULL_BODY_INTERIM_MIN_HEIGHT_UNITS = 8;
/** Meter-normalized full-body interim (Soldier.glb ≈ 1.8 m max axis). */
export const FPS_METER_FULL_BODY_MIN_EXTENT_M = 1.4;
/** Scale for procedural finger coords authored in legacy Khronos space. */
export const FPS_PROCEDURAL_RIG_SCALE = 0.012;

export interface FpsArmsPresentation {
  proceduralOnly: boolean;
  glbScale: number;
  fingerScale: number;
}

export function rigHasTorsoBones(scene: Object3D): boolean {
  let found = false;
  scene.traverse((obj) => {
    const n = obj.name.toLowerCase();
    if (n.includes('hips') || n.includes('spine')) found = true;
  });
  return found;
}

/**
 * Classify shipped fps_arms.glb (Khronos Soldier interim) vs real meter-scale arm rigs.
 * Legacy rigs need 0.012 on the GLB; meter rigs already include Character scale 0.01.
 */
export function resolveFpsArmsPresentation(scene: Object3D): FpsArmsPresentation {
  scene.updateWorldMatrix(true, true);
  const bounds = measureGltfBounds(scene);
  const maxExtent = Math.max(bounds.size.x, bounds.size.y, bounds.size.z);
  const legacyCentimeter = maxExtent > FULL_BODY_INTERIM_MIN_HEIGHT_UNITS;
  const fingerDetail = armMeshHasFingerDetail(scene);
  const fullBodyMeterInterim =
    !legacyCentimeter &&
    maxExtent >= FPS_METER_FULL_BODY_MIN_EXTENT_M &&
    rigHasTorsoBones(scene);
  const proceduralOnly = legacyCentimeter || !fingerDetail || fullBodyMeterInterim;
  const glbScale = legacyCentimeter ? FPS_PROCEDURAL_RIG_SCALE : 1;

  return {
    proceduralOnly,
    glbScale,
    fingerScale: FPS_PROCEDURAL_RIG_SCALE,
  };
}
