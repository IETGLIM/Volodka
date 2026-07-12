/**
 * Quest failure bypass — prevents permanent soft-locks on the critical path.
 *
 * Design problem (see GitHub review §7):
 *   - `canRetry: false` quests (roof_of_the_world, last_poem, system_infiltration,
 *     rooftop_confrontation, system_takedown, final_poem, volodka_legacy) sit
 *     on the critical path of acts 4–7.
 *   - If any of them is failed (combat defeat, story choice, future timed
 *     objective), downstream quests that declare it in `requiresQuests` never
 *     activate because `canActivateQuest` requires `status === 'completed'`.
 *   - The player is then permanently locked out of the finale — a 30-hour
 *     save effectively bricked.
 *
 * Solution: a "second chance" mechanic.
 *   1. Failing a quest sets a `quest_failed_<id>` flag so downstream quests
 *      can detect the failure and offer a bypassed activation.
 *   2. `areQuestDependenciesMet` and `canActivateQuest` treat a `failed`
 *      prerequisite as `met` (with a bypassed marker) — the story continues.
 *   3. `retryQuest` allows retrying `canRetry: false` quests exactly once,
 *      applying a karma + stress penalty so the failure still has stakes.
 *
 * The penalty is applied through `quest_retried_with_penalty_<id>` flags so
 * it only fires once per quest even if the player fails repeatedly.
 */

import type { QuestDefinition } from '@/shared/types/game';
import type { QuestState } from '@/shared/types/game';

/** A quest is on the critical path if it is `main` and in act 4 or later. */
export function isCriticalPathQuest(definition: QuestDefinition | undefined): boolean {
  if (!definition) return false;
  if (definition.questType !== 'main') return false;
  const act = definition.act ?? 0;
  return act >= 4;
}

/** Flag key set when a quest is failed (any reason). */
export function questFailedFlagKey(questId: string): string {
  return `quest_failed_${questId}`;
}

/** Flag key set when a quest is retried with the bypass penalty. */
export function questRetriedWithPenaltyFlagKey(questId: string): string {
  return `quest_retried_with_penalty_${questId}`;
}

/** Penalty applied when retrying a `canRetry: false` critical-path quest. */
export const QUEST_RETRY_PENALTY = {
  /** Karma reduction — the world remembers the failure. */
  karma: -8,
  /** Stress increase — the weight of the second chance. */
  stress: 15,
} as const;

/**
 * Check whether a prerequisite quest state satisfies a dependency.
 *
 * Returns `'met'` when the prerequisite is completed normally, `'bypassed'`
 * when it was failed but the downstream quest may still activate, or
 * `'unmet'` when the prerequisite is not yet in a terminal state.
 */
export type QuestDependencyStatus = 'met' | 'bypassed' | 'unmet';

export function resolveQuestDependencyStatus(
  prerequisite: QuestState | undefined,
): QuestDependencyStatus {
  if (!prerequisite) return 'unmet';
  if (prerequisite.status === 'completed') return 'met';
  if (prerequisite.status === 'failed') return 'bypassed';
  return 'unmet';
}

/**
 * Aggregate dependency check. Returns `{ met, missing, bypassed }` where
 * `met` is true if every prerequisite is either completed or failed (i.e.
 * the downstream quest can activate), `bypassed` lists the titles of failed
 * prerequisites (for UI feedback), and `missing` lists prerequisites that
 * are still active/inactive.
 */
export function areQuestDependenciesMetWithBypass(
  questId: string,
  quests: readonly QuestState[],
  getDefinition: (id: string) => QuestDefinition | undefined,
): { met: boolean; missing: string[]; bypassed: string[] } {
  const definition = getDefinition(questId);
  if (!definition?.requiresQuests || definition.requiresQuests.length === 0) {
    return { met: true, missing: [], bypassed: [] };
  }

  const missing: string[] = [];
  const bypassed: string[] = [];

  for (const reqId of definition.requiresQuests) {
    const reqQuest = quests.find((q) => q.questId === reqId);
    const status = resolveQuestDependencyStatus(reqQuest);
    const reqDef = getDefinition(reqId);
    const title = reqDef?.title ?? reqId;
    if (status === 'unmet') {
      missing.push(title);
    } else if (status === 'bypassed') {
      bypassed.push(title);
    }
  }

  return {
    met: missing.length === 0,
    missing,
    bypassed,
  };
}

/**
 * Decide whether a failed quest can be retried despite `canRetry: false`.
 *
 * Returns true when:
 *   - the quest is on the critical path (main, act >= 4), AND
 *   - it has not already been retried with penalty.
 *
 * This keeps `canRetry: false` semantics for side quests (which never block
 * progression) while unlocking the finale for the player who failed a
 * critical main quest.
 */
export function canBypassRetryLock(
  definition: QuestDefinition | undefined,
  flags: Record<string, boolean> | undefined,
): boolean {
  if (!definition) return false;
  if (definition.canRetry !== false) return true; // normal retry path
  if (!isCriticalPathQuest(definition)) return false;
  const penaltyFlag = questRetriedWithPenaltyFlagKey(definition.id);
  return !flags?.[penaltyFlag];
}
