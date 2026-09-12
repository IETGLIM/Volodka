import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuickTimeEventOverlay } from '@/components/game/hud/parts/QuickTimeEventOverlay';

vi.mock('@/hooks/useEffectiveReducedMotion', () => ({
  useEffectiveReducedMotion: () => false,
}));

/* press/normal: длительность 3000, окно успеха — последние 35%
 * (windowStart = 1950 мс, near-miss зона — с 1365 мс). */
function makePress(overrides?: Partial<Parameters<typeof QuickTimeEventOverlay>[0]>) {
  return (
    <QuickTimeEventOverlay
      isActive
      eventType="press"
      keyBindings={[{ display: 'E', code: 'KeyE' }]}
      duration={3000}
      {...overrides}
    />
  );
}

describe('QuickTimeEventOverlay (v4.30 — refs-фикс, 10 Гц тик)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('press: раннее нажатие — мгновенный провал', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(makePress({ onSuccess, onFailure }));

    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });

    expect(onFailure).toHaveBeenCalledWith('failure');
    expect(onSuccess).not.toHaveBeenCalled();
    // Экран результата анонсируется.
    expect(screen.getByText('ПРОМАХ!')).toBeInTheDocument();
  });

  it('press: near-miss зона не завершает событие, попадание в окно — успех', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(makePress({ onSuccess, onFailure }));

    act(() => {
      vi.advanceTimersByTime(1500); // 1500 >= windowStart*0.7 (1365) — near-miss
    });
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    expect(onFailure).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(600); // 2100 >= windowStart (1950) — попадание
    });
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });

    expect(onSuccess).toHaveBeenCalledWith('success');
    expect(screen.getByText('УСПЕХ!')).toBeInTheDocument();
  });

  it('press: без ввода — тайм-аут', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(makePress({ onSuccess, onFailure }));

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(onFailure).toHaveBeenCalledWith('timeout');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('mash: серия нажатий до targetPresses — успех; OS-автоповтор не считается', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(
      <QuickTimeEventOverlay
        isActive
        eventType="mash"
        keyBindings={[{ display: 'ПРОБЕЛ', code: 'Space' }]}
        duration={4000}
        targetPresses={5}
        onSuccess={onSuccess}
        onFailure={onFailure}
      />,
    );

    // Автоповтор игнорируется (FIX v4.30).
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(window, { code: 'Space', key: ' ', repeat: true });
    }
    expect(onSuccess).not.toHaveBeenCalled();

    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    }

    expect(onSuccess).toHaveBeenCalledWith('success');
    expect(onFailure).not.toHaveBeenCalled();
  });

  it('sequence: чужая клавиша игнорируется, верная серия завершается успехом', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(
      <QuickTimeEventOverlay
        isActive
        eventType="sequence"
        keyBindings={[
          { display: 'A', code: 'KeyA' },
          { display: 'B', code: 'KeyB' },
          { display: 'C', code: 'KeyC' },
        ]}
        duration={5000}
        onSuccess={onSuccess}
        onFailure={onFailure}
      />,
    );

    fireEvent.keyDown(window, { code: 'KeyX', key: 'x' });
    expect(onFailure).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { code: 'KeyA', key: 'a' });
    fireEvent.keyDown(window, { code: 'KeyB', key: 'b' });
    fireEvent.keyDown(window, { code: 'KeyC', key: 'c' });

    expect(onSuccess).toHaveBeenCalledWith('success');
  });

  it('hold: удержание копит прогресс по времени, отпускание останавливает', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(
      <QuickTimeEventOverlay
        isActive
        eventType="hold"
        keyBindings={[{ display: 'E', code: 'KeyE' }]}
        duration={4000}
        onSuccess={onSuccess}
        onFailure={onFailure}
      />,
    );

    // Удержание 1600 мс при HOLD_FILL_MS=1500 → прогресс ≥ 1 → успех.
    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(onSuccess).toHaveBeenCalledWith('success');
  });

  it('hold: отпускание до порога — тайм-аут вместо успеха', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(
      <QuickTimeEventOverlay
        isActive
        eventType="hold"
        keyBindings={[{ display: 'E', code: 'KeyE' }]}
        duration={4000}
        onSuccess={onSuccess}
        onFailure={onFailure}
      />,
    );

    fireEvent.keyDown(window, { code: 'KeyE', key: 'e' });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.keyUp(window, { code: 'KeyE', key: 'e' });
    act(() => {
      vi.advanceTimersByTime(3700);
    });

    expect(onFailure).toHaveBeenCalledWith('timeout');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('Escape отменяет событие (cancelled без экрана результата)', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(makePress({ onSuccess, onFailure }));

    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

    expect(onFailure).toHaveBeenCalledWith('cancelled');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText('ПРОМАХ!')).not.toBeInTheDocument();
  });

  it('keydown регистрируется ОДИН раз на сессию — инпуты не перерегистрируют слушатель', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    render(makePress());

    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Серия нажатий: раньше каждый инпут снимал и вешал listener заново.
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(window, { code: 'KeyA', key: 'a' }); // чужие клавиши
    }

    const keydownRegistrations = addSpy.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownRegistrations).toHaveLength(1);
    addSpy.mockRestore();
  });

  it('смена identity коллбеков не перезапускает сессию (стабильный таймер)', () => {
    // P0 из аудита: прежний код держал keyBindings/коллбеки в deps таймер-эффекта
    // — инлайн-пропсы перезапускали сессию на каждом рендере и QTE не доходил
    // до конца. Рестарт сбросил бы startTimeRef и тайм-аут не наступил бы.
    const latestFailure = vi.fn();
    const { rerender } = render(makePress({ onFailure: vi.fn() }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Инлайн-массив + новый коллбек — новая identity при перерендере.
    rerender(
      makePress({
        onFailure: latestFailure,
        keyBindings: [{ display: 'E', code: 'KeyE' }],
      }),
    );
    act(() => {
      vi.advanceTimersByTime(2100); // суммарно 3100 мс > длительности
    });

    expect(latestFailure).toHaveBeenCalledWith('timeout');
  });

  it('unmount снимает таймер (нет утечек интервалов)', () => {
    const { unmount } = render(makePress());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('тап по центру (pointerdown) работает как нажатие', () => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    render(makePress({ onSuccess, onFailure }));

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    // Контейнер QTE с onPointerDown (класс hud-filmic-qte-pulse-ring).
    const pad = document.querySelector('.hud-filmic-qte-pulse-ring');
    expect(pad).not.toBeNull();
    fireEvent.pointerDown(pad as Element);
    expect(onSuccess).toHaveBeenCalledWith('success');
  });
});
