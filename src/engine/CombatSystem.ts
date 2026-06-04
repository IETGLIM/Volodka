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
import { getGameStore } from '@/store/gameStore';
import { createInventoryItem } from '@/data/items';

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
import { getPlayerAttack, getPlayerDefense, getPlayerMaxHp, tickPowerCooldowns, isPowerAvailable, addXp } from './combat/formulas';
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

let currentCombat: CombatState | null = null;
let combatListeners: Set<(state: CombatState) => void> = new Set();
/** Track the enemy-turn setTimeout so it can be cancelled on combat end/reset */
let enemyTurnTimer: ReturnType<typeof setTimeout> | null = null;
/** G12: Stack of storyNode IDs to return to after combat ends */
let combatReturnStack: string[] = [];

/** Cancel any pending enemy turn timer (call before resetting or ending combat) */
function clearEnemyTurnTimer(): void {
  if (enemyTurnTimer !== null) {
    clearTimeout(enemyTurnTimer);
    enemyTurnTimer = null;
  }
}

function notifyListeners() {
  if (currentCombat) {
    combatListeners.forEach((fn) => fn(currentCombat!));
  }
}

/** Subscribe to combat state changes. Returns unsubscribe function. */
export function subscribeToCombat(listener: (state: CombatState) => void): () => void {
  combatListeners.add(listener);
  if (currentCombat) listener(currentCombat);
  return () => combatListeners.delete(listener);
}

/** Get current combat state (read-only snapshot) */
export function getCombatState(): CombatState | null {
  return currentCombat;
}

/* ═══════════════════════════════════════════════════════════════
   §5 — START COMBAT
   ═══════════════════════════════════════════════════════════════ */

export function startCombat(enemyType: EnemyType): CombatState {
  // Clear any stale timer from a previous combat
  clearEnemyTurnTimer();

  // G13: Resolve enemy type based on current act/level
  const resolvedType = resolveEnemyType(enemyType);

  const template = ENEMY_TEMPLATES[resolvedType];
  const store = getGameStore();

  // G12: Save current story node for return after combat
  const currentNodeId = store.currentNodeId;
  if (currentNodeId && store.showStoryOverlay) {
    combatReturnStack.push(currentNodeId);
  }

  // Scale enemy to player level
  const playerLevel = store.playerState.progression?.level ?? 1;
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

  currentCombat = {
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
  };

  store.setMode('combat');
  eventBus.emit('combat:start', { enemyType });

  notifyListeners();
  return currentCombat;
}

/* ═══════════════════════════════════════════════════════════════
   §6 — PLAYER ACTIONS
   ═══════════════════════════════════════════════════════════════ */

