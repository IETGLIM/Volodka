/* ─── Volodka RPG – NPC render tier (hero / interactive / background) ─── */

import type { NPCDefinition, SceneId } from '@/shared/types/game';

export type NpcRenderTier = 'hero' | 'interactive' | 'background';

/** Hero / story NPCs — always full visual treatment + Mixamo clip overrides. */
const HERO_NPC_IDS = new Set<string>([
  'volodka',
  'zarema',
  'albert',
  'cafe_barista',
  'office_colleague',
  'maria',
  'solnysh',
  'lyonya',
  'office_alexander',
  'office_dmitry',
  'maxim',
  'kate',
  'lena',
  'sergey',
  'oleg',
  'zeka',
  'anya',
  'fisherman_trofim',
  'baba_zina',
  // Major story NPCs previously falling through to 'interactive' tier.
  'viktor',
  'kira',
  'boris',
  'tamara',
  'grisha',
  'street_poet',
  'marat_echo',
  'guild_defector',
  // CHK guests — narrative participants in act 6.
  'chk_guest_devops',
  'chk_guest_analyst',
  'chk_ru',
  'chk_based',
  'chk_smert',
  'chk_stalker',
  'chk_elis',
  'chk_ritka',
]);

/**
 * Act 5+ crowd districts — schedule filler without dialogue defaults to background tier.
 * Per-NPC override: `NPCDefinition.renderTier`.
 */
const CROWD_SCENE_IDS = new Set<SceneId>([
  'street_night',
  'street_winter',
  'city_square',
  'guild_mainframe',
  'park_day',
  'abandoned_factory',
  'factory_roof',
  'chk_campfire_night',
]);

export function resolveNpcRenderTier(
  definition: NPCDefinition,
  sceneId: SceneId,
): NpcRenderTier {
  if (definition.renderTier) {
    return definition.renderTier;
  }
  if (HERO_NPC_IDS.has(definition.id)) {
    return 'hero';
  }
  if (definition.dialogueNodeId || (definition.questsGiven?.length ?? 0) > 0) {
    return 'interactive';
  }
  if (CROWD_SCENE_IDS.has(sceneId)) {
    return 'background';
  }
  return 'interactive';
}

export function npcTierHasHeadTracking(tier: NpcRenderTier): boolean {
  switch (tier) {
    case 'hero':
    case 'interactive':
      return true;
    case 'background':
      return false;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function npcTierHasNameLabels(tier: NpcRenderTier): boolean {
  switch (tier) {
    case 'hero':
    case 'interactive':
      return true;
    case 'background':
      return false;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function npcTierHasProximityBark(tier: NpcRenderTier): boolean {
  switch (tier) {
    case 'hero':
    case 'interactive':
      return true;
    case 'background':
      return false;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

export function npcTierHasQuestMarker(tier: NpcRenderTier): boolean {
  switch (tier) {
    case 'hero':
    case 'interactive':
      return true;
    case 'background':
      return false;
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

/** Background NPCs keep a static idle loop unless they are the interaction target. */
export function resolveNpcActivityForTier(
  activity: string,
  tier: NpcRenderTier,
  isInteractionTarget: boolean,
): string {
  if (tier === 'background' && !isInteractionTarget) {
    return 'idle';
  }
  return activity;
}
