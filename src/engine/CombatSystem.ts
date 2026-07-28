/* ─── Volodka RPG – Turn-based Combat System (facade) ───
   Бой — это не только сила. Это мудрость.
   Each collected poem = unique combat ability.

   Orchestrator facade — implementation lives under combat/:
   - combat/types.ts         — Types, interfaces, constants
   - combat/buffSystem.ts    — Buff/debuff management
   - combat/formulas.ts      — Damage formulas, flee/XP helpers, cooldowns
   - combat/enemies.ts       — Enemy templates & special attacks
   - combat/actions.ts       — Poem abilities, combos, skill tree, side effects
   - combat/combatSession.ts — Session singleton (timers, generation, return stack)
   - combat/combatStart.ts   — startCombat
   - combat/playerActions.ts — attack / defend / poem / flee
   - combat/turnFlow.ts      — turn handoff + enemy AI
   - combat/combatOutcome.ts — victory / defeat
*/

import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { CombatBuff, CombatState } from './combat/types';
import { POEM_COMBAT_ABILITIES } from './combat/actions';
import { combatSession } from './combat/combatSession';

export type {
  EnemyType,
  CombatEnemy,
  CombatState,
  CombatLogEntry,
  CombatAction,
  CombatBuff,
  BuffEffect,
  EnemySpecialAttack,
  SideEffect,
  CombatReward,
} from './combat/types';

export { applyCombatSideEffects } from './combat/actions';
export { SKILL_TREE } from './combat/actions';
export { calculateXpToNextLevel } from './combat/formulas';
export { startCombat } from './combat/combatStart';
export {
  playerAttack,
  playerDefend,
  playerUsePoemPower,
  playerFlee,
} from './combat/playerActions';

import {
  canUnlockSkill as _canUnlockSkill,
  unlockSkill as _unlockSkill,
} from './combat/actions';

/** Tear down combat session timers and listener refs. Idempotent. */
export function disposeCombatSystem(): void {
  combatSession.dispose();
}

registerHmrDispose(disposeCombatSystem);

/** Subscribe to combat state changes. Returns unsubscribe function. */
export function subscribeToCombat(listener: (state: CombatState) => void): () => void {
  return combatSession.subscribe(listener);
}

/** Get current combat state (read-only snapshot) */
export function getCombatState(): CombatState | null {
  return combatSession.getState();
}

/** Cooldown-aware list of collected poem powers for the combat UI. */
export function getAvailableCombatPowers(): Array<{
  poemId: string;
  name: string;
  description: string;
  cooldownRemaining: number;
}> {
  const combatState = combatSession.getState();
  if (!combatState) return [];

  return getGameSnapshot().collectedPoems
    .map((poemId) => {
      const ability = POEM_COMBAT_ABILITIES[poemId];
      if (!ability) return null;
      const cd = combatState.powerCooldowns[poemId] ?? 0;
      return { poemId, name: ability.name, description: ability.description, cooldownRemaining: cd };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/** Active buffs for UI display (optionally filtered by target). */
export function getActiveBuffs(target?: 'player' | 'enemy'): CombatBuff[] {
  const cs = combatSession.getState();
  if (!cs) return [];
  if (target) return cs.buffs.filter((b) => b.target === target);
  return cs.buffs;
}

/** Check if a skill tree node can be unlocked */
export { _canUnlockSkill as canUnlockSkill };

/** Unlock a skill tree node */
export { _unlockSkill as unlockSkill };
