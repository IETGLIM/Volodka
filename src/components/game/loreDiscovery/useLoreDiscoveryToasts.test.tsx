import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  LORE_DISCOVERED_EVENT,
  LORE_TOAST_EXIT_BUFFER_MS,
  LORE_TOAST_QUEUE_DELAY_MS,
} from '@/engine/lore/loreDiscoveryConstants';
import { getLoreToastDurationMs } from '@/engine/lore/loreDiscoveryPresentation';
import { useLoreDiscoveryToasts } from '@/components/game/loreDiscovery/useLoreDiscoveryToasts';

describe('useLoreDiscoveryToasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('queues lore:discovered events', () => {
    const { result } = renderHook(() => useLoreDiscoveryToasts());
    act(() => {
      eventBus.emit(LORE_DISCOVERED_EVENT, {
        id: 'lore-1',
        title: 'Запись',
        rarity: 'rare',
      });
      vi.advanceTimersByTime(LORE_TOAST_QUEUE_DELAY_MS + 10);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.title).toBe('Запись');
  });

  it('auto-dismisses after duration plus exit buffer', () => {
    const { result } = renderHook(() => useLoreDiscoveryToasts());
    act(() => {
      eventBus.emit(LORE_DISCOVERED_EVENT, {
        id: 'lore-1',
        title: 'Запись',
        rarity: 'common',
      });
      vi.advanceTimersByTime(LORE_TOAST_QUEUE_DELAY_MS + 10);
    });
    expect(result.current.toasts).toHaveLength(1);

    const duration = getLoreToastDurationMs('common') + LORE_TOAST_EXIT_BUFFER_MS;
    act(() => {
      vi.advanceTimersByTime(duration + 10);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
