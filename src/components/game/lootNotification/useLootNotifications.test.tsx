import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import { LOOT_NOTIFICATION_DISMISS_MS } from '@/engine/loot/lootNotificationPresentation';
import { useLootNotifications } from '@/components/game/lootNotification/useLootNotifications';

describe('useLootNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to loot notification events', () => {
    const { result } = renderHook(() => useLootNotifications());
    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'xp', label: '+10 опыта' });
    });
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]?.label).toBe('+10 опыта');
  });

  it('auto-dismisses after LOOT_NOTIFICATION_DISMISS_MS', () => {
    const { result } = renderHook(() => useLootNotifications());
    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'item', label: 'Test' });
    });
    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(LOOT_NOTIFICATION_DISMISS_MS + 10);
    });
    expect(result.current.notifications).toHaveLength(0);
  });
});
