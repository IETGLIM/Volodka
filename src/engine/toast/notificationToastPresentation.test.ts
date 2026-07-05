import { describe, expect, it } from 'vitest';
import {
  appendToastIfNew,
  buildCombatDefeatToastMessage,
  buildKarmaToastMessage,
  buildToastAccessibleLabel,
  canAcceptNotificationToasts,
  formatToastDelta,
  mapNotificationTypeToToast,
  shouldHideNotificationToastContainer,
  trimIdSet,
} from '@/engine/toast/notificationToastPresentation';

describe('notificationToastPresentation', () => {
  it('maps store notification types to toast types', () => {
    expect(mapNotificationTypeToToast('karma')).toBe('karma');
    expect(mapNotificationTypeToToast('quest')).toBe('quest');
  });

  it('dedupes and caps visible toasts', () => {
    const shown = new Set<string>();
    const toast = {
      id: 'a',
      type: 'karma' as const,
      message: 'test',
      timestamp: 1,
    };
    const first = appendToastIfNew([], toast, shown, true);
    expect(first).toHaveLength(1);
    const second = appendToastIfNew(first, toast, shown, true);
    expect(second).toBe(first);
  });

  it('skips append when acceptance is disabled', () => {
    const shown = new Set<string>();
    const toast = {
      id: 'b',
      type: 'energy' as const,
      message: 'test',
      timestamp: 1,
    };
    expect(appendToastIfNew([], toast, shown, false)).toEqual([]);
  });

  it('trims id sets to cap', () => {
    const ids = new Set(Array.from({ length: 50 }, (_, i) => `id-${i}`));
    trimIdSet(ids, 10);
    expect(ids.size).toBe(10);
    expect([...ids][0]).toBe('id-40');
  });

  it('blocks acceptance during menu and scene loading', () => {
    expect(canAcceptNotificationToasts('menu', 'idle')).toBe(false);
    expect(canAcceptNotificationToasts('exploration', 'loading')).toBe(false);
    expect(canAcceptNotificationToasts('exploration', 'idle')).toBe(true);
  });

  it('hides container when slot is unavailable', () => {
    expect(shouldHideNotificationToastContainer('exploration', 'idle', false)).toBe(true);
    expect(shouldHideNotificationToastContainer('exploration', 'idle', true)).toBe(false);
  });

  it('builds accessible labels and messages', () => {
    expect(buildToastAccessibleLabel('skill', 'Навык +1')).toContain('Навык');
    expect(buildKarmaToastMessage(3)).toBe('Карма +3');
    expect(buildCombatDefeatToastMessage(5)).toContain('-5');
    expect(formatToastDelta(-2)).toBe('-2');
  });
});
