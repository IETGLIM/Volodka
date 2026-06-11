/* ─── Volodka RPG – per-NPC animated GLB paths (CC0 Khronos sample models) ─── */

export interface NpcModelAssetMeta {
  url: string;
  scale?: number;
  /** Y rotation offset if model faces wrong way */
  yawOffset?: number;
  license: 'CC0';
  source: string;
  sourceUrl: string;
}

const NPCS = '/models/npcs';

/** Distinct Khronos rigged GLBs — silhouette differs per NPC at conversation range. */
export const NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  albert: {
    url: `${NPCS}/albert.glb`,
    scale: 1,
    license: 'CC0',
    source: 'Khronos glTF Sample Models — CesiumMan',
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/CesiumMan',
  },
  zarema: {
    url: `${NPCS}/zarema.glb`,
    scale: 1,
    license: 'CC0',
    source: 'Khronos glTF Sample Models — RiggedFigure',
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/RiggedFigure',
  },
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1,
    license: 'CC0',
    source: 'three.js examples — Soldier (CC0)',
    sourceUrl: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  },
  office_alexander: {
    // NOTE: GltfNPCModel auto-normalizes to 1.7 m — scale is a multiplier on top.
    // The old 0.35 double-corrected and produced a 0.6 m dwarf.
    url: `${NPCS}/office_alexander.glb`,
    scale: 1,
    license: 'CC0',
    source: 'Khronos glTF Sample Models — BrainStem',
    sourceUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/main/2.0/BrainStem',
  },
  office_colleague: {
    url: `${NPCS}/office_colleague.glb`,
    scale: 1,
    license: 'CC0',
    source: 'three.js examples — Soldier (CC0)',
    sourceUrl: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  },
};

export function resolveNpcModelUrl(npcId: string, modelPath?: string): string | undefined {
  if (modelPath) return modelPath;
  return NPC_MODEL_ASSETS[npcId]?.url;
}

export function getNpcModelMeta(npcId: string): NpcModelAssetMeta | undefined {
  return NPC_MODEL_ASSETS[npcId];
}

export function getNpcModelUrls(): string[] {
  return Object.values(NPC_MODEL_ASSETS)
    .map((m) => m?.url)
    .filter(Boolean) as string[];
}
