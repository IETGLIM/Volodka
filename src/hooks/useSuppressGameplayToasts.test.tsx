import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSuppressGameplayToasts } from '@/hooks/useSuppressGameplayToasts';
import {
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';

/* FIX (v4.48.6): хук расширен нарративным оверлеем — тестируем все ветки.
 * v4.57.0: плюс осмотр, диегетика и катсцена. */

let mockStack: unknown[] = [];
let mockShowStoryOverlay = false;
let mockDiegeticNarrative: { nodeId: string; kind: 'story' | 'dialogue' } | null = null;
let mockActiveCutsceneId: string | null = null;

vi.mock('@/components/game/orchestrator/PanelStackContext', () => ({
  usePanelStack: () => ({ stack: mockStack }),
}));

vi.mock('@/store/gameStore', () => ({
  useGameStore: (selector: (s: {
    showStoryOverlay: boolean;
    diegeticNarrative: { nodeId: string; kind: 'story' | 'dialogue' } | null;
    activeCutsceneId: string | null;
  }) => boolean) =>
    selector({
      showStoryOverlay: mockShowStoryOverlay,
      diegeticNarrative: mockDiegeticNarrative,
      activeCutsceneId: mockActiveCutsceneId,
    }),
}));

describe('useSuppressGameplayToasts', () => {
  beforeEach(() => {
    mockStack = [];
    mockShowStoryOverlay = false;
    mockDiegeticNarrative = null;
    mockActiveCutsceneId = null;
    resetGltfPreloadOverlayGateForTests();
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

  it('подавляет тосты при открытой диегетической плашке (v4.57.0)', () => {
    mockDiegeticNarrative = { nodeId: 'start', kind: 'story' };
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(true);
  });

  it('подавляет тосты во время катсцены (v4.57.0)', () => {
    mockActiveCutsceneId = 'intro_wakeup';
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(true);
  });

  it('подавляет тосты при открытой панели осмотра (v4.57.0)', () => {
    act(() => {
      setExamineOverlayAssetGate(true);
    });
    const { result } = renderHook(() => useSuppressGameplayToasts());
    expect(result.current).toBe(true);
    act(() => {
      setExamineOverlayAssetGate(false);
    });
    expect(result.current).toBe(false);
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
