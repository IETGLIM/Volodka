import type { QuaterniusRigRef } from '@/config/npcComposer/types';

const RIGS = '/models/npcs/_rigs';
const NPCS = '/models/npcs';
const HERO = '/models/characters/volodka';

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

/** Canonical shipped NPC GLB per rig (fallback when `_rigs/` not staged). */
export const QUATERNIUS_RIG_FALLBACK_URLS: Record<QuaterniusRigRef, string> = {
  male_01: `${HERO}/volodka_lod0.glb`,
  male_02: `${NPCS}/albert.glb`,
  male_03: `${NPCS}/office_dmitry.glb`,
  male_04: `${NPCS}/cafe_barista.glb`,
  male_05: `${NPCS}/office_alexander.glb`,
  male_06: `${NPCS}/chk_ru.glb`,
  male_07: `${NPCS}/chk_based.glb`,
  male_08: `${NPCS}/chk_stalker.glb`,
  male_09: `${NPCS}/maxim.glb`,
  male_10: `${NPCS}/zeka.glb`,
  male_11: `${NPCS}/trofim.glb`,
  female_01: `${NPCS}/zarema.glb`,
  female_02: `${NPCS}/solnysh.glb`,
  female_03: `${NPCS}/maria.glb`,
  female_04: `${NPCS}/chk_smert.glb`,
  female_05: `${NPCS}/chk_elis.glb`,
  female_06: `${NPCS}/chk_ritka.glb`,
  female_07: `${NPCS}/anya.glb`,
  female_08: `${NPCS}/baba_zina.glb`,
  female_09: `${NPCS}/kate.glb`,
};

export function resolveQuaterniusRigFallbackUrl(rigRef: QuaterniusRigRef): string {
  return QUATERNIUS_RIG_FALLBACK_URLS[rigRef];
}

export function resolveQuaterniusStagedRigUrl(rigRef: QuaterniusRigRef): string {
  return QUATERNIUS_STAGED_RIG_URLS[rigRef];
}
