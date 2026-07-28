/**
 * Combat subsystem exports.
 *
 * Architecture:
 *   CombatSystem (facade)  — stable public API for UI / orchestrator
 *   combatSession          — session singleton (timers, generation, return stack)
 *   combatStart            — startCombat
 *   playerActions          — attack / defend / poem / flee
 *   turnFlow               — turn handoff + enemy AI
 *   combatOutcome          — victory / defeat
 *   formulas / buffSystem / actions / enemies / types — shared domain
 */

export { combatSession, CombatManager } from './combatSession';
export { startCombat } from './combatStart';
export {
  playerAttack,
  playerDefend,
  playerUsePoemPower,
  playerFlee,
} from './playerActions';
export { endPlayerTurn, executeEnemyTurn, transitionToPlayerTurn } from './turnFlow';
export { handleVictory, handleDefeat } from './combatOutcome';
export {
  getPlayerAttack,
  getPlayerDefense,
  getPlayerMaxHp,
  computeCombatCredits,
  getComboMultiplier,
  getCritChance,
  computeFleeChance,
  computeVictoryComboBonus,
  computeVictoryLootChance,
  buildVictorySkillXp,
  computeDefeatPenalties,
  spiritualDamageReduction,
  tickPowerCooldowns,
  isPowerAvailable,
  calculateXpToNextLevel,
  addXp,
} from './formulas';
export { applyCombatSideEffects, SKILL_TREE, canUnlockSkill, unlockSkill } from './actions';
