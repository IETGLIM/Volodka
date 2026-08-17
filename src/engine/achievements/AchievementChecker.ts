/* ─── Volodka RPG – Trophy Achievement Condition Evaluator (engine re-export) ─── */
/* Engine files import from here. Actual logic lives in shared/achievements/
 * so that store slices can also import it without violating import rules. */

export { evaluateTrophyCondition, type TrophyTrackingState } from '@/shared/achievements/evaluateTrophyCondition';
