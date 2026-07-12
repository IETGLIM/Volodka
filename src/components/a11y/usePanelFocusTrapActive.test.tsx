import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  useGamePanelStackOpen,
  usePanelFocusTrapActive,
} from '@/components/a11y/usePanelFocusTrapActive';
import {
  PanelIdContext,
  PanelStackProvider,
} from '@/components/game/orchestrator/PanelStackContext';
import type { NonNullPanelType } from '@/components/game/orchestrator/panelStackReducer';

function createWrapper(stack: NonNullPanelType[], panelId: NonNullPanelType | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <PanelStackProvider stack={stack}>
        <PanelIdContext.Provider value={panelId}>{children}</PanelIdContext.Provider>
      </PanelStackProvider>
    );
  };
}

describe('usePanelFocusTrapActive', () => {
  it('traps when panel is top of stack', () => {
    const { result } = renderHook(() => usePanelFocusTrapActive(), {
      wrapper: createWrapper(['inventory'], 'inventory'),
    });
    expect(result.current).toBe(true);
  });

  it('does not trap when panel is buried under another panel', () => {
    const { result } = renderHook(() => usePanelFocusTrapActive(), {
      wrapper: createWrapper(['menu', 'inventory'], 'menu'),
    });
    expect(result.current).toBe(false);
  });

  it('respects explicit active=false', () => {
    const { result } = renderHook(() => usePanelFocusTrapActive(false), {
      wrapper: createWrapper(['inventory'], 'inventory'),
    });
    expect(result.current).toBe(false);
  });

  it('traps outside panel stack context', () => {
    const { result } = renderHook(() => usePanelFocusTrapActive());
    expect(result.current).toBe(true);
  });
});

describe('useGamePanelStackOpen', () => {
  it('is true when stack is non-empty', () => {
    const { result } = renderHook(() => useGamePanelStackOpen(), {
      wrapper: createWrapper(['journal'], 'journal'),
    });
    expect(result.current).toBe(true);
  });

  it('is false when stack is empty', () => {
    const { result } = renderHook(() => useGamePanelStackOpen(), {
      wrapper: createWrapper([], null),
    });
    expect(result.current).toBe(false);
  });
});
