import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindKeyboardInput,
  detachKeyboardListeners,
  sampleKeyboardMovement,
} from '@/engine/keyboardInputState';

describe('keyboardInputState', () => {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const handlers = new Map<string, EventListener>();

  beforeEach(() => {
    handlers.clear();
    addEventListener.mockImplementation((type: string, handler: EventListener) => {
      handlers.set(type, handler);
    });
    removeEventListener.mockImplementation((type: string, handler: EventListener) => {
      if (handlers.get(type) === handler) handlers.delete(type);
    });
    vi.stubGlobal('window', { addEventListener, removeEventListener });
  });

  afterEach(() => {
    detachKeyboardListeners();
    vi.unstubAllGlobals();
  });

  function dispatchKey(type: 'keydown' | 'keyup', code: string): void {
    handlers.get(type)?.({
      code,
      target: null,
      repeat: false,
    } as KeyboardEvent);
  }

  it('attachListeners is idempotent — bindKeyboardInput does not double-register', () => {
    bindKeyboardInput();
    bindKeyboardInput();

    expect(addEventListener).toHaveBeenCalledTimes(3);
    expect(addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
  });

  it('detachKeyboardListeners removes window handlers', () => {
    bindKeyboardInput();
    detachKeyboardListeners();

    expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
  });

  it('detachKeyboardListeners is idempotent', () => {
    bindKeyboardInput();
    detachKeyboardListeners();
    removeEventListener.mockClear();
    detachKeyboardListeners();

    expect(removeEventListener).not.toHaveBeenCalled();
  });

  it('detachKeyboardListeners clears held-key state', () => {
    bindKeyboardInput();
    dispatchKey('keydown', 'KeyW');
    expect(sampleKeyboardMovement().forward).toBe(true);

    detachKeyboardListeners();
    expect(sampleKeyboardMovement().forward).toBe(false);
    expect(sampleKeyboardMovement().hasMovement).toBe(false);
  });

  it('blur does not clear keys while document still has focus', () => {
    bindKeyboardInput();
    dispatchKey('keydown', 'KeyW');
    vi.stubGlobal('document', { hasFocus: () => true });
    handlers.get('blur')?.({} as FocusEvent);
    expect(sampleKeyboardMovement().forward).toBe(true);
    vi.unstubAllGlobals();
    vi.stubGlobal('window', { addEventListener, removeEventListener });
  });

  it('holding KeyX drives the block flag (keyboard block)', () => {
    bindKeyboardInput();
    expect(sampleKeyboardMovement().block).toBe(false);

    dispatchKey('keydown', 'KeyX');
    expect(sampleKeyboardMovement().block).toBe(true);

    // Auto-repeat must not toggle anything — still blocked.
    handlers.get('keydown')?.({
      code: 'KeyX',
      target: null,
      repeat: true,
    } as KeyboardEvent);
    expect(sampleKeyboardMovement().block).toBe(true);

    dispatchKey('keyup', 'KeyX');
    expect(sampleKeyboardMovement().block).toBe(false);
  });

  it('blur clears a held block key', () => {
    bindKeyboardInput();
    dispatchKey('keydown', 'KeyX');
    expect(sampleKeyboardMovement().block).toBe(true);

    vi.stubGlobal('document', { hasFocus: () => false });
    handlers.get('blur')?.({} as FocusEvent);
    expect(sampleKeyboardMovement().block).toBe(false);
    vi.unstubAllGlobals();
    vi.stubGlobal('window', { addEventListener, removeEventListener });
  });
});
