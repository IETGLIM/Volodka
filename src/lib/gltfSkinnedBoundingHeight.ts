import * as THREE from 'three';

/**
 * Fallback высоты (м), если bbox пустой или подозрительно мелкий — иначе делитель → гигантский меш.
 * Согласовано с `PhysicsPlayer` / exploration GLB.
 */
export const GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M = 1.72;

/**
 * Вертикальный размер bbox SkinnedMesh в **единицах сцены** (часто ~1.7–2.4 для «метровых» GLB или ~170 в «сантиметрах» файла).
 */
export function getGltfSkinnedVisualHeightMeters(root: THREE.Object3D, scratch: THREE.Vector3): number {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let foundSkinned = false;
  root.traverse((obj) => {
    if (obj instanceof THREE.SkinnedMesh && obj.geometry) {
      foundSkinned = true;
      if (!obj.geometry.boundingBox) {
        obj.geometry.computeBoundingBox();
      }
      const local = obj.geometry.boundingBox;
      if (!local || local.isEmpty()) return;
      const tmp = local.clone();
      tmp.applyMatrix4(obj.matrixWorld);
      box.union(tmp);
    }
  });
  if (!foundSkinned || box.isEmpty()) {
    box.setFromObject(root);
  }
  const hRaw = box.getSize(scratch).y;
  if (!Number.isFinite(hRaw) || hRaw < 1e-4) {
    return GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M;
  }
  if (hRaw < 0.55) {
    return GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M;
  }
  return hRaw;
}