export function playerAttack(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Apply attack_boost buff to player
  const pAtk = getPlayerAttack() + getPlayerAttackBoost(currentCombat);
  const enemyDef = Math.max(0, currentCombat.enemy.defense * (1 - getEnemyDefenseReduction(currentCombat)));

  // Apply buff-based defense boost to enemy
  const enemyDefBoost = sumBuffEffect(currentCombat, 'enemy', 'defense_boost');
  const effectiveEnemyDef = enemyDef + enemyDefBoost;

  const multiplier = getPlayerDamageMultiplier(currentCombat);
  let damage = Math.max(1, Math.floor((pAtk * multiplier - effectiveEnemyDef) * (0.85 + Math.random() * 0.3)));

  /* ── Combo System: consecutive attacks increase damage ── */
  const newComboCount = currentCombat.comboCount + 1;
  let comboMultiplier = 1.0;
  if (newComboCount >= 3) comboMultiplier = 2.0;
  else if (newComboCount >= 2) comboMultiplier = 1.5;
  else if (newComboCount >= 1) comboMultiplier = 1.2;
  damage = Math.floor(damage * comboMultiplier);

  /* ── Critical Hit: 10% base + (writing skill * 2%) bonus, 1.8x damage ── */
  const store = getGameStore();
  const critChance = 0.10 + store.playerState.skills.writing * 0.02;
  const isCritical = Math.random() < Math.min(0.5, critChance);
  if (isCritical) {
    damage = Math.floor(damage * 1.8);
  }

  const newEnemyHp = Math.max(0, currentCombat.enemy.hp - damage);

  const logEntry: CombatLogEntry = {
    turn: currentCombat.turn,
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

  const newMaxCombo = Math.max(currentCombat.maxCombo, newComboCount);

  currentCombat = {
    ...currentCombat,
    enemy: { ...currentCombat.enemy, hp: newEnemyHp },
    doubleAttack: false,
    enemyDefenseReduction: getEnemyDefenseReduction(currentCombat),
    log: appendLog(currentCombat.log, logEntry),
    comboCount: newComboCount,
    maxCombo: newMaxCombo,
    lastCritical: isCritical,
  };

  eventBus.emit('combat:action', { action: 'attack', damage });
  eventBus.emit('camera:combat_impact', { intensity: isCritical ? 0.6 : 0.3 });

  // Check victory
  if (newEnemyHp <= 0) {
    return handleVictory();
  }

  // Enemy turn
  return endPlayerTurn();
}

export function playerDefend(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Add a short-duration damage reduction buff
  const buff = createBuff(currentCombat, 'Защита', 'player_defend', 'buff', 'player', 1, { type: 'damage_reduction', value: 0.3 });
  const s = addBuff(currentCombat, buff);

  currentCombat = {
    ...s,
    playerDefending: true,
    comboCount: 0, // Defending resets combo
    log: appendLog(s.log, { turn: currentCombat.turn, text: '🛡️ Защита! Входящий урон снижен на 1 ход.', type: 'player_defend' }),
  };

  eventBus.emit('combat:action', { action: 'defend' });
  return endPlayerTurn();
}

export function playerUsePoemPower(poemId: string): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Check if silenced (censor_drone's silence_specials)
  if (hasBuffEffect(currentCombat, 'player', 'silence_specials')) return null;

  // Check if poem is collected and not on cooldown
  if (!isPowerAvailable(poemId, currentCombat)) return null;

  const ability = POEM_COMBAT_ABILITIES[poemId];
  if (!ability) return null;

  // Set cooldown
  const newCooldowns = { ...currentCombat.powerCooldowns, [poemId]: ability.cooldown };

  // Activate global cooldown in game store (for between-combat tracking)
  const store = getGameStore();
  store.activatePoemPower(poemId);

  // Track poem power usage for combo detection
  const lastPowers: [string | null, string | null] = [currentCombat.lastPoemPowersUsed[1], poemId];

  // Apply ability
  const abilityResult = ability.execute(currentCombat);

  // Check for poem power combos
  let comboLog: CombatLogEntry[] = [];
  if (lastPowers[0] && lastPowers[1]) {
    const comboResult = checkPoemPowerCombo(lastPowers[0], lastPowers[1], abilityResult);
    if (comboResult) {
      comboLog = [comboResult.logEntry];
      currentCombat = {
        ...consumeSideEffects(comboResult.state),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: currentCombat.comboCount + 1, // Poem powers maintain combo
      };
      currentCombat = { ...currentCombat, log: appendLog(currentCombat.log, ...comboLog) };
    } else {
      currentCombat = {
        ...consumeSideEffects(abilityResult),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: currentCombat.comboCount + 1,
      };
    }
  } else {
    currentCombat = {
      ...consumeSideEffects(abilityResult),
      powerCooldowns: newCooldowns,
      lastPoemPowersUsed: lastPowers,
      comboCount: currentCombat.comboCount + 1,
    };
  }

  eventBus.emit('combat:action', { action: 'poem_power' });
  eventBus.emit('poem:power_used', { poemId, powerName: ability.name });

  // Check if enemy died from the ability
  if (currentCombat.enemy.hp <= 0) {
    return handleVictory();
  }

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §7 — FLEE MECHANIC (cumulative + skill influence)
   ═══════════════════════════════════════════════════════════════ */

export function playerFlee(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  const store = getGameStore();
  const playerSpeed = store.playerState.skills.intuition + store.playerState.skills.logic;
  const enemySpeed = currentCombat.enemy.speed;

  // Base flee chance from speed comparison
  let fleeChance = 0.35 + (playerSpeed - enemySpeed) * 0.04;

  // Cumulative bonus: +15% per failed attempt
  fleeChance += currentCombat.fleeAttempts * 0.15;

  // Skill tree bonuses
  const unlockedSkills = store.playerState.progression?.unlockedSkills ?? [];
  // tech_4a "Цифровой Призрак" gives +20% flee chance
  if (unlockedSkills.includes('tech_4a')) fleeChance += 0.2;
  // social_2a "Дипломатия" gives +15% flee chance
  if (unlockedSkills.includes('social_2a')) fleeChance += 0.15;

  // Karma bonus: high karma gives slight advantage
  const karma = store.playerState.karma;
  if (karma >= 70) fleeChance += 0.05;

  // Clamp to [0.15, 0.95]
  const clampedChance = Math.max(0.15, Math.min(0.95, fleeChance));
  const fled = Math.random() < clampedChance;

  if (fled) {
    currentCombat = {
      ...currentCombat,
      status: 'fled',
      log: [
        ...currentCombat.log,
        { turn: currentCombat.turn, text: '🏃 Побег успешен! Вы вырвались из боя.', type: 'player_flee' },
      ],
    };

    eventBus.emit('combat:fled', { enemyType: currentCombat.enemy.type });
    eventBus.emit('combat:action', { action: 'flee' });

    // Return to exploration after a brief delay
    setTimeout(() => {
      getGameStore().setMode('exploration');
      clearEnemyTurnTimer();
      currentCombat = null;
      notifyListeners();
      eventBus.emit('combat:end', {});
    }, 1500);

    notifyListeners();
    return currentCombat;
  }

  // Failed flee — increment attempt counter
  currentCombat = {
    ...currentCombat,
    fleeAttempts: currentCombat.fleeAttempts + 1,
    log: [
      ...currentCombat.log,
      { turn: currentCombat.turn, text: `🏃 Побег не удался! (Шанс: ${Math.round(clampedChance * 100)}%, след. попытка: +15%)`, type: 'info' },
    ],
  };

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §8 — ENEMY TURN (with special attacks & buff processing)
   ═══════════════════════════════════════════════════════════════ */

function endPlayerTurn(): CombatState {
  if (!currentCombat) return currentCombat!;

  // Tick player power cooldowns
  currentCombat = {
    ...currentCombat,
    isPlayerTurn: false,
    powerCooldowns: tickPowerCooldowns(currentCombat.powerCooldowns),
  };

  eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: false });
  notifyListeners();

  // Enemy acts after a brief delay for visual feedback
  enemyTurnTimer = setTimeout(() => {
    enemyTurnTimer = null;
    executeEnemyTurn();
  }, 800);

  return currentCombat;
}

/** Transition to the player's turn.
 *  Processes player buffs at turn start (tick durations, stat drain, skip_turn check).
 *  If the player has a skip_turn debuff, auto-skips and transitions to enemy turn. */
function transitionToPlayerTurn(state: CombatState): void {
  if (!currentCombat) return;

  // ── Tick player buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(state, 'player');

  // ── Process stat drain debuffs on player ──
  const store = getGameStore();
  const drainLog: CombatLogEntry[] = [];
  for (const buff of afterBuffTick.buffs) {
    if (buff.target === 'player' && buff.effect.type === 'stat_drain') {
      const eff = buff.effect as { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma'; value: number };
      if (eff.stat === 'energy') {
        store.addEnergy(-eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Энергия -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'karma') {
        store.addKarma(-eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Карма -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'logic') {
        store.addSkill('logic', -eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Логика -${eff.value}`, type: 'info' });
      }
    }
    /* ── Enhanced: Process hp_drain_percent (Цифровая лихорадка) ── */
    if (buff.target === 'player' && buff.effect.type === 'hp_drain_percent') {
      const eff = buff.effect as { type: 'hp_drain_percent'; value: number };
      const drainDmg = Math.max(1, Math.floor(state.playerMaxHp * eff.value));
      afterBuffTick.playerHp = Math.max(1, afterBuffTick.playerHp - drainDmg);
      drainLog.push({ turn: afterBuffTick.turn, text: `🦠 ${buff.name}: -${drainDmg} HP`, type: 'status_effect', damage: drainDmg });
    }
  }

  let workingState: CombatState = {
    ...afterBuffTick,
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
    currentCombat = {
      ...workingState,
      isPlayerTurn: true, // Briefly show it's "your turn" before skipping
    };

    eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: true });
    notifyListeners();

    // Auto-skip after a brief delay
    enemyTurnTimer = setTimeout(() => {
      enemyTurnTimer = null;
      if (currentCombat && currentCombat.status === 'active') {
        endPlayerTurn();
      }
    }, 800);

    return;
  }

  // Normal: enable player turn
  currentCombat = {
    ...workingState,
    isPlayerTurn: true,
  };

  eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: true });
  notifyListeners();
}

function executeEnemyTurn() {
  if (!currentCombat || currentCombat.status !== 'active') return;

  // ── Tick enemy buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(currentCombat, 'enemy');

  // ── Check if enemy is stunned (skip_turn debuff on enemy) ──
  if (hasBuffEffect(afterBuffTick, 'enemy', 'skip_turn') || afterBuffTick.enemyDefending) {
    // Remove the skip_turn buff since it's been consumed
    const remaining = afterBuffTick.buffs.filter(
      (b) => !(b.target === 'enemy' && b.effect.type === 'skip_turn'),
    );
    currentCombat = {
      ...afterBuffTick,
      enemyDefending: false,
      buffs: remaining,
      log: [
        ...afterBuffTick.log,
        ...expiredLog,
        { turn: afterBuffTick.turn, text: `${afterBuffTick.enemy.emoji} ${afterBuffTick.enemy.name} дезориентирован и пропускает ход!`, type: 'info' },
      ],
    };

    // Transition to player turn (handles buff processing and skip_turn check)
    transitionToPlayerTurn(currentCombat);
    return;
  }

  // Player buffs and stat drain are now processed at the start of the player's turn (see transitionToPlayerTurn)

  const store = getGameStore();

  let workingState: CombatState = {
    ...afterBuffTick,
    log: [...afterBuffTick.log, ...expiredLog],
  };

  // ── Enemy special attack check ──
  const template = ENEMY_TEMPLATES[workingState.enemy.type];
  const enemySpecialCooldown = workingState.enemy.specialCooldown;

  if (enemySpecialCooldown <= 0 && template.specialAttacks.length > 0) {
    // Try special attacks (check each, use first that procs)
    for (const special of template.specialAttacks) {
      if (Math.random() < special.chance) {
        const specialResult = special.execute(workingState, workingState.enemy);
        workingState = consumeSideEffects(specialResult);
        workingState = {
          ...workingState,
          enemy: { ...workingState.enemy, specialCooldown: special.cooldown },
        };
        // Skip basic attack this turn
        gotoEnemyTurnEnd(workingState);
        return;
      }
    }
  }

  // ── Enemy basic attack ──
  // Apply enemy attack_boost buff (flat bonus)
  const enemyAtkBoost = getEnemyAttackBoost(workingState);
  const effectiveEnemyAttack = workingState.enemy.attack + enemyAtkBoost;

  // Apply enemy damage_multiplier buff
  const enemyDmgMultiplier = getEnemyDamageMultiplier(workingState);

  let enemyDamage = Math.max(1, Math.floor(effectiveEnemyAttack * enemyDmgMultiplier * (0.85 + Math.random() * 0.3)));

  // Player defense reduces damage
  if (workingState.playerDefending) {
    const playerDef = getPlayerDefense();
    enemyDamage = Math.max(1, Math.floor(enemyDamage * 0.5 - playerDef * 0.3));
  }

  // Apply player defense_boost buff (flat damage reduction)
  const playerDefBoost = getPlayerDefenseBoost(workingState);
  if (playerDefBoost > 0) {
    enemyDamage = Math.max(1, enemyDamage - playerDefBoost);
  }

  // Apply buff-based damage reduction
  const playerDmgReduction = getPlayerDamageReduction(workingState);
  if (playerDmgReduction > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - playerDmgReduction)));
  }

  // Apply player vulnerability from defense_reduction debuffs (e.g. Цифровая Тюрьма)
  const playerVulnerability = getPlayerVulnerability(workingState);
  if (playerVulnerability > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 + playerVulnerability)));
  }

  // Apply spiritual branch bonus (resilience)
  const spiritualLevel = store.playerState.progression?.unlockedSkills?.filter(
    (id) => id.startsWith('spiritual_'),
  ).length ?? 0;
  if (spiritualLevel > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - spiritualLevel * 0.05)));
  }

  const newPlayerHp = Math.max(0, workingState.playerHp - enemyDamage);

  // Enemy also targets a specific stat (basic attack debuff)
  const targetedStat = workingState.enemy.targetsStat;
  let statEffectText = '';
  if (targetedStat === 'logic') {
    if (Math.random() < 0.3) {
      store.addSkill('logic', -1);
      statEffectText = ' Логика -1!';
    }
  } else if (targetedStat === 'energy') {
    if (Math.random() < 0.4) {
      store.addEnergy(-5);
      statEffectText = ' Энергия -5!';
    }
  } else if (targetedStat === 'karma') {
    if (Math.random() < 0.3) {
      store.addKarma(-3);
      statEffectText = ' Карма -3!';
    }
  }

  currentCombat = {
    ...workingState,
    playerHp: newPlayerHp,
    playerDefending: false,
    comboCount: 0, // Taking damage resets combo
    enemy: {
      ...workingState.enemy,
      specialCooldown: Math.max(0, workingState.enemy.specialCooldown - 1),
    },
    log: [
      ...workingState.log,
      {
        turn: workingState.turn,
        text: `${workingState.enemy.emoji} ${workingState.enemy.name} атакует! -${enemyDamage} HP${statEffectText}`,
        type: 'enemy_attack',
        damage: enemyDamage,
      },
    ],
  };

  eventBus.emit('camera:combat_shake', { intensity: 0.2 });

  // Check defeat
  if (newPlayerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(currentCombat);
}

/** Helper to finalize enemy turn after a special attack */
function gotoEnemyTurnEnd(state: CombatState) {
  // Stat drain is now processed at the start of the player's turn (see transitionToPlayerTurn)

  currentCombat = {
    ...state,
    playerDefending: false,
    enemy: {
      ...state.enemy,
      specialCooldown: Math.max(0, state.enemy.specialCooldown - 1),
    },
  };

  // Check defeat (some specials deal damage directly)
  if (currentCombat.playerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(currentCombat);
}

/* ═══════════════════════════════════════════════════════════════
   §9 — VICTORY / DEFEAT
   ═══════════════════════════════════════════════════════════════ */

function handleVictory(): CombatState {
  if (!currentCombat) return currentCombat!;

  const store = getGameStore();
  const enemy = currentCombat.enemy;

  // Karma reward (increased with combo)
  const comboBonus = Math.min(currentCombat.maxCombo * 2, 10);
  const karmaGained = 3 + Math.floor(Math.random() * 5) + comboBonus;
  store.addKarma(karmaGained);

  // XP reward
  const xpGained = enemy.xpReward + comboBonus;
  addXp(xpGained);

  // Loot roll (higher combo = better loot chance)
  const lootChance = 0.6 + currentCombat.maxCombo * 0.05;
  const lootItems: string[] = [];
  if (enemy.lootTable.length > 0 && Math.random() < Math.min(0.9, lootChance)) {
    const lootItemId = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
    const item = createInventoryItem(lootItemId);
    store.addItem(item);
    lootItems.push(lootItemId);
  }

  // Skill experience
  const skillXp: Partial<Record<import('@/shared/types/game').TrainablePlayerSkill, number>> = {};
  skillXp.coding = Math.floor(xpGained * 0.3);
  skillXp.logic = Math.floor(xpGained * 0.2);
  skillXp.writing = Math.floor(xpGained * 0.1);

  const rewards: import('@/shared/types/game').CombatReward = {
    xp: xpGained,
    karma: karmaGained,
    lootItems,
    skillXp,
  };

  currentCombat = {
    ...currentCombat,
    status: 'victory',
    rewards,
    log: [
      ...currentCombat.log,
      {
        turn: currentCombat.turn,
        text: `🏆 Победа! +${karmaGained} кармы, +${xpGained} опыта${lootItems.length > 0 ? `, найден предмет!` : ''}${currentCombat.maxCombo >= 3 ? ` Макс. комбо: x${currentCombat.maxCombo}!` : ''}`,
        type: 'victory',
      },
    ],
  };

  eventBus.emit('combat:victory', {
    enemyType: enemy.type,
    xpGained,
    karmaGained,
    lootItemId: lootItems[0],
  });

  notifyListeners();

  // Return to story node or exploration after delay (G12)
  setTimeout(() => {
    const returnNodeId = combatReturnStack.pop();
    if (returnNodeId) {
      store.setMode('exploration');
      store.setCurrentNodeId(returnNodeId);
      store.setShowStoryOverlay(true);
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      store.setMode('exploration');
    }
    clearEnemyTurnTimer();
    currentCombat = null;
    notifyListeners();
    eventBus.emit('combat:end', {});
  }, 3000);

  return currentCombat;
}

function handleDefeat(): void {
  if (!currentCombat) return;

  const store = getGameStore();
  const enemy = currentCombat.enemy;

  // Not game over — just penalties
  const energyLost = 15 + Math.floor(Math.random() * 10);
  const karmaLost = 5 + Math.floor(Math.random() * 5);
  store.addEnergy(-energyLost);
  store.addKarma(-karmaLost);

  currentCombat = {
    ...currentCombat,
    status: 'defeat',
    log: [
      ...currentCombat.log,
      {
        turn: currentCombat.turn,
        text: `💀 Поражение... -${energyLost} энергии, -${karmaLost} кармы. Вы отступаете.`,
        type: 'defeat',
      },
    ],
  };

  eventBus.emit('combat:defeat', {
    enemyType: enemy.type,
    energyLost,
    karmaLost,
  });

  notifyListeners();

  // Return to story node or exploration after defeat (G12)
  setTimeout(() => {
    const returnNodeId = combatReturnStack.pop();
    if (returnNodeId) {
      store.setMode('exploration');
      store.setCurrentNodeId(returnNodeId);
      store.setShowStoryOverlay(true);
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      store.setMode('exploration');
    }
    clearEnemyTurnTimer();
    currentCombat = null;
    notifyListeners();
    eventBus.emit('combat:end', {});
  }, 3000);
}

/* ═══════════════════════════════════════════════════════════════
   §11 — GET AVAILABLE POEM POWERS (cooldown-based)
   ═══════════════════════════════════════════════════════════════ */

export function getAvailableCombatPowers(): Array<{ poemId: string; name: string; description: string; cooldownRemaining: number }> {
  const store = getGameStore();
  const combat = currentCombat;
  if (!combat) return [];

  return store.collectedPoems
    .map((poemId) => {
      const ability = POEM_COMBAT_ABILITIES[poemId];
      if (!ability) return null;
      const cd = combat.powerCooldowns[poemId] ?? 0;
      return { poemId, name: ability.name, description: ability.description, cooldownRemaining: cd };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/* ═══════════════════════════════════════════════════════════════
   §12 — GET ACTIVE BUFFS (for UI display)
   ═══════════════════════════════════════════════════════════════ */

export function getActiveBuffs(target?: 'player' | 'enemy'): CombatBuff[] {
  if (!currentCombat) return [];
  if (target) return currentCombat.buffs.filter((b) => b.target === target);
  return currentCombat.buffs;
}

/* ═══════════════════════════════════════════════════════════════
   §13 — SKILL TREE (re-exported from actions module)
   ═══════════════════════════════════════════════════════════════ */

/** Check if a skill tree node can be unlocked */
export { _canUnlockSkill as canUnlockSkill };

/** Unlock a skill tree node */
export { _unlockSkill as unlockSkill };
