/**
 * Events emitted from the store layer — typed subset decoupled from Engine EventBus.
 * Engine binds these to the central bus at bootstrap.
 */

import type { SceneId, PlayerSkills } from '@/shared/types/game';

export interface ApplicationEventMap {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  'game:playthrough_reset': Record<string, never>;
  'game:system_alert': {
    kind: 'save_failed' | 'load_failed' | 'load_recovered';
    message: string;
  };
  'quest:accepted': { questId: string; questTitle: string };
  'quest:completed': { questId: string; npcId?: string };
  'quest:failed': {
    questId: string;
    questTitle: string;
    reason?: string;
    canRetry?: boolean;
  };
  'quest:reward_applied': {
    questId: string;
    questTitle: string;
    xpGained: number;
    rewards: string[];
  };
  'quest:objective_updated': { questId: string; objectiveId: string };
  'quest:retried': { questId: string; questTitle: string };
  'poem:collected': { poemId: string };
  'poem:reset_all_effects': Record<string, never>;
  'achievement:unlocked': {
    achievementId: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    soundEffect?: string;
    accessibilityAnnounce: string;
  };
  'player:levelup': {
    newLevel: number;
    prevLevel: number;
    levelsGained?: number;
    perkPointsGained?: number;
    perkPointGained?: boolean;
    prevSkillPoints?: number;
    prevPerkPoints?: number;
    prevXp?: number;
    prevSkills?: PlayerSkills;
    prevKarma?: number;
  };
  /** Rest at home (restAtHome) — engine listeners fully restore stamina. */
  'player:rest': { amount: number };
  'choice:made': { karmaChange: number; npcId?: string; relationChange?: number };
  'crafting:discovered': { recipeId: string; recipeName: string; rarity: string };
  'item:crafted': { recipeId: string; recipeName: string; category: string };
  'npc:gift': {
    npcId: string;
    itemId: string;
    preference: string;
    affinityChange: number;
  };
  'world:hour_changed': {
    hour: number;
    previousHour: number;
    npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  };
  'sound:play': { type: string };
  'ui:music_volume': { volume: number };
  'ui:music_enabled': { enabled: boolean; sceneId: SceneId };
  'lore:discovered': { id: string; title: string; rarity: string; category?: string };
  /** Volodka's inner monologue / thought bubble overlay. */
  'volodka:thought': { text: string; duration?: number };
  /** Data terminal hacking mini-game overlay. */
  'ui:data_terminal': {
    difficulty: 'easy' | 'medium' | 'hard';
    title: string;
    reward?: string;
  };
  /** XP gain visual feedback — floating "+X XP" toast. */
  'fx:xp_gain': { amount: number; source?: string };
  /** Camera shake for emotional story beats (revelations, confrontations). */
  'cutscene:camera_shake': {
    intensity: number;
    /** Decay rate (per second). If provided, takes precedence over `duration`. */
    frequency?: number;
    /** Target duration in ms — converted to a decay rate that brings intensity to ~1% by the end. */
    duration?: number;
  };
  /** Perk unlocked — fires Volodka's reactive inner monologue. */
  'perk:unlocked': { perkId: string; perkName: string; category: string };
  /**
   * Store-emitted when an NPC's relation value changes between commits.
   * Engine subscribes (via `onAppEvent`) and runs `checkRelationMilestones`
   * to emit `npc:relation_milestone` for any crossed threshold. This decouples
   * the store from the engine milestone module — the store only emits the
   * raw relation change, the engine owns the milestone logic.
   */
  'store:npc_relation_changed': {
    npcId: string;
    oldRelation: number;
    newRelation: number;
  };
}

export type ApplicationEventName = keyof ApplicationEventMap;
