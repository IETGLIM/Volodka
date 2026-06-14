import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  createTextSpeed,
  initAccessibilitySettings,
  resetDefaultAccessibilityManager,
  setTextSpeed,
} from '@/engine/accessibility/accessibilitySettings';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

describe('useAccessibilitySettings', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();
  });

  afterEach(() => {
    localStorage.clear();
    resetDefaultAccessibilityManager();
  });

  it('returns hydrated settings on mount', () => {
    localStorage.setItem('volodka_text_speed', '1.6');
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();

    const { result } = renderHook(() => useAccessibilitySettings());
    expect(result.current.textSpeed).toBe(1.6);
  });

  it('updates when accessibility:changed fires', async () => {
    const { result } = renderHook(() => useAccessibilitySettings());
    expect(result.current.textSpeed).toBe(1);

    setTextSpeed(createTextSpeed(1.4));

    await waitFor(() => {
      expect(result.current.textSpeed).toBe(1.4);
    });
  });

  it('syncs cross-tab storage events through the manager', async () => {
    const { result } = renderHook(() => useAccessibilitySettings());

    eventBus.emit('accessibility:changed', {
      changedKey: 'textSpeed',
      settings: {
        ...result.current,
        textSpeed: createTextSpeed(1.8),
      },
    });

    await waitFor(() => {
      expect(result.current.textSpeed).toBe(1.8);
    });
  });
});
