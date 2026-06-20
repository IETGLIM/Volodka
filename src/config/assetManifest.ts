/**
 * Typed AAA asset registry.
 * Authoring flow: place source GLB in assets-source/ → npm run assets:process → public/models/
 */

import type { CompressionPreference } from '@/engine/graphics/qualityPresets';
import { ASSET_DISK_SHIPPED } from './assetManifestShipped.generated';

export interface AssetLodLevel {
  /** Relative path under /models/ */
  url: string;
  /** Switch to this LOD when camera distance exceeds threshold (meters) */
  maxDistance: number;
  /** Optional triangle budget for DevPanel */
  triangles?: number;
}

export interface GltfAssetDefinition {
  id: string;
  /** Base name for processed variants */
  category: 'character' | 'prop' | 'environment' | 'vegetation';
  lods: AssetLodLevel[];
  /** Per-compression variants (processed by scripts/process-gltf-assets.mjs) */
  variants?: Partial<Record<CompressionPreference, string>>;
  /** KTX2 texture atlas basename (without _{scale}.ktx2 suffix) */
  textureAtlas?: string;
  /** Baked lightmap / probe volume path */
  bakedLightmap?: string;
  /** Billboard impostor atlas for distant LOD */
  impostor?: { url: string; distance: number };
  instancing?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /**
   * Whether the processed asset files actually exist under public/models/.
   * Defaults to false: the game renders procedural meshes until the art
   * pipeline (npm run assets:process) ships real GLBs. While false, GPU
   * preload and GltfAsset rendering are skipped so missing files never trigger
   * 404s / HTML-as-GLB parse errors. Flip to true once the files are present.
   */
  shipped?: boolean;
}

const MODELS = '/models';

/** Map game NPC id → ASSET_MANIFEST key (when they differ). */
export const NPC_ID_TO_MANIFEST: Readonly<Record<string, string>> = {
  volodka: 'player_volodka',
  maria: 'npc_maria_ai3dgen',
  fisherman_trofim: 'npc_trofim',
};

function npcCharacterAsset(
  manifestId: string,
  fileBase: string,
  lod1Distance = 15,
  lod2Distance = 35,
): GltfAssetDefinition {
  const base = `${MODELS}/npcs/${fileBase}`;
  return {
    id: manifestId,
    category: 'character',
    lods: [
      { url: `${base}.glb`, maxDistance: 0 },
      { url: `${base}_lod1.glb`, maxDistance: lod1Distance },
      { url: `${base}_lod2.glb`, maxDistance: lod2Distance },
    ],
    variants: {
      none: `${base}.glb`,
      draco: `${base}.draco.glb`,
      meshopt: `${base}.meshopt.glb`,
    },
    castShadow: true,
    shipped: true,
  };
}

