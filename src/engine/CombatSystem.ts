/* ─── FIX-1D (Phase 11.1 — TS error cleanup) ─────────────────────
 *  Date: 2026-07-24
 *  Changes:
 *    - Updated the `stat_drain` cast in `transitionToPlayerTurn` to include
 *      `'empathy'` (mirrors the `BuffEffect` union extension in
 *      `shared/types/definitions/combat.ts`).
 *    - Added a new `'empathy'` branch in the per-turn stat-drain handler
 *      that drains `playerState.skills.empathy` via `player/addSkill` —
 *      matching the existing `'logic'` branch.
 *  Effect: Phase 11 enemies (`grief_echo`, `memory_devourer`) which apply
 *  `stat_drain: empathy` debuffs now correctly tick down the player's
 *  empathy stat each turn instead of silently no-oping.
 * ─────────────────────────────────────────────────────────────────── */

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

import {
  clearDeferredCombatStart,
  deferCombatStartIfTransitionBusy,
  registerCombatStartExecutor } from '@/engine/core/combatStartGate';
import {
  cancelEncounterPresentation,
  registerEncounterCommitHandler,
  startEncounter } from '@/engine/combat/encounterPresentation';
import type { EncounterSource } from '@/engine/combat/encounterTypes';
import { eventBus } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower,
  tryAddInventoryItem } from '@/engine/GameActionDispatcher';
import { createInventoryItem } from '@/data/items';

function snap() {
  return getGameSnapshot();
}

// ── Sub-module imports ──
import type { CombatState, CombatLogEntry, CombatBuff, EnemyType, CombatEnemy, EnemyTemplate } from './combat/types';
import { appendLog, isBossEnemyType } from './combat/types';
import {
  createBuff, addBuff, sumBuffEffect, hasBuffEffect, tickBuffs,
  getEnemyDefenseReduction, getPlayerDamageMultiplier,
  getPlayerAttackBoost } from './combat/buffSystem';
import { getPlayerAttack, getPlayerMaxHp, isPowerAvailable, addXp, getPlayerCritChance, getPlayerThoughtFleeBonus, getPlayerThoughtComboMultiplierBonus, applyCritMultiplier, getComboDamageMultiplier } from './combat/formulas';
import { initCombatRngForEncounter, SeededCombatRng, type CombatRngState } from './combat/combatRng';
import { getFleeChanceBonus, computeEnemyScalingFactor } from './combat/combatDifficulty';
import { getPassiveSkillModifiers } from '@/engine/skills/passiveSkillModifiers';
import { resolveCombatPerkModifiers } from '@/shared/perks/perkModifiers';
import { applyExplorationPoemCombatBridge } from '@/engine/poemEffects/poemTTLRuntime';
import { ENEMY_TEMPLATES, resolveEnemyType } from './combat/enemies';
import { devWarn } from '@/shared/utils/devLog';
import {
  POEM_COMBAT_ABILITIES,
  consumeSideEffects,
  checkPoemPowerCombo,
} from './combat/actions';
import {
  resolveActionChannel,
  applyAffinityToDamage,
} from './combat/combatAffinities';
import {
  computeEnemyIncomingDamage,
  resolveStatDrain,
} from './combat/enemyTurn';
import {
  checkBossPhaseTransition,
  getBossPhaseSpeedMultiplier,
  type BossPhaseDefinition,
} from './combat/bossPhases';
import {
  endPlayerTurn as computeEndPlayerTurn,
  transitionToPlayerTurn as computeTransitionToPlayerTurn,
  gotoEnemyTurnEnd as computeGotoEnemyTurnEnd,
  type PlayerStatDrainSnapshot,
} from './combat/turnCycle';
import {
  computeVictoryRewards,
  computeDefeatPenalty,
  buildCombatReward,
  buildVictoryLogEntries,
  buildDefeatLogEntry,
} from './combat/rewards';

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
  CombatReward } from './combat/types';

