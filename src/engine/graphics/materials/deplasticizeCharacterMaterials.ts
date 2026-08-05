import * as THREE from 'three';

export interface DeplasticizeCharacterOptions {
  /** Base IBL response — cloth/skin should drink light, not mirror it. */
  envMapIntensity?: number;
  /** Min roughness after pass (higher = less plastic). */
  minRoughness?: number;
  /** Roughness multiplier before clamp. */
  roughnessMul?: number;
  /** Hard cap on metalness for organic/cloth kits. */
  maxMetalness?: number;
  /** Cap emissive so neon kit mats don't blow out. */
  maxEmissiveIntensity?: number;
}

const DEFAULTS: Required<DeplasticizeCharacterOptions> = {
  envMapIntensity: 0.38,
  minRoughness: 0.68,
  roughnessMul: 1.42,
  maxMetalness: 0.12,
  maxEmissiveIntensity: 0.32,
};

/**
 * Quaternius / Mixamo / kit GLBs often ship as plastic-shiny MeshStandard.
 * Pull them toward worn cloth/skin response without rebuilding the mesh.
 */
export function deplasticizeCharacterMaterials(
  root: THREE.Object3D,
  options: DeplasticizeCharacterOptions = {},
): void {
  const opts = { ...DEFAULTS, ...options };

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m || !(m as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
      const std = m as THREE.MeshStandardMaterial;

      const name = `${std.name ?? ''} ${mesh.name ?? ''}`.toLowerCase();
      const isSkin =
        /skin|face|body|head|hand|arm|leg|flesh|beard|stubble/.test(name);
      const isCloth =
        /cloth|shirt|hoodie|jacket|pant|jean|coat|fabric|dress|hat|hair/.test(name);
      const isMetalKit =
        /metal|steel|iron|chrome|weapon|gun|blade|buckle/.test(name);

      std.envMapIntensity = isSkin
        ? Math.min(opts.envMapIntensity, 0.32)
        : isCloth
          ? Math.min(opts.envMapIntensity, 0.35)
          : Math.min(opts.envMapIntensity, 0.38);

      const roughFloor = isSkin ? 0.68 : isCloth ? 0.82 : opts.minRoughness;
      std.roughness = Math.min(
        1,
        Math.max(roughFloor, (std.roughness ?? 0.55) * opts.roughnessMul),
      );

      if (!isMetalKit) {
        std.metalness = Math.min(opts.maxMetalness, std.metalness ?? 0);
      } else {
        std.metalness = Math.min(0.62, Math.max(0.32, std.metalness ?? 0.45));
        std.roughness = Math.min(std.roughness, 0.52);
      }

      if (std.emissiveIntensity > opts.maxEmissiveIntensity) {
        std.emissiveIntensity = opts.maxEmissiveIntensity;
      }

      // Soften hard faceted kit normals without recomputing buffers every frame.
      if (std.flatShading) {
        std.flatShading = false;
        std.needsUpdate = true;
      }

      // AAA: add subtle sheen for cloth/skin when using Physical (graceful on Standard)
      const physical = std as unknown as THREE.MeshPhysicalMaterial;
      if (isCloth && 'sheen' in physical) {
        try {
          (physical as any).sheen = Math.max((physical as any).sheen ?? 0, 0.4);
          (physical as any).sheenRoughness = 0.72;
          (physical as any).sheenColor = new THREE.Color('#5a5a6a');
        } catch { /* ignore */ }
      }
      if (isSkin && 'sheen' in physical) {
        try {
          (physical as any).sheen = Math.max((physical as any).sheen ?? 0, 0.25);
          (physical as any).sheenRoughness = 0.62;
          (physical as any).sheenColor = new THREE.Color('#ffdfc4');
        } catch { /* ignore */ }
      }
    }
  });
}
