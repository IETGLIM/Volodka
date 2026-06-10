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
      disconnect: vi.fn(),
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

import { AmbientSoundPlayer, getAmbientPlayer, disposeAmbientEngine, ambientEngine } from './AmbientEngine';

describe('AmbientSoundPlayer crossfade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetSharedAudioContext.mockImplementation(() => buildMockAudioContext());
    disposeAmbientEngine();
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

  it('purges orphaned fading layers when play() outruns crossfade duration', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as { fadingAmbients: Set<unknown> };

    player.play('rain', 5000);
    player.play('snow', 5000);
    player.play('street', 5000);

    expect(player.getCurrentType()).toBe('street');
    expect(internal.fadingAmbients.size).toBeLessThanOrEqual(1);
  });

  it('instant crossfade removes outgoing without leaving fading instances', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as { fadingAmbients: Set<unknown> };

    player.play('rain', 2000);
    player.play('snow', 0);

    expect(player.getCurrentType()).toBe('snow');
    expect(internal.fadingAmbients.size).toBe(0);
  });

  it('does not invalidate in-flight transition when play() repeats the same type', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as { transitionGeneration: number };

    player.play('rain', 1000);
    const genAfterFirst = internal.transitionGeneration;

    player.play('rain', 1000);

    expect(internal.transitionGeneration).toBe(genAfterFirst);
    expect(player.getCurrentType()).toBe('rain');
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
      pendingScheduledTimers: Set<ReturnType<typeof setTimeout>>;
    };

    player.play('cafe', 2000);
    expect(internal.pendingScheduledTimers.size).toBeGreaterThan(0);

    player.play('office', 2000);
    player.dispose();

    expect(internal.pendingScheduledTimers.size).toBe(0);

    vi.advanceTimersByTime(120_000);
    expect(player.getCurrentType()).toBeNull();
  });

  it('dispose clears timers on orphaned instances not in current/fading', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as {
      pendingScheduledTimers: Set<ReturnType<typeof setTimeout>>;
      activeAmbients: Set<unknown>;
    };

    player.play('cafe', 5000);
    player.play('office', 5000);
    player.play('street', 5000);

    expect(internal.activeAmbients.size).toBeGreaterThan(0);
    player.dispose();

    expect(internal.pendingScheduledTimers.size).toBe(0);
    expect(internal.activeAmbients.size).toBe(0);

    const timerCountBefore = internal.pendingScheduledTimers.size;
    vi.advanceTimersByTime(120_000);
    expect(internal.pendingScheduledTimers.size).toBe(timerCountBefore);
  });

  it('dispose invalidates in-flight random-sound callbacks before they reschedule', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as {
      pendingScheduledTimers: Set<ReturnType<typeof setTimeout>>;
    };

    player.play('cafe', 2000);
    vi.advanceTimersByTime(60_000);

    const countAfterTick = internal.pendingScheduledTimers.size;
    expect(countAfterTick).toBeGreaterThan(0);

    player.dispose();
    expect(internal.pendingScheduledTimers.size).toBe(0);

    vi.advanceTimersByTime(120_000);
    expect(internal.pendingScheduledTimers.size).toBe(0);
  });

  it('disposeAmbientEngine drops singleton so HMR/StrictMode get a fresh player', () => {
    const first = getAmbientPlayer();
    first.play('rain', 0);

    disposeAmbientEngine();

    const second = getAmbientPlayer();
    expect(second).not.toBe(first);
    expect(second.getCurrentType()).toBeNull();
  });

  it('releases noise loop AudioBuffer when ambient instance is cleaned up', () => {
    const player = new AmbientSoundPlayer();
    const internal = player as unknown as {
      currentAmbient: {
        noiseSource?: { buffer: AudioBuffer | null };
        noiseBuffer?: AudioBuffer;
      } | null;
    };

    player.play('rain', 0);
    const noiseSource = internal.currentAmbient?.noiseSource;
    expect(noiseSource?.buffer).toBeTruthy();
    expect(internal.currentAmbient?.noiseBuffer).toBeTruthy();

    player.stopAll();

    expect(noiseSource?.buffer).toBeNull();
    expect(internal.currentAmbient).toBeNull();
  });

  it('tracks playback FSM through play → playing → dispose', () => {
    const player = new AmbientSoundPlayer();

    expect(player.getPlaybackState()).toBe('idle');
    player.play('rain', 0);
    expect(player.getPlaybackState()).toBe('playing');

    player.dispose();
    expect(player.getPlaybackState()).toBe('disposed');
  });

  it('ambientEngine proxy forwards to the live singleton after dispose', () => {
    disposeAmbientEngine();
    ambientEngine.play('cafe', 0);
    expect(getAmbientPlayer().getCurrentType()).toBe('cafe');
  });
});
