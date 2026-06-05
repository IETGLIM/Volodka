import type { TrainablePlayerSkill } from '@/shared/types/game';

/** Player progression, skills, choices, loot. */
export interface PlayerEvents {
  'loot:reward': { itemId: string; name: string };
  'skill:level_up': { skill: TrainablePlayerSkill; level: number };
  'skill:check': { skill: TrainablePlayerSkill; difficulty: number; success: boolean };
  'player:stand_up': Record<string, never>;
  'player:levelup': {
    newLevel: number;
    prevLevel: number;
    levelsGained?: number;
    perkPointsGained?: number;
    perkPointGained?: boolean;
  };
  'player:heal': { amount: number };
  'choice:made': { karmaChange: number; npcId?: string; relationChange?: number };
}
