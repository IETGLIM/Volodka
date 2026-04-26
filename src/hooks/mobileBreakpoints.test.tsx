import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useIsMobile, useTouchGameControls } from '@/hooks/use-mobile';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';

type MediaState = {
  width: number;
  coarse: boolean;
  reducedMotion: boolean;
};

function installMatchMedia(state: MediaState) {
  const listeners = new Map<string, Set<() => void>>();

  const evaluate = (query: string) => {
    if (query.includes('pointer: coarse')) return state.coarse;
    if (query.includes('prefers-reduced-motion: reduce')) return state.reducedMotion;
    const widthMatch = query.match(/max-width:\s*(\d+)px/);
    if (widthMatch) return state.width <= Number(widthMatch[1]);
    return false;
  };

  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => {
      const api = {
        media: query,
        matches: evaluate(query),
        addEventListener: (_: string, cb: () => void) => {
          const set = listeners.get(query) ?? new Set<() => void>();
          set.add(cb);
          listeners.set(query, set);
        },
        removeEventListener: (_: string, cb: () => void) => {
          listeners.get(query)?.delete(cb);
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        onchange: null,
        dispatchEvent: vi.fn(),
      };
      return api;
    }),
  );

  return () => {
    for (const [query, callbacks] of listeners.entries()) {
      for (const cb of callbacks) cb();
      listeners.set(query, callbacks);
    }
  };
}

describe('mobile breakpoint hooks', () => {
  const state: MediaState = { width: 1280, coarse: false, reducedMotion: false };
  let notifyMediaChange = () => {};

  beforeEach(() => {
    notifyMediaChange = installMatchMedia(state);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('treats tablet-sized widths consistently as mobile and visual-lite', async () => {
    state.width = 900;
    const mobile = renderHook(() => useIsMobile());
    const perf = renderHook(() => useMobileVisualPerf());

    act(() => {
      notifyMediaChange();
    });

    await waitFor(() => {
      expect(mobile.result.current).toBe(true);
      expect(perf.result.current).toBe(true);
    });
  });

  test('shows touch controls for coarse pointer devices even on wide screens', async () => {
    state.width = 1400;
    state.coarse = true;

    const controls = renderHook(() => useTouchGameControls());
    act(() => {
      notifyMediaChange();
    });

    await waitFor(() => {
      expect(controls.result.current).toBe(true);
    });
  });

  test('visual lite from reduced motion on wide desktop without enabling touch HUD', async () => {
    state.width = 1400;
    state.coarse = false;
    state.reducedMotion = true;

    const perf = renderHook(() => useMobileVisualPerf());
    const controls = renderHook(() => useTouchGameControls());

    act(() => {
      notifyMediaChange();
    });

    await waitFor(() => {
      expect(perf.result.current).toBe(true);
      expect(controls.result.current).toBe(false);
    });
  });

  test('wide screen + fine pointer: not mobile, not touch HUD, not visual lite', async () => {
    state.width = 1400;
    state.coarse = false;
    state.reducedMotion = false;

    const mobile = renderHook(() => useIsMobile());
    const perf = renderHook(() => useMobileVisualPerf());
    const controls = renderHook(() => useTouchGameControls());

    act(() => {
      notifyMediaChange();
    });

    await waitFor(() => {
      expect(mobile.result.current).toBe(false);
      expect(perf.result.current).toBe(false);
      expect(controls.result.current).toBe(false);
    });
  });
});
