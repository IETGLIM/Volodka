import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, vi } from 'vitest';

vi.mock('framer-motion', () => {
  const MotionStub = React.forwardRef(
    ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref) => {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        layoutId: _layoutId,
        variants: _variants,
        ...domProps
      } = props;
      return React.createElement('div', { ref, ...domProps }, children);
    },
  );
  MotionStub.displayName = 'MotionStub';

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(
      {},
      {
        get: () => MotionStub,
      },
    ),
    useReducedMotion: () => false,
  };
});

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const canvasContextStub = {
  fillStyle: '',
  font: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
};

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => canvasContextStub,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
