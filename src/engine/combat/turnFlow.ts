/* ─── Combat turn flow — player→enemy handoff, enemy AI, buff ticks ─── */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { CombatLogEntry, CombatState } from './types';
import {
  tickBuffs,
  hasBuffEffect,
  getEnemyAttackBoost,
  getEnemyDamageMultiplier,
  getPlayerDefenseBoost,
  getPlayerDamageReduction,
  getPlayerVulnerability,
} from './buffSystem';
import {
  getPlayerDefense,
  tickPowerCooldowns,
  attackVariance,
  spiritualDamageReduction,
} from './formulas';
import { ENEMY_TEMPLATES } from './enemies';
import { consumeSideEffects } from './actions';
import { combatSession } from './combatSession';
import { handleDefeat } from './combatOutcome';

function snap() {
  return getGameSnapshot();
}

export function endPlayerTurn(): CombatState {
  const cs = combatSession.getState();
  if (!cs || cs.status !== 'active') return cs!;

  combatSession.setState({
    ...cs,
    isPlayerTurn: false,
    powerCooldowns: tickPowerCooldowns(cs.powerCooldowns),
  });

  const next = combatSession.getState()!;
  eventBus.emit('combat:turn', { turn: next.turn, isPlayerTurn: false });
  combatSession.notifyListeners();

  combatSession.schedule(800, () => executeEnemyTurn());

  return next;
}

/** Transition to the player's turn.
 *  Processes player buffs at turn start (tick durations, stat drain, skip_turn check).
 *  If the player has a skip_turn debuff, auto-skips and transitions to enemy turn. */
export function transitionToPlayerTurn(state: CombatState): void {
  if (!combatSession.getState()) return;

  const { state: afterBuffTick, expiredLog } = tickBuffs(state, 'player');

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
    enemyDefending: false,
    doubleAttack: false,
    playerDefending: false,
    _sideEffects: [],
    log: [...afterBuffTick.log, ...expiredLog, ...drainLog],
  };

  if (hasBuffEffect(workingState, 'player', 'skip_turn')) {
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

    combatSession.setState({
      ...workingState,
      isPlayerTurn: true,
    });

    const stunnedTurn = combatSession.getState()!;
    eventBus.emit('combat:turn', { turn: stunnedTurn.turn, isPlayerTurn: true });
    combatSession.notifyListeners();

    combatSession.schedule(800, () => {
      if (combatSession.getState()?.status === 'active') {
        endPlayerTurn();
      }
    });

    return;
  }

  combatSession.setState({
    ...workingState,
    isPlayerTurn: true,
  });

  const playerTurn = combatSession.getState()!;
  eventBus.emit('combat:turn', { turn: playerTurn.turn, isPlayerTurn: true });
  combatSession.notifyListeners();
}

function gotoEnemyTurnEnd(state: CombatState): void {
  combatSession.setState({
    ...state,
    playerDefending: false,
    enemy: {
      ...state.enemy,
      specialCooldown: Math.max(0, state.enemy.specialCooldown - 1),
    },
  });

  const afterSpecial = combatSession.getState()!;
  if (afterSpecial.playerHp <= 0) {
    handleDefeat();
    return;
  }

  transitionToPlayerTurn(afterSpecial);
}

export function executeEnemyTurn(): void {
  const cs = combatSession.getState();
  if (!cs || cs.status !== 'active') return;

  const { state: afterBuffTick, expiredLog } = tickBuffs(cs, 'enemy');

  if (hasBuffEffect(afterBuffTick, 'enemy', 'skip_turn') || afterBuffTick.enemyDefending) {
    const remaining = afterBuffTick.buffs.filter(
      (b) => !(b.target === 'enemy' && b.effect.type === 'skip_turn'),
    );
    combatSession.setState({
      ...afterBuffTick,
      enemyDefending: false,
      buffs: remaining,
      log: [
        ...afterBuffTick.log,
        ...expiredLog,
        { turn: afterBuffTick.turn, text: `${afterBuffTick.enemy.emoji} ${afterBuffTick.enemy.name} дезориентирован и пропускает ход!`, type: 'info' },
      ],
    });

    transitionToPlayerTurn(combatSession.getState()!);
    return;
  }

  let workingState: CombatState = {
    ...afterBuffTick,
    log: [...afterBuffTick.log, ...expiredLog],
  };

  const template = ENEMY_TEMPLATES[workingState.enemy.type];
  const enemySpecialCooldown = workingState.enemy.specialCooldown;

  if (enemySpecialCooldown <= 0 && template.specialAttacks.length > 0) {
    for (const special of template.specialAttacks) {
      if (Math.random() < special.chance) {
        const specialResult = special.execute(workingState, workingState.enemy);
        workingState = consumeSideEffects(specialResult);
        workingState = {
          ...workingState,
          enemy: { ...workingState.enemy, specialCooldown: special.cooldown },
        };
        gotoEnemyTurnEnd(workingState);
        return;
      }
    }
  }

  const enemyAtkBoost = getEnemyAttackBoost(workingState);
  const effectiveEnemyAttack = workingState.enemy.attack + enemyAtkBoost;
  const enemyDmgMultiplier = getEnemyDamageMultiplier(workingState);

  let enemyDamage = Math.max(1, Math.floor(effectiveEnemyAttack * enemyDmgMultiplier * attackVariance()));

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

  const spiritReduce = spiritualDamageReduction(snap().playerState.progression.unlockedSkills);
  if (spiritReduce > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - spiritReduce)));
  }

  const newPlayerHp = Math.max(0, workingState.playerHp - enemyDamage);

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

  combatSession.setState({
    ...workingState,
    playerHp: newPlayerHp,
    playerDefending: false,
    comboCount: 0,
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
  });

  eventBus.emit('camera:combat_shake', { intensity: 0.2 });

  if (newPlayerHp <= 0) {
    handleDefeat();
    return;
  }

  transitionToPlayerTurn(combatSession.getState()!);
}
