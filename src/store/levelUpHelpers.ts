/* ─── Volodka RPG – level-up notification + event helpers ─── */

import type { PlayerProgression } from '@/shared/types/game';
import { applyXpGain } from './shared';
import { scheduleLevelUpEvent } from './storeEffects';

export interface LevelUpEvent {
  newLevel: number;
  prevLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  perkPointGained: boolean;
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
): { progression: PlayerProgression; levelUp: LevelUpEvent | null } {
  const result = applyXpGain(progression, amount);
  if (result.levelsGained <= 0) {
    return { progression: result.progression, levelUp: null };
  }

  return {
    progression: result.progression,
    levelUp: {
      newLevel: result.progression.level,
      prevLevel: result.prevLevel,
      levelsGained: result.levelsGained,
      perkPointsGained: result.perkPointsGained,
      perkPointGained: result.perkPointGained,
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
  };
}

export function scheduleLevelUpEmit(event: LevelUpEvent): void {
  scheduleLevelUpEvent(event);
}

export function scheduleLevelUpEmitMerged(events: LevelUpEvent[]): void {
  const merged = mergeLevelUpEvents(events);
  if (merged) scheduleLevelUpEmit(merged);
}
