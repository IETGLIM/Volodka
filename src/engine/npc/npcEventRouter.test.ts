import { describe, it, expect, afterEach } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  getNpcAnimationBusSubscriptionCount,
  getNpcAnimationHandlerCount,
  onNpcAnimation,
  resetNpcEventRouterForTests,
} from './npcEventRouter';

describe('npcEventRouter', () => {
  afterEach(() => {
    resetNpcEventRouterForTests();
  });

  it('uses one EventBus subscription for many npc handlers', () => {
    const received: Record<string, string[]> = {};
    const unsubs = Array.from({ length: 20 }, (_, index) => {
      const npcId = `npc-${index}`;
      received[npcId] = [];
      return onNpcAnimation(npcId, (state) => {
        received[npcId].push(state);
      });
    });

    expect(getNpcAnimationBusSubscriptionCount()).toBe(1);
    expect(getNpcAnimationHandlerCount()).toBe(20);

    eventBus.emit('npc:animation', { npcId: 'npc-3', state: 'talk' });
    eventBus.emit('npc:animation', { npcId: 'npc-19', state: 'walk' });

    expect(received['npc-3']).toEqual(['talk']);
    expect(received['npc-19']).toEqual(['walk']);
    expect(received['npc-0']).toEqual([]);

    for (const unsub of unsubs) {
      unsub();
    }
    expect(getNpcAnimationBusSubscriptionCount()).toBe(0);
    expect(getNpcAnimationHandlerCount()).toBe(0);
  });
});
