import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAudioCapabilitiesCache } from './audio/audioCapabilities';

function buildMockAudioContext() {
  const gainParam = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };

  return {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createGain: () => ({
      gain: { ...gainParam },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createOscillator: () => ({
      type: 'sine' as OscillatorType,
      frequency: { setValueAtTime: vi.fn() },
      detune: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBiquadFilter: () => ({
      type: 'lowpass' as BiquadFilterType,
      frequency: { value: 1000, setValueAtTime: vi.fn() },
      Q: { value: 0.7 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createBuffer: (_channels: number, length: number, _sampleRate: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createConvolver: () => ({
      buffer: {} as AudioBuffer,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createPanner: () => ({
      panningModel: 'equalpower' as PanningModelType,
      positionX: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createStereoPanner: () => ({
      pan: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    resume: vi.fn().mockResolvedValue(undefined),
  } as unknown as AudioContext;
}

const { mockGetSharedAudioContext } = vi.hoisted(() => ({
  mockGetSharedAudioContext: vi.fn(() => buildMockAudioContext()),
}));

vi.mock('./SharedAudioContext', () => ({
  getSharedAudioContext: mockGetSharedAudioContext,
  safeResume: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/shared/dev/hmrDispose', () => ({
  registerHmrDispose: vi.fn(),
}));

import {
  disposeMusicEngine,
  musicEngine,
  reviveMusicEngine,
} from './MusicEngine';

type MusicEngineInternal = {
  initContext: () => void;
  padConvolver: ConvolverNode | null;
  playMelodyNote: (config: {
    scale: { intervals: number[] };
    rootMidi: number;
    melodyType: OscillatorType;
    melodyGain: number;
  }) => void;
};

describe('MusicEngine dispose', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAudioCapabilitiesCache();
    mockGetSharedAudioContext.mockImplementation(() => buildMockAudioContext());
    reviveMusicEngine();
  });

  afterEach(() => {
    disposeMusicEngine();
    vi.useRealTimers();
    resetAudioCapabilitiesCache();
  });

  it('disconnects pad convolver immediately on dispose without waiting for fade timer', () => {
    const convolver = {
      buffer: {} as AudioBuffer,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const internal = musicEngine as unknown as MusicEngineInternal;
    internal.initContext();
    internal.padConvolver = convolver as unknown as ConvolverNode;

    disposeMusicEngine();

    expect(convolver.disconnect).toHaveBeenCalled();
    expect(convolver.buffer).toBeNull();
    expect(internal.padConvolver).toBeNull();

    vi.advanceTimersByTime(5_000);
    expect(convolver.disconnect).toHaveBeenCalledTimes(1);
  });

  it('melody note cleanup disconnects nodes when dispose invalidates scene generation', () => {
    const melodyNodes: Array<{ disconnect: ReturnType<typeof vi.fn> }> = [];
    const ctx = buildMockAudioContext();
    (ctx as unknown as {
      createBiquadFilter: () => BiquadFilterNode;
      createGain: () => GainNode;
    }).createBiquadFilter = vi.fn(() => {
      const node = {
        type: 'lowpass' as BiquadFilterType,
        frequency: { value: 2000 },
        Q: { value: 0.5 },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      melodyNodes.push(node);
      return node as unknown as BiquadFilterNode;
    });
    (ctx as unknown as { createGain: () => GainNode }).createGain = vi.fn(() => {
      const node = {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      melodyNodes.push(node);
      return node as unknown as GainNode;
    });
    mockGetSharedAudioContext.mockReturnValue(ctx);

    const internal = musicEngine as unknown as MusicEngineInternal;
    internal.initContext();

    const originalRandom = Math.random;
    Math.random = () => 0;

    internal.playMelodyNote({
      scale: { intervals: [0, 3, 5, 7, 10] },
      rootMidi: 48,
      melodyType: 'sine',
      melodyGain: 0.008,
    });

    disposeMusicEngine();
    vi.advanceTimersByTime(5_000);

    expect(melodyNodes.every((node) => node.disconnect.mock.calls.length > 0)).toBe(true);

    Math.random = originalRandom;
  });
});
