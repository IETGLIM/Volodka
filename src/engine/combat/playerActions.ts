/* ─── Combat player actions — attack, defend, poem powers, flee ─── */

import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower,
} from '@/engine/GameActionDispatcher';
import type { CombatLogEntry, CombatState } from './types';
import { appendLog } from './types';
import {
  createBuff,
  addBuff,
  sumBuffEffect,
  hasBuffEffect,
  getEnemyDefenseReduction,
  getPlayerDamageMultiplier,
  getPlayerAttackBoost,
} from './buffSystem';
import {
  getPlayerAttack,
  isPowerAvailable,
  getComboMultiplier,
  getCritChance,
  attackVariance,
  computeFleeChance,
} from './formulas';
import {
  POEM_COMBAT_ABILITIES,
  consumeSideEffects,
  checkPoemPowerCombo,
} from './actions';
import { combatSession } from './combatSession';
import { endPlayerTurn } from './turnFlow';
import { handleVictory } from './combatOutcome';

function snap() {
  return getGameSnapshot();
}

export function playerAttack(): CombatState | null {
  const cs = combatSession.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  const pAtk = getPlayerAttack() + getPlayerAttackBoost(cs);
  const enemyDef = Math.max(0, cs.enemy.defense * (1 - getEnemyDefenseReduction(cs)));

  const enemyDefBoost = sumBuffEffect(cs, 'enemy', 'defense_boost');
  const effectiveEnemyDef = enemyDef + enemyDefBoost;

  const multiplier = getPlayerDamageMultiplier(cs);
  let damage = Math.max(1, Math.floor((pAtk * multiplier - effectiveEnemyDef) * attackVariance()));

  const newComboCount = cs.comboCount + 1;
  const comboMultiplier = getComboMultiplier(newComboCount);
  damage = Math.floor(damage * comboMultiplier);

  const critChance = getCritChance(snap().playerState.skills.writing);
  const isCritical = Math.random() < critChance;
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

  combatSession.setState({
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

  if (newEnemyHp <= 0) {
    return handleVictory();
  }

  return endPlayerTurn();
}

export function playerDefend(): CombatState | null {
  const cs = combatSession.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  const buff = createBuff(cs, 'Защита', 'player_defend', 'buff', 'player', 1, { type: 'damage_reduction', value: 0.3 });
  const s = addBuff(cs, buff);

  combatSession.setState({
    ...s,
    playerDefending: true,
    comboCount: 0,
    log: appendLog(s.log, { turn: cs.turn, text: '🛡️ Защита! Входящий урон снижен на 1 ход.', type: 'player_defend' }),
  });

  eventBus.emit('combat:action', { action: 'defend' });
  return endPlayerTurn();
}

export function playerUsePoemPower(poemId: string): CombatState | null {
  const cs = combatSession.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  if (hasBuffEffect(cs, 'player', 'silence_specials')) return null;
  if (!isPowerAvailable(poemId, cs)) return null;

  const ability = POEM_COMBAT_ABILITIES[poemId];
  if (!ability) return null;

  const newCooldowns = { ...cs.powerCooldowns, [poemId]: ability.cooldown };
  tryActivatePoemPower(poemId);

  const lastPowers: [string | null, string | null] = [cs.lastPoemPowersUsed[1], poemId];
  const abilityResult = ability.execute(cs);

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
      combatSession.setState({
        ...nextState,
        log: appendLog(nextState.log, ...comboLog),
      });
    } else {
      combatSession.setState({
        ...consumeSideEffects(abilityResult),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: cs.comboCount + 1,
      });
    }
  } else {
    combatSession.setState({
      ...consumeSideEffects(abilityResult),
      powerCooldowns: newCooldowns,
      lastPoemPowersUsed: lastPowers,
      comboCount: cs.comboCount + 1,
    });
  }

  eventBus.emit('combat:action', { action: 'poem_power' });
  eventBus.emit('poem:power_used', { poemId, powerName: ability.name });

  const afterUse = combatSession.getState();
  if (afterUse && afterUse.enemy.hp <= 0) {
    return handleVictory();
  }

  return endPlayerTurn();
}

export function playerFlee(): CombatState | null {
  const cs = combatSession.getState();
  if (!cs || !cs.isPlayerTurn || cs.status !== 'active') return null;

  const playerState = snap().playerState;
  const playerSpeed = playerState.skills.intuition + playerState.skills.logic;
  const enemySpeed = cs.enemy.speed;

  const clampedChance = computeFleeChance({
    playerSpeed,
    enemySpeed,
    fleeAttempts: cs.fleeAttempts,
    unlockedSkills: playerState.progression.unlockedSkills,
    karma: playerState.karma,
  });
  const fled = Math.random() < clampedChance;

  if (fled) {
    combatSession.popReturnNode();
    combatSession.beginSession();

    combatSession.setState({
      ...cs,
      status: 'fled',
      powerCooldowns: {},
      log: [
        ...cs.log,
        { turn: cs.turn, text: '🏃 Побег успешен! Вы вырвались из боя.', type: 'player_flee' },
      ],
    });

    const fledState = combatSession.getState()!;
    eventBus.emit('combat:fled', { enemyType: fledState.enemy.type });
    eventBus.emit('combat:action', { action: 'flee' });

    combatSession.schedule(1500, () => {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
      combatSession.endSession();
      combatSession.notifyListeners();
      eventBus.emit('combat:end', {});
    });

    combatSession.notifyListeners();
    return fledState;
  }

  combatSession.setState({
    ...cs,
    fleeAttempts: cs.fleeAttempts + 1,
    log: [
      ...cs.log,
      { turn: cs.turn, text: `🏃 Побег не удался! (Шанс: ${Math.round(clampedChance * 100)}%, след. попытка: +15%)`, type: 'info' },
    ],
  });

  return endPlayerTurn();
}