export { applyCombatSideEffects } from './combat/actions';
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
  private _disposed = false;

  getState(): CombatState | null {
    if (this._disposed) return null;
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
    this._disposed = false;
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
    const capturedGeneration = this.generation;
    this.exitTimer = setTimeout(() => {
      this.exitTimer = null;
      if (capturedGeneration !== this.generation) return;
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
    this._disposed = true;
    this.endSession();
    this.listeners.clear();
    this.returnStack.length = 0;
  }

  /** Re-arm after orchestrator remount (React StrictMode). */
  undispose(): void {
    this._disposed = false;
  }

  pushReturnNode(nodeId: string): void {
    if (this.returnStack.length >= MAX_RETURN_STACK_DEPTH) {
      const dropped = this.returnStack.shift();
      devWarn(
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
      devWarn(`[CombatSystem] Discarded orphaned return node "${orphaned}" from interrupted combat`);
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
/** Exposed for read-only consumers (e.g. ScreenEffects low-HP vignette). */
export { combat };

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
    // Combat is strictly 1v1 turn-based: CombatEnemy carries no spatial data
    // (no position/orientation — see shared/types/definitions/combat.ts), so
    // there is no relative direction to derive. 'front' is the only truthful
    // value; DirectionalDamageIndicator renders its full-screen variant.
    direction: isPlayerHit ? 'front' : undefined,
    source: entry.type,
    isCritical });
  eventBus.emit('combat:damage', {
    amount: entry.damage,
    source: entry.type,
    critical: isCritical });

  // AAA combat feedback: critical hits trigger a white screen flash + brief
  // hit-stop; boss special attacks trigger chromatic aberration + heavy shake.
  if (isCritical) {
    eventBus.emit('fx:flash', { color: '#ffffff', opacity: 0.35, duration: 120 });
    eventBus.emit('combat:bullet_time', { duration: 0.18, intensity: 0.5, reason: 'critical_hit' });
  }
  if (entry.type === 'enemy_special') {
    eventBus.emit('fx:chromatic', { intensity: 4, duration: 350 });
    eventBus.emit('fx:shake', { intensity: 6, duration: 300 });
    eventBus.emit('fx:damage_vignette', { intensity: 0.5, duration: 400 });
  }
}

function notifyNewCombatLogEntries(beforeLen: number): void {
  const state = combat.getState();
  if (!state) return;
  for (const entry of state.log.slice(beforeLen)) {
    notifyCombatDamage(entry);
  }
}

/* ═══════════════════════════════════════════════════════════════
   §5.5 — BOSS PHASE TRANSITIONS (combat/bossPhases.ts integration)

   Multi-phase bosses escalate when HP crosses a threshold (100/60/30).
   On each forward transition the orchestrator applies:
     - damageMultiplier — via the damage pipelines (enemyTurn.ts), which
       read the CURRENT phase from enemy HP on every hit;
     - speedMultiplier — mirrored onto enemy.speed (flee calc / UI) and
       into the enemy-action delay (strict 1v1 alternation has no turn
       order to race, so pacing is the honest expression of "speed");
     - i-frames — a 1-hit absorption buff on the enemy (damage_reduction 1.0);
     - canSummonAdds — combat is strictly 1v1, so "adds" become shadow
       reinforcements: an enemy attack_boost + player energy drain
       (mirrors the catacombs_summon_shades special);
     - UI/audio events — flash color + 'combat:boss_phase' + combat log.
   ═══════════════════════════════════════════════════════════════ */

/** Whether the enemy currently has full i-frames (phase-transition buff
 *  with damage_reduction ≥ 1.0) — the player's next hit is absorbed. */
function hasEnemyIframes(state: CombatState): boolean {
  return sumBuffEffect(state, 'enemy', 'damage_reduction') >= 1;
}

/** Apply a boss phase transition (if any) to the current state.
 *  Returns the same state object when no forward transition occurred. */
function applyBossPhaseTransition(state: CombatState): CombatState {
  const previousPhase = state.bossPhase ?? 0;
  const transition: BossPhaseDefinition | null = checkBossPhaseTransition(state.enemy, previousPhase);
  // Forward transitions only — bosses never heal, but a hypothetical heal
  // must not re-grant i-frames / re-log the phase.
  if (!transition || transition.phase <= previousPhase) return state;

  let next: CombatState = {
    ...state,
    bossPhase: transition.phase,
  };

  // Speed multiplier — re-derived from the pre-phase base so multipliers
  // never compound across transitions.
  const baseSpeed = state.bossBaseSpeed ?? state.enemy.speed;
  next = {
    ...next,
    bossBaseSpeed: baseSpeed,
    enemy: {
      ...next.enemy,
      speed: Math.max(1, Math.floor(baseSpeed * transition.speedMultiplier)),
    },
  };

  // I-frames: duration is invulnerabilityTurns + 1 because enemy buffs tick
  // at the START of the enemy's turn — +1 keeps the buff alive through the
  // enemy's next turn so it absorbs exactly ONE player hit.
  if (transition.invulnerabilityOnEnter && transition.invulnerabilityTurns > 0) {
    const iframeBuff = createBuff(
      next,
      'Фазовый переход',
      `boss_phase_iframe_${transition.phase}`,
      'buff',
      'enemy',
      transition.invulnerabilityTurns + 1,
      { type: 'damage_reduction', value: 1 },
    );
    next = addBuff(next, iframeBuff);
  }

  // Adds (phase 2+ with canSummonAdds): strictly-1v1 substitute — shadow
  // reinforcements buff the boss's attack and drain the player's energy.
  if (transition.canSummonAdds) {
    const shadesBuff = createBuff(
      next,
      'Тени',
      `boss_phase_shades_${transition.phase}`,
      'buff',
      'enemy',
      2,
      { type: 'attack_boost', value: 6 },
    );
    next = addBuff(next, shadesBuff);
    dispatchGameAction({ type: 'player/addEnergy', amount: -10 });
  }

  const phaseLog: CombatLogEntry = {
    turn: state.turn,
    text: `💥 ${state.enemy.emoji} ${state.enemy.name} — ${transition.description}! Урон ×${transition.damageMultiplier}!`,
    type: 'info',
  };
  next = {
    ...next,
    log: appendLog(next.log, phaseLog),
  };

  // UI flash in the phase color + typed event for audio/announcer layers.
  eventBus.emit('combat:boss_phase', {
    enemyType: state.enemy.type,
    phase: transition.phase,
    description: transition.description,
    flashColor: transition.flashColor,
    damageMultiplier: transition.damageMultiplier,
  });
  eventBus.emit('fx:flash', { color: transition.flashColor, opacity: 0.4, duration: 350 });

  return next;
}

/** Commit a boss phase transition (if any) after enemy HP changed. */
function commitBossPhaseTransition(): void {
  const cs = combat.getState();
  if (!cs || cs.enemy.hp <= 0) return;
  const next = applyBossPhaseTransition(cs);
  if (next !== cs) {
    combat.setState(next);
    combat.notifyListeners();
  }
}

/** Tear down combat session timers and listener refs. Idempotent. */
export function disposeCombatSystem(): void {
  unsubscribeGamepadListeners();
  cancelEncounterPresentation();
  clearDeferredCombatStart();
  combat.dispose();
}

/** Re-arm after orchestrator remount (React StrictMode). */
export function reviveCombatSystem(): void {
  combat.undispose();
  bindCombatGamepadListeners();
}

registerCombatStartExecutor((enemyType, options) => {
  startEncounter({
    source: options?.encounterSource ?? 'story',
    enemyType,
    encounterName: options?.encounterName,
    creepId: options?.creepId });
});

registerEncounterCommitHandler((ctx) => {
  startCombatImmediate(ctx.enemyType, { encounterName: ctx.encounterName });
});

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
  encounterSource?: EncounterSource;
  creepId?: string;
  /** Test harness — skip the shared encounter presentation beat. */
  skipPresentation?: boolean;
  /** v4.7.8 «Волна из двух врагов»: очередь типов, вступающих после падения
   *  первого. Наполняется вызывающей стороной (encounter roll) либо самим
   *  бойцом при story-encounters на акте 3+. */
  pendingEnemies?: EnemyType[];
}

export function startCombat(
  enemyType: EnemyType,
  options?: CombatStartOptions,
): CombatState | null {
  if (options?.skipPresentation) {
    if (deferCombatStartIfTransitionBusy(enemyType, options)) {
      return null;
    }
    return startCombatImmediate(enemyType, options);
  }

  startEncounter({
    source: options?.encounterSource ?? 'story',
    enemyType,
    encounterName: options?.encounterName,
    creepId: options?.creepId });
  return getCombatState()?.status === 'active' ? getCombatState() : null;
}

function startCombatImmediate(
  enemyType: EnemyType,
  options?: CombatStartOptions,
): CombatState {
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
  const currentAct = state.playerState.progression.currentAct;
  const scaleFactor = computeEnemyScalingFactor(currentAct, playerLevel);
  const difficultySettings = snap().difficultySettings;
  const hpScale = scaleFactor * difficultySettings.enemyHealthMultiplier;

  const enemy: CombatEnemy = {
    type: template.type,
    name: template.name,
    emoji: template.emoji,
    maxHp: Math.floor(template.baseHp * hpScale),
    hp: Math.floor(template.baseHp * hpScale),
    attack: Math.floor(template.baseAttack * scaleFactor),
    defense: Math.floor(template.baseDefense * scaleFactor),
    speed: Math.floor(template.baseSpeed * scaleFactor),
    targetsStat: template.targetsStat,
    lootTable: template.lootTable,
    xpReward: Math.floor(template.xpReward * scaleFactor * difficultySettings.xpMultiplier),
    specialCooldown: 0,
    chargingSpecial: null };

  const playerMaxHp = getPlayerMaxHp();
  const playerState = state.playerState;
  const combatRng = initCombatRngForEncounter(playerState, resolvedType);
  dispatchGameAction({ type: 'player/bumpCombatEncounterSeq' });

  const openingCombatState = applyExplorationPoemCombatBridge(
    {
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
      comboCount: 0,
      maxCombo: 0,
      lastCritical: false,
      lastPoemPowersUsed: [null, null],
      lastUsedPoemId: null,
      rng: combatRng,
      // Boss phase tracking (bossPhases.ts) — phase 0 until HP crosses 60%.
      bossPhase: 0,
      bossBaseSpeed: enemy.speed,
      // v4.7.8: волна второго врага (если назначена снаружи).
      pendingEnemies: options?.pendingEnemies ?? [],
    },
    state.activeTTLFlags,
  );

  combat.setState(openingCombatState);

  dispatchGameAction({ type: 'story/setCombatActive', active: true });
  const encounterLabel = options?.encounterName ?? enemy.name;
  eventBus.emit('combat:start', {
    enemyType,
    encounterName: encounterLabel,
    encounterEmoji: enemy.emoji });

  combat.notifyListeners();
  return combat.getState()!;
}

/* ═══════════════════════════════════════════════════════════════
   §6 — PLAYER ACTIONS
   ═══════════════════════════════════════════════════════════════ */

export function playerAttack(): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  // ── Boss phase-transition i-frames: a 'Фазовый переход' buff
  // (damage_reduction ≥ 1.0) absorbs the player's hit entirely — the boss
  // "skips" one attack while it transitions between phases.
  if (hasEnemyIframes(cs)) {
    const absorbedLog: CombatLogEntry = {
      turn: cs.turn,
      text: `🛡 ${cs.enemy.emoji} ${cs.enemy.name} неуязвим — ваш удар поглощён фазовым переходом!`,
      type: 'info',
    };
    combat.setState({
      ...cs,
      comboCount: 0,
      log: appendLog(cs.log, absorbedLog),
    });
    eventBus.emit('combat:action', { action: 'attack', damage: 0 });
    eventBus.emit('camera:combat_impact', { intensity: 0.12 });
    return endPlayerTurn();
  }

  // Apply attack_boost buff to player
  const pAtk = getPlayerAttack() + getPlayerAttackBoost(cs);
  const enemyDef = Math.max(0, cs.enemy.defense * (1 - getEnemyDefenseReduction(cs)));

  // Apply buff-based defense boost to enemy
  const enemyDefBoost = sumBuffEffect(cs, 'enemy', 'defense_boost');
  const effectiveEnemyDef = enemyDef + enemyDefBoost;

  const multiplier = getPlayerDamageMultiplier(cs);
  const difficultySettings = snap().difficultySettings;
  const seeded = SeededCombatRng.fromState(cs.rng);
  let damage = seeded.rollDamage({
    attack: pAtk,
    defense: effectiveEnemyDef,
    multiplier,
    varianceProfile: 'player',
  });

  // Apply difficulty player damage multiplier
  damage = Math.max(1, Math.floor(damage * difficultySettings.playerDamageMultiplier));

  /* ── Combo System: consecutive attacks increase damage ── */
  const newComboCount = cs.comboCount + 1;
  const comboMultiplier = getComboDamageMultiplier(newComboCount);
  // Thought-cabinet combo multiplier bonus (persuasion/rhythm thoughts)
  const thoughtComboBonus = getPlayerThoughtComboMultiplierBonus();
  damage = Math.floor(damage * (comboMultiplier + thoughtComboBonus));

  /* ── Perk outgoing damage multiplier (combat_veteran, stress_mastery,
     night_owl, code_poet) — conditional on stress/time/combo. ── */
  const playerSnap = snap();
  const perkMods = resolveCombatPerkModifiers(playerSnap.playerState.progression?.unlockedPerks ?? [], {
    stress: playerSnap.playerState.stress,
    timeOfDay: playerSnap.exploration?.timeOfDay,
    comboCount: newComboCount,
  });
  if (perkMods.outgoingDamageMultiplier !== 1) {
    damage = Math.max(1, Math.floor(damage * perkMods.outgoingDamageMultiplier));
  }

  /* ── Critical Hit: 10% base + (writing skill * 2%) bonus + thought bonuses, 1.8x damage ── */
  const isCritical = seeded.rollCritical(getPlayerCritChance());
  if (isCritical) {
    damage = applyCritMultiplier(damage);
  }

  /* ── Phase 11: Affinity System — elemental weakness/resistance ──
   *  Standard attacks use 'physical' channel. Apply the affinity multiplier
   *  from the enemy's type matchup table. Super-effective = 2×, resisted = 0.7×,
   *  immune = 0 damage. Adds strategic depth like Persona/Disco Elysium. */
  const attackChannel = resolveActionChannel('attack');
  const affinityResult = applyAffinityToDamage(damage, cs.enemy.type, attackChannel);
  damage = affinityResult.damage;

  // Affinity label for log entry — "Суперэффективно!" / "Сильное сопротивление" / "Иммунитет"
  const affinityLabel = affinityResult.label;

  const newEnemyHp = Math.max(0, cs.enemy.hp - damage);

  const logEntry: CombatLogEntry = {
    turn: cs.turn,
    text: isCritical
      ? `⚔️💥 КРИТИЧЕСКИЙ УДАР! ${damage} урона!${affinityLabel ? ' ' + affinityLabel : ''}`
      : comboMultiplier > 1.0
        ? `⚔️🔥 Комбо x${newComboCount}! ${damage} урона!${affinityLabel ? ' ' + affinityLabel : ''}`
        : affinityLabel
          ? `⚔️ ${damage} урона! ${affinityLabel}`
          : `⚔️ Атака! ${damage} урона!`,
    type: affinityResult.multiplier >= 2.0
      ? 'affinity_super'
      : affinityResult.multiplier <= 0.0
        ? 'affinity_immune'
        : affinityResult.multiplier < 1.0
          ? 'affinity_weak'
          : isCritical ? 'critical_hit' : comboMultiplier > 1.0 ? 'combo_hit' : 'player_attack',
    damage,
    isCritical,
    comboCount: newComboCount,
    affinityMultiplier: affinityResult.multiplier,
    damageChannel: attackChannel };

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
    rng: seeded.getState() });

  eventBus.emit('combat:action', {
    action: 'attack',
    damage,
    damageChannel: attackChannel,
    isCritical,
    comboCount: newComboCount,
  });
  // Differentiated impact: crit hits harder than a normal swing
  eventBus.emit('camera:combat_impact', {
    intensity: isCritical ? 0.8 : affinityResult.multiplier >= 2.0 ? 0.55 : 0.3,
  });

  /* ── Hit-pause / bullet time ──
   * Crit + super-effective (existing), combo ≥ 3 (light slow-mo). */
  if (isCritical || affinityResult.multiplier >= 2.0) {
    eventBus.emit('combat:bullet_time', {
      duration: 0.3,
      intensity: isCritical && affinityResult.multiplier >= 2.0 ? 0.15 : 0.25,
      reason: isCritical ? 'critical_hit' : 'affinity_super',
    });
  } else if (newComboCount >= 3) {
    eventBus.emit('combat:bullet_time', {
      duration: 0.15,
      intensity: 0.5,
      reason: 'combo_hit',
    });
  }

  notifyCombatDamage(logEntry);

  // Check victory
  if (newEnemyHp <= 0) {
    return handleVictory();
  }

  // Boss phase transition (100/60/30 thresholds) — multipliers, i-frames,
  // adds, flash + log. No-op for regular enemies.
  commitBossPhaseTransition();

  // Enemy turn
  return endPlayerTurn();
}

