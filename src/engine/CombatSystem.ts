/* ─── Volodka RPG – Turn-based Combat System (Orchestrator) ───
   Бой — это не только сила. Это мудрость.
   Each collected poem = unique combat ability.

   This module orchestrates combat by importing from focused sub-modules:
   - combat/types.ts      — Types, interfaces, constants
   - combat/buffSystem.ts — Buff/debuff management
   - combat/formulas.ts   — Damage formulas, player stats, cooldowns
   - combat/enemies.ts    — Enemy templates & special attacks
   - combat/actions.ts    — Poem abilities, combos, skill tree, side effects

   §3.1 Fixes:
   1. Buff/debuff duration system — replaces implicit flags
   2. Enemy special attacks — each type has 2 unique specials
   3. Cumulative flee mechanic — +15% per failed attempt + skill influence
   4. Poem ability cooldowns — reuse after N turns instead of single-use
*/

import { eventBus } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower,
  tryAddInventoryItem,
} from '@/engine/GameActionDispatcher';
import { createInventoryItem } from '@/data/items';

function snap() {
  return getGameSnapshot();
}

// ── Sub-module imports ──
import type { CombatState, CombatLogEntry, CombatBuff, EnemyType, CombatEnemy } from './combat/types';
import { appendLog } from './combat/types';
import {
  createBuff, addBuff, sumBuffEffect, hasBuffEffect, tickBuffs,
  getEnemyDefenseReduction, getPlayerDamageMultiplier,
  getPlayerDamageReduction, getPlayerVulnerability,
  getEnemyDamageMultiplier, getEnemyAttackBoost,
  getPlayerAttackBoost, getPlayerDefenseBoost,
} from './combat/buffSystem';
import { getPlayerAttack, getPlayerDefense, getPlayerMaxHp, tickPowerCooldowns, isPowerAvailable, addXp, computeCombatCredits } from './combat/formulas';
import { ENEMY_TEMPLATES, resolveEnemyType } from './combat/enemies';
import {
  POEM_COMBAT_ABILITIES,
  applyCombatSideEffects,
  consumeSideEffects,
  checkPoemPowerCombo,
  SKILL_TREE,
  canUnlockSkill as _canUnlockSkill,
  unlockSkill as _unlockSkill,
} from './combat/actions';

// ── Re-export types so existing imports of CombatSystem don't break ──
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

/* ═══════════════════════════════════════════════════════════════
   §4 — COMBAT SYSTEM SINGLETON (State Management)
   ═══════════════════════════════════════════════════════════════ */

/** Max nested story→combat returns; excess oldest entries are dropped with a warn. */
const MAX_RETURN_STACK_DEPTH = 8;

/**
 * Instance-scoped combat session manager with generation tokens.
 * Async callbacks capture the generation at schedule time and no-op if
 * a newer combat session has started or the current one was torn down.
 */
class CombatManager {
  private _state: CombatState | null = null;
  private listeners = new Set<(state: CombatState) => void>();
  /** G12: Stack of storyNode IDs to return to after combat ends */
  private returnStack: string[] = [];
  private generation = 0;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  getState(): CombatState | null {
    return this._state;
  }

  setState(next: CombatState | null): void {
    this._state = next;
  }

  notifyListeners(): void {
    const state = this._state;
    if (state) {
      this.listeners.forEach((fn) => fn(state));
    }
  }

  subscribe(listener: (state: CombatState) => void): () => void {
    this.listeners.add(listener);
    if (this._state) listener(this._state);
    return () => this.listeners.delete(listener);
  }

  private exitTimer: ReturnType<typeof setTimeout> | null = null;

  /** Start a new combat session — invalidates pending async work from prior sessions. */
  beginSession(): void {
    this.clearPendingTimers();
    this.clearExitTimer();
    this.generation += 1;
  }

  /** Tear down the active session — invalidates in-flight async callbacks. */
  endSession(): void {
    this.clearPendingTimers();
    this.clearExitTimer();
    this.generation += 1;
    this._state = null;
  }

