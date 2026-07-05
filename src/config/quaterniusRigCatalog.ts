import type { QuaterniusRigRef } from '@/config/npcComposer/types';

const NPCS = '/models/npcs';
const HERO = '/models/characters/volodka';

/**
 * [roadmap:ANIM-01] Removed `QUATERNIUS_STAGED_RIG_URLS` and
 * `resolveQuaterniusStagedRigUrl` — zero runtime callers. The `_rigs/`
 * directory (20 GLBs, 32 MB) was dead weight: `ComposerRigDriver` always
 * uses `resolveQuaterniusRigFallbackUrl` to load the full-mesh NPC GLB as
 * an invisible rig driver.
 */

/** Canonical shipped NPC GLB per rig — used as invisible rig driver by ComposerRigDriver. */
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
