/* ─── Combat System — Turn Cycle (pure functions) ───
 *
 * Extracted from CombatSystem.ts (§3.1) to reduce the orchestrator's size.
 * All functions here are **pure** — they take state and return the next
 * state (or a result object describing what the orchestrator should do).
 *
 * Side-effect-free: no `combat` singleton, no `eventBus`, no
 * `dispatchGameAction`, no `combat.schedule`. The orchestrator
 * (CombatSystem.ts) calls these and applies side effects (setState,
 * eventBus.emit, dispatchGameAction, schedule) itself.
 *
 * Extracted:
 *  - endPlayerTurn(state)        — phase switch, tick player power cooldowns
 *  - transitionToPlayerTurn(...) — buff tick, stat drain, stun check, state assembly
 *  - gotoEnemyTurnEnd(state)     — finalize enemy turn, defeat check
 *
 * Why pure: enables unit-testing all buff-tick / drain / stun branches
 * without instantiating the combat singleton or mocking the game store.
 */

import type { CombatState } from './types';
import {
  createBuff,
  addBuff,
  hasBuffEffect,
  tickBuffs,
  getEnemyDefenseReduction,
} from './buffSystem';
import { tickPowerCooldowns } from './formulas';
import {
  processStatDrainDebuffs,
  type StatDrainGameAction,
  type PlayerStatDrainSnapshot,
} from './statDrain';

/* ═══════════════════════════════════════════════════════════════
   §3.1.1 — endPlayerTurn (phase switch)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Tick player power cooldowns and switch the phase to enemy turn.
 *
 * Pure: returns the next combat state with `isPlayerTurn=false` and
 * cooldowns decremented. The orchestrator must:
 *  1. Call `combat.setState(result)` to commit the phase switch.
 *  2. Emit `'combat:turn'` with `isPlayerTurn: false`.
 *  3. Notify listeners.
 *  4. Schedule `executeEnemyTurn` after a short visual delay (the
 *     orchestrator owns the enemy-turn pipeline and timer).
 */
export function endPlayerTurn(state: CombatState): CombatState {
  return {
    ...state,
    isPlayerTurn: false,
    powerCooldowns: tickPowerCooldowns(state.powerCooldowns),
  };
}

/* ═══════════════════════════════════════════════════════════════
   §3.1.2 — transitionToPlayerTurn (buff tick + stat drain + stun)
   ═══════════════════════════════════════════════════════════════ */

/** Result of `transitionToPlayerTurn`. Two branches:
 *  - `stunned`: skip_turn debuff consumed, stun_immune granted, player's
 *    turn auto-skips after a brief display. Orchestrator schedules auto-skip.
 *  - `normal`: buffs ticked, stat drain computed, player can act. */
export type TransitionToPlayerTurnResult =
  | {
      kind: 'stunned';
      /** Final combat state with isPlayerTurn=true and stun log applied. */
      nextState: CombatState;
      /** Orchestrator must schedule an `endPlayerTurn` auto-skip after a delay. */
      scheduleAutoSkip: true;
      /** Stunned turns skip stat drain (matches original behavior). */
      drainActions: readonly StatDrainGameAction[];
    }
  | {
      kind: 'normal';
      /** Final combat state with isPlayerTurn=true and buff tick + drain applied. */
      nextState: CombatState;
      scheduleAutoSkip: false;
      /** Drain actions the orchestrator must dispatch BEFORE setState
       *  (the drain math clamps each drain against the running total of
       *  earlier drains in the same pass — dispatching in order reproduces
       *  the original inline getGameSnapshot-per-iteration behavior). */
      drainActions: StatDrainGameAction[];
    };

/**
 * Process the start of the player's turn.
 *
 * Branches:
 *  1. **Stunned** — player has a `skip_turn` debuff applied during the
 *     enemy's turn. Consume the debuff, tick remaining buffs, grant a
 *     1-turn `stun_immune` buff (anti stun-lock), advance turn counter,
 *     briefly mark isPlayerTurn=true so the UI shows the stun message,
 *     then the orchestrator schedules an auto-skip.
 *  2. **Normal** — tick all player buffs, then run the per-turn stat drain
 *     (energy / karma / logic / empathy + hp_drain_percent) and assemble
 *     the next turn state.
 *
 * The stun check runs BEFORE `tickBuffs` because tickBuffs decrements
 * durations first, which would remove a duration-1 skip_turn before the
 * stun fires (preserved from the original comment, lines 916-920).
 *
 * The `playerSnapshot` is required only for the normal branch (drain
 * clamping). For the stunned branch it's accepted but unused — callers
 * may pass a minimal snapshot.
 */
