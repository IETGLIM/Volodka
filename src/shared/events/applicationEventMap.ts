/**
 * Events emitted from the store layer — typed subset decoupled from Engine EventBus.
 * Engine binds these to the central bus at bootstrap.
 */

import type { SceneId } from '@/shared/types/game';

export interface ApplicationEventMap {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  'game:system_alert': {
    kind: 'save_failed' | 'load_failed' | 'load_recovered';
    message: string;
  };
  'quest:accepted': { questId: string; questTitle: string };
  'quest:completed': { questId: string; npcId?: string };
  'quest:reward_applied': {
    questId: string;
    questTitle: string;
    xpGained: number;
    rewards: string[];
  };
  'quest:objective_updated': { questId: string; objectiveId: string };
  'poem:collected': { poemId: string };
  'poem:reset_all_effects': Record<string, never>;
  'achievement:unlocked': {
    achievementId: string;
    title: string;
    description: string;
    icon: string;
    category: string;
  };
  'fx:achievement': { title: string; description: string; icon?: string };
  'player:levelup': {
    newLevel: number;
    prevLevel: number;
    levelsGained?: number;
    perkPointsGained?: number;
    perkPointGained?: boolean;
  };
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
}

export type ApplicationEventName = keyof ApplicationEventMap;
