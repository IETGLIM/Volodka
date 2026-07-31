import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';

const getPoemById = vi.fn((poemId: string) =>
  poemId === 'poem_x'
    ? { id: 'poem_x', title: 'X', author: 'A', lines: ['a', 'b', 'c', 'd', 'e'] }
    : undefined,
);

vi.mock('@/data/gameDataLoader', () => ({
  getPoemById: (poemId: string) => getPoemById(poemId),
}));

vi.mock('@/engine/presentation/cinematicInterstitialPresentation', () => ({
  setPoemRevealInterstitialActive: vi.fn(),
  notifyPoemReadingInterstitialChanged: vi.fn(),
}));

import {
  cancelPoemDiscoveryReveal,
  completePoemDiscoveryReveal,
  getPendingPoemDiscoveryId,
  hasSeenPoemDiscoveryThisSession,
  isPoemDiscoveryRevealBusy,
  requestPoemDiscoveryReveal,
  resetPoemDiscoveryRevealSession,
} from './poemDiscoveryRevealOrchestrator';

describe('poemDiscoveryRevealOrchestrator (compat shim)', () => {
  beforeEach(() => {
    resetPoemDiscoveryRevealSession();
    getPoemById.mockClear();
  });

  it('queues a reveal once per poem per session', () => {
    const seen: string[] = [];
    const unsub = eventBus.on('poem:show_discovery_reveal', ({ poemId }) => {
      seen.push(poemId);
    });

    expect(requestPoemDiscoveryReveal('poem_x')).toBe(true);
    expect(getPendingPoemDiscoveryId()).toBe('poem_x');
    expect(isPoemDiscoveryRevealBusy()).toBe(true);
    expect(requestPoemDiscoveryReveal('poem_x')).toBe(false);

    completePoemDiscoveryReveal('poem_x');
    expect(hasSeenPoemDiscoveryThisSession('poem_x')).toBe(true);
    expect(isPoemDiscoveryRevealBusy()).toBe(false);
    expect(requestPoemDiscoveryReveal('poem_x')).toBe(false);
    expect(seen).toEqual(['poem_x']);

    unsub();
  });

  it('ignores unknown poems and cancels cleanly', () => {
    expect(requestPoemDiscoveryReveal('missing')).toBe(false);
    expect(requestPoemDiscoveryReveal('poem_x')).toBe(true);
    cancelPoemDiscoveryReveal();
    expect(getPendingPoemDiscoveryId()).toBeNull();
    expect(isPoemDiscoveryRevealBusy()).toBe(false);
  });

  it('auto-requests on poem:collected', () => {
    const seen: string[] = [];
    const unsub = eventBus.on('poem:show_discovery_reveal', ({ poemId }) => {
      seen.push(poemId);
    });

    eventBus.emit('poem:collected', { poemId: 'poem_x' });
    expect(seen).toEqual(['poem_x']);
    unsub();
  });
});
