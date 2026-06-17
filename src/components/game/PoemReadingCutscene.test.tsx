import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPendingPoemReadingId,
  requestPoemPowerActivation,
  resetPoemReadingSession,
} from '@/engine/poemReading/poemReadingOrchestrator';
import { PoemReadingCutscene } from './PoemReadingCutscene';

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

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => false,
}));

vi.mock('@/hooks/useCinematicNarrativePresentation', () => ({
  useCinematicNarrativePresentation: vi.fn(),
}));

vi.mock('@/hooks/useAccessibilitySettings', () => ({
  useAccessibilitySettings: () => ({ textSpeed: 1 }),
}));

vi.mock('@/data/gameDataLoader', () => ({
  getPoemById: (poemId: string) => ({
    id: poemId,
    title: 'Test Poem',
    author: 'Test Author',
    lines: ['Line one', 'Line two'],
  }),
}));

describe('PoemReadingCutscene', () => {
  beforeEach(() => {
    mockPendingPoemReadingId = null;
    resetPoemReadingSession();
    activateSpy.mockClear();
  });

  it('clears pending state on unmount without completing the ritual', () => {
    const { unmount } = render(<PoemReadingCutscene />);

    act(() => {
      const result = requestPoemPowerActivation('poem_1');
      expect(result.status).toBe('cutscene_pending');
    });
    expect(getPendingPoemReadingId()).toBe('poem_1');
    expect(screen.getByTestId('poem-reading-cutscene')).toBeInTheDocument();

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
