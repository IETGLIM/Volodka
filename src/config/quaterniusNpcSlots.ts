/**
 * 20 Quaternius Ultimate Modular rig slots (hero + 19 story/CHK NPCs).
 *
 * On-disk GLBs serve as invisible rig drivers for `ComposerRigDriver` (bone
 * retargeting onto procedural capsule figures). Runtime visuals use procedural
 * silhouettes at ALL quality presets (low/medium/high/ultra) until RPM avatars
 * ship — see `proceduralNpcAvatarCatalog.ts` (primary visual SoT).
 *
 * [roadmap:DOC-03] Updated stale docstring: GLBs are never rendered as visible
 * meshes at any preset today; `shouldRenderGltfNpc` returns false for all NPCs
 * because `RPM_NPC_GLB_URLS_ON_DISK` is empty (0/20 RPM avatars on disk).
 * Enforced by `npcQuaterniusProdSmoke.test.ts:23-29`.
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