export function playerDefend(): CombatState | null {
  const cs = combat.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  // Add a short-duration damage reduction buff
  const buff = createBuff(cs, 'Защита', 'player_defend', 'buff', 'player', 1, { type: 'damage_reduction', value: 0.3 });
  const s = addBuff(cs, buff);

  // Telegraph counter-window hint: defending against a CHARGED special
  // applies an extra ×0.4 multiplier (see computeSpecialIncomingDamage).
  const chargingName = cs.enemy.chargingSpecial?.name;
  const defendText = chargingName
    ? `🛡️ Защита! «${chargingName}» будет значительно ослаблена!`
    : '🛡️ Защита! Входящий урон снижен на 1 ход.';

  combat.setState({
    ...s,
    playerDefending: true,
    comboCount: 0, // Defending resets combo
    log: appendLog(s.log, { turn: cs.turn, text: defendText, type: 'player_defend' }) });

  eventBus.emit('combat:action', { action: 'defend' });
  return endPlayerTurn();
}

function amplifyPoemCombatResult(prev: CombatState, next: CombatState): CombatState {
  const { playerState } = snap();
  const mult = getPassiveSkillModifiers({
    unlockedSkills: playerState.progression.unlockedSkills,
    flags: playerState.flags,
    codingSkill: playerState.skills.coding,
  }).poemInCodeStrengthMultiplier;
  // Also apply damage_multiplier buff (poem_6 Слово Мощь) to poem damage
  const dmgMult = getPlayerDamageMultiplier(next);

  const result = { ...next, enemy: { ...next.enemy } };
  const playerHeal = next.playerHp - prev.playerHp;
  if (playerHeal > 0 && mult > 1) {
    const bonus = Math.round(playerHeal * (mult - 1));
    result.playerHp = Math.min(next.playerMaxHp, next.playerHp + bonus);
  }
  const enemyDamage = prev.enemy.hp - next.enemy.hp;
  if (enemyDamage > 0) {
    // Boss phase-transition i-frames absorb poem damage too — the ability's
    // own log line stays, followed by the absorption note below.
    if (hasEnemyIframes(prev)) {
      result.enemy.hp = prev.enemy.hp;
      result.log = [...result.log, {
        turn: prev.turn,
        text: `🛡 ${prev.enemy.emoji} ${prev.enemy.name} неуязвим — сила стиха рассеивается!`,
        type: 'info' as const,
      }];
      return result;
    }
    // Apply both passive skill multiplier and damage_multiplier buff
    const totalMult = mult * dmgMult;
    if (totalMult > 1) {
      const bonus = Math.round(enemyDamage * (totalMult - 1));
      result.enemy.hp = Math.max(0, result.enemy.hp - bonus);
    }
  }
  return result;
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
  const lastUsedPoemId = poemId !== 'poem_16' ? poemId : cs.lastUsedPoemId;

  // Apply ability
  const logLenBefore = cs.log.length;
  let abilityResult = amplifyPoemCombatResult(cs, ability.execute(cs));

  // ── Affinity for poem powers ──
  // Poem abilities compute damage inside execute() and bypass the affinity
  // system that playerAttack() uses. Post-process the result: if enemy HP
  // dropped, re-derive the damage through the poem's affinity channel so
  // resistances/immunities apply. This restores strategic depth (e.g. using
  // a 'code' poem vs a code-immune enemy deals reduced damage).
  const poemDealt = Math.max(0, cs.enemy.hp - abilityResult.enemy.hp);
  if (poemDealt > 0) {
    const poemChannel = resolveActionChannel('poem_power', poemId);
    const poemAffinity = applyAffinityToDamage(poemDealt, cs.enemy.type, poemChannel);
    if (poemAffinity.damage !== poemDealt) {
      const adjustedHp = Math.max(0, cs.enemy.hp - poemAffinity.damage);
      const affinityLogLine: CombatLogEntry | null = poemAffinity.label
        ? { turn: cs.turn, text: `✦ ${ability.name}: ${poemAffinity.label}`, type: 'player_power' as const }
        : null;
      abilityResult = {
        ...abilityResult,
        enemy: { ...abilityResult.enemy, hp: adjustedHp },
        log: affinityLogLine ? [...abilityResult.log, affinityLogLine] : abilityResult.log,
      };
    }
  }

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
        lastUsedPoemId,
        comboCount: cs.comboCount + 1 };
      combat.setState({
        ...nextState,
        log: appendLog(nextState.log, ...comboLog) });
    } else {
      combat.setState({
        ...consumeSideEffects(abilityResult),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        lastUsedPoemId,
        comboCount: cs.comboCount + 1 });
    }
  } else {
    combat.setState({
      ...consumeSideEffects(abilityResult),
      powerCooldowns: newCooldowns,
      lastPoemPowersUsed: lastPowers,
      lastUsedPoemId,
      comboCount: cs.comboCount + 1 });
  }

  eventBus.emit('combat:action', { action: 'poem_power' });
  eventBus.emit('poem:power_used', { poemId, powerName: ability.name });
  notifyNewCombatLogEntries(logLenBefore);

  // Boss phase transition if the poem crossed a threshold (no-op otherwise).
  commitBossPhaseTransition();

  const afterUse = combat.getState();
  if (afterUse) {
    const dealt = Math.max(0, cs.enemy.hp - afterUse.enemy.hp);
    const healed = Math.max(0, afterUse.playerHp - cs.playerHp);
    if (dealt > 0) {
      eventBus.emit('camera:combat_impact', {
        intensity: dealt >= 25 ? 0.65 : 0.4,
      });
      if (dealt >= 20) {
        eventBus.emit('combat:bullet_time', {
          duration: 0.2,
          intensity: 0.35,
          reason: 'poem_power',
        });
      }
    } else if (healed > 0) {
      eventBus.emit('combat:heal', { amount: healed, source: poemId });
      eventBus.emit('camera:combat_impact', { intensity: 0.2 });
    } else {
      eventBus.emit('camera:combat_impact', { intensity: 0.25 });
    }
  }

  // Check if enemy died from the ability
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

  // Bosses cannot be fled — act finales are do-or-die.
  if (isBossEnemyType(cs.enemy.type)) {
    const logEntry: CombatLogEntry = {
      turn: cs.turn,
      text: '⚔ От босса нельзя сбежать — это решающая битва!',
      type: 'info' as const,
    };
    const next = { ...cs, log: appendLog(cs.log, logEntry) };
    combat.setState(next);
    notifyNewCombatLogEntries(cs.log.length);
    return next;
  }

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

  fleeChance += getFleeChanceBonus();
  // Thought-cabinet flee bonus (empathy thoughts → +5% per thought)
  fleeChance += getPlayerThoughtFleeBonus() / 100;
  fleeChance += snap().difficultySettings.combatFleeBaseChance - 0.3;

  // Clamp to [0.15, 0.95]
  const clampedChance = Math.max(0.15, Math.min(0.95, fleeChance));
  const fleeRng = SeededCombatRng.fromState(cs.rng);
  const fled = fleeRng.roll(clampedChance);
  const rngAfterFlee = fleeRng.getState();

  if (fled) {
    // Pop synchronously — delayed exit callbacks may be cancelled by a new session
    combat.popReturnNode();
    combat.clearPendingTimers();

    combat.setState({
      ...cs,
      status: 'fled',
      powerCooldowns: {},
      rng: rngAfterFlee,
      log: [
        ...cs.log,
        { turn: cs.turn, text: '🏃 Побег успешен! Вы вырвались из боя.', type: 'player_flee' },
      ] });

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
    rng: rngAfterFlee,
    log: [
      ...cs.log,
      { turn: cs.turn, text: `🏃 Побег не удался! (Шанс: ${Math.round(clampedChance * 100)}%, след. попытка: +15%)`, type: 'info' },
    ] });

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §7.5 — USE ITEM (Phase 11: Combat Consumables)
   Player uses an inventory item during combat. This takes the
   player's turn (like defend/flee), then the enemy acts.
   ═══════════════════════════════════════════════════════════════ */

