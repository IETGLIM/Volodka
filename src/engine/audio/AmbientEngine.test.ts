import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

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
      start: vi.fn(),
      stop: vi.fn(),
    }),
    createBiquadFilter: () => ({
      type: 'lowpass' as BiquadFilterType,
      frequency: { value: 1000 },
      Q: { value: 0.7 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createBuffer: (_channels: number, length: number, _sampleRate: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => ({
      buffer: null as AudioBuffer | null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }),
    resume: vi.fn().mockResolvedValue(undefined),
  } as unknown as AudioContext;
}

const { mockGetSharedAudioContext } = vi.hoisted(() => ({
  mockGetSharedAudioContext: vi.fn(() => buildMockAudioContext()),
}));

vi.mock('../SharedAudioContext', () => ({
  getSharedAudioContext: mockGetSharedAudioContext,
}));

import { AmbientSoundPlayer } from './AmbientEngine';

describe('AmbientSoundPlayer crossfade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetSharedAudioContext.mockImplementation(() => buildMockAudioContext());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps latest type when play() is called in quick succession', () => {
    const player = new AmbientSoundPlayer();

    player.play('rain', 1000);
    player.play('snow', 1000);
    player.play('street', 1000);

    expect(player.getCurrentType()).toBe('street');
  });

  it('does not treat a fading outgoing instance as current during transition', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as {
      currentAmbient: { fadingOut: boolean } | null;
    };

    player.play('rain', 2000);
    player.play('snow', 2000);

    expect(internal.currentAmbient?.fadingOut).not.toBe(true);
    expect(player.getCurrentType()).toBe('snow');
  });

  it('clears scheduleRandomSound timers on dispose and scene change', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as {
      pendingRandomTimers: Set<ReturnType<typeof setTimeout>>;
    };

    player.play('cafe', 2000);
    expect(internal.pendingRandomTimers.size).toBeGreaterThan(0);

    player.play('office', 2000);
    player.dispose();

    expect(internal.pendingRandomTimers.size).toBe(0);

    vi.advanceTimersByTime(120_000);
    expect(player.getCurrentType()).toBeNull();
  });
});