  /** Cancel turn timers only — keeps generation (victory/defeat exit must not be dropped). */
  clearPendingTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }

  /** Schedule return to exploration/story — survives clearPendingTimers; cleared on endSession. */
  scheduleExit(delayMs: number, fn: () => void): void {
    if (this.exitTimer) clearTimeout(this.exitTimer);
    this.exitTimer = setTimeout(() => {
      this.exitTimer = null;
      fn();
    }, delayMs);
  }

  private clearExitTimer(): void {
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }

  /** Cancel timers and drop listener refs (unmount / HMR). */
  dispose(): void {
    this.endSession();
    this.listeners.clear();
    this.returnStack.length = 0;
  }

  pushReturnNode(nodeId: string): void {
    if (this.returnStack.length >= MAX_RETURN_STACK_DEPTH) {
      const dropped = this.returnStack.shift();
      console.warn(
        `[CombatSystem] returnStack capped at ${MAX_RETURN_STACK_DEPTH}; dropped oldest entry "${dropped}"`,
      );
    }
    this.returnStack.push(nodeId);
  }

  popReturnNode(): string | undefined {
    return this.returnStack.pop();
  }

  /** Pop the return entry for a combat session that is being replaced without a normal exit. */
  discardOrphanedReturnNode(): void {
    const orphaned = this.popReturnNode();
    if (orphaned) {
      console.warn(`[CombatSystem] Discarded orphaned return node "${orphaned}" from interrupted combat`);
    }
  }

  /** Schedule combat work that is cancelled when the session generation changes. */
  schedule(delayMs: number, fn: () => void): void {
    const capturedGeneration = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (capturedGeneration !== this.generation) return;
      fn();
    }, delayMs);
    this.timers.add(timer);
  }
}

const combat = new CombatManager();

function notifyCombatDamage(entry: CombatLogEntry): void {
  if (!entry.damage || entry.damage <= 0) return;

  const isPlayerHit =
    entry.type === 'enemy_attack' ||
    entry.type === 'enemy_special' ||
    entry.type === 'status_effect';

  const isCritical = entry.isCritical === true || entry.type === 'critical_hit';

  eventBus.emit('combat:hit', {
    damage: entry.damage,
    isPlayerHit,
    direction: isPlayerHit ? 'front' : undefined,
    source: entry.type,
  });
  eventBus.emit('combat:damage', {
    amount: entry.damage,
    source: entry.type,
    critical: isCritical,
  });
}

function notifyNewCombatLogEntries(beforeLen: number): void {
  const state = combat.getState();
  if (!state) return;
  for (const entry of state.log.slice(beforeLen)) {
    notifyCombatDamage(entry);
  }
}

/** Tear down combat session timers and listener refs. Idempotent. */
export function disposeCombatSystem(): void {
  combat.dispose();
}

registerHmrDispose(disposeCombatSystem);

/** Subscribe to combat state changes. Returns unsubscribe function. */
export function subscribeToCombat(listener: (state: CombatState) => void): () => void {
  return combat.subscribe(listener);
}

/** Get current combat state (read-only snapshot) */
export function getCombatState(): CombatState | null {
  return combat.getState();
}

/* ═══════════════════════════════════════════════════════════════
   §5 — START COMBAT
   ═══════════════════════════════════════════════════════════════ */

export interface CombatStartOptions {
  /** Street creep / story label shown in toasts when templates differ from context. */
  encounterName?: string;
}

