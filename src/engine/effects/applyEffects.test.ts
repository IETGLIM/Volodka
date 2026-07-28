import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoryEffect } from '@/shared/types/game';

const dispatchGameAction = vi.fn();
const tryAddInventoryItem = vi.fn();
const eventBusEmit = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
  tryAddInventoryItem: (...args: unknown[]) => tryAddInventoryItem(...args),
}));

vi.mock('@/engine/EventBus', () => ({
  eventBus: {
    emit: (...args: unknown[]) => eventBusEmit(...args),
  },
}));

vi.mock('@/data/items', () => ({
  createInventoryItem: (itemId: string, quantity: number) => ({ id: itemId, quantity }),
}));

import { applyEffects } from './applyEffects';

describe('applyEffects', () => {
  beforeEach(() => {
    dispatchGameAction.mockReset();
    tryAddInventoryItem.mockReset();
    eventBusEmit.mockReset();
  });

  it('dispatches player reward actions', () => {
    const effects: StoryEffect[] = [
      { type: 'addXp', value: 10 },
      { type: 'addKarma', value: 2 },
      { type: 'addCredits', value: 5 },
      { type: 'addSkill', skill: 'coding', value: 1 },
      { type: 'addStat', stat: 'energy', value: 3 },
      { type: 'setFlag', flag: 'demo', flagValue: true },
    ];

    applyEffects(effects);

    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'player/addXp', amount: 10 });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'player/addKarma', amount: 2 });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'player/addCredits', amount: 5 });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'player/addSkill',
      skill: 'coding',
      amount: 1,
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'player/addEnergy', amount: 3 });
    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'player/setFlag',
      key: 'demo',
      value: true,
    });
  });

  it('adds items via tryAddInventoryItem and notifies callback', () => {
    tryAddInventoryItem.mockReturnValue(true);
    const onItemAdded = vi.fn();

    applyEffects([{ type: 'addItem', itemId: 'chip', value: 2 }], { onItemAdded });

    expect(tryAddInventoryItem).toHaveBeenCalledWith({ id: 'chip', quantity: 2 });
    expect(onItemAdded).toHaveBeenCalledWith('chip', 2);
  });

  it('removes items, collects poems, discovers lore, activates quests', () => {
    applyEffects([
      { type: 'removeItem', itemId: 'chip', value: 1 },
      { type: 'collectPoem', poemId: 'poem_1' },
      { type: 'discoverLore', loreId: 'lore_a, lore_b' },
      { type: 'triggerQuest', questId: 'q1' },
    ]);

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'inventory/removeItem',
      itemId: 'chip',
      quantity: 1,
    });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'poem/collect', poemId: 'poem_1' });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'lore/discover', entryId: 'lore_a' });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'lore/discover', entryId: 'lore_b' });
    expect(dispatchGameAction).toHaveBeenCalledWith({ type: 'quest/activate', questId: 'q1' });
  });

  it('respects shouldActivateQuest guard', () => {
    applyEffects([{ type: 'triggerQuest', questId: 'blocked' }], {
      shouldActivateQuest: () => false,
    });
    expect(dispatchGameAction).not.toHaveBeenCalled();
  });

  it('emits choice:made for significant npc relation changes', () => {
    applyEffects([
      { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
    ]);

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'player/setNpcRelation',
      npcId: 'zarema',
      delta: 5,
    });
    expect(eventBusEmit).toHaveBeenCalledWith('choice:made', {
      karmaChange: 0,
      npcId: 'zarema',
      relationChange: 5,
    });
  });

  it('delegates combat and emits scene:request_transition', () => {
    const startCombat = vi.fn();
    applyEffects(
      [
        { type: 'combat', enemyType: 'system_daemon' },
        { type: 'transitionScene', sceneId: 'volodka_room' },
      ],
      { startCombat },
    );

    expect(startCombat).toHaveBeenCalledWith('system_daemon');
    expect(eventBusEmit).toHaveBeenCalledWith('scene:request_transition', {
      targetScene: 'volodka_room',
    });
  });
});
