import * as THREE from 'three';

/**
 * Шаг 4 (мерцание / порядок с окружением): для загруженного персонажа GLB включить **`depthWrite`**
 * на всех материалах мешей. У прозрачных материалов Three.js часто ставит **`depthWrite: false`** —
 * тогда порядок относительно статичного окружения нестабилен и возможен z-fighting / «мигание».
 *
 * Не вызывать для намеренно «декальных» мешей (мягкая тень на полу и т.п.).
 * Для волос с настоящим альфа-блендингом при необходимости настраивайте **`alphaTest`** в DCC/GLTF
 * или отдельные материалы вручную — глобальная замена **`transparent` → `alphaTest`** здесь не делается.
 */
export function applyGltfCharacterDepthWrite(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (mat && typeof (mat as THREE.Material).depthWrite === 'boolean') {
        (mat as THREE.Material).depthWrite = true;
      }
    }
  });
}
