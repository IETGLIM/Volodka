import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotificationToasts } from '@/components/game/NotificationToasts';

let toastHandler: ((msg: unknown) => void) | undefined;

vi.mock('@/engine/ToastManager', () => ({
  toastManager: {
    subscribe: (handler: (msg: unknown) => void) => {
      toastHandler = handler;
      return vi.fn();
    },
    addToast: vi.fn(),
  },
}));

vi.mock('@/hooks/useTransitionDirector', () => ({
  useTransitionDirector: () => ({ phase: 'idle', progress: 0, targetScene: null }),
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => true,
}));

vi.mock('@/store/selectors', () => ({
  useGamePhase: () => 'exploration',
  useNotifications: () => [],
}));

vi.mock('@/hooks/useNotificationSlot', () => ({
  NOTIFY_PRIORITY: { toast: 70 },
  useNotificationSlot: () => true,
}));

describe('NotificationToasts', () => {
  beforeEach(() => {
    toastHandler = undefined;
  });

  it('renders live region and shows subscribed toast', () => {
    render(<NotificationToasts />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

    act(() => {
      toastHandler?.({
        id: 'toast-1',
        type: 'karma',
        message: 'Карма +2',
        delta: 2,
        timestamp: Date.now(),
      });
    });

    expect(screen.getByRole('alert', { name: /Карма: Карма \+2/ })).toBeInTheDocument();
  });

  it('dismisses toast on click', () => {
    render(<NotificationToasts />);

    act(() => {
      toastHandler?.({
        id: 'toast-2',
        type: 'energy',
        message: 'Энергия +1',
        delta: 1,
        timestamp: Date.now(),
      });
    });

    const toast = screen.getByRole('alert', { name: /Энергия: Энергия \+1/ });
    fireEvent.click(toast);
    expect(screen.queryByRole('alert', { name: /Энергия: Энергия \+1/ })).not.toBeInTheDocument();
  });
});
