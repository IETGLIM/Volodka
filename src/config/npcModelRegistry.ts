/* ─── Volodka RPG – per-NPC animated GLB paths ─── */
/* Priority: Ready Player Me > Quaternius CC0 > Khronos CC0 interim. */

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
const QUATERNIUS = 'Quaternius Ultimate Modular Character Packs';
const QUATERNIUS_URL = 'https://quaternius.com/packs/ultimatemodularcharacters.html';
const RPM_SOURCE = 'Ready Player Me avatar export';
const RPM_SOURCE_URL = 'https://readyplayer.me/';

const RPM_SHIPPED = new Set<string>(RPM_SHIPPED_NPC_GLB_URLS);

/**
 * CC0 interim meshes on disk today (bootstrap / Quaternius import).
 * Pending RPM or Quaternius slots are omitted — runtime uses procedural fallback.
 */
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
  `${NPCS}/maxim.glb`,
  `${NPCS}/zeka.glb`,
  `${NPCS}/trofim.glb`,
  `${NPCS}/kate.glb`,
  `${NPCS}/anya.glb`,
  `${NPCS}/baba_zina.glb`,
  `${NPCS}/solnysh.glb`,
  `${NPCS}/chk_ru.glb`,
  `${NPCS}/chk_based.glb`,
  `${NPCS}/chk_stalker.glb`,
  `${NPCS}/chk_smert.glb`,
  `${NPCS}/chk_elis.glb`,
  `${NPCS}/chk_ritka.glb`,
]);

const CC0_NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  albert: {
    url: `${NPCS}/albert.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  zarema: {
    url: `${NPCS}/zarema.glb`,
    scale: 0.95,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  office_alexander: {
    url: `${NPCS}/office_alexander.glb`,
    scale: 1.05,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
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
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  office_dmitry: {
    url: `${NPCS}/office_dmitry.glb`,
    scale: 1.1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
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
  maxim: {
    url: `${NPCS}/maxim.glb`,
    scale: 1.1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  zeka: {
    url: `${NPCS}/zeka.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  fisherman_trofim: {
    url: `${NPCS}/trofim.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  kate: {
    url: `${NPCS}/kate.glb`,
    scale: 0.9,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  anya: {
    url: `${NPCS}/anya.glb`,
    scale: 0.9,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  baba_zina: {
    url: `${NPCS}/baba_zina.glb`,
    scale: 0.88,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  solnysh: {
    url: `${NPCS}/solnysh.glb`,
    scale: 0.92,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_ru: {
    url: `${NPCS}/chk_ru.glb`,
    scale: 1.05,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_based: {
    url: `${NPCS}/chk_based.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_stalker: {
    url: `${NPCS}/chk_stalker.glb`,
    scale: 1,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_smert: {
    url: `${NPCS}/chk_smert.glb`,
    scale: 0.95,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_elis: {
    url: `${NPCS}/chk_elis.glb`,
    scale: 0.92,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_ritka: {
    url: `${NPCS}/chk_ritka.glb`,
    scale: 0.9,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
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

function isCc0ShippedUrl(url: string, npcId?: string): boolean {
  if (!CC0_SHIPPED_NPC_GLB_URLS.has(url)) return false;
  if (npcId && isRpmShippedForNpc(npcId)) return false;
  return true;
}

function resolveCc0Url(npcId: string): string | undefined {
  const url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (!url || !isCc0ShippedUrl(url, npcId)) return undefined;
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
    return resolveCc0Url(npcId);
  }

  if (RPM_SHIPPED.has(modelPath)) return modelPath;

  if (isCc0ShippedUrl(modelPath, npcId)) return modelPath;

  const cc0Url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (modelPath === cc0Url && isCc0ShippedUrl(modelPath, npcId)) {
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
