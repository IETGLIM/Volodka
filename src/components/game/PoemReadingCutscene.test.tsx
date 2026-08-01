import React from 'react';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPendingPoemReadingId,
  requestPoemPowerActivation,
  resetPoemReadingSession,
} from '@/engine/poemReading/poemReadingOrchestrator';
import {
  getActivePoemReveal,
  resetPoemRevealSession,
} from '@/engine/poemReveal/poemRevealOrchestrator';
import { PoemRevealHost } from '@/components/game/poemReveal/PoemRevealHost';

const activateSpy = vi.fn((_poemId: string) => true);

let mockPendingPoemReadingId: string | null = null;

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ pendingPoemReadingId: mockPendingPoemReadingId }),
  dispatchGameAction: (action: { type: string; poemId?: string | null }) => {
    if (action.type === 'poem/setPendingReading') {
      mockPendingPoemReadingId = action.poemId ?? null;
    }
  },
}));

vi.mock('@/engine/PoemPowerSystem', () => ({
  activatePoemPowerById: (poemId: string) => activateSpy(poemId),
  canUsePower: () => true,
  getPoemPower: (poemId: string) => ({
    poemId,
    name: 'Test Power',
    description: 'desc',
    cooldownMs: 60000,
    effect: () => {},
  }),
}));

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: {
    enableDialogueMuffle: vi.fn(),
    disableDialogueMuffle: vi.fn(),
    playSfx: vi.fn(),
  },
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

vi.mock('@/hooks/useCinematicNarrativePresentation', () => ({
  useCinematicNarrativePresentation: vi.fn(),
}));

vi.mock('@/data/gameDataLoader', () => ({
  getPoemById: (poemId: string) => ({
    id: poemId,
    title: 'Test Poem',
    author: 'Test Author',
    lines: ['Line one', 'Line two'],
  }),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (s: { showStoryOverlay: boolean }) => unknown) =>
    selector({ showStoryOverlay: false }),
}));

/** Avoid framer-motion / typewriter hang in jsdom — host wiring only. */
vi.mock('@/components/game/poemReveal/PoemRevealShell', () => ({
  PoemRevealShell: ({ poemId, mode }: { poemId: string; mode: string }) =>
    React.createElement('div', {
      'data-testid': 'poem-reading-cutscene',
      'data-poem-id': poemId,
      'data-mode': mode,
    }),
}));

describe('PoemRevealHost power_ritual', () => {
  beforeEach(() => {
    mockPendingPoemReadingId = null;
    resetPoemReadingSession();
    resetPoemRevealSession();
    activateSpy.mockClear();
  });

  it('clears pending state on unmount without completing the ritual', () => {
    const { unmount } = render(<PoemRevealHost />);

    act(() => {
      const result = requestPoemPowerActivation('poem_1');
      expect(result.status).toBe('cutscene_pending');
    });
    expect(getPendingPoemReadingId()).toBe('poem_1');
    expect(getActivePoemReveal()?.mode).toBe('power_ritual');

    activateSpy.mockClear();
    act(() => {
      unmount();
    });

    expect(getPendingPoemReadingId()).toBeNull();
    expect(activateSpy).not.toHaveBeenCalled();

    const retry = requestPoemPowerActivation('poem_1');
    expect(retry.status).toBe('cutscene_pending');
  });
});