export function startCombat(enemyType: EnemyType, options?: CombatStartOptions): CombatState {
  // Abandoned active combat pushed a return node that will never be popped on victory/defeat/flee
  if (combat.getState()?.status === 'active') {
    combat.discardOrphanedReturnNode();
  }

  // Invalidate pending async work from any prior combat session
  combat.beginSession();

  // G13: Resolve enemy type based on current act/level
  const resolvedType = resolveEnemyType(enemyType);

  const template = ENEMY_TEMPLATES[resolvedType];
  const state = snap();

  const currentNodeId = state.currentNodeId;
  if (currentNodeId && state.showStoryOverlay) {
    combat.pushReturnNode(currentNodeId);
    // Hide story overlay during combat — prevents stacked story + combat UI (see screenshot).
    dispatchGameAction({ type: 'story/closeNarrativeOverlay' });
  }

  const playerLevel = state.playerState.progression.level;
  const scaleFactor = 1 + (playerLevel - 1) * 0.12; // +12% per level

  const enemy: CombatEnemy = {
    type: template.type,
    name: template.name,
    emoji: template.emoji,
    maxHp: Math.floor(template.baseHp * scaleFactor),
    hp: Math.floor(template.baseHp * scaleFactor),
    attack: Math.floor(template.baseAttack * scaleFactor),
    defense: Math.floor(template.baseDefense * scaleFactor),
    speed: Math.floor(template.baseSpeed * scaleFactor),
    targetsStat: template.targetsStat,
    lootTable: template.lootTable,
    xpReward: Math.floor(template.xpReward * scaleFactor),
    specialCooldown: 0,
  };

  const playerMaxHp = getPlayerMaxHp();

  combat.setState({
    enemy,
    playerHp: playerMaxHp,
    playerMaxHp,
    turn: 1,
    isPlayerTurn: true,
    playerDefending: false,
    enemyDefending: false,
    log: [
      { turn: 0, text: `${enemy.emoji} ${enemy.name} появляется!`, type: 'info' },
    ],
    status: 'active',
    powerCooldowns: {},
    enemyDefenseReduction: 0,
    doubleAttack: false,
    buffs: [],
    fleeAttempts: 0,
    _nextBuffId: 1,
    /* ── Enhanced Combat ── */
    comboCount: 0,
    maxCombo: 0,
    lastCritical: false,
    lastPoemPowersUsed: [null, null],
  });

  dispatchGameAction({ type: 'story/setCombatActive', active: true });
  const encounterLabel = options?.encounterName ?? enemy.name;
  eventBus.emit('combat:start', {
    enemyType,
    encounterName: encounterLabel,
    encounterEmoji: enemy.emoji,
  });
  eventBus.emit('fx:flash', { color: 'rgba(255,40,60,0.32)', opacity: 0.32, duration: 420 });
  eventBus.emit('fx:glitch', { intensity: 0.48, duration: 520 });
  eventBus.emit('camera:combat_impact', { intensity: 0.5 });

  combat.notifyListeners();
  return combat.getState()!;
}

/* ═══════════════════════════════════════════════════════════════
   §6 — PLAYER ACTIONS
   ═══════════════════════════════════════════════════════════════ */

export function playerAttack(): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  // Apply attack_boost buff to player
  const pAtk = getPlayerAttack() + getPlayerAttackBoost(cs);
  const enemyDef = Math.max(0, cs.enemy.defense * (1 - getEnemyDefenseReduction(cs)));

  // Apply buff-based defense boost to enemy
  const enemyDefBoost = sumBuffEffect(cs, 'enemy', 'defense_boost');
  const effectiveEnemyDef = enemyDef + enemyDefBoost;

  const multiplier = getPlayerDamageMultiplier(cs);
  let damage = Math.max(1, Math.floor((pAtk * multiplier - effectiveEnemyDef) * (0.85 + Math.random() * 0.3)));

  /* ── Combo System: consecutive attacks increase damage ── */
  const newComboCount = cs.comboCount + 1;
  let comboMultiplier = 1.0;
  if (newComboCount >= 3) comboMultiplier = 2.0;
  else if (newComboCount >= 2) comboMultiplier = 1.5;
  else if (newComboCount >= 1) comboMultiplier = 1.2;
  damage = Math.floor(damage * comboMultiplier);

  /* ── Critical Hit: 10% base + (writing skill * 2%) bonus, 1.8x damage ── */
  const critChance = 0.10 + snap().playerState.skills.writing * 0.02;
  const isCritical = Math.random() < Math.min(0.5, critChance);
  if (isCritical) {
    damage = Math.floor(damage * 1.8);
  }

  const newEnemyHp = Math.max(0, cs.enemy.hp - damage);

  const logEntry: CombatLogEntry = {
    turn: cs.turn,
    text: isCritical
      ? `⚔️💥 КРИТИЧЕСКИЙ УДАР! ${damage} урона!`
      : comboMultiplier > 1.0
        ? `⚔️🔥 Комбо x${newComboCount}! ${damage} урона!`
        : `⚔️ Атака! ${damage} урона!`,
    type: isCritical ? 'critical_hit' : comboMultiplier > 1.0 ? 'combo_hit' : 'player_attack',
    damage,
    isCritical,
    comboCount: newComboCount,
  };

  const newMaxCombo = Math.max(cs.maxCombo, newComboCount);

  combat.setState({
    ...cs,
    enemy: { ...cs.enemy, hp: newEnemyHp },
    doubleAttack: false,
    enemyDefenseReduction: getEnemyDefenseReduction(cs),
    log: appendLog(cs.log, logEntry),
    comboCount: newComboCount,
    maxCombo: newMaxCombo,
    lastCritical: isCritical,
  });

  eventBus.emit('combat:action', { action: 'attack', damage });
  eventBus.emit('camera:combat_impact', { intensity: isCritical ? 0.6 : 0.3 });
  notifyCombatDamage(logEntry);

  // Check victory
  if (newEnemyHp <= 0) {
    return handleVictory();
  }

  // Enemy turn
  return endPlayerTurn();
}

