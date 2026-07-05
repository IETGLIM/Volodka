import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  NOTIFY_PRIORITY,
  resetNotificationSlotsForTests,
  useNotificationSlot,
} from './useNotificationSlot';

describe('useNotificationSlot', () => {
  afterEach(() => {
    resetNotificationSlotsForTests();
  });

  it('grants critical channels when non-critical slots are full', () => {
    renderHook(() => useNotificationSlot('quest', NOTIFY_PRIORITY.quest, true));
    renderHook(() => useNotificationSlot('event', NOTIFY_PRIORITY.event, true));
    const { result: system } = renderHook(() =>
      useNotificationSlot('system', NOTIFY_PRIORITY.system, true, { critical: true }),
    );

    expect(system.current).toBe(true);
  });

  it('limits non-critical channels to the visible cap', () => {
    const { result: quest } = renderHook(() =>
      useNotificationSlot('quest', NOTIFY_PRIORITY.quest, true),
    );
    const { result: event } = renderHook(() =>
      useNotificationSlot('event', NOTIFY_PRIORITY.event, true),
    );
    const { result: loot } = renderHook(() =>
      useNotificationSlot('loot', NOTIFY_PRIORITY.loot, true),
    );

    expect(quest.current).toBe(true);
    expect(event.current).toBe(true);
    expect(loot.current).toBe(false);
  });
});
