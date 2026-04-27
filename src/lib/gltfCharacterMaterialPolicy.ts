import * as THREE from 'three';

/**
 * Для блендинга и стекла (`transmission`) не форсируем `depthWrite: true` — иначе запись в depth
 * ломает порядок отрисовки (очки, витрины). Волосы/ресницы обрабатываются отдельно через
 * `applyGltfHairLikeAlphaTestCutout` (alphaTest + depthWrite).
 */
function shouldSkipDepthWriteForce(mat: THREE.Material): boolean {
  if (mat.transparent) return true;
  if (mat instanceof THREE.MeshPhysicalMaterial && mat.transmission > 0.001) return true;
  return false;
}

function applyPerMaterialDepthAndPolygonDefaults(mat: THREE.Material): void {
  /** DCC часто оставляет `opacity` < 1 без `transparent` — неверный бленд / мерцание относительно окружения. */
  if (mat.opacity < 1 - 1e-4 && !mat.transparent) {
    mat.transparent = true;
    mat.needsUpdate = true;
  }
  if (typeof mat.depthWrite === 'boolean' && !shouldSkipDepthWriteForce(mat)) {
    mat.depthWrite = true;
  }
  /** Шаг «Глубина / Z»: импорт GLB иногда задаёт polygonOffset — при борьбе с полом даёт «пропадание». */
  mat.polygonOffset = false;
  mat.polygonOffsetFactor = 0;
  mat.polygonOffsetUnits = 0;
}

/**
 * Шаг 4 / В (мерцание / порядок с окружением): для **непрозрачных** материалов мешей GLB включить
 * **`depthWrite`** (если экспорт выключил — z-fighting с окружением). Пропуск для **`transparent`**
 * и **`MeshPhysicalMaterial`** с **`transmission`** (стекло), чтобы не затирать себя в depth.
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
 * Вертикаль объединённого AABB по всем `Mesh`/`SkinnedMesh` (boundingBox геометрии × `matrixWorld`).
 * Стабильнее `setFromObject` на корне при «раздутых» иерархиях.
 */
export function computeExplorationCharacterMeshUnionVerticalExtent(root: THREE.Object3D): number {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  let any = false;
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const geom = mesh.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    const b = geom.boundingBox!.clone();
    b.applyMatrix4(mesh.matrixWorld);
    if (!any) {
      box.copy(b);
      any = true;
    } else {
      box.union(b);
    }
  });
  if (!any) {
    const f = new THREE.Box3().setFromObject(root);
    return Math.max(0, f.max.y - f.min.y);
  }
  return Math.max(0, box.max.y - box.min.y);
}

export type ExplorationCharacterMaterialPolicyOptions = {
  /**
   * Итоговый uniform визуала обхода (после ÷5 и капов из `resolveCharacterMeshUniformScale`).
   * Если задан — `userData.characterHeightM` = `characterBoundingVerticalM × uniform` (сырой продукт для `validateCharacterScale`).
   */
  explorationVisualUniform?: number;
};

/**
 * Политика материалов и видимости персонажа в обходе: **`depthWrite`** (кроме прозрачного бленда /
 * transmission-стекла), cutout волос, отключение frustum culling на мешах GLB. Вызывать после загрузки
 * (**`GLBPlayerModel`**, **`NPC`**).
 *
 * Записывает **`userData.characterBoundingVerticalM`**, **`userData.characterHeightM`** (при uniform).
 */
export function applyGltfExplorationCharacterMaterialPolicies(
  root: THREE.Object3D,
  options?: ExplorationCharacterMaterialPolicyOptions,
): void {
  applyGltfCharacterDepthWrite(root);
  applyGltfHairLikeAlphaTestCutout(root);
  applyGltfMeshesFrustumCullOff(root);

  const bboxH = computeExplorationCharacterMeshUnionVerticalExtent(root);
  root.userData.characterBoundingVerticalM = bboxH;

  const u = options?.explorationVisualUniform;
  if (u != null && Number.isFinite(u) && u > 0) {
    root.userData.characterHeightM = bboxH * u;
  } else {
    delete root.userData.characterHeightM;
  }
}
