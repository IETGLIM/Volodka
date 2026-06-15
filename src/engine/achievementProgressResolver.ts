import type { AchievementDefinition } from '@/data/achievements';
import { countCollectedMainPoems } from '@/data/poemCollectionMeta';
import type { AchievementProgressSnapshot } from '@/engine/GameActionDispatcher';

export interface AchievementProgressView {
  current: number;
  target: number;
}

type ProgressState = {
  collectedPoems: string[];
  karma: number;
  flags: Record<string, boolean>;
};

function counterValue(
  key: string,
  progress: AchievementProgressSnapshot,
  state: ProgressState,
): number {
  switch (key) {
    case 'visitedScenes':
      return progress.visitedScenes.length;
    case 'consecutiveVictories':
      return progress.consecutiveVictories;
    case 'combatVictories':
      return progress.combatVictories;
    case 'maxComboAchieved':
      return progress.maxComboAchieved;
    case 'nightTimeHours':
      return Math.floor(progress.nightTimeHours);
    case 'defeatedEnemyTypes':
      return progress.defeatedEnemyTypes.length;
    case 'karma':
      return state.karma;
    case 'goodKarmaStreak':
      return progress.goodKarmaStreak;
    case 'badKarmaStreak':
      return progress.badKarmaStreak;
    default:
      return state.flags[`${key}_count`] ? 1 : 0;
  }
}

/** Returns progress fraction for cumulative achievements (null if not trackable). */
export function resolveAchievementProgress(
  def: AchievementDefinition,
  progress: AchievementProgressSnapshot,
  state: ProgressState,
): AchievementProgressView | null {
  const tracking = def.progressTracking;
  if (!tracking?.target) return null;

  switch (tracking.type) {
    case 'counter': {
      const key = tracking.counterKey;
      if (!key) return null;
      return {
        current: Math.min(counterValue(key, progress, state), tracking.target),
        target: tracking.target,
      };
    }
    case 'collection': {
      if (tracking.collectionKind === 'poems') {
        const current = countCollectedMainPoems(state.collectedPoems);
        return {
          current: Math.min(current, tracking.target),
          target: tracking.target,
        };
      }
      if (tracking.collectionKind === 'scenes') {
        return {
          current: Math.min(progress.visitedScenes.length, tracking.target),
          target: tracking.target,
        };
      }
      return null;
    }
    case 'flag': {
      const flag = tracking.unlockFlag ?? def.unlockFlag;
      if (!flag) return null;
      const done = state.flags[flag] ? 1 : 0;
      return { current: done, target: 1 };
    }
    default: {
      const _exhaustive: never = tracking.type;
      return _exhaustive;
    }
  }
}