export function playerDefend(): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  // Add a short-duration damage reduction buff
  const buff = createBuff(cs, 'Защита', 'player_defend', 'buff', 'player', 1, { type: 'damage_reduction', value: 0.3 });
  const s = addBuff(cs, buff);

  combat.setState({
    ...s,
    playerDefending: true,
    comboCount: 0, // Defending resets combo
    log: appendLog(s.log, { turn: cs.turn, text: '🛡️ Защита! Входящий урон снижен на 1 ход.', type: 'player_defend' }),
  });

  eventBus.emit('combat:action', { action: 'defend' });
  return endPlayerTurn();
}

export function playerUsePoemPower(poemId: string): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  // Check if silenced (censor_drone's silence_specials)
  if (hasBuffEffect(cs, 'player', 'silence_specials')) return null;

  // Check if poem is collected and not on cooldown
  if (!isPowerAvailable(poemId, cs)) return null;

  const ability = POEM_COMBAT_ABILITIES[poemId];
  if (!ability) return null;

  // Set cooldown
  const newCooldowns = { ...cs.powerCooldowns, [poemId]: ability.cooldown };

  // Activate global cooldown in game store (for between-combat tracking)
  tryActivatePoemPower(poemId);

  // Track poem power usage for combo detection
  const lastPowers: [string | null, string | null] = [cs.lastPoemPowersUsed[1], poemId];

  // Apply ability
  const logLenBefore = cs.log.length;
  const abilityResult = ability.execute(cs);

  // Check for poem power combos
  let comboLog: CombatLogEntry[] = [];
  if (lastPowers[0] && lastPowers[1]) {
    const comboResult = checkPoemPowerCombo(lastPowers[0], lastPowers[1], abilityResult);
    if (comboResult) {
      comboLog = [comboResult.logEntry];
      const nextState = {
        ...consumeSideEffects(comboResult.state),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: cs.comboCount + 1,
      };
      combat.setState({
        ...nextState,
        log: appendLog(nextState.log, ...comboLog),
      });
    } else {
      combat.setState({
        ...consumeSideEffects(abilityResult),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: cs.comboCount + 1,
      });
    }
  } else {
    combat.setState({
      ...consumeSideEffects(abilityResult),
      powerCooldowns: newCooldowns,
      lastPoemPowersUsed: lastPowers,
      comboCount: cs.comboCount + 1,
    });
  }

  eventBus.emit('combat:action', { action: 'poem_power' });
  eventBus.emit('poem:power_used', { poemId, powerName: ability.name });
  notifyNewCombatLogEntries(logLenBefore);

  // Check if enemy died from the ability
  const afterUse = combat.getState();
  if (afterUse && afterUse.enemy.hp <= 0) {
    return handleVictory();
  }

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §7 — FLEE MECHANIC (cumulative + skill influence)
   ═══════════════════════════════════════════════════════════════ */

