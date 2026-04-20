import * as THREE from 'three';

function applyPerMaterialDepthAndPolygonDefaults(mat: THREE.Material): void {
  if (typeof mat.depthWrite === 'boolean') {
    mat.depthWrite = true;
  }
  /** Шаг «Глубина / Z»: импорт GLB иногда задаёт polygonOffset — при борьбе с полом даёт «пропадание». */
  mat.polygonOffset = false;
  mat.polygonOffsetFactor = 0;
  mat.polygonOffsetUnits = 0;
}

/**
 * Шаг 4 / В (мерцание / порядок с окружением): для загруженного персонажа GLB включить **`depthWrite`**
 * на всех материалах мешей. У прозрачных материалов Three.js часто ставит **`depthWrite: false`** —
 * тогда порядок относительно статичного окружения нестабилен и возможен z-fighting / «мигание».
 *
 * Сброс **`polygonOffset`** на материалах — диагностика/профилактика Z-конфликтов с DCC.
 *
 * Не вызывать для намеренно «декальных» мешей (мягкая тень на полу и т.п.).
 */
export function applyGltfCharacterDepthWrite(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => {
        if (mat) applyPerMaterialDepthAndPolygonDefaults(mat);
      });
    } else {
      applyPerMaterialDepthAndPolygonDefaults(mesh.material);
    }
  });
}

const HAIR_LIKE_NAME = /hair|lash|brow|beard|mustache|eyelash|scalp|fringe|bangs|волос|ресниц/i;

function isHairLikeMesh(mesh: THREE.Mesh): boolean {
  const n = `${mesh.name}`.toLowerCase();
  if (HAIR_LIKE_NAME.test(n)) return true;
  let p: THREE.Object3D | null = mesh.parent;
  let depth = 0;
  while (p && depth < 6) {
    if (HAIR_LIKE_NAME.test(`${p.name}`.toLowerCase())) return true;
    p = p.parent;
    depth += 1;
  }
  return false;
}

function applyAlphaTestToHairMaterial(mat: THREE.Material): void {
  if (!(mat instanceof THREE.MeshStandardMaterial) && !(mat instanceof THREE.MeshPhysicalMaterial)) {
    return;
  }
  if (!mat.transparent && mat.opacity >= 1) return;
  mat.transparent = false;
  mat.opacity = 1;
  mat.alphaTest = 0.42;
  mat.depthWrite = true;
  mat.depthTest = true;
  mat.needsUpdate = true;
}

/**
 * Шаг В: волосы / ресницы — **`alphaTest`** (cutout) вместо полного **`transparent`**-бленда,
 * чтобы уменьшить мерцание самопересечений и относительно окружения (при наличии альфы в карте
 * или низкой непрозрачности в GLB).
 */
function isHairLikeMaterialName(mat: THREE.Material): boolean {
  return HAIR_LIKE_NAME.test(`${mat.name}`.toLowerCase());
}

export function applyGltfHairLikeAlphaTestCutout(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const meshHair = isHairLikeMesh(mesh);
    for (const m of mats) {
      if (!m) continue;
      if (meshHair || isHairLikeMaterialName(m)) {
        applyAlphaTestToHairMaterial(m);
      }
    }
  });
}

/**
 * Диагностика «пропадание» / мерцание из‑за неверного frustum culling у динамических персонажей:
 * **`frustumCulled = false`** на всех **`Mesh`** / **`SkinnedMesh`** под корнем GLB.
 */
export function applyGltfMeshesFrustumCullOff(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.frustumCulled = false;
    }
  });
}

/**
 * Политика материалов и видимости персонажа в обходе: **`depthWrite`**, cutout волос, отключение
 * frustum culling на мешах GLB. Вызывать после загрузки (**`GLBPlayerModel`**, **`NPC`**).
 */
export function applyGltfExplorationCharacterMaterialPolicies(root: THREE.Object3D): void {
  applyGltfCharacterDepthWrite(root);
  applyGltfHairLikeAlphaTestCutout(root);
  applyGltfMeshesFrustumCullOff(root);
}
