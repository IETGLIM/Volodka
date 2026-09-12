import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLcpElementTag,
  getLcpMs,
  initLcpProfiler,
  resetLcpProfilerForTests,
} from './lcpProfiler';

/* ─── Этап 106: LCP-профилировщик загрузки ───
 *
 * Модуль обязан тихо отключаться в средах без Largest-Contentful-Paint
 * (Firefox/Safari/jsdom/node) и снимать ПОСЛЕДНИЙ LCP-элемент там, где
 * тип поддерживается (проверено через мок PerformanceObserver).
 */
describe('lcpProfiler', () => {
  afterEach(() => {
    resetLcpProfilerForTests();
    vi.unstubAllGlobals();
  });

  it('в среде без window/PerformanceObserver тихо отключается (getLcpMs → null)', () => {
    initLcpProfiler();
    expect(getLcpMs()).toBeNull();
    expect(getLcpElementTag()).toBeNull();
  });

  it('если observe бросил исключение — модуль не падает и отключается', () => {
    vi.stubGlobal('window', {});
    vi.stubGlobal(
      'PerformanceObserver',
      class {
        observe(): void {
          throw new Error('largest-contentful-paint не поддерживается');
        }
      },
    );
    expect(() => initLcpProfiler()).not.toThrow();
    expect(getLcpMs()).toBeNull();
  });

  it('фиксирует последний LCP-элемент и тег крупнейшей отрисовки', () => {
    type Listener = (list: { getEntries: () => unknown[] }) => void;
    // Обёртка вместо let-переменной: присваивание внутри конструктора мок-класса
    // невидимо для сужения типов TS на локальной переменной.
    const capture: { listener: Listener | null } = { listener: null };
    const observedInits: unknown[] = [];

    class FakeObserver {
      constructor(listener: Listener) {
        capture.listener = listener;
      }
      observe(init: unknown): void {
        observedInits.push(init);
      }
      disconnect(): void {
        /* no-op */
      }
    }

    vi.stubGlobal('window', {});
    vi.stubGlobal('PerformanceObserver', FakeObserver);

    initLcpProfiler();
    expect(capture.listener).not.toBeNull();
    // buffered: true — модуль добирает отрисовки до момента подписки.
    expect(observedInits[0]).toMatchObject({ buffered: true });

    capture.listener?.({
      getEntries: () => [
        { startTime: 120, element: { tagName: 'div' } },
        { startTime: 435, element: { tagName: 'IMG' } },
      ],
    });

    expect(getLcpMs()).toBe(435);
    expect(getLcpElementTag()).toBe('IMG');
  });
});
