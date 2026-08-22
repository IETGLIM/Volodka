/* ─── Combat System — Per-Turn Stat Drain (pure function) ───
 *
 * Extracted from CombatSystem.transitionToPlayerTurn() (§8.3 / §3.3) to
 * isolate the four-branch stat-drain loop (energy / karma / logic / empathy)
 * and the hp_drain_percent tick. Pure — no singleton access, no event bus,
 * no dispatchGameAction. The orchestrator (CombatSystem.ts) is responsible
 * for dispatching the returned GameAction[] and applying the hpDelta to
 * combat state.
 *
 * Bug preserved on purpose (FIX-1D): the empathy branch was added in
 * Phase 11.1 to handle grief_echo / memory_devourer debuffs. The cast
 * mirrors the `BuffEffect.stat_drain` union extension in
 * shared/types/definitions/combat.ts.
 *
 * Behavior preservation note: the original inline loop called
 * `getGameSnapshot()` inside the loop body, AFTER each dispatch. This
 * means subsequent drains see the *clamped* result of earlier drains
 * (e.g. two `-5 energy` drains on a starting pool of `8 energy` would
 * drain `5` then `3`, not `5` then `5`). The pure function reproduces this
 * by tracking running values internally — the orchestrator must dispatch
 * the returned `actions[]` in order to reach the same final state.
 */

import type {
  CombatState,
  CombatLogEntry,
} from './types';

/** Discriminated union of stat-drain actions the orchestrator must dispatch.
 *  Kept narrow on purpose — only the four drains this module can produce. */
export type StatDrainGameAction =
  | { type: 'player/addEnergy'; amount: number }
  | { type: 'player/addKarma'; amount: number }
  | { type: 'player/addSkill'; skill: 'logic' | 'empathy'; amount: number };

/** Snapshot of player-side stats the drain loop needs to clamp against.
 *  Orchestrator passes `snap().playerState` (filtered to these fields). */
export interface PlayerStatDrainSnapshot {
  energy: number;
  karma: number;
  skills: { logic: number; empathy: number };
}

/** Output of the per-turn stat-drain pass. */
export interface ProcessStatDrainResult {
  /** Resulting player HP after applying any hp_drain_percent ticks.
   *  Pre-drain value is `state.playerHp`; the orchestrator assigns this
   *  directly to `playerHp` in the assembled next state. */
  playerHpAfterDrain: number;
  /** Log lines produced by the drain (one per active drain buff). */
  log: CombatLogEntry[];
  /** Side-effecting actions the orchestrator must dispatch
   *  (player/addEnergy, /addKarma, /addSkill) — in order. Each action's
   *  amount already accounts for clamping against earlier drains. */
  actions: StatDrainGameAction[];
}

/**
 * Process all `stat_drain` and `hp_drain_percent` debuffs on the player
 * for the upcoming turn.
 *
 * Behavior mirrors the original inline loop in `transitionToPlayerTurn`:
 *  - `stat_drain` (energy): dispatches `player/addEnergy` with the drained
 *    amount, clamped to the player's current energy.
 *  - `stat_drain` (karma): dispatches `player/addKarma` with the drained
 *    amount, clamped to current karma.
 *  - `stat_drain` (logic): dispatches `player/addSkill` for `logic`,
 *    clamped to the player's current logic.
 *  - `stat_drain` (empathy): dispatches `player/addSkill` for `empathy`,
 *    clamped to the player's current empathy (FIX-1D — Phase 11).
 *  - `hp_drain_percent`: applies `floor(playerMaxHp * value)` direct HP
 *    damage, clamped so the player never drops below 1 HP from drain alone.
 *
 * Multiple `stat_drain` debuffs of the same stat accumulate sequentially —
 * each clamp uses the running value after earlier drains in the same pass
 * (reproducing the original "read snapshot per iteration" behavior).
 */
export function processStatDrainDebuffs(
  state: CombatState,
  playerSnapshot: PlayerStatDrainSnapshot,
): ProcessStatDrainResult {
  const log: CombatLogEntry[] = [];
  const actions: StatDrainGameAction[] = [];
  let playerHpAfterDrain = state.playerHp;

  // Running values — each drain clamps against the residual after earlier
  // drains in the same pass. Matches the original inline behavior which
  // re-read getGameSnapshot() inside the loop body.
  let runningEnergy = playerSnapshot.energy;
  let runningKarma = playerSnapshot.karma;
  let runningLogic = playerSnapshot.skills.logic;
  let runningEmpathy = playerSnapshot.skills.empathy;

  for (const buff of state.buffs) {
    if (buff.target !== 'player') continue;

    if (buff.effect.type === 'stat_drain') {
      // FIX-1D: cast extended to include 'empathy' (matches BuffEffect union).
      const eff = buff.effect as {
        type: 'stat_drain';
        stat: 'logic' | 'energy' | 'karma' | 'empathy';
        value: number;
      };

      if (eff.stat === 'energy') {
        const current = runningEnergy;
        const drainAmount = Math.min(eff.value, current);
        runningEnergy = Math.max(0, runningEnergy - drainAmount);
        actions.push({ type: 'player/addEnergy', amount: -drainAmount });
        log.push({
          turn: state.turn,
          text: `💀 ${buff.name}: Энергия -${drainAmount}`,
          type: 'info',
        });
      } else if (eff.stat === 'karma') {
        const current = runningKarma;
        const drainAmount = Math.min(eff.value, current);
        runningKarma = Math.max(0, runningKarma - drainAmount);
        actions.push({ type: 'player/addKarma', amount: -drainAmount });
        log.push({
          turn: state.turn,
          text: `💀 ${buff.name}: Карма -${drainAmount}`,
          type: 'info',
        });
      } else if (eff.stat === 'logic') {
        const currentLogic = runningLogic;
        const drainAmount = Math.min(eff.value, currentLogic);
        runningLogic = Math.max(0, runningLogic - drainAmount);
        actions.push({
          type: 'player/addSkill',
          skill: 'logic',
          amount: -drainAmount,
        });
        log.push({
          turn: state.turn,
          text: `💀 ${buff.name}: Логика -${drainAmount}`,
          type: 'info',
        });
      } else if (eff.stat === 'empathy') {
        // FIX-1D: Phase 11 empathy drain (grief_echo, memory_devourer).
        const currentEmpathy = runningEmpathy;
        const drainAmount = Math.min(eff.value, currentEmpathy);
        runningEmpathy = Math.max(0, runningEmpathy - drainAmount);
        actions.push({
          type: 'player/addSkill',
          skill: 'empathy',
          amount: -drainAmount,
        });
        log.push({
          turn: state.turn,
          text: `💀 ${buff.name}: Эмпатия -${drainAmount}`,
          type: 'info',
        });
      }
    }

    /* ── hp_drain_percent (Цифровая лихорадка) ──
     *  Direct HP damage as % of playerMaxHp, clamped so the player never
     *  drops below 1 HP from drain alone (matches original inline logic). */
    if (buff.effect.type === 'hp_drain_percent') {
      const eff = buff.effect as { type: 'hp_drain_percent'; value: number };
      const drainDmg = Math.max(1, Math.floor(state.playerMaxHp * eff.value));
      playerHpAfterDrain = Math.max(1, playerHpAfterDrain - drainDmg);
      log.push({
        turn: state.turn,
        text: `🦠 ${buff.name}: -${drainDmg} HP`,
        type: 'status_effect',
        damage: drainDmg,
      });
    }
  }

  return { playerHpAfterDrain, log, actions };
}
