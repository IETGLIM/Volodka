import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useGameSessionFlow } from './useGameSessionFlow';

describe('useGameSessionFlow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('detects existing save from localStorage', () => {
    localStorage.setItem('volodka_save_v3', '{"ok":true}');

    const { result } = renderHook(() =>
      useGameSessionFlow({
        setPhase: vi.fn(),
        setGameMode: vi.fn(),
        setCurrentNode: vi.fn(),
        saveGameToStore: vi.fn(),
        loadGameFromStore: vi.fn(),
        resetGameStore: vi.fn(),
      }),
    );

    expect(result.current.hasSavedGame).toBe(true);
  });

  it('starts new game with expected flow', () => {
    const setPhase = vi.fn();
    const resetGameStore = vi.fn();

    const { result } = renderHook(() =>
      useGameSessionFlow({
        setPhase,
        saveGameToStore: vi.fn(),
        loadGameFromStore: vi.fn(),
        resetGameStore,
      }),
    );

    act(() => {
      result.current.handleStartNewGame();
    });

    expect(resetGameStore).toHaveBeenCalledTimes(1);
    expect(setPhase).toHaveBeenCalledWith('intro');
  });

  it('saves game with manual source', () => {
    const saveGameToStore = vi.fn();

    const { result } = renderHook(() =>
      useGameSessionFlow({
        setPhase: vi.fn(),
        setGameMode: vi.fn(),
        setCurrentNode: vi.fn(),
        saveGameToStore,
        loadGameFromStore: vi.fn(),
        resetGameStore: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleSaveGame();
    });

    expect(saveGameToStore).toHaveBeenCalledTimes(1);
    expect(saveGameToStore).toHaveBeenCalledWith({ source: 'manual' });
  });
});
