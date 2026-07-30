/* ─── Volodka RPG – per-NPC animated GLB paths ─── */
/* Visual policy (v2 — GLB-first for medium/high/ultra):
   - low preset: procedural archetypes (fast, no GLB streaming)
   - medium/high/ultra: Quaternius CC0 GLBs are rendered as visible character meshes.
   - RPM or AI3DGen Pro overrides CC0 when those GLBs are on disk.
   - Procedural archetypes remain the Suspense fallback during GLB loading.
   This replaces the old policy that blocked CC0 GLBs from in-world rendering.
   Quaternius models look like real 3D characters vs primitive boxes/spheres. */

import type { AssetRenderMode } from '@/engine/graphics/qualityPresets';
import {
  getRpmNpcByRegistryId,
  getRpmPublicUrls,
  RPM_NPC_CATALOG,
} from '@/config/rpmNpcCatalog';
import { RPM_NPC_GLB_URLS_ON_DISK } from '@/config/rpmNpcOnDisk.generated';
import {
  getAssetLod0Url,
  isAssetEffectiveShipped,
  resolveCharacterManifestId,
} from '@/config/assetManifest';

export interface NpcModelAssetMeta {
  url: string;
  /** Optional multiplier after auto-fit to 1.75 m (prefer `NPCDefinition.scale`). */
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

const QUATERNIUS = 'Quaternius Ultimate Modular Character Packs';
const QUATERNIUS_URL = 'https://quaternius.com/packs/ultimatemodularcharacters.html';
const RPM_SOURCE = 'Ready Player Me avatar export';
const RPM_SOURCE_URL = 'https://readyplayer.me/';

const RPM_ON_DISK = new Set<string>(RPM_NPC_GLB_URLS_ON_DISK);

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
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  zarema: {
    url: `${NPCS}/zarema.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  cafe_barista: {
    url: `${NPCS}/cafe_barista.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  office_alexander: {
    url: `${NPCS}/office_alexander.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  office_colleague: {
    url: `${NPCS}/office_colleague.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  maria: {
    url: `${NPCS}/maria.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  office_dmitry: {
    url: `${NPCS}/office_dmitry.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  viktor: {
    url: `${NPCS}/viktor.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  kira: {
    url: `${NPCS}/kira.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  boris: {
    url: `${NPCS}/boris.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  tamara: {
    url: `${NPCS}/tamara.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  grisha: {
    url: `${NPCS}/grisha.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  maxim: {
    url: `${NPCS}/maxim.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  zeka: {
    url: `${NPCS}/zeka.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  fisherman_trofim: {
    url: `${NPCS}/trofim.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  kate: {
    url: `${NPCS}/kate.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  anya: {
    url: `${NPCS}/anya.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  baba_zina: {
    url: `${NPCS}/baba_zina.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  solnysh: {
    url: `${NPCS}/solnysh.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_ru: {
    url: `${NPCS}/chk_ru.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_based: {
    url: `${NPCS}/chk_based.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_stalker: {
    url: `${NPCS}/chk_stalker.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_smert: {
    url: `${NPCS}/chk_smert.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_elis: {
    url: `${NPCS}/chk_elis.glb`,
    license: 'CC0',
    source: QUATERNIUS,
    sourceUrl: QUATERNIUS_URL,
  },
  chk_ritka: {
    url: `${NPCS}/chk_ritka.glb`,
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

function isRpmOnDiskForNpc(npcId: string): boolean {
  const rpm = getRpmNpcByRegistryId(npcId);
  return rpm != null && RPM_ON_DISK.has(rpm.publicUrl);
}

function isCc0ShippedUrl(url: string, npcId?: string): boolean {
  if (!CC0_SHIPPED_NPC_GLB_URLS.has(url)) return false;
  if (npcId && isRpmOnDiskForNpc(npcId)) return false;
  return true;
}

function resolveCc0Url(npcId: string): string | undefined {
  const url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (!url || !isCc0ShippedUrl(url, npcId)) return undefined;
  return url;
}

/** Distinct rigged GLBs — RPM overrides CC0 when on disk; CC0-only NPCs unchanged. */
export const NPC_MODEL_ASSETS: Partial<Record<string, NpcModelAssetMeta>> = {
  ...CC0_NPC_MODEL_ASSETS,
  ...RPM_NPC_MODEL_ASSETS,
};

function resolveManifestNpcUrl(npcId: string): string | undefined {
  const manifestId = resolveCharacterManifestId(npcId);
  if (!isAssetEffectiveShipped(manifestId)) return undefined;
  return getAssetLod0Url(manifestId);
}

export function resolveNpcModelUrl(npcId: string, modelPath?: string): string | undefined {
  const rpmEntry = getRpmNpcByRegistryId(npcId);
  if (rpmEntry && RPM_ON_DISK.has(rpmEntry.publicUrl)) {
    return rpmEntry.publicUrl;
  }

  // Single shipped source: ASSET_MANIFEST before hardcoded CC0 table.
  const fromManifest = resolveManifestNpcUrl(npcId);
  if (fromManifest) return fromManifest;

  if (!modelPath || modelPath === NPC_PROCEDURAL_MODEL_PLACEHOLDER) {
    return resolveCc0Url(npcId);
  }

  if (RPM_ON_DISK.has(modelPath)) return modelPath;

  if (isCc0ShippedUrl(modelPath, npcId)) return modelPath;

  const cc0Url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  if (modelPath === cc0Url && isCc0ShippedUrl(modelPath, npcId)) {
    return modelPath;
  }

  return undefined;
}

export function getNpcModelMeta(npcId: string): NpcModelAssetMeta | undefined {
  if (isRpmOnDiskForNpc(npcId)) {
    return RPM_NPC_MODEL_ASSETS[npcId];
  }
  return CC0_NPC_MODEL_ASSETS[npcId];
}

export function getNpcModelUrls(): string[] {
  const urls = new Set<string>();
  for (const url of CC0_SHIPPED_NPC_GLB_URLS) {
    const npcId = Object.entries(CC0_NPC_MODEL_ASSETS).find(([, meta]) => meta?.url === url)?.[0];
    if (npcId && isRpmOnDiskForNpc(npcId)) continue;
    urls.add(url);
  }
  for (const url of RPM_ON_DISK) {
    if (url.startsWith(`${NPCS}/`) || url.includes('/npcs/')) {
      urls.add(url);
    }
  }
  return [...urls];
}

/** Pending RPM public URLs — validate only when file exists (see validate-gltf-assets). */
export function getRpmPendingPublicUrls(): string[] {
  return getRpmPublicUrls().filter((url) => !RPM_ON_DISK.has(url));
}

export function isRpmNpcOnDisk(npcId: string): boolean {
  return isRpmOnDiskForNpc(npcId);
}

/** Whether ANY shipped GLB (CC0 or RPM) exists for this NPC on disk. */
export function isNpcMeshOnDisk(npcId: string): boolean {
  // RPM overrides CC0 when available — return true for either source.
  if (isRpmOnDiskForNpc(npcId)) return true;
  // CC0 Quaternius GLB exists for all 25 shipped NPCs.
  const cc0Url = CC0_NPC_MODEL_ASSETS[npcId]?.url;
  return cc0Url != null && isCc0ShippedUrl(cc0Url, npcId);
}

/** @deprecated — use isNpcMeshOnDisk() instead (now includes CC0). */
export function isUniqueNpcMeshOnDisk(npcId: string): boolean {
  return isNpcMeshOnDisk(npcId);
}

/**
 * Whether the renderer should draw a rigged GLB for this NPC.
 * v2: CC0 Quaternius GLBs are rendered at medium/high/ultra quality.
 * Procedural archetypes only on 'procedural' mode (low preset).
 */
export function shouldRenderGltfNpc(npcId: string, renderMode: AssetRenderMode): boolean {
  if (renderMode === 'procedural') return false;
  return isNpcMeshOnDisk(npcId);
}

/** URL for in-world NPC rendering (respects visual identity policy). */
export function resolveNpcVisualModelUrl(
  npcId: string,
  modelPath: string | undefined,
  renderMode: AssetRenderMode,
): string | undefined {
  if (!shouldRenderGltfNpc(npcId, renderMode)) return undefined;
  return resolveNpcModelUrl(npcId, modelPath);
}

