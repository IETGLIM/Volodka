import { Color, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D } from 'three';

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
  /** Enable subtle subsurface scattering approximation via clearcoat + transmission. */
  enableSssApprox?: boolean;
}

const DEFAULTS: Required<DeplasticizeCharacterOptions> = {
  envMapIntensity: 0.22,
  minRoughness: 0.68,
  roughnessMul: 1.42,
  maxMetalness: 0.12,
  maxEmissiveIntensity: 0.32,
  enableSssApprox: true,
};

/**
 * Quaternius / Mixamo / kit GLBs often ship as plastic-shiny MeshStandard.
 * Pull them toward worn cloth/skin response without rebuilding the mesh.
 */
export function deplasticizeCharacterMaterials(
  root: Object3D,
  options: DeplasticizeCharacterOptions = {},
): void {
  const opts = { ...DEFAULTS, ...options };

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (!m || !(m as MeshStandardMaterial).isMeshStandardMaterial) continue;
      const std = m as MeshStandardMaterial;

      const name = `${std.name ?? ''} ${mesh.name ?? ''}`.toLowerCase();
      const isSkin =
        /skin|face|body|head|hand|arm|leg|flesh|beard|stubble|mouth/.test(name);
      const isCloth =
        /cloth|shirt|hoodie|jacket|pant|jean|coat|fabric|dress|hat|hair/.test(name);
      const isMetalKit =
        /metal|steel|iron|chrome|weapon|gun|blade|buckle/.test(name);

      std.envMapIntensity = isSkin
        ? Math.min(opts.envMapIntensity, 0.18)
        : isCloth
          ? Math.min(opts.envMapIntensity, 0.20)
          : Math.min(opts.envMapIntensity, 0.25);

      const roughFloor = isSkin ? 0.72 : isCloth ? 0.82 : opts.minRoughness;
      std.roughness = Math.min(
        1,
        Math.max(roughFloor, (std.roughness ?? 0.55) * opts.roughnessMul),
      );

      // Skin roughness: add slight per-pixel variation via roughnessMap noise
      // to break the uniform plastic sheen. Standard material doesn't have
      // roughnessMap, so we clamp to a natural range and accept uniform.
      if (isSkin) {
        // Skin needs higher roughness floor (0.72 vs 0.68) to avoid waxy look
        // and lower metalness cap (0.02 — skin is never metallic)
        std.metalness = Math.min(0.02, std.metalness ?? 0);
      }

      if (!isMetalKit && !isSkin) {
        // Subtle metalness floor (0.01-0.08) for non-metal realism —
        // real-world dielectrics always have a tiny Fresnel reflectance hint.
        const floor = isCloth ? 0.01 : 0.03;
        std.metalness = Math.min(opts.maxMetalness, Math.max(floor, std.metalness ?? 0));
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
      const physical = std as unknown as MeshPhysicalMaterial;
      if (isCloth && 'sheen' in physical) {
        try {
          physical.sheen = Math.max(physical.sheen ?? 0, 0.45);
          physical.sheenRoughness = 0.72;
          physical.sheenColor = new Color('#5a5a6a');
        } catch { /* ignore */ }
      }
      if (isSkin && 'sheen' in physical) {
        try {
          physical.sheen = Math.max(physical.sheen ?? 0, 0.28);
          physical.sheenRoughness = 0.58;
          physical.sheenColor = new Color('#ffdfc4');
        } catch { /* ignore */ }
        // SSS approximation: thin clearcoat layer simulates epidermis specular
        // and subtle transmission simulates light through thin skin (ears, fingers).
        if (opts.enableSssApprox && 'clearcoat' in physical && 'transmission' in physical) {
          try {
            physical.clearcoat = Math.max(physical.clearcoat ?? 0, 0.08);
            physical.clearcoatRoughness = 0.65;
            physical.transmission = Math.max(physical.transmission ?? 0, 0.03);
            physical.thickness = 0.5;
            physical.ior = 1.4;  // Skin IOR ≈ 1.4
          } catch { /* ignore */ }
        }
      }
      if (!isMetalKit && !isSkin && !isCloth && 'clearcoat' in physical) {
        // Subtle clearcoat on polished/wood kit surfaces — breaks the dead matte look
        // that deplasticizing can cause. 0.08-0.15 reads as varnished or worn lacquer.
        try {
          physical.clearcoat = Math.max(physical.clearcoat ?? 0, 0.1);
          physical.clearcoatRoughness = 0.55;
        } catch { /* ignore */ }
      }
    }
  });
}
