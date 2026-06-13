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

  it('registers tab blur/focus handlers and re-registers after dispose/revive', async () => {
    const { disposeSharedAudioContext, reviveSharedAudioContext } = await import('./SharedAudioContext');

    const tabHandlers = () =>
      addEventListener.mock.calls.filter(([event]) => event === 'blur' || event === 'focus');
    expect(tabHandlers()).toHaveLength(2);

    disposeSharedAudioContext();

    addEventListener.mockClear();
    reviveSharedAudioContext();

    const revived = tabHandlers();
    expect(revived).toHaveLength(2);
    expect(revived.map(([event]) => event)).toEqual(['blur', 'focus']);
  });
});
