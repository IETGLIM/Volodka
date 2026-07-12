/**
 * 20 Quaternius Ultimate Modular rig slots (hero + 19 story/CHK NPCs).
 * On-disk GLBs are animation/rig references — runtime visuals use procedural
 * silhouettes — see `proceduralNpcAvatarCatalog.ts` (primary; no RPM required).
 */

/** Hero player rig — not schedule-spawned as an NPC. */
export const QUATERNIUS_HERO_SLOT_ID = 'volodka' as const;

/** Story + CHK NPC registry ids backed by Quaternius GLBs on disk. */
export const QUATERNIUS_STORY_NPC_SLOT_IDS = [
  'albert',
  'office_dmitry',
  'cafe_barista',
  'office_alexander',
  'chk_ru',
  'chk_based',
  'chk_stalker',
  'maxim',
  'zeka',
  'fisherman_trofim',
  'zarema',
  'solnysh',
  'maria',
  'chk_smert',
  'chk_elis',
  'chk_ritka',
  'anya',
  'baba_zina',
  'kate',
] as const;

export const QUATERNIUS_NPC_SLOT_IDS = [
  QUATERNIUS_HERO_SLOT_ID,
  ...QUATERNIUS_STORY_NPC_SLOT_IDS,
] as const;

export type QuaterniusNpcSlotId = (typeof QUATERNIUS_NPC_SLOT_IDS)[number];
