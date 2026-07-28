/* ─── Volodka RPG – White/Red Check Retry System ───
   Disco Elysium-style skill check retry mechanics:
   - White checks: can be retried after skill growth (skill + thought bonus now exceeds original DC)
   - Red checks: one-shot, never retryable
   - Default: if not specified, all checks are 'white'
*/

import type { ChoiceCondition } from '@/shared/types/common/conditions';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export type { CheckType } from '@/shared/types/common/conditions';

export interface CheckAttemptRecord {
  /** Dialogue node where the check occurred. */
  nodeId: string;
  /** Index of the choice within that node's choices array. */
  choiceIndex: number;
  /** Skill that was checked. */
  skill: TrainablePlayerSkill;
  /** Difficulty Class of the check. */
  dc: number;
  /** The total dice roll + modifier value. */
  rollTotal: number;
  /** Whether the check succeeded at the time. */
  success: boolean;
  /** White or red check classification. */
  checkType: CheckType;
  /** Game timestamp when attempted (for chronological ordering). */
  timestamp: number;
}

export interface WhiteRedCheckResult {
  /** Whether this check is white (retryable) or red (one-shot). */
  checkType: CheckType;
  /** Whether the player can retry this check right now. */
  canRetry: boolean;
  /** How many more skill/thought points are needed to pass the check (if canRetry is false). */
  retrySkillGap: number;
  /** Previous attempts on this same node+choice (for display & retry tracking). */
  previousAttempts: CheckAttemptRecord[];
}

/* ══════════════════════════════════════════════════════════════
   In-memory failed check store
   (Game store integration: these records should be persisted via a
   dedicated slice; the module-level array is a transitional solution.)
   ══════════════════════════════════════════════════════════════ */

let failedCheckRecords: CheckAttemptRecord[] = [];

/** Get all stored failed check records (for UI display and retry logic). */
export function getFailedCheckRecords(): CheckAttemptRecord[] {
  return failedCheckRecords;
}

/** Reset all failed check records (used on new playthrough). */
export function resetFailedCheckRecords(): void {
  failedCheckRecords = [];
}

/** Import failed check records from save data. */
export function loadFailedCheckRecords(records: CheckAttemptRecord[]): void {
  failedCheckRecords = records;
}

/** Export failed check records for save serialization. */
export function exportFailedCheckRecords(): CheckAttemptRecord[] {
  return [...failedCheckRecords];
}

/* ══════════════════════════════════════════════════════════════
   Core resolvers
   ══════════════════════════════════════════════════════════════ */

/**
 * Determine check type and retry availability.
 *
 * White checks: can be retried after skill growth
 *   (skillLevel + thoughtBonus now > original skillLevel + thoughtBonus at time of attempt)
 * Red checks: one-shot, never retryable
 * Default: if not specified on the ChoiceCondition, all checks are 'white'
 */
export function resolveCheckType(
  nodeId: string,
  choiceIndex: number,
  condition: ChoiceCondition,
  currentSkillLevel: number,
  currentThoughtBonus: number,
): WhiteRedCheckResult {
  // Determine check type from condition
  const checkType: CheckType = condition.checkType ?? 'white';

  // Find previous attempts on this node+choice
  const previousAttempts = failedCheckRecords.filter(
    (r) => r.nodeId === nodeId && r.choiceIndex === choiceIndex,
  );

  // If any previous attempt succeeded, the check is passed (not retryable)
  const hasSuccess = previousAttempts.some((r) => r.success);
  if (hasSuccess) {
    return {
      checkType,
      canRetry: false,
      retrySkillGap: 0,
      previousAttempts,
    };
  }

  // Red checks: never retryable
  if (checkType === 'red') {
    return {
      checkType: 'red',
      canRetry: false,
      retrySkillGap: 0,
      previousAttempts,
    };
  }

  // White checks: retryable if skill has grown enough
  const skill = condition.minSkillCheck?.skill;
  const dc = condition.minSkillCheck?.difficulty ?? 0;

  if (!skill || dc === 0) {
    // No skill check defined — shouldn't be in this function, but safe fallback
    return {
      checkType: 'white',
      canRetry: true,
      retrySkillGap: 0,
      previousAttempts,
    };
  }

  // Calculate the current effective modifier
  const currentEffective = currentSkillLevel + currentThoughtBonus;
  // Calculate the minimum effective modifier needed to pass (2d6 average = 7)
  // Actually, we just check: can they pass now? The "gap" is dc - currentEffective - 7 (avg roll)
  // But the real question is: has the skill improved since the last attempt?
  // The simplest Disco Elysium approach: can retry if skill+thoughts > skill+thoughts at time of failure
  // Since we don't store the skill level at time of attempt, we use the gap approach:
  // can retry when currentEffective >= dc - 7 (meaning an average roll would pass)

  // The gap is: how many more points needed for an average roll to pass
  const avgRoll = 7; // 2d6 average
  const neededForAvg = dc - avgRoll; // modifier needed for average roll to pass
  const gap = Math.max(0, neededForAvg - currentEffective);

  // Can retry if there's a realistic chance (current effective + best roll could pass)
  // Or more simply: can always retry a white check as long as you haven't already passed it
  // The "retry availability" shows if the skill has grown since last failure
  const canRetry = checkType === 'white' && !hasSuccess;

  return {
    checkType,
    canRetry,
    retrySkillGap: gap,
    previousAttempts,
  };
}

/**
 * Record a failed check attempt for potential retry tracking.
 * Only stores failures (successes are tracked but don't block retries).
 */
export function recordFailedCheck(
  nodeId: string,
  choiceIndex: number,
  skill: TrainablePlayerSkill,
  dc: number,
  rollTotal: number,
  success: boolean,
  checkType: CheckType,
): CheckAttemptRecord {
  const record: CheckAttemptRecord = {
    nodeId,
    choiceIndex,
    skill,
    dc,
    rollTotal,
    success,
    checkType,
    timestamp: Date.now(),
  };

  failedCheckRecords.push(record);
  return record;
}

/**
 * Check if a previously failed white check can now be passed.
 * A white check can be retried when:
 * - It's a white check (not red)
 * - It hasn't succeeded yet
 * - The player's skill level has increased since the last attempt
 *
 * The "canRetry" boolean is simpler than "can now pass" — it just means
 * the player is allowed to attempt again. Whether they succeed is still
 * determined by the dice roll.
 */
export function canRetryWhiteCheck(
  attempt: CheckAttemptRecord,
  _currentSkillLevel: number,
  _currentThoughtBonus: number,
): boolean {
  // Red checks are never retryable
  if (attempt.checkType === 'red') return false;
  // Already succeeded — no need to retry
  if (attempt.success) return false;
  // White checks are always retryable (Disco Elysium style: you can always try again)
  // The UI shows "retry available" to encourage the player to try again
  // when their skills have improved
  return true;
}

/**
 * Check if a specific choice has a previously failed check record.
 * Used by DialogueRenderer to show retry indicators on choices.
 */
export function hasFailedCheckForChoice(
  nodeId: string,
  choiceIndex: number,
): boolean {
  return failedCheckRecords.some(
    (r) => r.nodeId === nodeId && r.choiceIndex === choiceIndex && !r.success,
  );
}

/**
 * Get all failed check records for a specific choice.
 */
export function getFailedChecksForChoice(
  nodeId: string,
  choiceIndex: number,
): CheckAttemptRecord[] {
  return failedCheckRecords.filter(
    (r) => r.nodeId === nodeId && r.choiceIndex === choiceIndex,
  );
}
