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
  pendingAnimationFrameCallbacks.clear();
  cleanup();
});

const canvasContextStub = {
  fillStyle: '',
  font: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
};

class MockAudioContext {
  state: AudioContextState = 'running';
  destination = {};
  currentTime = 0;
  sampleRate = 44_100;

  createGain() {
    return { connect: vi.fn(), gain: { value: 1 } };
  }

  createBuffer() {
    return { getChannelData: vi.fn(() => new Float32Array(0)) };
  }

  createBufferSource() {
    return { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), buffer: null };
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 },
    };
  }

  createAnalyser() {
    return {
      connect: vi.fn(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
    };
  }

  createBiquadFilter() {
    return { connect: vi.fn(), frequency: { value: 350 }, Q: { value: 1 } };
  }

  createConvolver() {
    return { connect: vi.fn(), buffer: null };
  }

  decodeAudioData() {
    return Promise.resolve(this.createBuffer() as AudioBuffer);
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
}

class MockOffscreenCanvas {
  width = 0;
  height = 0;

  getContext() {
    return canvasContextStub;
  }

  convertToBlob() {
    return Promise.resolve(new Blob());
  }
}

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(_callback: ResizeObserverCallback) {}
}

let animationFrameId = 0;
const pendingAnimationFrameCallbacks = new Map<number, FrameRequestCallback>();

const requestAnimationFrameMock = (callback: FrameRequestCallback): number => {
  animationFrameId += 1;
  pendingAnimationFrameCallbacks.set(animationFrameId, callback);
  return animationFrameId;
};

const cancelAnimationFrameMock = (id: number): void => {
  pendingAnimationFrameCallbacks.delete(id);
};

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);
vi.stubGlobal('OffscreenCanvas', MockOffscreenCanvas);
vi.stubGlobal('ResizeObserver', MockResizeObserver);
vi.stubGlobal('requestAnimationFrame', requestAnimationFrameMock);
vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameMock);

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  configurable: true,
  value: requestAnimationFrameMock,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  configurable: true,
  value: cancelAnimationFrameMock,
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

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => canvasContextStub,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
