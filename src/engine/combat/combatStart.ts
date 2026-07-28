/* ─── Combat start — spawn enemy, scale stats, push return node ─── */

import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { CombatEnemy, CombatState, EnemyType } from './types';
import { getPlayerMaxHp } from './formulas';
import { ENEMY_TEMPLATES, resolveEnemyType } from './enemies';
import { combatSession } from './combatSession';

function snap() {
  return getGameSnapshot();
}

export function startCombat(enemyType: EnemyType): CombatState {
  // Abandoned active combat pushed a return node that will never be popped on victory/defeat/flee
  if (combatSession.getState()?.status === 'active') {
    combatSession.discardOrphanedReturnNode();
  }

  combatSession.beginSession();

  const resolvedType = resolveEnemyType(enemyType);
  const template = ENEMY_TEMPLATES[resolvedType];
  const state = snap();

  const currentNodeId = state.currentNodeId;
  if (currentNodeId && state.showStoryOverlay) {
    combatSession.pushReturnNode(currentNodeId);
  }

  const playerLevel = state.playerState.progression.level;
  const scaleFactor = 1 + (playerLevel - 1) * 0.12;

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

  combatSession.setState({
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
  });

  dispatchGameAction({ type: 'story/setCombatActive', active: true });
  eventBus.emit('combat:start', { enemyType });

  combatSession.notifyListeners();
  return combatSession.getState()!;
}
