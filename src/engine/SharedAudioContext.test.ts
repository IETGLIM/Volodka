import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('SharedAudioContext gesture handlers', () => {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('window', {
      addEventListener,
      removeEventListener,
    });
    addEventListener.mockClear();
    removeEventListener.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function gestureHandlerCalls() {
    return addEventListener.mock.calls.filter(
      ([event]) => event === 'click' || event === 'keydown' || event === 'touchstart',
    );
  }

  it('registers gesture handlers on load and re-registers after dispose', async () => {
    const { disposeSharedAudioContext } = await import('./SharedAudioContext');

    const initial = gestureHandlerCalls();
    expect(initial).toHaveLength(3);
    expect(initial.every(([, , opts]) => opts?.once === true)).toBe(true);

    addEventListener.mockClear();

    disposeSharedAudioContext();

    const reRegistered = gestureHandlerCalls();
    expect(reRegistered).toHaveLength(3);
    expect(reRegistered.every(([, , opts]) => opts?.once === true)).toBe(true);
  });
});
