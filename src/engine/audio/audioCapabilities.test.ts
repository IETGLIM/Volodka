import { describe, expect, it, beforeEach, vi } from 'vitest';

function buildMockContext(options?: {
  panner?: boolean;
  hrtf?: boolean;
  audioParams?: boolean;
  stereoPanner?: boolean;
  convolver?: boolean;
}) {
  const opts = {
    panner: true,
    hrtf: true,
    audioParams: true,
    stereoPanner: true,
    convolver: true,
    ...options,
  };

  return {
    currentTime: 0,
    sampleRate: 44100,
    createGain: () => ({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createPanner: opts.panner
      ? () => {
          const node = {
            panningModel: 'equalpower' as PanningModelType,
            distanceModel: 'inverse' as DistanceModelType,
            positionX: opts.audioParams ? { setValueAtTime: vi.fn() } : undefined,
            positionY: opts.audioParams ? { setValueAtTime: vi.fn() } : undefined,
            positionZ: opts.audioParams ? { setValueAtTime: vi.fn() } : undefined,
            refDistance: 1,
            maxDistance: 30,
            rolloffFactor: 1,
            coneInnerAngle: 360,
            coneOuterAngle: 360,
            coneOuterGain: 0,
            connect: vi.fn(),
            disconnect: vi.fn(),
            setPosition: vi.fn(),
          };
          Object.defineProperty(node, 'panningModel', {
            get() {
              return (node as { _model?: PanningModelType })._model ?? 'equalpower';
            },
            set(value: PanningModelType) {
              if (value === 'HRTF' && !opts.hrtf) {
                throw new Error('HRTF unsupported');
              }
              (node as { _model?: PanningModelType })._model = value;
            },
          });
          return node as unknown as PannerNode;
        }
      : () => {
          throw new Error('Panner unsupported');
        },
    createStereoPanner: opts.stereoPanner
      ? () => ({
          pan: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          disconnect: vi.fn(),
        })
      : () => {
          throw new Error('StereoPanner unsupported');
        },
    createConvolver: opts.convolver
      ? () => ({
          buffer: null as AudioBuffer | null,
          connect: vi.fn(),
          disconnect: vi.fn(),
        })
      : () => {
          throw new Error('Convolver unsupported');
        },
  } as unknown as AudioContext;
}

import {
  connectSpatialSource,
  connectWithStereoPan,
  computeDistanceGain,
  computeStereoPan,
  probeAudioCapabilities,
  resetAudioCapabilitiesCache,
  tryCreateConvolver,
} from './audioCapabilities';

describe('audioCapabilities', () => {
  beforeEach(() => {
    resetAudioCapabilitiesCache();
  });

  it('probes panner, stereo panner, and convolver support', () => {
    const caps = probeAudioCapabilities(buildMockContext());
    expect(caps.panner3d).toBe(true);
    expect(caps.stereoPanner).toBe(true);
    expect(caps.convolver).toBe(true);
  });

  it('falls back to stereo pan when PannerNode throws', () => {
    const ctx = buildMockContext({ panner: false, stereoPanner: true });
    const dest = ctx.createGain();
    const sink = connectSpatialSource(ctx, dest, [5, 0, 0]);
    expect(sink.input).toBeTruthy();
    sink.disconnect();
  });

  it('falls back to dry gain when spatial nodes are unavailable', () => {
    const ctx = buildMockContext({ panner: false, stereoPanner: false });
    const dest = ctx.createGain();
    const sink = connectSpatialSource(ctx, dest, [3, 0, -2]);
    expect(sink.input).toBeTruthy();
    sink.disconnect();
  });

  it('returns null convolver when unsupported', () => {
    const ctx = buildMockContext({ convolver: false });
    const buffer = { length: 1 } as AudioBuffer;
    expect(tryCreateConvolver(ctx, buffer)).toBeNull();
  });

  it('connectWithStereoPan falls back to direct routing', () => {
    const ctx = buildMockContext({ stereoPanner: false });
    const source = ctx.createGain();
    const dest = ctx.createGain();
    connectWithStereoPan(ctx, source, dest, -1, 1, 0, 1);
    expect(source.connect).toHaveBeenCalledWith(dest);
  });

  it('attenuates by distance in dry fallback', () => {
    expect(computeDistanceGain([0, 0, 0], [0, 0, 0], 1, 30, 1)).toBe(1);
    expect(computeDistanceGain([30, 0, 0], [0, 0, 0], 1, 30, 1)).toBe(0);
    expect(computeDistanceGain([20, 0, 0], [0, 0, 0], 1, 30, 1)).toBeCloseTo(0.05);
  });

  it('computes stereo pan from X offset', () => {
    expect(computeStereoPan([6, 0, 0], [0, 0, 0], 12)).toBe(0.5);
    expect(computeStereoPan([-12, 0, 0], [0, 0, 0], 12)).toBe(-1);
  });
});
