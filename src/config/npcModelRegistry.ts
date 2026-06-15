/* ─── Volodka RPG – per-NPC animated GLB paths ─── */
/* CC0 Khronos interim meshes; Ready Player Me avatars supersede when imported. */

import {
  getRpmNpcByRegistryId,
  getRpmPublicUrls,
  RPM_NPC_CATALOG,
} from '@/config/rpmNpcCatalog';
import { RPM_SHIPPED_NPC_GLB_URLS } from '@/config/rpmNpcShipped.generated';

export interface NpcModelAssetMeta {
  url: string;
  scale?: number;
  /** Y rotation offset if model faces wrong way */
  yawOffset?: number;
  license: 'CC0' | 'AI3DGen-Pro' | 'Ready Player Me';
  source: string;
  sourceUrl: string;
}

const NPCS = '/models/npcs';

/** Explicit marker — no shipped GLB; renderer uses ProceduralNPCModel. */
export const NPC_PROCEDURAL_MODEL_PLACEHOLDER = 'procedural';

const KHRONOS = 'Khronos glTF Sample Models';
const KHRONOS_URL = 'https://github.com/KhronosGroup/glTF-Sample-Models';
const THREE_SAMPLES = 'three.js examples (CC0)';
const THREE_SAMPLES_URL = 'https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf';
const RPM_SOURCE = 'Ready Player Me avatar export';
const RPM_SOURCE_URL = 'https://readyplayer.me/';

const RPM_SHIPPED = new Set<string>(RPM_SHIPPED_NPC_GLB_URLS);

/** CC0 interim placeholders — skipped when RPM mesh is shipped for same npcId. */
const CC0_SHIPPED_NPC_GLB_URLS = new Set<string>([
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

const CC0_NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  albert: {
    url: `${NPCS}/albert.glb`,
    scale: 1,
    license: 'CC0',
    source: `${KHRONOS} — RiggedFigure`,
    sourceUrl: KHRONOS_URL,
  },
  zarema: {
    url: `${NPCS}/zarema.glb`,
    scale: 0.95,
    license: 'CC0',
    source: `${KHRONOS} — CesiumMan`,
    sourceUrl: KHRONOS_URL,
  },
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1,
    license: 'CC0',
    source: `${THREE_SAMPLES} — Soldier`,
    sourceUrl: THREE_SAMPLES_URL,
  },
  office_alexander: {
    url: `${NPCS}/office_alexander.glb`,
    scale: 1.05,
    license: 'CC0',
    source: `${THREE_SAMPLES} — Xbot`,
    sourceUrl: KHRONOS_URL,
  },
  office_colleague: {
    url: `${NPCS}/office_colleague.glb`,
    scale: 1,
    license: 'CC0',
    source: `${KHRONOS} — RiggedSimple`,
    sourceUrl: KHRONOS_URL,
  },
  maria: {
    url: `${NPCS}/maria.glb`,
    scale: 0.8,
    license: 'CC0',
    source: `${THREE_SAMPLES} — RobotExpressive`,
    sourceUrl: THREE_SAMPLES_URL,
  },
  office_dmitry: {
    url: `${NPCS}/office_dmitry.glb`,
    scale: 1.1,
    license: 'CC0',
    source: `${THREE_SAMPLES} — Xbot`,
    sourceUrl: KHRONOS_URL,
  },
  viktor: {
    url: `${NPCS}/viktor.glb`,
    scale: 1,
    license: 'CC0',
    source: `${THREE_SAMPLES} — Soldier`,
    sourceUrl: THREE_SAMPLES_URL,
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
    source: `${KHRONOS} — CesiumMan`,
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

function buildRpmNpcModelAssets(): Partial<Record<string, NpcModelAssetMeta>> {
  const out: Partial<Record<string, NpcModelAssetMeta>> = {};
  for (const entry of RPM_NPC_CATALOG) {
    if (entry.wire.kind === 'hero') continue;
    out[entry.npcId] = {
      url: entry.publicUrl,
      scale: entry.defaultScale ?? 1,
      license: 'Ready Player Me',
      source: RPM_SOURCE,
      sourceUrl: RPM_SOURCE_URL,
    };
  }
  return out;
}

const RPM_NPC_MODEL_ASSETS = buildRpmNpcModelAssets();

function isRpmShippedForNpc(npcId: string): boolean {
  const rpm = getRpmNpcByRegistryId(npcId);
  return rpm != null && RPM_SHIPPED.has(rpm.publicUrl);
}

function resolveCc0Url(npcId: string): string | undefined {
  const url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (!url || !CC0_SHIPPED_NPC_GLB_URLS.has(url)) return undefined;
  if (isRpmShippedForNpc(npcId)) return undefined;
  return url;
}

/** Distinct rigged GLBs — RPM overrides CC0 when shipped; CC0-only NPCs unchanged. */
export const NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  ...CC0_NPC_MODEL_ASSETS,
  ...RPM_NPC_MODEL_ASSETS,
};

export function resolveNpcModelUrl(npcId: string, modelPath?: string): string | undefined {
  const rpmEntry = getRpmNpcByRegistryId(npcId);
  if (rpmEntry && RPM_SHIPPED.has(rpmEntry.publicUrl)) {
    return rpmEntry.publicUrl;
  }

  if (!modelPath || modelPath === NPC_PROCEDURAL_MODEL_PLACEHOLDER) {
    const cc0Url = resolveCc0Url(npcId);
    if (cc0Url) return cc0Url;
    return undefined;
  }

  if (RPM_SHIPPED.has(modelPath)) return modelPath;

  const cc0Url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (modelPath === cc0Url && CC0_SHIPPED_NPC_GLB_URLS.has(modelPath) && !isRpmShippedForNpc(npcId)) {
    return modelPath;
  }

  if (CC0_SHIPPED_NPC_GLB_URLS.has(modelPath) && !isRpmShippedForNpc(npcId)) {
    return modelPath;
  }

  return undefined;
}

export function getNpcModelMeta(npcId: string): NpcModelAssetMeta | undefined {
  if (isRpmShippedForNpc(npcId)) {
    return RPM_NPC_MODEL_ASSETS[npcId];
  }
  return CC0_NPC_MODEL_ASSETS[npcId];
}

export function getNpcModelUrls(): string[] {
  const urls = new Set<string>();
  for (const url of CC0_SHIPPED_NPC_GLB_URLS) {
    const npcId = Object.entries(CC0_NPC_MODEL_ASSETS).find(([, meta]) => meta?.url === url)?.[0];
    if (npcId && isRpmShippedForNpc(npcId)) continue;
    urls.add(url);
  }
  for (const url of RPM_SHIPPED) {
    if (url.startsWith(`${NPCS}/`) || url.includes('/npcs/')) {
      urls.add(url);
    }
  }
  return [...urls];
}

/** Pending RPM public URLs — validate only when file exists (see validate-gltf-assets). */
export function getRpmPendingPublicUrls(): string[] {
  return getRpmPublicUrls().filter((url) => !RPM_SHIPPED.has(url));
}

export function isRpmNpcShipped(npcId: string): boolean {
  return isRpmShippedForNpc(npcId);
}
