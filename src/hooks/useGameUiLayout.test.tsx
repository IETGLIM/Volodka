import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameUiLayout } from './useGameUiLayout';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import type { StoryNode } from '@/data/types';

const nodeEligibleOverlay: StoryNode = {
  id: 'hub',
  type: 'narration',
  scene: 'volodka_room',
  act: 1,
  text: 'Hello',
  choices: [{ text: 'Go', next: 'explore_mode' }],
} as StoryNode;

const nodeNoOverlay: StoryNode = {
  id: 'explore_mode',
  type: 'narration',
  scene: 'office_morning',
  act: 1,
  text: '',
} as StoryNode;

describe('useGameUiLayout', () => {
  afterEach(() => {
    useGamePhaseStore.getState().setExplorationPhase('gameplay');
  });

  it('does not register inventory hotkey outside game phase', () => {
    const togglePanel = vi.fn();
    renderHook(() =>
      useGameUiLayout({
        phase: 'menu',
        gameMode: 'exploration',
        hasCurrentNode: true,
        currentNode: nodeEligibleOverlay,
        togglePanel,
      }),
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
    });
    expect(togglePanel).not.toHaveBeenCalled();
  });

  it('toggles inventory with I in game exploration mode', () => {
    const togglePanel = vi.fn();
    renderHook(() =>
      useGameUiLayout({
        phase: 'game',
        gameMode: 'exploration',
        hasCurrentNode: true,
        currentNode: nodeNoOverlay,
        togglePanel,
      }),
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'I' }));
    });
    expect(togglePanel).toHaveBeenCalledTimes(1);
    expect(togglePanel).toHaveBeenCalledWith('inventory');
  });

  it('hides story overlay during exploration intro cutscene (no stack with IntroCutsceneOverlays)', () => {
    useGamePhaseStore.getState().setExplorationPhase('intro_cutscene');
    const { result } = renderHook(() =>
      useGameUiLayout({
        phase: 'game',
        gameMode: 'exploration',
        hasCurrentNode: true,
        currentNode: nodeEligibleOverlay,
        togglePanel: vi.fn(),
      }),
    );
    expect(result.current.showStoryOverlay).toBe(false);
  });

  it('does not toggle inventory in dialogue mode', () => {
    const togglePanel = vi.fn();
    renderHook(() =>
      useGameUiLayout({
        phase: 'game',
        gameMode: 'dialogue',
        hasCurrentNode: true,
        currentNode: nodeEligibleOverlay,
        togglePanel,
      }),
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
    });
    expect(togglePanel).not.toHaveBeenCalled();
  });
});
