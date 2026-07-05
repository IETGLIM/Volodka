import type { PlayerSkills } from '@/shared/types/game';

export interface LevelUpEvent {
  newLevel: number;
  prevLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  perkPointGained: boolean;
  prevSkillPoints: number;
  prevPerkPoints: number;
  prevXp: number;
  prevSkills: PlayerSkills;
  prevKarma: number;
}