export function transitionToPlayerTurn(
  state: CombatState,
  playerSnapshot: PlayerStatDrainSnapshot,
): TransitionToPlayerTurnResult {
  // ── STUN BRANCH ────────────────────────────────────────────────────
  // Check BEFORE tickBuffs — a duration-1 skip_turn applied during the
  // enemy's turn must fire here; tickBuffs would decrement it to 0 and
  // remove it before this check could catch it.
  if (hasBuffEffect(state, 'player', 'skip_turn')) {
    // Consume the skip_turn buff (it's been "used")
    const consumed = state.buffs.filter(
      (b) => !(b.target === 'player' && b.effect.type === 'skip_turn'),
    );
    // Tick remaining buffs so durations still progress
    const { state: afterTick, expiredLog } = tickBuffs(
      { ...state, buffs: consumed },
      'player',
    );
    // Grant stun immunity for 1 turn so the player cannot be stun-locked
    const immuneBuff = createBuff(
      afterTick,
      'Иммунитет к оглушению',
      'stun_recovery_player',
      'buff',
      'player',
      1,
      { type: 'stun_immune' },
    );
    const withImmune = addBuff(afterTick, immuneBuff);

    const workingState: CombatState = {
      ...withImmune,
      turn: afterTick.turn + 1,
      enemyDefending: false,
      doubleAttack: false,
      playerDefending: false,
      enemyDefenseReduction: getEnemyDefenseReduction(afterTick),
      _sideEffects: [],
      log: [
        ...withImmune.log,
        ...expiredLog,
        { turn: afterTick.turn + 1, text: '😵 Вы оглушены и пропускаете ход!', type: 'info' },
        { turn: afterTick.turn + 1, text: '🛡️ Вы получаете иммунитет к оглушению на 1 ход.', type: 'info' },
      ],
      isPlayerTurn: true, // Briefly show it's "your turn" before skipping
    };

    return {
      kind: 'stunned',
      nextState: workingState,
      scheduleAutoSkip: true,
      drainActions: [],
    };
  }

  // ── NORMAL BRANCH ─────────────────────────────────────────────────
  const { state: afterBuffTick, expiredLog } = tickBuffs(state, 'player');

  // Stat drain (delegated to statDrain.ts pure function)
  const drainResult = processStatDrainDebuffs(afterBuffTick, playerSnapshot);

  const workingState: CombatState = {
    ...afterBuffTick,
    playerHp: drainResult.playerHpAfterDrain,
    turn: afterBuffTick.turn + 1,
    // Reset backward-compat flags at the start of each player turn.
    // These are consumed during the enemy's turn and must not persist;
    // the buff system handles duration-based effects.
    enemyDefending: false,
    doubleAttack: false,
    playerDefending: false,
    // Sync enemy defense reduction from buff system (may have changed due to buff tick/expiry)
    enemyDefenseReduction: getEnemyDefenseReduction(afterBuffTick),
    // Safety: clear any stale side effects that survived from a previous turn.
    _sideEffects: [],
    log: [...afterBuffTick.log, ...expiredLog, ...drainResult.log],
    isPlayerTurn: true,
  };

  return {
    kind: 'normal',
    nextState: workingState,
    scheduleAutoSkip: false,
    drainActions: drainResult.actions,
  };
}

/* ═══════════════════════════════════════════════════════════════
   §3.1.3 — gotoEnemyTurnEnd (finalize enemy turn after special attack)
   ═══════════════════════════════════════════════════════════════ */

/** Result of `gotoEnemyTurnEnd`. */
export interface GotoEnemyTurnEndResult {
  /** Combat state with turn-end flags applied (playerDefending reset,
   *  enemy special cooldown decremented, enemyDefenseReduction synced). */
  nextState: CombatState;
  /** True if the player has been defeated (HP ≤ 0) — orchestrator must
   *  call `handleDefeat()` and skip the transition to player turn. */
  playerDefeated: boolean;
}

/**
 * Finalize the enemy's turn after a special attack lands.
 *
 * Resets per-turn flags, decrements the enemy's special-attack cooldown,
 * and signals whether the player has been defeated (some specials deal
 * direct damage — defeat check happens after the special resolved).
 *
 * Pure: the orchestrator commits `nextState` via `combat.setState`,
 * then either calls `handleDefeat()` (if `playerDefeated`) or
 * `transitionToPlayerTurn(nextState)` to begin the player's turn.
 */
export function gotoEnemyTurnEnd(state: CombatState): GotoEnemyTurnEndResult {
  const nextState: CombatState = {
    ...state,
    playerDefending: false,
    enemyDefenseReduction: getEnemyDefenseReduction(state),
    enemy: {
      ...state.enemy,
      specialCooldown: Math.max(0, state.enemy.specialCooldown - 1),
    },
  };

  return {
    nextState,
    playerDefeated: nextState.playerHp <= 0,
  };
}

/* Re-export the stat-drain snapshot type so callers of `transitionToPlayerTurn`
 *  can construct the input without importing statDrain.ts separately. */
export type { PlayerStatDrainSnapshot, StatDrainGameAction };
