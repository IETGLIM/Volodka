import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGameUiLayout } from './useGameUiLayout';

describe('useGameUiLayout', () => {
  it('does not register inventory hotkey outside game phase', () => {
    const togglePanel = vi.fn();
    renderHook(() =>
      useGameUiLayout({
        phase: 'menu',
        gameMode: 'exploration',
        currentNodeId: 'start',
        hasCurrentNode: true,
        storyOverlayEligible: true,
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
        currentNodeId: 'explore_mode',
        hasCurrentNode: true,
        storyOverlayEligible: false,
        togglePanel,
      }),
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'I' }));
    });
    expect(togglePanel).toHaveBeenCalledTimes(1);
    expect(togglePanel).toHaveBeenCalledWith('inventory');
  });

  it('does not toggle inventory in dialogue mode', () => {
    const togglePanel = vi.fn();
    renderHook(() =>
      useGameUiLayout({
        phase: 'game',
        gameMode: 'dialogue',
        currentNodeId: 'x',
        hasCurrentNode: true,
        storyOverlayEligible: true,
        togglePanel,
      }),
    );
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
    });
    expect(togglePanel).not.toHaveBeenCalled();
  });
});