export function playerFlee(): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  const playerState = snap().playerState;
  const playerSpeed = playerState.skills.intuition + playerState.skills.logic;
  const enemySpeed = cs.enemy.speed;

  let fleeChance = 0.35 + (playerSpeed - enemySpeed) * 0.04;

  fleeChance += cs.fleeAttempts * 0.15;

  const unlockedSkills = playerState.progression.unlockedSkills;
  // Tier-4+ technical mastery sharpens the escape route; tier-2+ social grants composure under pressure.
  if (unlockedSkills.some((id) => id.startsWith('tech_t4') || id === 'tech_t5_ultimate'))
    fleeChance += 0.2;
  if (unlockedSkills.some((id) => id.startsWith('social_t2'))) fleeChance += 0.15;

  const karma = playerState.karma;
  if (karma >= 70) fleeChance += 0.05;

  // Clamp to [0.15, 0.95]
  const clampedChance = Math.max(0.15, Math.min(0.95, fleeChance));
  const fled = Math.random() < clampedChance;

  if (fled) {
    // Pop synchronously — delayed exit callbacks may be cancelled by a new session
    combat.popReturnNode();
    combat.clearPendingTimers();

    combat.setState({
      ...cs,
      status: 'fled',
      powerCooldowns: {},
      log: [
        ...cs.log,
        { turn: cs.turn, text: '🏃 Побег успешен! Вы вырвались из боя.', type: 'player_flee' },
      ],
    });

    const fledState = combat.getState()!;
    eventBus.emit('combat:fled', { enemyType: fledState.enemy.type });
    eventBus.emit('combat:action', { action: 'flee' });

    // Return to exploration after a brief delay
    combat.scheduleExit(1500, () => {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
      combat.endSession();
      combat.notifyListeners();
      eventBus.emit('combat:end', {});
    });

    combat.notifyListeners();
    return fledState;
  }

  // Failed flee — increment attempt counter
  combat.setState({
    ...cs,
    fleeAttempts: cs.fleeAttempts + 1,
    log: [
      ...cs.log,
      { turn: cs.turn, text: `🏃 Побег не удался! (Шанс: ${Math.round(clampedChance * 100)}%, след. попытка: +15%)`, type: 'info' },
    ],
  });

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §8 — ENEMY TURN (with special attacks & buff processing)
   ═══════════════════════════════════════════════════════════════ */

function endPlayerTurn(): CombatState {
  const cs = combat.getState();
  if (!cs || cs.status !== 'active') return cs!;

  // Tick player power cooldowns
  combat.setState({
    ...cs,
    isPlayerTurn: false,
    powerCooldowns: tickPowerCooldowns(cs.powerCooldowns),
  });

  const next = combat.getState()!;
  eventBus.emit('combat:turn', { turn: next.turn, isPlayerTurn: false });
  combat.notifyListeners();

  // Enemy acts after a brief delay for visual feedback
  combat.schedule(800, () => executeEnemyTurn());

  return next;
}

/** Transition to the player's turn.
 *  Processes player buffs at turn start (tick durations, stat drain, skip_turn check).
 *  If the player has a skip_turn debuff, auto-skips and transitions to enemy turn. */
