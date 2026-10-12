import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import { LOOT_NOTIFICATION_EVENT } from '@/engine/loot/lootNotificationConstants';
import { LOOT_NOTIFICATION_DISMISS_MS } from '@/engine/loot/lootNotificationPresentation';
import { resetToastQueueForTests } from '@/components/game/toastQueue/toastQueueStore';
import { TransientToastStack } from '@/components/game/toastQueue/TransientToastStack';

vi.mock('@/store/selectors', () => ({
  useGamePhase: () => 'exploration',
}));

vi.mock('@/hooks/useSuppressGameplayToasts', () => ({
  useSuppressGameplayToasts: () => false,
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

vi.mock('@/hooks/useNotificationSlot', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useNotificationSlot')>();
  return { ...actual, useNotificationSlot: () => true };
});

/* Фаза 2 (v4.48.6): мост EventBus ui:loot_notification → единая очередь
 * переехал в TransientToastStack (раньше — useLootNotifications). Тесты
 * заменяют удалённый useLootNotifications.test.tsx на уровне стека. */
describe('TransientToastStack — loot-канал единой очереди', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastQueueForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('показывает лут-карточку по событию ui:loot_notification', () => {
    render(<TransientToastStack />);

    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, {
        type: 'item',
        label: 'Ржавый ключ',
        detail: 'Инвентарь: I',
        rarity: 'rare',
      });
    });

    expect(screen.getByRole('alert', { name: /Ржавый ключ/ })).toBeInTheDocument();
    expect(screen.getByText('Ржавый ключ')).toBeInTheDocument();
  });

  it('автоматически убирает карточку по LOOT_NOTIFICATION_DISMISS_MS', () => {
    render(<TransientToastStack />);

    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'xp', label: '+25 опыта' });
    });
    expect(screen.getByRole('alert', { name: /25 опыта/ })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(LOOT_NOTIFICATION_DISMISS_MS + 50);
    });
    expect(screen.queryByRole('alert', { name: /25 опыта/ })).not.toBeInTheDocument();
  });

  it('Escape снимает все лут-карточки (capture-семантика прежнего хука)', () => {
    render(<TransientToastStack />);

    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'item', label: 'Кружка' });
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'karma', label: 'Карма +1' });
    });
    expect(screen.getByRole('alert', { name: /Кружка/ })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: /Карма \+1/ })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('alert', { name: /Кружка/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert', { name: /Карма \+1/ })).not.toBeInTheDocument();
  });

  it('клик по карточке убирает только её', () => {
    render(<TransientToastStack />);

    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'item', label: 'Кружка' });
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'item', label: 'Термос' });
    });

    fireEvent.click(screen.getByRole('alert', { name: /Кружка/ }));

    expect(screen.queryByRole('alert', { name: /Кружка/ })).not.toBeInTheDocument();
    expect(screen.getByRole('alert', { name: /Термос/ })).toBeInTheDocument();
  });

  it('живой анонс последней лут-карточки доступен скринридеру (sr-only status)', () => {
    render(<TransientToastStack />);

    act(() => {
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'item', label: 'Кружка' });
      eventBus.emit(LOOT_NOTIFICATION_EVENT, { type: 'poem', label: 'Ночная смена', detail: 'Стихотворение найдено' });
    });

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Ночная смена. Стихотворение найдено');
  });
});
