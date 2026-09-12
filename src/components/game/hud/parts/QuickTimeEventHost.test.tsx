import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickTimeEventHost } from '@/components/game/hud/parts/QuickTimeEventHost';
import { eventBus } from '@/engine/EventBus';
import {
  isGameplayOverlayLocomotionLocked,
  resetPlayerLocomotionGateForTests,
  setPanelStackLocomotionGate,
} from '@/engine/player/playerLocomotionGate';
import type { QteStartPayload } from '@/engine/events/qteEvents';

const playSfxMock = vi.fn();

vi.mock('@/engine/audio/AudioEngine', () => ({
  audioEngine: {
    playSfx: (name: string) => playSfxMock(name),
  },
}));

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => false,
}));

function mashPayload(overrides?: Partial<QteStartPayload>): QteStartPayload {
  return {
    id: 'qte-test-1',
    eventType: 'mash',
    keyBindings: [{ display: 'ПРОБЕЛ', code: 'Space' }],
    duration: 5000,
    targetPresses: 2,
    ...overrides,
  };
}

describe('QuickTimeEventHost (v4.30 — запуск QTE через EventBus)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetPlayerLocomotionGateForTests();
    playSfxMock.mockClear();
  });
  afterEach(() => {
    cleanup();
    resetPlayerLocomotionGateForTests();
    vi.useRealTimers();
  });

  it('qte:start монтирует оверлей и ставит локомоция-гейт', () => {
    render(<QuickTimeEventHost />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isGameplayOverlayLocomotionLocked()).toBe(false);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });

    expect(screen.getByRole('dialog', { name: 'Быстрое событие: mash' })).toBeInTheDocument();
    expect(isGameplayOverlayLocomotionLocked()).toBe(true);
    // Стартовый звук из выделенных пресетов QTE.
    expect(playSfxMock).toHaveBeenCalledWith('qte_start');
  });

  it('повторный qte:start, пока активен предыдущий, отбрасывается', () => {
    render(<QuickTimeEventHost />);
    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });
    act(() => {
      eventBus.emit('qte:start', { ...mashPayload(), id: 'qte-test-2', eventType: 'press' });
    });

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Быстрое событие: mash' })).toBeInTheDocument();
  });

  it('занятый экран (панель-гейт) блокирует запуск QTE', () => {
    setPanelStackLocomotionGate(true);
    render(<QuickTimeEventHost />);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('успех эмитит qte:resolve один раз, гейт снимается после размонтирования', () => {
    const resolveListener = vi.fn();
    const unsub = eventBus.on('qte:resolve', (payload) => resolveListener(payload));
    render(<QuickTimeEventHost />);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });
    // Два нажатия = targetPresses → success.
    for (let i = 0; i < 2; i++) {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    }

    expect(resolveListener).toHaveBeenCalledWith({ id: 'qte-test-1', result: 'success' });
    expect(playSfxMock).toHaveBeenCalledWith('qte_success');

    // Экран результата держится RESULT_HOLD_MS, затем оверлей размонтируется.
    expect(isGameplayOverlayLocomotionLocked()).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isGameplayOverlayLocomotionLocked()).toBe(false);

    unsub();
  });

  it('Escape эмитит resolve с результатом cancelled и закрывает сразу', () => {
    const resolveListener = vi.fn();
    const unsub = eventBus.on('qte:resolve', (payload) => resolveListener(payload));
    render(<QuickTimeEventHost />);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });
    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

    expect(resolveListener).toHaveBeenCalledWith({ id: 'qte-test-1', result: 'cancelled' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isGameplayOverlayLocomotionLocked()).toBe(false);

    unsub();
  });

  it('v4.31: closed эмитится сразу при cancelled (оверлей ушёл — экран свободен)', () => {
    const closedListener = vi.fn();
    const unsub = eventBus.on('qte:closed', (payload) => closedListener(payload));
    render(<QuickTimeEventHost />);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });
    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

    expect(closedListener).toHaveBeenCalledTimes(1);
    expect(closedListener).toHaveBeenCalledWith({ id: 'qte-test-1', result: 'cancelled' });

    unsub();
  });

  it('v4.31: closed эмитится один раз после экрана результата (успех)', () => {
    const closedListener = vi.fn();
    const unsub = eventBus.on('qte:closed', (payload) => closedListener(payload));
    render(<QuickTimeEventHost />);

    act(() => {
      eventBus.emit('qte:start', mashPayload());
    });
    for (let i = 0; i < 2; i++) {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    }

    // Resolve уже случился, но экран результата ещё держится — closed нет.
    expect(closedListener).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(closedListener).toHaveBeenCalledTimes(1);
    expect(closedListener).toHaveBeenCalledWith({ id: 'qte-test-1', result: 'success' });

    unsub();
  });
});
