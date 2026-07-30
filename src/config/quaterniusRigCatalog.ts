import type { QuaterniusRigRef } from '@/config/npcComposer/types';
import { getAssetLod0Url } from '@/config/assetManifest';
import { getPlayerVolodkaModelUrl } from '@/config/playerModelUrl';

const RIGS = '/models/npcs/_rigs';
const NPCS = '/models/npcs';

function npcFallback(manifestId: string, fileBase: string): string {
  return getAssetLod0Url(manifestId) ?? `${NPCS}/${fileBase}.glb`;
}

/**
 * Staged animation-driver rigs (`npm run assets:npc-composer`).
 * Preferred at runtime when present on disk.
 */
export const QUATERNIUS_STAGED_RIG_URLS: Record<QuaterniusRigRef, string> = {
  male_01: `${RIGS}/male_01.glb`,
  male_02: `${RIGS}/male_02.glb`,
  male_03: `${RIGS}/male_03.glb`,
  male_04: `${RIGS}/male_04.glb`,
  male_05: `${RIGS}/male_05.glb`,
  male_06: `${RIGS}/male_06.glb`,
  male_07: `${RIGS}/male_07.glb`,
  male_08: `${RIGS}/male_08.glb`,
  male_09: `${RIGS}/male_09.glb`,
  male_10: `${RIGS}/male_10.glb`,
  male_11: `${RIGS}/male_11.glb`,
  female_01: `${RIGS}/female_01.glb`,
  female_02: `${RIGS}/female_02.glb`,
  female_03: `${RIGS}/female_03.glb`,
  female_04: `${RIGS}/female_04.glb`,
  female_05: `${RIGS}/female_05.glb`,
  female_06: `${RIGS}/female_06.glb`,
  female_07: `${RIGS}/female_07.glb`,
  female_08: `${RIGS}/female_08.glb`,
  female_09: `${RIGS}/female_09.glb`,
};

/** Canonical shipped NPC GLB per rig (fallback when `_rigs/` not staged) — ASSET_MANIFEST first. */
export const QUATERNIUS_RIG_FALLBACK_URLS: Record<QuaterniusRigRef, string> = {
  male_01: getPlayerVolodkaModelUrl(),
  male_02: npcFallback('npc_albert', 'albert'),
  male_03: npcFallback('npc_office_dmitry', 'office_dmitry'),
  male_04: npcFallback('npc_cafe_barista', 'cafe_barista'),
  male_05: npcFallback('npc_office_alexander', 'office_alexander'),
  male_06: npcFallback('npc_chk_ru', 'chk_ru'),
  male_07: npcFallback('npc_chk_based', 'chk_based'),
  male_08: npcFallback('npc_chk_stalker', 'chk_stalker'),
  male_09: npcFallback('npc_maxim', 'maxim'),
  male_10: npcFallback('npc_zeka', 'zeka'),
  male_11: npcFallback('npc_trofim', 'trofim'),
  female_01: npcFallback('npc_zarema', 'zarema'),
  female_02: npcFallback('npc_solnysh', 'solnysh'),
  female_03: npcFallback('npc_maria_ai3dgen', 'maria'),
  female_04: npcFallback('npc_chk_smert', 'chk_smert'),
  female_05: npcFallback('npc_chk_elis', 'chk_elis'),
  female_06: npcFallback('npc_chk_ritka', 'chk_ritka'),
  female_07: npcFallback('npc_anya', 'anya'),
  female_08: npcFallback('npc_baba_zina', 'baba_zina'),
  female_09: npcFallback('npc_kate', 'kate'),
};

export function resolveQuaterniusRigFallbackUrl(rigRef: QuaterniusRigRef): string {
  return QUATERNIUS_RIG_FALLBACK_URLS[rigRef];
}

export function resolveQuaterniusStagedRigUrl(rigRef: QuaterniusRigRef): string {
  return QUATERNIUS_STAGED_RIG_URLS[rigRef];
}
