import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';

const getPoemById = vi.fn((poemId: string) =>
  poemId.startsWith('poem_')
    ? { id: poemId, title: 'X', author: 'A', lines: ['a', 'b', 'c', 'd', 'e'] }
    : undefined,
);

vi.mock('@/data/gameDataLoader', () => ({
  getPoemById: (poemId: string) => getPoemById(poemId),
}));

import {
  cancelPoemReveal,
  completePoemReveal,
  getActivePoemReveal,
  getPendingPoemRevealQueue,
  hasSeenPoemDiscoveryThisSession,
  isPoemRevealBusy,
  requestPoemDiscoveryReveal,
  requestPoemReveal,
  resetPoemRevealSession,
} from './poemRevealOrchestrator';

describe('poemRevealOrchestrator', () => {
  beforeEach(() => {
    resetPoemRevealSession();
    getPoemById.mockClear();
  });

  it('queues discovery once per poem per session', () => {
    const seen: string[] = [];
    const unsub = eventBus.on('poem:show_reveal', ({ poemId, mode }) => {
      seen.push(`${mode}:${poemId}`);
    });

    expect(requestPoemDiscoveryReveal('poem_x')).toBe(true);
    expect(getActivePoemReveal()).toEqual({ poemId: 'poem_x', mode: 'discovery' });
    expect(isPoemRevealBusy()).toBe(true);
    expect(requestPoemDiscoveryReveal('poem_x')).toBe(false);

    completePoemReveal('poem_x');
    expect(hasSeenPoemDiscoveryThisSession('poem_x')).toBe(true);
    expect(isPoemRevealBusy()).toBe(false);
    expect(requestPoemDiscoveryReveal('poem_x')).toBe(false);
    expect(seen).toEqual(['discovery:poem_x']);

    unsub();
  });

  it('FIFO-queues a second poem while the first reveal is active', () => {
    const seen: string[] = [];
    const unsub = eventBus.on('poem:show_reveal', ({ poemId }) => {
      seen.push(poemId);
    });

    expect(requestPoemReveal('poem_a', 'discovery')).toBe(true);
    expect(requestPoemReveal('poem_b', 'discovery')).toBe(true);
    expect(getPendingPoemRevealQueue()).toEqual([{ poemId: 'poem_b', mode: 'discovery' }]);

    completePoemReveal('poem_a');
    expect(getActivePoemReveal()).toEqual({ poemId: 'poem_b', mode: 'discovery' });
    expect(seen).toEqual(['poem_a', 'poem_b']);

    completePoemReveal('poem_b');
    expect(isPoemRevealBusy()).toBe(false);
    unsub();
  });

  it('queues power_ritual behind an active discovery (no stacking)', () => {
    expect(requestPoemReveal('poem_a', 'discovery')).toBe(true);
    expect(requestPoemReveal('poem_a', 'power_ritual')).toBe(true);
    expect(getActivePoemReveal()?.mode).toBe('discovery');
    expect(getPendingPoemRevealQueue()[0]?.mode).toBe('power_ritual');

    completePoemReveal('poem_a');
    expect(getActivePoemReveal()).toEqual({ poemId: 'poem_a', mode: 'power_ritual' });
  });

  it('ignores unknown poems and cancels cleanly', () => {
    expect(requestPoemReveal('missing', 'discovery')).toBe(false);
    expect(requestPoemReveal('poem_x', 'discovery')).toBe(true);
    cancelPoemReveal();
    expect(getActivePoemReveal()).toBeNull();
    expect(isPoemRevealBusy()).toBe(false);
  });

  it('auto-requests discovery on poem:collected', () => {
    const seen: string[] = [];
    const unsub = eventBus.on('poem:show_reveal', ({ poemId, mode }) => {
      seen.push(`${mode}:${poemId}`);
    });

    eventBus.emit('poem:collected', { poemId: 'poem_x' });
    expect(seen).toEqual(['discovery:poem_x']);
    unsub();
  });
});
