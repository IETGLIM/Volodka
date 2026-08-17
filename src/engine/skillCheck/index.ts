/* ─── Volodka RPG – Dice-roll skill check barrel ─── */

export {
  performDiceRoll,
  getSuccessProbability,
  formatDiceRollResult,
  DICE_SKILL_LABELS,
} from './diceRollSkillCheck';

export type {
  DiceRollResult,
  DiceRollParams,
} from './diceRollSkillCheck';

export type {
  SuccessDegree,
  PartialSuccessEffects,
  PartialSuccessResult,
} from '@/engine/narrative/partialSuccessSystem';

export {
  resolveSuccessDegree,
  isSuccessDegree,
  getSuccessDegreeLabel,
  getSuccessDegreeColor,
  SUCCESS_DEGREE_LABELS,
  SUCCESS_DEGREE_COLORS,
  resolveChoiceEffectsByDegree,
} from '@/engine/narrative/partialSuccessSystem';

export type {
  CheckType,
  CheckAttemptRecord,
  WhiteRedCheckResult,
} from '@/engine/narrative/whiteRedCheckSystem';

export {
  resolveCheckType,
  recordFailedCheck,
  canRetryWhiteCheck,
  hasFailedCheckForChoice,
  getFailedChecksForChoice,
  getFailedCheckRecords,
  resetFailedCheckRecords,
} from '@/engine/narrative/whiteRedCheckSystem';

export type {
  ThoughtInterjection,
} from '@/engine/narrative/thoughtInterjection';

export {
  resolveThoughtInterjections,
} from '@/engine/narrative/thoughtInterjection';