function transitionToPlayerTurn(state: CombatState): void {
  if (!combat.getState()) return;

  // ── Tick player buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(state, 'player');

  // ── Process stat drain debuffs on player ──
  const drainLog: CombatLogEntry[] = [];
  let playerHpAfterDrain = afterBuffTick.playerHp;
  for (const buff of afterBuffTick.buffs) {
    if (buff.target === 'player' && buff.effect.type === 'stat_drain') {
      const eff = buff.effect as { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma'; value: number };
      if (eff.stat === 'energy') {
        dispatchGameAction({ type: 'player/addEnergy', amount: -eff.value });
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Энергия -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'karma') {
        dispatchGameAction({ type: 'player/addKarma', amount: -eff.value });
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Карма -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'logic') {
        dispatchGameAction({ type: 'player/addSkill', skill: 'logic', amount: -eff.value });
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Логика -${eff.value}`, type: 'info' });
      }
    }
    /* ── Enhanced: Process hp_drain_percent (Цифровая лихорадка) ── */
    if (buff.target === 'player' && buff.effect.type === 'hp_drain_percent') {
      const eff = buff.effect as { type: 'hp_drain_percent'; value: number };
      const drainDmg = Math.max(1, Math.floor(state.playerMaxHp * eff.value));
      playerHpAfterDrain = Math.max(1, playerHpAfterDrain - drainDmg);
      drainLog.push({ turn: afterBuffTick.turn, text: `🦠 ${buff.name}: -${drainDmg} HP`, type: 'status_effect', damage: drainDmg });
    }
  }

  let workingState: CombatState = {
    ...afterBuffTick,
    playerHp: playerHpAfterDrain,
    turn: afterBuffTick.turn + 1,
    // Reset backward-compat flags at the start of each player turn.
    // These are consumed during the enemy's turn and must not persist;
    // the buff system handles duration-based effects.
    enemyDefending: false,
    doubleAttack: false,
    playerDefending: false,
    // Safety: clear any stale side effects that survived from a previous turn.
    // consumeSideEffects() is the primary clearing mechanism, but this
    // prevents re-application if a consumer reads the state between turns.
    _sideEffects: [],
    log: [...afterBuffTick.log, ...expiredLog, ...drainLog],
  };

  // ── Check if player is stunned (skip_turn debuff) ──
  if (hasBuffEffect(workingState, 'player', 'skip_turn')) {
    // Remove the skip_turn buff since it's been consumed
    const remaining = workingState.buffs.filter(
      (b) => !(b.target === 'player' && b.effect.type === 'skip_turn'),
    );
    workingState = {
      ...workingState,
      buffs: remaining,
      log: [
        ...workingState.log,
        { turn: workingState.turn, text: '😵 Вы оглушены и пропускаете ход!', type: 'info' },
      ],
    };

    // Set state and auto-skip after a brief delay for visual feedback
    combat.setState({
      ...workingState,
      isPlayerTurn: true, // Briefly show it's "your turn" before skipping
    });

    const stunnedTurn = combat.getState()!;
    eventBus.emit('combat:turn', { turn: stunnedTurn.turn, isPlayerTurn: true });
    combat.notifyListeners();

    // Auto-skip after a brief delay
    combat.schedule(800, () => {
      if (combat.getState()?.status === 'active') {
        endPlayerTurn();
      }
    });

    return;
  }

  // Normal: enable player turn
  combat.setState({
    ...workingState,
    isPlayerTurn: true,
  });

  const playerTurn = combat.getState()!;
  eventBus.emit('combat:turn', { turn: playerTurn.turn, isPlayerTurn: true });
  combat.notifyListeners();
}

function executeEnemyTurn() {
  const cs = combat.getState();
  if (!cs || cs.status !== 'active') return;

  // ── Tick enemy buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(cs, 'enemy');

  // ── Check if enemy is stunned (skip_turn debuff on enemy) ──
  if (hasBuffEffect(afterBuffTick, 'enemy', 'skip_turn') || afterBuffTick.enemyDefending) {
    // Remove the skip_turn buff since it's been consumed
    const remaining = afterBuffTick.buffs.filter(
      (b) => !(b.target === 'enemy' && b.effect.type === 'skip_turn'),
    );
    combat.setState({
      ...afterBuffTick,
      enemyDefending: false,
      buffs: remaining,
      log: [
        ...afterBuffTick.log,
        ...expiredLog,
        { turn: afterBuffTick.turn, text: `${afterBuffTick.enemy.emoji} ${afterBuffTick.enemy.name} дезориентирован и пропускает ход!`, type: 'info' },
      ],
    });

    // Transition to player turn (handles buff processing and skip_turn check)
    transitionToPlayerTurn(combat.getState()!);
    return;
  }

  // Player buffs and stat drain are now processed at the start of the player's turn (see transitionToPlayerTurn)

  let workingState: CombatState = {
    ...afterBuffTick,
    log: [...afterBuffTick.log, ...expiredLog],
  };

  const template = ENEMY_TEMPLATES[workingState.enemy.type];
  const enemySpecialCooldown = workingState.enemy.specialCooldown;

  if (enemySpecialCooldown <= 0 && template.specialAttacks.length > 0) {
    for (const special of template.specialAttacks) {
      if (Math.random() < special.chance) {
        const logLenBefore = workingState.log.length;
        const specialResult = special.execute(workingState, workingState.enemy);
        workingState = consumeSideEffects(specialResult);
        workingState = {
          ...workingState,
          enemy: { ...workingState.enemy, specialCooldown: special.cooldown },
        };
        notifyNewCombatLogEntries(logLenBefore);
        gotoEnemyTurnEnd(workingState);
        return;
      }
    }
  }

  const enemyAtkBoost = getEnemyAttackBoost(workingState);
  const effectiveEnemyAttack = workingState.enemy.attack + enemyAtkBoost;
  const enemyDmgMultiplier = getEnemyDamageMultiplier(workingState);

  let enemyDamage = Math.max(1, Math.floor(effectiveEnemyAttack * enemyDmgMultiplier * (0.85 + Math.random() * 0.3)));

  if (workingState.playerDefending) {
    const playerDef = getPlayerDefense();
    enemyDamage = Math.max(1, Math.floor(enemyDamage * 0.5 - playerDef * 0.3));
  }

  const playerDefBoost = getPlayerDefenseBoost(workingState);
  if (playerDefBoost > 0) {
    enemyDamage = Math.max(1, enemyDamage - playerDefBoost);
  }

  const playerDmgReduction = getPlayerDamageReduction(workingState);
  if (playerDmgReduction > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - playerDmgReduction)));
  }

  const playerVulnerability = getPlayerVulnerability(workingState);
  if (playerVulnerability > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 + playerVulnerability)));
  }

  const spiritualLevel = snap().playerState.progression.unlockedSkills.filter(
    (id) => id.startsWith('spirit_'),
  ).length;
  if (spiritualLevel > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - spiritualLevel * 0.05)));
  }

  const newPlayerHp = Math.max(0, workingState.playerHp - enemyDamage);

  // Enemy also targets a specific stat (basic attack debuff)
  const targetedStat = workingState.enemy.targetsStat;
  let statEffectText = '';
  if (targetedStat === 'logic') {
    if (Math.random() < 0.3) {
      dispatchGameAction({ type: 'player/addSkill', skill: 'logic', amount: -1 });
      statEffectText = ' Логика -1!';
    }
  } else if (targetedStat === 'energy') {
    if (Math.random() < 0.4) {
      dispatchGameAction({ type: 'player/addEnergy', amount: -5 });
      statEffectText = ' Энергия -5!';
    }
  } else if (targetedStat === 'karma') {
    if (Math.random() < 0.3) {
      dispatchGameAction({ type: 'player/addKarma', amount: -3 });
      statEffectText = ' Карма -3!';
    }
  }

  const enemyAttackLog: CombatLogEntry = {
    turn: workingState.turn,
    text: `${workingState.enemy.emoji} ${workingState.enemy.name} атакует! -${enemyDamage} HP${statEffectText}`,
    type: 'enemy_attack',
    damage: enemyDamage,
  };

  combat.setState({
    ...workingState,
    playerHp: newPlayerHp,
    playerDefending: false,
    comboCount: 0, // Taking damage resets combo
    enemy: {
      ...workingState.enemy,
      specialCooldown: Math.max(0, workingState.enemy.specialCooldown - 1),
    },
    log: [...workingState.log, enemyAttackLog],
  });

  eventBus.emit('camera:combat_shake', { intensity: 0.2 });
  notifyCombatDamage(enemyAttackLog);

  // Check defeat
  if (newPlayerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(combat.getState()!);
}

/** Helper to finalize enemy turn after a special attack */
function gotoEnemyTurnEnd(state: CombatState) {
  // Stat drain is now processed at the start of the player's turn (see transitionToPlayerTurn)

  combat.setState({
    ...state,
    playerDefending: false,
    enemy: {
      ...state.enemy,
      specialCooldown: Math.max(0, state.enemy.specialCooldown - 1),
    },
  });

  // Check defeat (some specials deal damage directly)
  const afterSpecial = combat.getState()!;
  if (afterSpecial.playerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(afterSpecial);
}

/* ═══════════════════════════════════════════════════════════════
   §9 — VICTORY / DEFEAT
   ═══════════════════════════════════════════════════════════════ */

function handleVictory(): CombatState {
  const cs = combat.getState();
  if (!cs) return cs!;

  // Pop synchronously — delayed exit callbacks may be cancelled by a new session
  const returnNodeId = combat.popReturnNode();
  combat.clearPendingTimers();

  const enemy = cs.enemy;

  const comboBonus = Math.min(cs.maxCombo * 2, 10);
  const karmaGained = 3 + Math.floor(Math.random() * 5) + comboBonus;
  dispatchGameAction({ type: 'player/addKarma', amount: karmaGained });

  // XP reward
  const xpGained = enemy.xpReward + comboBonus;
  addXp(xpGained);

  const creditsGained = computeCombatCredits(xpGained, comboBonus);
  dispatchGameAction({ type: 'player/addCredits', amount: creditsGained });

  // Loot roll (higher combo = better loot chance)
  const lootChance = 0.6 + cs.maxCombo * 0.05;
  const lootItems: string[] = [];
  if (enemy.lootTable.length > 0 && Math.random() < Math.min(0.9, lootChance)) {
    const lootItemId = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
    const item = createInventoryItem(lootItemId);
    if (tryAddInventoryItem(item)) {
      lootItems.push(lootItemId);
    }
  }

  // Skill experience
  const skillXp: Partial<Record<import('@/shared/types/game').TrainablePlayerSkill, number>> = {};
  skillXp.coding = Math.floor(xpGained * 0.3);
  skillXp.logic = Math.floor(xpGained * 0.2);
  skillXp.writing = Math.floor(xpGained * 0.1);

  const rewards: import('@/shared/types/game').CombatReward = {
    xp: xpGained,
    karma: karmaGained,
    credits: creditsGained,
    lootItems,
    skillXp,
  };

  combat.setState({
    ...cs,
    status: 'victory',
    powerCooldowns: {},
    rewards,
    log: [
      ...cs.log,
      {
        turn: cs.turn,
        text: `🏆 Победа! +${karmaGained} кармы, +${xpGained} опыта, +${creditsGained} кредитов${lootItems.length > 0 ? `, найден предмет!` : ''}${cs.maxCombo >= 3 ? ` Макс. комбо: x${cs.maxCombo}!` : ''}`,
        type: 'victory',
      },
    ],
  });

  eventBus.emit('combat:victory', {
    enemyType: enemy.type,
    xpGained,
    karmaGained,
    creditsGained,
    lootItemId: lootItems[0],
  });

  combat.notifyListeners();

  // Return to story node or exploration after delay (G12)
  combat.scheduleExit(3000, () => {
    if (returnNodeId) {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
      dispatchGameAction({ type: 'story/openNarrativeOverlay', nodeId: returnNodeId, kind: 'story' });
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
    }
    combat.endSession();
    combat.notifyListeners();
    eventBus.emit('combat:end', {});
  });

  return combat.getState()!;
}

function handleDefeat(): void {
  const cs = combat.getState();
  if (!cs) return;

  const returnNodeId = combat.popReturnNode();
  combat.clearPendingTimers();

  const enemy = cs.enemy;

  const energyLost = 15 + Math.floor(Math.random() * 10);
  const karmaLost = 5 + Math.floor(Math.random() * 5);
  dispatchGameAction({ type: 'player/addEnergy', amount: -energyLost });
  dispatchGameAction({ type: 'player/addKarma', amount: -karmaLost });

  combat.setState({
    ...cs,
    status: 'defeat',
    powerCooldowns: {},
    log: [
      ...cs.log,
      {
        turn: cs.turn,
        text: `💀 Поражение... -${energyLost} энергии, -${karmaLost} кармы. Вы отступаете.`,
        type: 'defeat',
      },
    ],
  });

  eventBus.emit('combat:defeat', {
    enemyType: enemy.type,
    energyLost,
    karmaLost,
  });

  combat.notifyListeners();

  // Return to story node or exploration after defeat (G12)
  combat.scheduleExit(3000, () => {
    if (returnNodeId) {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
      dispatchGameAction({ type: 'story/openNarrativeOverlay', nodeId: returnNodeId, kind: 'story' });
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
    }
    combat.endSession();
    combat.notifyListeners();
    eventBus.emit('combat:end', {});
  });
}

/* ═══════════════════════════════════════════════════════════════
   §11 — GET AVAILABLE POEM POWERS (cooldown-based)
   ═══════════════════════════════════════════════════════════════ */

export function getAvailableCombatPowers(): Array<{ poemId: string; name: string; description: string; cooldownRemaining: number }> {
  const combatState = combat.getState();
  if (!combatState) return [];

  return snap().collectedPoems
    .map((poemId) => {
      const ability = POEM_COMBAT_ABILITIES[poemId];
      if (!ability) return null;
      const cd = combatState.powerCooldowns[poemId] ?? 0;
      return { poemId, name: ability.name, description: ability.description, cooldownRemaining: cd };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/* ═══════════════════════════════════════════════════════════════
   §12 — GET ACTIVE BUFFS (for UI display)
   ═══════════════════════════════════════════════════════════════ */

export function getActiveBuffs(target?: 'player' | 'enemy'): CombatBuff[] {
  const cs = combat.getState();
  if (!cs) return [];
  if (target) return cs.buffs.filter((b) => b.target === target);
  return cs.buffs;
}

/* ═══════════════════════════════════════════════════════════════
   §13 — SKILL TREE (re-exported from actions module)
   ═══════════════════════════════════════════════════════════════ */

/** Check if a skill tree node can be unlocked */
export { _canUnlockSkill as canUnlockSkill };

/** Unlock a skill tree node */
export { _unlockSkill as unlockSkill };
