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
  generateMelodyMotif,
  musicEngine,
  pickWeightedQualityForDegree,
  reviveMusicEngine,
} from './MusicEngine';

const VALID_QUALITIES: ReadonlySet<string> = new Set([
  'triad', 'seventh', 'sus2', 'sus4', 'add9', 'open5',
]);

/* ─── v4.47.0: регресс-тесты музыкальной вариативности (прогрессии/фразы) ─── */
describe('MusicEngine musical variety (v4.47.0)', () => {
  it('pickWeightedQualityForDegree возвращает только допустимые качества', () => {
    for (let i = 0; i < 200; i++) {
      const q = pickWeightedQualityForDegree(Math.floor(Math.random() * 14));
      expect(VALID_QUALITIES.has(q)).toBe(true);
    }
  });

  it('тоника (ступень 0) не даёт sus4 — напряжение остаётся на D-функции', () => {
    // Статистическая гарантия: 200 прогонов, sus4 отсутствует в весах тоники
    for (let i = 0; i < 200; i++) {
      expect(pickWeightedQualityForDegree(0)).not.toBe('sus4');
    }
  });

  it('generateMelodyMotif: 3–6 нот, все в ладе, первая — аккордовая', () => {
    // C minor pentatonic, root C3 (48), аккорд C-Eb-G
    const scale = { name: 'test', intervals: [0, 3, 5, 7, 10] };
    const chord = [48, 51, 55];
    for (let i = 0; i < 100; i++) {
      const motif = generateMelodyMotif(scale, 48, chord, 'exploration');
      expect(motif.length).toBeGreaterThanOrEqual(3);
      expect(motif.length).toBeLessThanOrEqual(6);
      // Первая нота — аккордовая (+12/+24), консонанс гарантирован
      expect(chord.map((c) => c + 12).concat(chord.map((c) => c + 24))).toContain(motif[0]);
      // Все ноты принадлежат ладу (периодичность октавы)
      for (const n of motif) {
        const pitchClass = ((n - 48) % 12 + 12) % 12;
        expect(scale.intervals).toContain(pitchClass);
        expect(n).toBeGreaterThanOrEqual(48);
        expect(n).toBeLessThanOrEqual(48 + 48);
      }
    }
  });

  it('generateMelodyMotif: combat-фразы плотнее (4–6 нот)', () => {
    const scale = { name: 'test', intervals: [0, 2, 3, 5, 7, 8, 10] };
    const chord = [50, 53, 57];
    for (let i = 0; i < 100; i++) {
      const motif = generateMelodyMotif(scale, 50, chord, 'combat');
      expect(motif.length).toBeGreaterThanOrEqual(4);
      expect(motif.length).toBeLessThanOrEqual(6);
    }
  });

  it('generateMelodyMotif: диапазон мотива — в пределах октавы от старта', () => {
    const scale = { name: 'test', intervals: [0, 3, 5, 7, 10] };
    const chord = [48, 51, 55];
    for (let i = 0; i < 100; i++) {
      const motif = generateMelodyMotif(scale, 48, chord);
      const min = Math.min(...motif);
      const max = Math.max(...motif);
      expect(max - min).toBeLessThanOrEqual(12);
    }
  });
});

/* ─── v4.38.0: инструментированный мок — регресс-тесты слышимости шины ───
 * Фон: «музыка отсутствует» — padGain создавался в 0 и никогда не взводился
 * (пэд молчал с v3.1.0), а бас/мелодия лежали на −42…−48 дБ.
 * Фикс: ramp padGain 0→1, makeup ×30, бусты слоёв (бас ×12, мелодия ×10/×3), лимитер master→compressor→destination. */
function buildInstrumentedAudioContext() {
  const gainNodes: Array<{
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];

  const compressor = {
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 1 },
    attack: { value: 0 },
    release: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const destination = {};

  const ctx = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination,
    createGain: () => {
      const node = {
        gain: {
          value: 1,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gainNodes.push(node);
      return node;
    },
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
    createDynamicsCompressor: () => compressor,
    resume: vi.fn().mockResolvedValue(undefined),
  } as unknown as AudioContext;

  return { ctx, gainNodes, compressor, destination };
}

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

/* ─── v4.38.0: регресс-тесты слышимости музыкальной шины («музыка отсутствует») ─── */
describe('MusicEngine audible bus (v4.38.0)', () => {
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

  it('pad bus ramps to 1 when bed starts — раньше padGain навсегда оставался в 0', () => {
    const { ctx, gainNodes } = buildInstrumentedAudioContext();
    mockGetSharedAudioContext.mockReturnValue(ctx);

    musicEngine.playSceneMusic('volodka_room');
    vi.advanceTimersByTime(10);

    // Единственный узел, чей ramp целится в ~1 — padGain (голоса ≤ 0.5,
    // мастер-фейд = config.masterGain × makeup × volume; при громкости 100%
    // может превышать 1 — выбросы гасит лимитер (−6 дБ, 12:1).
    const rampsToOne = gainNodes.flatMap((n) =>
      n.gain.linearRampToValueAtTime.mock.calls,
    ).filter((args) => (args[0] as number) >= 0.99);
    expect(rampsToOne.length).toBeGreaterThan(0);
  });

  it('master fade-in target includes ×30 makeup (volodka_room: 0.04×30×0.5 = 0.6)', () => {
    const { ctx, gainNodes } = buildInstrumentedAudioContext();
    mockGetSharedAudioContext.mockReturnValue(ctx);

    musicEngine.playSceneMusic('volodka_room'); // masterGain 0.04, volume 0.5 по умолчанию
    vi.advanceTimersByTime(10);

    // masterGainNode — первый созданный gain (initContext)
    const master = gainNodes[0];
    const rampCalls = master.gain.linearRampToValueAtTime.mock.calls;
    expect(rampCalls.length).toBeGreaterThan(0);
    expect(rampCalls[0][0]).toBeCloseTo(0.6, 5);
  });

  it('limiter sits between master gain and destination (threshold −6 dB, ratio 12)', () => {
    const { ctx, gainNodes, compressor, destination } = buildInstrumentedAudioContext();
    mockGetSharedAudioContext.mockReturnValue(ctx);

    musicEngine.playSceneMusic('volodka_room');
    vi.advanceTimersByTime(10);

    expect(compressor.threshold.value).toBe(-6);
    expect(compressor.ratio.value).toBe(12);
    // master → compressor → ctx.destination
    const master = gainNodes[0];
    expect(master.connect.mock.calls.some((c) => c[0] === compressor)).toBe(true);
    expect(compressor.connect.mock.calls.some((c) => c[0] === destination)).toBe(true);
  });

  it('dispose disconnects the bus limiter immediately', () => {
    const { ctx, compressor } = buildInstrumentedAudioContext();
    mockGetSharedAudioContext.mockReturnValue(ctx);

    musicEngine.playSceneMusic('volodka_room');
    vi.advanceTimersByTime(10);

    expect(compressor.disconnect).not.toHaveBeenCalled();
    disposeMusicEngine();
    expect(compressor.disconnect).toHaveBeenCalledTimes(1);
  });
});
