import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useGameSessionFlow } from './useGameSessionFlow';
import { eventBus } from '@/engine/EventBus';

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
        showSaveNotif: vi.fn(),
      }),
    );

    expect(result.current.hasSavedGame).toBe(true);
  });

  it('starts new game with expected flow', () => {
    const setPhase = vi.fn();
    const setGameMode = vi.fn();
    const setCurrentNode = vi.fn();
    const resetGameStore = vi.fn();

    const { result } = renderHook(() =>
      useGameSessionFlow({
        setPhase,
        setGameMode,
        setCurrentNode,
        saveGameToStore: vi.fn(),
        loadGameFromStore: vi.fn(),
        resetGameStore,
        showSaveNotif: vi.fn(),
      }),
    );

    act(() => {
      result.current.handleStartNewGame();
    });

    expect(resetGameStore).toHaveBeenCalledTimes(1);
    expect(setGameMode).toHaveBeenCalledWith('visual-novel');
    expect(setCurrentNode).toHaveBeenCalledWith('start');
    expect(setPhase).toHaveBeenCalledWith('intro');
  });

  it('saves game and emits save event', () => {
    const saveGameToStore = vi.fn();
    const showSaveNotif = vi.fn();
    const emitSpy = vi.spyOn(eventBus, 'emit');

    const { result } = renderHook(() =>
      useGameSessionFlow({
        setPhase: vi.fn(),
        setGameMode: vi.fn(),
        setCurrentNode: vi.fn(),
        saveGameToStore,
        loadGameFromStore: vi.fn(),
        resetGameStore: vi.fn(),
        showSaveNotif,
      }),
    );

    act(() => {
      result.current.handleSaveGame();
    });

    expect(saveGameToStore).toHaveBeenCalledTimes(1);
    expect(showSaveNotif).toHaveBeenCalledWith('Игра сохранена!');
    expect(emitSpy).toHaveBeenCalledWith('game:saved', expect.objectContaining({ timestamp: expect.any(Number) }));

    emitSpy.mockRestore();
  });
});
