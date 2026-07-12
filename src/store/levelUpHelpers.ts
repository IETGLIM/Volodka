/* ─── Volodka RPG – level-up notification + event helpers ─── */

import type { PlayerProgression, PlayerSkills } from '@/shared/types/game';
import type { LevelUpEvent } from '@/shared/types/levelUp';
export type { LevelUpEvent } from '@/shared/types/levelUp';
import { DEFAULT_SKILLS } from '@/data/constants';
import { applyXpGain } from './shared';
import { scheduleLevelUpEvent } from './storeEffects';

export interface LevelUpPlayerSnapshot {
  prevSkills: PlayerSkills;
  prevKarma: number;
}

export function formatLevelUpMessage(
  newLevel: number,
  levelsGained: number,
  perkPointsGained: number,
): string {
  const skillPart =
    levelsGained === 1 ? '+1 очко навыка' : `+${levelsGained} очков навыка`;
  if (perkPointsGained === 0) {
    return `Уровень ${newLevel}! ${skillPart}`;
  }
  const perkPart =
    perkPointsGained === 1 ? '+1 очко черты' : `+${perkPointsGained} очков черты`;
  return `Уровень ${newLevel}! ${skillPart} ${perkPart}!`;
}

export function applyXpToProgression(
  progression: PlayerProgression,
  amount: number,
  playerSnapshot?: LevelUpPlayerSnapshot,
): { progression: PlayerProgression; levelUp: LevelUpEvent | null } {
  const prevSkillPoints = progression.skillPoints;
  const prevPerkPoints = progression.perkPoints;
  const prevXp = progression.xp;

  const result = applyXpGain(progression, amount);
  if (result.levelsGained <= 0) {
    return { progression: result.progression, levelUp: null };
  }

  if (!playerSnapshot) {
    console.warn('[levelUp] applyXpToProgression without player snapshot — summary diffs may be incomplete');
  }

  return {
    progression: result.progression,
    levelUp: {
      newLevel: result.progression.level,
      prevLevel: result.prevLevel,
      levelsGained: result.levelsGained,
      perkPointsGained: result.perkPointsGained,
      perkPointGained: result.perkPointGained,
      prevSkillPoints,
      prevPerkPoints,
      prevXp,
      prevSkills: playerSnapshot?.prevSkills ?? DEFAULT_SKILLS,
      prevKarma: playerSnapshot?.prevKarma ?? 0,
    },
  };
}

export function mergeLevelUpEvents(events: LevelUpEvent[]): LevelUpEvent | null {
  if (events.length === 0) return null;
  if (events.length === 1) return events[0]!;

  const first = events[0]!;
  const last = events[events.length - 1]!;
  const perkPointsGained = events.reduce((sum, event) => sum + event.perkPointsGained, 0);

  return {
    newLevel: last.newLevel,
    prevLevel: first.prevLevel,
    levelsGained: last.newLevel - first.prevLevel,
    perkPointsGained,
    perkPointGained: perkPointsGained > 0,
    prevSkillPoints: first.prevSkillPoints,
    prevPerkPoints: first.prevPerkPoints,
    prevXp: first.prevXp,
    prevSkills: first.prevSkills,
    prevKarma: first.prevKarma,
  };
}

export function scheduleLevelUpEmit(event: LevelUpEvent): void {
  scheduleLevelUpEvent(event);
}

export function scheduleLevelUpEmitMerged(events: LevelUpEvent[]): void {
  const merged = mergeLevelUpEvents(events);
  if (merged) scheduleLevelUpEmit(merged);
}