import {
  findCombatConsumable,
  consumeCombatItem,
  getAvailableCombatConsumables,
} from './combat/combatConsumables';

export function playerUseItem(itemId: string): CombatState | null {
  const cs = combat.getState();
  if (!cs || cs.status !== 'active' || !cs.isPlayerTurn) return cs ?? null;

  const consumable = findCombatConsumable(itemId);
  if (!consumable) {
    // Item not defined as a combat consumable — log and skip
    combat.setState({
      ...cs,
      log: appendLog(cs.log, { turn: cs.turn, text: `❌ ${itemId} нельзя использовать в бою!`, type: 'info' }),
    });
    combat.notifyListeners();
    return combat.getState()!;
  }

  // Execute the consumable effect on combat state
  const nextState = consumable.execute(cs);

  // Consume the item from inventory if marked as consumed
  if (consumable.consumes) {
    consumeCombatItem(itemId);
  }

  combat.setState(nextState);
  combat.notifyListeners();

  eventBus.emit('combat:action', { action: 'use_item', itemId });

  return endPlayerTurn();
}

/** Get all consumable items the player can use in combat right now.
 *  Returns array of { itemId, name, emoji, description } for UI rendering. */
export function getAvailableCombatItems(): Array<{ itemId: string; name: string; emoji: string; description: string }> {
  return getAvailableCombatConsumables().map(c => ({
    itemId: c.itemId,
    name: c.name,
    emoji: c.emoji,
    description: c.description,
  }));
}

