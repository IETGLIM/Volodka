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

/** Explicit marker — no shipped GLB; renderer uses ProceduralNPCModel. */
export const NPC_PROCEDURAL_MODEL_PLACEHOLDER = 'procedural';

/**
 * GLB files that exist under public/models/npcs and pass validate-gltf-assets.
 * NPCs not listed here (albert, zarema, office_alexander, …) render via
 * ProceduralNPCModel — see ProceduralNPCModels.tsx switch.
 */
const SHIPPED_NPC_GLB_URLS = new Set<string>([
  `${NPCS}/cafe_barista.glb`,
  `${NPCS}/office_colleague.glb`,
]);

/** Distinct Khronos rigged GLBs — only entries with files on disk. */
export const NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1,
    license: 'CC0',
    source: 'three.js examples — Soldier (CC0)',
    sourceUrl: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  },
  office_colleague: {
    url: `${NPCS}/office_colleague.glb`,
    scale: 1,
    license: 'CC0',
    source: 'three.js examples — Soldier (CC0)',
    sourceUrl: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  },
  maria: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1.02,
    license: 'CC0',
    source: 'three.js examples — Soldier (CC0) — hero placeholder',
    sourceUrl: 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf',
  },
};

/**
 * Documented procedural fallbacks (no GLB shipped yet):
 * - albert, zarema → AlbertModel / ZaremaModel
 * - office_alexander → AlexanderModel
 * - all expanded NPCs → unique or themed procedural silhouettes
 */

export function resolveNpcModelUrl(npcId: string, modelPath?: string): string | undefined {
  if (!modelPath || modelPath === NPC_PROCEDURAL_MODEL_PLACEHOLDER) {
    const registryUrl = NPC_MODEL_ASSETS[npcId]?.url;
    if (registryUrl && SHIPPED_NPC_GLB_URLS.has(registryUrl)) return registryUrl;
    return undefined;
  }
  const candidate = modelPath || NPC_MODEL_ASSETS[npcId]?.url;
  if (!candidate || !SHIPPED_NPC_GLB_URLS.has(candidate)) return undefined;
  return candidate;
}

export function getNpcModelMeta(npcId: string): NpcModelAssetMeta | undefined {
  return NPC_MODEL_ASSETS[npcId];
}

export function getNpcModelUrls(): string[] {
  return [...SHIPPED_NPC_GLB_URLS];
}
