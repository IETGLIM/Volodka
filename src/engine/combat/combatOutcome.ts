/* ─── Combat outcome — victory / defeat rewards & exit scheduling ─── */

import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  tryAddInventoryItem,
} from '@/engine/GameActionDispatcher';
import { createInventoryItem } from '@/data/items';
import type { CombatReward, CombatState } from './types';
import {
  addXp,
  buildVictorySkillXp,
  computeCombatCredits,
  computeDefeatPenalties,
  computeVictoryComboBonus,
  computeVictoryLootChance,
} from './formulas';
import { combatSession } from './combatSession';

function scheduleCombatExit(returnNodeId: string | undefined): void {
  combatSession.schedule(3000, () => {
    if (returnNodeId) {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
      dispatchGameAction({ type: 'story/openNarrativeOverlay', nodeId: returnNodeId, kind: 'story' });
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      dispatchGameAction({ type: 'story/setCombatActive', active: false });
    }
    combatSession.endSession();
    combatSession.notifyListeners();
    eventBus.emit('combat:end', {});
  });
}

export function handleVictory(): CombatState {
  const cs = combatSession.getState();
  if (!cs) return cs!;

  // Pop synchronously — delayed exit callbacks may be cancelled by a new session
  const returnNodeId = combatSession.popReturnNode();
  combatSession.beginSession();

  const enemy = cs.enemy;

  const comboBonus = computeVictoryComboBonus(cs.maxCombo);
  const karmaGained = 3 + Math.floor(Math.random() * 5) + comboBonus;
  dispatchGameAction({ type: 'player/addKarma', amount: karmaGained });

  const xpGained = enemy.xpReward + comboBonus;
  addXp(xpGained);

  const creditsGained = computeCombatCredits(xpGained, comboBonus);
  dispatchGameAction({ type: 'player/addCredits', amount: creditsGained });

  const lootChance = computeVictoryLootChance(cs.maxCombo);
  const lootItems: string[] = [];
  if (enemy.lootTable.length > 0 && Math.random() < lootChance) {
    const lootItemId = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
    const item = createInventoryItem(lootItemId);
    if (tryAddInventoryItem(item)) {
      lootItems.push(lootItemId);
    }
  }

  const skillXp = buildVictorySkillXp(xpGained);

  const rewards: CombatReward = {
    xp: xpGained,
    karma: karmaGained,
    credits: creditsGained,
    lootItems,
    skillXp,
  };

  combatSession.setState({
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

  combatSession.notifyListeners();
  scheduleCombatExit(returnNodeId);

  return combatSession.getState()!;
}

export function handleDefeat(): void {
  const cs = combatSession.getState();
  if (!cs) return;

  const returnNodeId = combatSession.popReturnNode();
  combatSession.beginSession();

  const enemy = cs.enemy;

  const { energyLost, karmaLost } = computeDefeatPenalties();
  dispatchGameAction({ type: 'player/addEnergy', amount: -energyLost });
  dispatchGameAction({ type: 'player/addKarma', amount: -karmaLost });

  combatSession.setState({
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

  combatSession.notifyListeners();
  scheduleCombatExit(returnNodeId);
}
