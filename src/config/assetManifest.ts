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
  npc_cafe_barista: {
    id: 'npc_cafe_barista',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/cafe_barista.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_office_colleague: {
    id: 'npc_office_colleague',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/office_colleague.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  /** AI3DGen pipeline targets — flip shipped after import (see ai3dgenAssetCatalog.ts). */
  npc_albert: {
    id: 'npc_albert',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/albert.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_zarema: {
    id: 'npc_zarema',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/zarema.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_maria_ai3dgen: {
    id: 'npc_maria_ai3dgen',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/maria.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_office_alexander: {
    id: 'npc_office_alexander',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/office_alexander.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_office_dmitry: {
    id: 'npc_office_dmitry',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/office_dmitry.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_viktor: {
    id: 'npc_viktor',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/viktor.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_kira: {
    id: 'npc_kira',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/kira.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_boris: {
    id: 'npc_boris',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/boris.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_tamara: {
    id: 'npc_tamara',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/tamara.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  npc_grisha: {
    id: 'npc_grisha',
    category: 'character',
    lods: [{ url: `${MODELS}/npcs/grisha.glb`, maxDistance: 0 }],
    castShadow: true,
    shipped: true,
  },
  env_cafe_props: {
    id: 'env_cafe_props',
    category: 'environment',
    lods: [
      { url: `${MODELS}/environments/cafe/props_lod0.glb`, maxDistance: 0 },
      { url: `${MODELS}/environments/cafe/props_lod1.glb`, maxDistance: 20 },
    ],
    variants: {
      draco: `${MODELS}/environments/cafe/props.draco.glb`,
      meshopt: `${MODELS}/environments/cafe/props.meshopt.glb`,
    },
    // textureAtlas / bakedLightmap — add when KTX2 cafe pack lands (assets:process)
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

/** Pick compression variant matching quality preset. Falls back to nearest LOD0. */
export function resolveVariantUrl(
  asset: GltfAssetDefinition,
  compression: CompressionPreference,
  distance: number,
  lodBias: number,
): string {
  const variant = asset.variants?.[compression];
  if (variant) return variant;
  return resolveLodUrl(asset, distance, lodBias);
}

/** KTX2 atlas path for current texture scale tier. */
export function resolveAtlasUrl(
  atlasBase: string,
  textureScale: number,
): string {
  const tier = textureScale <= 0.25 ? '256' : textureScale <= 0.5 ? '512' : '1k';
  return `${atlasBase}_${tier}.ktx2`;
}