/** Processed asset catalog — extend as art pipeline grows. */
export const ASSET_MANIFEST: Record<string, GltfAssetDefinition> = {
  fps_arms: {
    id: 'fps_arms',
    category: 'character',
    lods: [{ url: `${MODELS}/fps/fps_arms.glb`, maxDistance: 0 }],
    castShadow: false,
    shipped: true,
  },
  player_volodka: {
    id: 'player_volodka',
    category: 'character',
    lods: [
      { url: `${MODELS}/characters/volodka/volodka_lod0.glb`, maxDistance: 0, triangles: 12000 },
      { url: `${MODELS}/characters/volodka/volodka_lod1.glb`, maxDistance: 15, triangles: 6000 },
      { url: `${MODELS}/characters/volodka/volodka_lod2.glb`, maxDistance: 35, triangles: 2000 },
    ],
    variants: {
      none: `${MODELS}/characters/volodka/volodka_lod0.glb`,
      draco: `${MODELS}/characters/volodka/volodka_lod0.draco.glb`,
      meshopt: `${MODELS}/characters/volodka/volodka_lod0.meshopt.glb`,
    },
    castShadow: true,
    shipped: true,
  },
  npc_cafe_barista: npcCharacterAsset('npc_cafe_barista', 'cafe_barista'),
  npc_office_colleague: npcCharacterAsset('npc_office_colleague', 'office_colleague'),
  npc_albert: npcCharacterAsset('npc_albert', 'albert'),
  npc_zarema: npcCharacterAsset('npc_zarema', 'zarema'),
  npc_maria_ai3dgen: npcCharacterAsset('npc_maria_ai3dgen', 'maria'),
  npc_office_alexander: npcCharacterAsset('npc_office_alexander', 'office_alexander'),
  npc_office_dmitry: npcCharacterAsset('npc_office_dmitry', 'office_dmitry'),
  npc_viktor: npcCharacterAsset('npc_viktor', 'viktor'),
  npc_kira: npcCharacterAsset('npc_kira', 'kira'),
  npc_boris: npcCharacterAsset('npc_boris', 'boris'),
  npc_tamara: npcCharacterAsset('npc_tamara', 'tamara'),
  npc_grisha: npcCharacterAsset('npc_grisha', 'grisha'),
  npc_maxim: npcCharacterAsset('npc_maxim', 'maxim'),
  npc_zeka: npcCharacterAsset('npc_zeka', 'zeka'),
  npc_trofim: npcCharacterAsset('npc_trofim', 'trofim'),
  npc_kate: npcCharacterAsset('npc_kate', 'kate'),
  npc_anya: npcCharacterAsset('npc_anya', 'anya'),
  npc_baba_zina: npcCharacterAsset('npc_baba_zina', 'baba_zina'),
  npc_solnysh: npcCharacterAsset('npc_solnysh', 'solnysh'),
  npc_chk_ru: npcCharacterAsset('npc_chk_ru', 'chk_ru'),
  npc_chk_based: npcCharacterAsset('npc_chk_based', 'chk_based'),
  npc_chk_stalker: npcCharacterAsset('npc_chk_stalker', 'chk_stalker'),
  npc_chk_smert: npcCharacterAsset('npc_chk_smert', 'chk_smert'),
  npc_chk_elis: npcCharacterAsset('npc_chk_elis', 'chk_elis'),
  npc_chk_ritka: npcCharacterAsset('npc_chk_ritka', 'chk_ritka'),
  env_cafe_props: {
    id: 'env_cafe_props',
    category: 'environment',
    lods: [
      { url: `${MODELS}/environments/cafe/props_lod0.glb`, maxDistance: 0 },
      { url: `${MODELS}/environments/cafe/props_lod1.glb`, maxDistance: 20 },
      { url: `${MODELS}/environments/cafe/props_lod2.glb`, maxDistance: 40 },
    ],
    variants: {
      none: `${MODELS}/environments/cafe/props_lod0.glb`,
      draco: `${MODELS}/environments/cafe/props.draco.glb`,
      meshopt: `${MODELS}/environments/cafe/props.meshopt.glb`,
    },
    instancing: true,
    receiveShadow: true,
    shipped: true,
  },
  veg_tree_pine: {
    id: 'veg_tree_pine',
    category: 'vegetation',
    lods: [
      { url: `${MODELS}/vegetation/pine/pine_lod0.glb`, maxDistance: 0 },
      { url: `${MODELS}/vegetation/pine/pine_lod1.glb`, maxDistance: 25 },
      { url: `${MODELS}/vegetation/pine/pine_lod2.glb`, maxDistance: 50 },
    ],
    // impostor atlas — add when vegetation impostor bake is ready
    instancing: true,
    shipped: true,
  },
  /** CC0 interior shells — Kenney fallback; replace with Poly Pizza via assets:freekit-stage. */
  interior_room_bedroom: {
    id: 'interior_room_bedroom',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/room_bedroom.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_cafe: {
    id: 'interior_cafe',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/cafe_interior.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_office: {
    id: 'interior_office',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/office.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_library: {
    id: 'interior_library',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/library.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_factory: {
    id: 'interior_factory',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/factory.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_corridor: {
    id: 'interior_corridor',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/corridor.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_rooftop: {
    id: 'interior_rooftop',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/rooftop.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_basement: {
    id: 'interior_basement',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/basement.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_pier: {
    id: 'interior_pier',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/pier.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
  interior_forest_clearing: {
    id: 'interior_forest_clearing',
    category: 'environment',
    lods: [{ url: `${MODELS}/interiors/forest_clearing.glb`, maxDistance: 0 }],
    receiveShadow: true,
    shipped: true,
  },
};

export function getAssetDefinition(assetId: string): GltfAssetDefinition | undefined {
  return ASSET_MANIFEST[assetId];
}

/** Whether manifest + on-disk flags agree the asset is ready to load. */
export function isAssetEffectiveShipped(assetId: string): boolean {
  const asset = ASSET_MANIFEST[assetId];
  if (!asset || asset.shipped !== true) return false;
  const onDisk = ASSET_DISK_SHIPPED[assetId];
  if (onDisk === undefined) return true;
  return onDisk;
}

/** Whether an asset's processed files are shipped under public/models/. */
export function isAssetShipped(assetId: string): boolean {
  return isAssetEffectiveShipped(assetId);
}

/** Pick LOD url for camera distance with quality bias. */
export function resolveLodUrl(
  asset: GltfAssetDefinition,
  distance: number,
  lodBias: number,
): string {
  const sorted = [...asset.lods].sort((a, b) => b.maxDistance - a.maxDistance);
  const threshold = distance / Math.max(lodBias, 0.1);
  for (const lod of sorted) {
    if (threshold >= lod.maxDistance) return lod.url;
  }
  return sorted[sorted.length - 1]?.url ?? asset.lods[0].url;
}

/** Manifest key for an in-game NPC id, if catalogued. */
export function getNpcManifestId(npcId: string): string | undefined {
  const mapped = NPC_ID_TO_MANIFEST[npcId];
  if (mapped && ASSET_MANIFEST[mapped]) return mapped;
  const direct = `npc_${npcId}`;
  if (ASSET_MANIFEST[direct]) return direct;
  return undefined;
}

/**
 * Pick url with distance LOD, then compression variant on the highest-detail LOD only.
 * Simplified LOD meshes are already smaller — compression variants apply to lod0.
 */
export function resolveAssetUrl(
  asset: GltfAssetDefinition,
  compression: CompressionPreference,
  distance: number,
  lodBias: number,
): string {
  const lodUrl = resolveLodUrl(asset, distance, lodBias);
  const lod0Url = asset.lods[0]?.url;
  if (lod0Url && lodUrl === lod0Url && compression !== 'none') {
    const variant = asset.variants?.[compression];
    if (variant) return variant;
  }
  return lodUrl;
}

/** @deprecated Use resolveAssetUrl — kept for call-site compatibility during migration. */
export function resolveVariantUrl(
  asset: GltfAssetDefinition,
  compression: CompressionPreference,
  distance: number,
  lodBias: number,
): string {
  return resolveAssetUrl(asset, compression, distance, lodBias);
}

/** Resolve processed NPC url (LOD + compression) when manifest entry is shipped. */
export function resolveNpcAssetUrl(
  npcId: string,
  compression: CompressionPreference,
  distance: number,
  lodBias: number,
): string | undefined {
  const manifestId = getNpcManifestId(npcId);
  if (!manifestId) return undefined;
  const asset = ASSET_MANIFEST[manifestId];
  if (!asset || !isAssetEffectiveShipped(manifestId)) return undefined;
  return resolveAssetUrl(asset, compression, distance, lodBias);
}

/** KTX2 atlas path for current texture scale tier. */
export function resolveAtlasUrl(
  atlasBase: string,
  textureScale: number,
): string {
  const tier = textureScale <= 0.25 ? '256' : textureScale <= 0.5 ? '512' : '1k';
  return `${atlasBase}_${tier}.ktx2`;
}
