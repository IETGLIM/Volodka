/* ─── Volodka RPG – Trophy Achievement Condition Evaluator ─── */
/* Pure function — no React, no store imports. Evaluates TrophyCondition
 * against a GameStoreSnapshot and optional tracking counters.
 * Placed in shared/ (not engine/) so both store and engine can import it. */

import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';
import type { TrophyCondition } from '@/data/achievements';

/** Tracking counters managed by AchievementSlice (passed alongside snapshot). */
export interface TrophyTrackingState {
  craftCount: number;
  poemPowersUsedCount: number;
  highStressWin: boolean;
}

/** Evaluate a single TrophyCondition against the game snapshot + tracking. */
export function evaluateTrophyCondition(
  condition: TrophyCondition,
  snapshot: GameStoreSnapshot,
  tracking?: TrophyTrackingState,
): boolean {
  switch (condition.type) {
    case 'poems_collected':
      return snapshot.collectedPoems.length >= condition.min;

    case 'combats_won':
      return snapshot.achievementProgress.combatVictories >= condition.min;

    case 'scenes_visited':
      return snapshot.achievementProgress.visitedScenes.length >= condition.min;

    case 'skill_level': {
      const level = (snapshot.playerState.skills as Record<string, number>)[condition.skill] ?? 0;
      return level >= condition.min;
    }

    case 'karma': {
      const k = snapshot.playerState.karma;
      if (condition.min !== undefined && k < condition.min) return false;
      if (condition.max !== undefined && k > condition.max) return false;
      return true;
    }

    case 'items_owned':
      return snapshot.playerState.inventory.length >= condition.min;

    case 'npcs_friendly': {
      const friendly = snapshot.npcRelations.filter((r) => r.value > 0).length;
      return friendly >= condition.min;
    }

    case 'poem_powers_used':
      return (tracking?.poemPowersUsedCount ?? 0) >= condition.min;

    case 'thoughts_acquired':
      return snapshot.acquiredThoughtIds.length >= condition.min;

    case 'equipment_slots_filled': {
      const eq = snapshot.equippedItems;
      if (!eq) return false;
      const filled = Object.values(eq).filter((v) => v !== null && v !== undefined).length;
      return filled >= condition.min;
    }

    case 'time_of_day_range': {
      const t = snapshot.exploration.timeOfDay;
      return t >= condition.min && t <= condition.max;
    }

    case 'stress_win':
      return tracking?.highStressWin ?? false;

    case 'flag_set':
      return snapshot.playerState.flags[condition.flag] === true;

    case 'craft_count':
      return (tracking?.craftCount ?? 0) >= condition.min;

    case 'act_reached':
      return snapshot.playerState.progression.currentAct >= condition.min;

    default: {
      const _exhaustive: never = condition;
      return false;
    }
  }
}
