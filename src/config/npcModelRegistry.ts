/* ─── Volodka RPG – per-NPC animated GLB paths (CC0 Khronos sample models) ─── */

export interface NpcModelAssetMeta {
  url: string;
  scale?: number;
  /** Y rotation offset if model faces wrong way */
  yawOffset?: number;
  license: 'CC0' | 'AI3DGen-Pro';
  source: string;
  sourceUrl: string;
}

const NPCS = '/models/npcs';

/** Explicit marker — no shipped GLB; renderer uses ProceduralNPCModel. */
export const NPC_PROCEDURAL_MODEL_PLACEHOLDER = 'procedural';

const KHRONOS = 'Khronos glTF Sample Models';
const KHRONOS_URL = 'https://github.com/KhronosGroup/glTF-Sample-Models';
const THREE_SOLDIER = 'three.js examples — Soldier (CC0)';
const THREE_SOLDIER_URL = 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf';

/**
 * GLB files under public/models/npcs — validated by validate-gltf-assets.
 * Interim CC0 placeholders ship until AI3DGen Pro meshes replace them.
 */
const SHIPPED_NPC_GLB_URLS = new Set<string>([
  `${NPCS}/cafe_barista.glb`,
  `${NPCS}/office_colleague.glb`,
  `${NPCS}/albert.glb`,
  `${NPCS}/zarema.glb`,
  `${NPCS}/maria.glb`,
  `${NPCS}/office_alexander.glb`,
  `${NPCS}/office_dmitry.glb`,
  `${NPCS}/viktor.glb`,
  `${NPCS}/kira.glb`,
  `${NPCS}/boris.glb`,
  `${NPCS}/tamara.glb`,
  `${NPCS}/grisha.glb`,
]);

/** Distinct rigged GLBs — only entries with files on disk. */
export const NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  albert: {
    url: `${NPCS}/albert.glb`,
    scale: 1,
    license: 'CC0',
    source: `${KHRONOS} — CesiumMan`,
    sourceUrl: KHRONOS_URL,
  },
  zarema: {
    url: `${NPCS}/zarema.glb`,
    scale: 0.95,
    license: 'CC0',
    source: `${KHRONOS} — RiggedFigure`,
    sourceUrl: KHRONOS_URL,
  },
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1,
    license: 'CC0',
    source: THREE_SOLDIER,
    sourceUrl: THREE_SOLDIER_URL,
  },
  office_alexander: {
    url: `${NPCS}/office_alexander.glb`,
    scale: 1.05,
    license: 'CC0',
    source: `${KHRONOS} — BrainStem`,
    sourceUrl: KHRONOS_URL,
  },
  office_colleague: {
    url: `${NPCS}/office_colleague.glb`,
    scale: 1,
    license: 'CC0',
    source: THREE_SOLDIER,
    sourceUrl: THREE_SOLDIER_URL,
  },
  maria: {
    url: `${NPCS}/maria.glb`,
    scale: 0.8,
    license: 'CC0',
    source: THREE_SOLDIER,
    sourceUrl: THREE_SOLDIER_URL,
  },
  office_dmitry: {
    url: `${NPCS}/office_dmitry.glb`,
    scale: 1.1,
    license: 'CC0',
    source: `${KHRONOS} — CesiumMan`,
    sourceUrl: KHRONOS_URL,
  },
  viktor: {
    url: `${NPCS}/viktor.glb`,
    scale: 1,
    license: 'CC0',
    source: THREE_SOLDIER,
    sourceUrl: THREE_SOLDIER_URL,
  },
  kira: {
    url: `${NPCS}/kira.glb`,
    scale: 0.9,
    license: 'CC0',
    source: `${KHRONOS} — RiggedFigure`,
    sourceUrl: KHRONOS_URL,
  },
  boris: {
    url: `${NPCS}/boris.glb`,
    scale: 1.1,
    license: 'CC0',
    source: `${KHRONOS} — RiggedSimple`,
    sourceUrl: KHRONOS_URL,
  },
  tamara: {
    url: `${NPCS}/tamara.glb`,
    scale: 1,
    license: 'CC0',
    source: `${KHRONOS} — RiggedSimple`,
    sourceUrl: KHRONOS_URL,
  },
  grisha: {
    url: `${NPCS}/grisha.glb`,
    scale: 1,
    license: 'CC0',
    source: `${KHRONOS} — Fox`,
    sourceUrl: KHRONOS_URL,
  },
};

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
