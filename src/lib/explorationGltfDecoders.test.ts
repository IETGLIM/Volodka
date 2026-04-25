import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ensureGltfDracoDecoderPathConfigured,
  __resetGltfDracoDecoderPathTestState,
  DEFAULT_DRACO_DECODER_BASE,
} from './explorationGltfDecoders';

const setDecoderPath = vi.fn();

vi.mock('@react-three/drei', () => ({
  useGLTF: Object.assign(() => ({}), {
    setDecoderPath: (...a: unknown[]) => setDecoderPath(...a),
    preload: vi.fn(),
    clear: vi.fn(),
  }),
}));

describe('explorationGltfDecoders', () => {
  beforeEach(() => {
    __resetGltfDracoDecoderPathTestState();
    setDecoderPath.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets decoder path once with default base + trailing slash', () => {
    ensureGltfDracoDecoderPathConfigured();
    expect(setDecoderPath).toHaveBeenCalledTimes(1);
    expect(setDecoderPath).toHaveBeenCalledWith(`${DEFAULT_DRACO_DECODER_BASE}/`);
    ensureGltfDracoDecoderPathConfigured();
    expect(setDecoderPath).toHaveBeenCalledTimes(1);
  });

  it('normalizes env base without trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_DRACO_DECODER_BASE', '/draco');
    ensureGltfDracoDecoderPathConfigured();
    expect(setDecoderPath).toHaveBeenCalledWith('/draco/');
  });
});