function endPlayerTurn(): CombatState | null {
  const cs = combat.getState();
  if (!cs || cs.status !== 'active') return cs ?? null;

  // Pure computation: tick player power cooldowns, switch phase to enemy.
  // Side-effect orchestration stays here (setState / emit / schedule).
  const next = computeEndPlayerTurn(cs);

  combat.setState(next);
  eventBus.emit('combat:turn', { turn: next.turn, isPlayerTurn: false });
  combat.notifyListeners();

  // Enemy acts after a brief delay for visual feedback. Boss phase speed
  // multipliers (bossPhases.ts) compress the delay — an enraged boss acts
  // noticeably sooner (strict 1v1 has no turn order to race, so pacing is
  // where "speed" is expressed).
  const speedMultiplier = getBossPhaseSpeedMultiplier(next.enemy);
  const enemyDelayMs = Math.max(250, Math.floor(800 / Math.max(1, speedMultiplier)));
  combat.schedule(enemyDelayMs, () => executeEnemyTurn());

  return combat.getState();
}

/** Transition to the player's turn.
 *  Processes player buffs at turn start (tick durations, stat drain, skip_turn check).
 *  If the player has a skip_turn debuff, auto-skips and transitions to enemy turn.
 *
 *  Pure computation lives in `combat/turnCycle.ts` (computeTransitionToPlayerTurn);
 *  this orchestrator applies side effects (dispatch drain actions, setState,
 *  emit, schedule auto-skip for stunned turns). */
function transitionToPlayerTurn(state: CombatState): void {
  if (!combat.getState()) return;

  // Snapshot for stat drain clamping — read ONCE before any drain dispatch.
  // The pure function tracks running values internally so subsequent drains
  // clamp against earlier ones in the same pass (matches the original
  // getGameSnapshot-per-iteration behavior).
  const gameSnap = snap();
  const playerSnapshot: PlayerStatDrainSnapshot = {
    energy: gameSnap.playerState.energy,
    karma: gameSnap.playerState.karma,
    skills: {
      logic: gameSnap.playerState.skills.logic,
      empathy: gameSnap.playerState.skills.empathy,
    },
  };

  const result = computeTransitionToPlayerTurn(state, playerSnapshot);

  // Dispatch drain actions BEFORE setState — the drain math assumes the
  // store reflects each drain by the time the next drain's clamp runs.
  for (const action of result.drainActions) {
    dispatchGameAction(action);
  }

  combat.setState(result.nextState);
  const turn = combat.getState()!;
  eventBus.emit('combat:turn', { turn: turn.turn, isPlayerTurn: true });
  combat.notifyListeners();

  // Stunned turns auto-skip after a brief display.
  if (result.scheduleAutoSkip) {
    combat.schedule(800, () => {
      if (combat.getState()?.status === 'active') {
        endPlayerTurn();
      }
    });
  }
}

