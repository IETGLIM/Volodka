import { describe, expect, it, vi } from 'vitest';
import {
  LOCAL_MODEL_PATHS,
  MODEL_FALLBACK_PATH,
  resolveModelUrl,
  resolveModelUrlWithFallback,
  rewriteLegacyModelPath,
} from '@/config/modelUrls';

describe('modelUrls', () => {
  it('rewrites legacy /models/ paths', () => {
    expect(rewriteLegacyModelPath('/models/foo.glb')).toBe('/models-external/foo.glb');
    expect(rewriteLegacyModelPath('/models/Volodka.glb')).toBe(MODEL_FALLBACK_PATH);
  });

  it('returns fallback for invalid player paths', () => {
    expect(resolveModelUrlWithFallback('')).toBe(resolveModelUrl(MODEL_FALLBACK_PATH));
    expect(resolveModelUrlWithFallback('/not-a-model.txt')).toBe(resolveModelUrl(MODEL_FALLBACK_PATH));
  });

  it('passes through absolute URLs', () => {
    const url = 'https://cdn.example.com/volodka.glb';
    expect(resolveModelUrl(url)).toBe(url);
  });

  it('exposes local CC0 paths for asset validation', () => {
    expect(LOCAL_MODEL_PATHS.volodka).toContain('/models-external/');
  });

  it('prefixes VITE_MODELS_BASE when set', () => {
    vi.stubEnv('VITE_MODELS_BASE', 'https://cdn.test/models');
    vi.resetModules();
    return import('@/config/modelUrls').then(({ resolveModelUrl: resolve }) => {
      expect(resolve('/models-external/khronos_cc0_Fox.glb')).toBe(
        'https://cdn.test/models/khronos_cc0_Fox.glb',
      );
    });
  });
});
