import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSuppressGameplayToasts } from '@/hooks/useSuppressGameplayToasts';

/* FIX (v4.48.6): хук расширен нарративным оверлеем — тестируем все три ветки. */

let mockStack: unknown[] = [];
let mockShowStoryOverlay = false;

vi.mock('@/components/game/orchestrator/PanelStackContext', () => ({
  usePanelStack: () => ({ stack: mockStack }),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (s: { showStoryOverlay: boolean }) => boolean) =>
    selector({ showStoryOverlay: mockShowStoryOverlay }),
}));

describe('useSuppressGameplayToasts', () => {
  beforeEach(() => {
    mockStack = [];
    mockShowStoryOverlay = false;
  });

  it('не подавляет тосты, когда панели закрыты и нарратива нет', () => {
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(false);
  });

  it('подавляет тосты при открытой панели (инвентарь/пауза)', () => {
    mockStack = [{ panel: 'inventory' }];
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(true);
  });

  it('подавляет тосты при открытом нарративном оверлее (v4.48.6)', () => {
    mockShowStoryOverlay = true;
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(true);
  });

  it('реагирует на смену нарративного флага на лету', () => {
    const { result, rerender } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(false);

    act(() => {
      mockShowStoryOverlay = true;
    });
    rerender();
    expect(result.current).toBe(true);
  });
});