function executeEnemyTurn() {
  const cs = combat.getState();
  if (!cs || cs.status !== 'active') return;

  // ── Check if enemy is stunned (skip_turn debuff on enemy) BEFORE ticking ──
  // Same fix as transitionToPlayerTurn: a duration-1 skip_turn applied during
  // the player's turn must fire on the enemy's turn. Checking before tickBuffs
  // ensures the stun takes effect instead of being decremented away.
  if (hasBuffEffect(cs, 'enemy', 'skip_turn')) {
    const consumed = cs.buffs.filter(
      (b) => !(b.target === 'enemy' && b.effect.type === 'skip_turn'),
    );
    const { state: afterTick, expiredLog } = tickBuffs({ ...cs, buffs: consumed }, 'enemy');
    const immuneBuff = createBuff(afterTick, 'Иммунитет к оглушению', 'stun_recovery', 'buff', 'enemy', 1, { type: 'stun_immune' });
    const withImmune = addBuff(afterTick, immuneBuff);
    combat.setState({
      ...withImmune,
      log: [
        ...withImmune.log,
        ...expiredLog,
        { turn: afterTick.turn, text: `${afterTick.enemy.emoji} ${afterTick.enemy.name} дезориентирован и пропускает ход!`, type: 'info' },
        { turn: afterTick.turn, text: `${afterTick.enemy.emoji} ${afterTick.enemy.name} получает иммунитет к оглушению на 1 ход.`, type: 'info' },
      ] });

    transitionToPlayerTurn(combat.getState()!);
    return;
  }

  // ── Normal path: tick enemy buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(cs, 'enemy');

  // Player buffs and stat drain are now processed at the start of the player's turn (see transitionToPlayerTurn)

  let workingState: CombatState = {
    ...afterBuffTick,
    log: [...afterBuffTick.log, ...expiredLog] };

  const template = ENEMY_TEMPLATES[workingState.enemy.type];
  // Null-guard: at runtime a new EnemyType could be added to the union without
  // a matching ENEMY_TEMPLATES entry. Fall back to a basic-attack-only template
  // so the special-attack length check below doesn't crash.
  const safeTemplate: EnemyTemplate = template ?? { specialAttacks: [], attackBarks: [] };
  const enemySpecialCooldown = workingState.enemy.specialCooldown;
  const charging = workingState.enemy.chargingSpecial ?? null;

  if (charging) {
    // ── Telegraph resolution: a special charged on a previous turn fires
    // GUARANTEED now. chargingSpecial stays on the enemy while executing so
    // damage specials can apply the defend counter-window multiplier
    // (computeSpecialIncomingDamage); cleared right after. ──
    if (charging.turnsToHit > 1) {
      // Multi-turn charge (not used by current templates) — still winding up.
      workingState = {
        ...workingState,
        enemy: {
          ...workingState.enemy,
          chargingSpecial: { ...charging, turnsToHit: charging.turnsToHit - 1 },
        },
        log: appendLog(workingState.log, {
          turn: workingState.turn,
          text: `⚠️ ${workingState.enemy.emoji} ${workingState.enemy.name} продолжает готовить: ${charging.name}!`,
          type: 'enemy_special' as const,
        }),
      };
      // Fall through to a basic attack this turn.
    } else {
      const chargedSpecial = safeTemplate.specialAttacks.find(
        (s) => s.id === charging.attackId,
      );
      if (chargedSpecial) {
        const logLenBefore = workingState.log.length;
        const specialResult = chargedSpecial.execute(workingState, workingState.enemy);
        workingState = consumeSideEffects(specialResult);
        workingState = {
          ...workingState,
          enemy: {
            ...workingState.enemy,
            chargingSpecial: null,
            specialCooldown: chargedSpecial.cooldown + 1,
          },
        };
        notifyNewCombatLogEntries(logLenBefore);
        gotoEnemyTurnEnd(workingState);
        return;
      }
      // Unknown attack id (template changed mid-charge) — drop the charge
      // and fall through to the normal turn logic.
      workingState = {
        ...workingState,
        enemy: { ...workingState.enemy, chargingSpecial: null },
      };
    }
  } else if (enemySpecialCooldown <= 0 && safeTemplate.specialAttacks.length > 0) {
    const specialRng = SeededCombatRng.fromState(workingState.rng);
    for (const special of safeTemplate.specialAttacks) {
      if (specialRng.roll(special.chance)) {
        // ── Telegraph (Task 3.3-b1): instead of an instant special, the
        // enemy spends THIS turn charging. The special executes guaranteed
        // on its next turn — giving the player a one-turn counter-window
        // (defend cuts the damage hard: extra ×0.4). ──
        workingState = {
          ...workingState,
          rng: specialRng.getState(),
          enemy: {
            ...workingState.enemy,
            chargingSpecial: { attackId: special.id, name: special.name, turnsToHit: 1 },
          },
          log: appendLog(workingState.log, {
            turn: workingState.turn,
            text: `⚠️ ${workingState.enemy.emoji} ${workingState.enemy.name} готовит: ${special.name}! Защищайтесь!`,
            type: 'enemy_special' as const,
          }),
        };
        eventBus.emit('combat:telegraph', {
          enemyType: workingState.enemy.type,
          attackId: special.id,
          attackName: special.name,
        });
        gotoEnemyTurnEnd(workingState);
        return;
      }
    }
    workingState = { ...workingState, rng: specialRng.getState() };
  }

  // ── Basic attack: use extracted damage pipeline ──
  const attackRng = SeededCombatRng.fromState(workingState.rng);
  const combatSnap = snap();
  const spiritualLevel = combatSnap.playerState.progression.unlockedSkills.filter(
    (id) => id.startsWith('spirit_'),
  ).length;
  const perkMods = resolveCombatPerkModifiers(combatSnap.playerState.progression?.unlockedPerks ?? [], {
    stress: combatSnap.playerState.stress,
    timeOfDay: combatSnap.exploration?.timeOfDay,
  });

  const { damage: enemyDamage, rng: updatedRng } = computeEnemyIncomingDamage({
    combatState: workingState,
    rng: attackRng,
    currentAct: combatSnap.playerState.progression.currentAct,
    currentLevel: combatSnap.playerState.progression.level,
    spiritualSkillCount: spiritualLevel,
    perkMods,
  });

  // ── Stat drain side effect ──
  const { action: statDrainAction, label: statEffectText } = resolveStatDrain(
    workingState.enemy.targetsStat, updatedRng,
  );
  if (statDrainAction) {
    dispatchGameAction(statDrainAction);
  }

  const newPlayerHp = Math.max(0, workingState.playerHp - enemyDamage);

  // Use enemy-specific attack bark if available (adds personality to combat)
  const attackBarks = safeTemplate.attackBarks;
  const barkRng = SeededCombatRng.fromState(workingState.rng);
  const barkText = attackBarks.length > 0
    ? attackBarks[barkRng.nextInt(0, attackBarks.length - 1)]
    : `${workingState.enemy.emoji} ${workingState.enemy.name} атакует!`;

  const enemyAttackLog: CombatLogEntry = {
    turn: workingState.turn,
    text: `${barkText} -${enemyDamage} HP${statEffectText}`,
    type: 'enemy_attack',
    damage: enemyDamage };

  combat.setState({
    ...workingState,
    playerHp: newPlayerHp,
    playerDefending: false,
    // Phase 11: Combo decay — instead of instant reset, decay by 2 levels.
    // This makes combo building less punishing and rewards sustained aggression.
    // Only fully resets if combo was at 0 or 1 (no meaningful combo to preserve).
    comboCount: Math.max(0, workingState.comboCount - 2),
    enemyDefenseReduction: getEnemyDefenseReduction(workingState),
    enemy: {
      ...workingState.enemy,
      specialCooldown: Math.max(0, workingState.enemy.specialCooldown - 1) },
    log: [...workingState.log, enemyAttackLog],
    rng: updatedRng.getState() });

  eventBus.emit('camera:combat_shake', { intensity: enemyDamage >= 20 ? 0.55 : 0.5 });
  // Brief stagger when the player takes a hit (Max Payne / Gothic feel)
  eventBus.emit('combat:bullet_time', {
    duration: 0.1,
    intensity: 0.6,
    reason: 'player_stagger',
  });
  notifyCombatDamage(enemyAttackLog);

  // Check defeat
  if (newPlayerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(combat.getState()!);
}

/** Helper to finalize enemy turn after a special attack.
 *  Pure computation lives in `combat/turnCycle.ts` (computeGotoEnemyTurnEnd);
 *  this orchestrator applies side effects (setState, defeat check, transition). */
function gotoEnemyTurnEnd(state: CombatState) {
  const result = computeGotoEnemyTurnEnd(state);
  combat.setState(result.nextState);

  // Check defeat (some specials deal damage directly)
  if (result.playerDefeated) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(result.nextState);
}

/* ═══════════════════════════════════════════════════════════════
   §9 — VICTORY / DEFEAT
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   §9.5 — WAVE SWAP (v4.7.8 «Волна из двух врагов»)
   Победа над активным врагом при непустой pendingEnemies-очереди:
   начисляем половинные награды за павшего, второй враг вступает в бой
   на полном HP со своим набором спец-атак; баффы/дебаффы игрока живут
   (бой один), баффы врага и телеграф сбрасываются.
   ═══════════════════════════════════════════════════════════════ */

function handleWaveSwap(cs: CombatState, pendingWave: EnemyType[]): CombatState | null {
  const enemy = cs.enemy;
  const creditsMultiplier = snap().difficultySettings.creditsMultiplier;
  const defeatBarks = ENEMY_TEMPLATES[enemy.type]?.defeatBarks ?? [];

  // Награды за павшего — половинные (бой продолжается, финальная премия —
  // за второго врага в полном объёме).
  const computed = computeVictoryRewards({
    combatState: cs,
    creditsMultiplier,
    defeatBarks,
  });
  const halfXp = Math.max(1, Math.floor(computed.xpGained / 2));
  const halfCredits = Math.max(0, Math.floor(computed.creditsGained / 2));
  dispatchGameAction({ type: 'player/addKarma', amount: Math.floor(computed.karmaGained / 2) });
  addXp(halfXp);
  dispatchGameAction({ type: 'player/addCredits', amount: halfCredits });

  if (computed.isBoss) {
    dispatchGameAction({ type: 'player/setFlag', key: `${enemy.type}_defeated`, value: true });
  }

  // Лут за павшего выпадает как обычно.
  const lootItems: string[] = [];
  if (computed.lootDrop) {
    const item = createInventoryItem(computed.lootDrop);
    if (tryAddInventoryItem(item)) lootItems.push(computed.lootDrop);
  }

  // Следующий враг из очереди.
  const [nextType, ...rest] = pendingWave;
  const resolvedType = resolveEnemyType(nextType);
  const template = ENEMY_TEMPLATES[resolvedType];
  if (!template) {
    // Неизвестный шаблон — деградируем в обычную победу.
    const fallbackState: CombatState = { ...cs, pendingEnemies: [] };
    combat.setState(fallbackState);
    return handleVictory();
  }

  const state = snap();
  const playerLevel = state.playerState.progression.level;
  const currentAct = state.playerState.progression.currentAct;
  const scaleFactor = computeEnemyScalingFactor(currentAct, playerLevel);
  const difficultySettings = state.difficultySettings;
  const hpScale = scaleFactor * difficultySettings.enemyHealthMultiplier;

  const nextEnemy: CombatEnemy = {
    type: template.type,
    name: template.name,
    emoji: template.emoji,
    maxHp: Math.floor(template.baseHp * hpScale),
    hp: Math.floor(template.baseHp * hpScale),
    attack: Math.floor(template.baseAttack * scaleFactor),
    defense: Math.floor(template.baseDefense * scaleFactor),
    speed: Math.floor(template.baseSpeed * scaleFactor),
    targetsStat: template.targetsStat,
    lootTable: template.lootTable,
    xpReward: Math.floor(template.xpReward * scaleFactor * difficultySettings.xpMultiplier),
    specialCooldown: 0,
    chargingSpecial: null,
  };

  const swapLog: CombatLogEntry[] = [
    ...cs.log,
    {
      turn: cs.turn,
      text: `${enemy.emoji} ${enemy.name} повержен! +${halfXp} опыта, +${halfCredits} кр.`,
      type: 'victory',
    },
    {
      turn: cs.turn,
      text: `⚡ ${nextEnemy.emoji} ${nextEnemy.name} вступает в бой!`,
      type: 'info',
    },
  ];

  // Баффы врага умирают вместе с ним; баффы игрока переносятся (бой один).
  const playerBuffs = cs.buffs.filter((b) => b.target === 'player');

  combat.setState({
    ...cs,
    enemy: nextEnemy,
    pendingEnemies: rest,
    // Фазы/скорость/защита — заново для нового врага.
    bossPhase: 0,
    bossBaseSpeed: nextEnemy.speed,
    enemyDefending: false,
    enemyDefenseReduction: 0,
    buffs: playerBuffs,
    // Игрок сохраняет инициативу — только что нанёс решающий удар.
    isPlayerTurn: true,
    turn: cs.turn + 1,
    comboCount: 0,
    log: swapLog,
    rng: computed.rng,
  });

  // UI-хук: смена портрета/панели (CombatEnemyPanel ремоунтится по enemy.type).
  eventBus.emit('combat:wave_swap', {
    defeatedType: enemy.type,
    nextType: nextEnemy.type,
    nextName: nextEnemy.name,
  });
  eventBus.emit('fx:flash', { color: '#ff3b6b', opacity: 0.3, duration: 400 });
  combat.notifyListeners();

  return combat.getState();
}

function handleVictory(): CombatState | null {
  const cs = combat.getState();
  if (!cs) return null;

  // v4.7.8 «Волна из двух врагов»: первый враг пал, но очередь не пуста —
  // это смена цели, а не победа. Награды начисляются сразу (половинные —
  // бой продолжается), второй враг вступает.
  const pendingWave = (cs.pendingEnemies ?? []).filter(Boolean);
  if (pendingWave.length > 0 && cs.status === 'active') {
    return handleWaveSwap(cs, pendingWave);
  }

  // Pop synchronously — delayed exit callbacks may be cancelled by a new session
  const returnNodeId = combat.popReturnNode();
  combat.clearPendingTimers();

  const enemy = cs.enemy;
  const defeatBarks = ENEMY_TEMPLATES[enemy.type]?.defeatBarks ?? [];
  const creditsMultiplier = snap().difficultySettings.creditsMultiplier;

  // Pure computation: roll karma, XP, credits, loot drop, skill XP, defeat bark.
  // Side-effect orchestration (dispatches, tryAddInventoryItem, setState, emit,
  // scheduleExit) stays here.
  const computed = computeVictoryRewards({
    combatState: cs,
    creditsMultiplier,
    defeatBarks,
  });

  // Dispatch reward game actions (side effects on Zustand store)
  dispatchGameAction({ type: 'player/addKarma', amount: computed.karmaGained });
  addXp(computed.xpGained);
  dispatchGameAction({ type: 'player/addCredits', amount: computed.creditsGained });

  // Boss defeat flag — used by achievement system + story progression
  if (computed.isBoss) {
    dispatchGameAction({ type: 'player/setFlag', key: `${enemy.type}_defeated`, value: true });
  }

  // Loot add — may fail if inventory full; only counts toward the reward
  // if the add succeeds (preserves original behavior).
  const lootItems: string[] = [];
  if (computed.lootDrop) {
    const item = createInventoryItem(computed.lootDrop);
    if (tryAddInventoryItem(item)) {
      lootItems.push(computed.lootDrop);
    }
  }

  // Build the final CombatReward (xp/karma/credits/lootItems/skillXp).
  const rewards = buildCombatReward(computed, lootItems);

  // Build the victory log entries (defeat bark + summary line).
  const logEntries = buildVictoryLogEntries(
    cs.turn,
    computed,
    lootItems.length,
    cs.maxCombo,
  );

  combat.setState({
    ...cs,
    status: 'victory',
    powerCooldowns: {},
    rewards,
    rng: computed.rng,
    log: [...cs.log, ...logEntries],
  });

  eventBus.emit('combat:victory', {
    enemyType: enemy.type,
    xpGained: computed.xpGained,
    karmaGained: computed.karmaGained,
    creditsGained: computed.creditsGained,
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
    // Notify listeners BEFORE endSession — endSession sets _state = null,
    // and notifyListeners skips when state is null. CombatUI needs to
    // receive the final state to unmount.
    combat.notifyListeners();
    combat.endSession();
    eventBus.emit('combat:end', {});
  });

  return combat.getState();
}

function handleDefeat(): void {
  const cs = combat.getState();
  if (!cs) return;

  const returnNodeId = combat.popReturnNode();
  combat.clearPendingTimers();

  const enemy = cs.enemy;

  // Pure computation: roll energyLost + karmaLost from combat RNG.
  const computed = computeDefeatPenalty(cs);

  dispatchGameAction({ type: 'player/addEnergy', amount: -computed.energyLost });
  dispatchGameAction({ type: 'player/addKarma', amount: -computed.karmaLost });

  const logEntry = buildDefeatLogEntry(
    cs.turn,
    computed.energyLost,
    computed.karmaLost,
  );

  combat.setState({
    ...cs,
    status: 'defeat',
    powerCooldowns: {},
    rng: computed.rng,
    log: [...cs.log, logEntry],
  });

  eventBus.emit('combat:defeat', {
    enemyType: enemy.type,
    energyLost: computed.energyLost,
    karmaLost: computed.karmaLost,
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
    // Notify listeners BEFORE endSession (same fix as handleVictory).
    combat.notifyListeners();
    combat.endSession();
    eventBus.emit('combat:end', {});
  });
}

/* ═══════════════════════════════════════════════════════════════
   §10.5 — GAMEPAD EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════ */

/** Module-level poem selection index for gamepad cycling. */
let gamepadSelectedPoemIndex = 0;

function handleGamepadAttack(): void {
  playerAttack();
}

function handleGamepadDefend(): void {
  playerDefend();
}

function handleGamepadFlee(): void {
  playerFlee();
}

function handleGamepadPoemCyclePrev(): void {
  const powers = getAvailableCombatPowers();
  if (powers.length === 0) return;
  gamepadSelectedPoemIndex = (gamepadSelectedPoemIndex - 1 + powers.length) % powers.length;
  eventBus.emit('combat:gamepad_poem_cycle_prev' as never, {} as never);
}

function handleGamepadPoemCycleNext(): void {
  const powers = getAvailableCombatPowers();
  if (powers.length === 0) return;
  gamepadSelectedPoemIndex = (gamepadSelectedPoemIndex + 1) % powers.length;
  eventBus.emit('combat:gamepad_poem_cycle_next' as never, {} as never);
}

function handleGamepadPoemUseSelected(): void {
  const powers = getAvailableCombatPowers();
  if (powers.length === 0) return;
  const idx = Math.min(gamepadSelectedPoemIndex, powers.length - 1);
  const selected = powers[idx];
  if (selected && selected.cooldownRemaining <= 0) {
    playerUsePoemPower(selected.poemId);
  }
}

/** Get the currently gamepad-selected poem index (for UI highlighting). */
export function getGamepadSelectedPoemIndex(): number {
  return gamepadSelectedPoemIndex;
}

/** Reset poem selection when combat starts. */
function resetGamepadPoemSelection(): void {
  gamepadSelectedPoemIndex = 0;
}

const gamepadUnsubs: Array<() => void> = [];

function unsubscribeGamepadListeners(): void {
  for (const unsub of gamepadUnsubs) unsub();
  gamepadUnsubs.length = 0;
}

/** (Re)bind combat gamepad handlers after EventBus dispose/revive. */
export function bindCombatGamepadListeners(): void {
  unsubscribeGamepadListeners();
  gamepadUnsubs.push(eventBus.on('combat:gamepad_attack', handleGamepadAttack));
  gamepadUnsubs.push(eventBus.on('combat:gamepad_defend', handleGamepadDefend));
  gamepadUnsubs.push(eventBus.on('combat:gamepad_flee', handleGamepadFlee));
  gamepadUnsubs.push(eventBus.on('combat:gamepad_poem_cycle_prev', handleGamepadPoemCyclePrev));
  gamepadUnsubs.push(eventBus.on('combat:gamepad_poem_cycle_next', handleGamepadPoemCycleNext));
  gamepadUnsubs.push(eventBus.on('combat:gamepad_poem_use_selected', handleGamepadPoemUseSelected));
  gamepadUnsubs.push(eventBus.on('combat:start', resetGamepadPoemSelection));
}

bindCombatGamepadListeners();

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
   §14 — COMBAT RNG (deterministic rolls / dev & test hooks)
   ═══════════════════════════════════════════════════════════════ */

export {
  getRngState,
  setRngSeed,
  createCombatRngState,
  type CombatRngState,
} from './combat/combatRng';

/** Replace active combat RNG state (tests / dev reproducibility). */
export function setCombatRngStateForTests(rng: CombatRngState): void {
  const cs = combat.getState();
  if (!cs) return;
  combat.setState({ ...cs, rng });
}

/** Replace the whole active combat state (tests / dev reproducibility).
 *  Lets integration tests preset boss HP / phase markers / charging specials
 *  without grinding through dozens of real turns. */
export function setCombatStateForTests(state: CombatState): void {
  if (!combat.getState()) return;
  combat.setState(state);
  combat.notifyListeners();
}
