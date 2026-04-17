import { describe, expect, it } from 'vitest';
import { isValidPlayerGlbPath, MODEL_URLS, rewriteLegacyModelPath } from './modelUrls';

describe('rewriteLegacyModelPath', () => {
  it('maps legacy /models/ prefix onto the configured public base', () => {
    const mapped = rewriteLegacyModelPath('/models/Volodka.glb');
    expect(mapped.endsWith('/Volodka.glb')).toBe(true);
    expect(mapped).toContain('models-external');
  });

  it('leaves non-legacy paths unchanged', () => {
    expect(rewriteLegacyModelPath('https://cdn.example.com/a.glb')).toBe('https://cdn.example.com/a.glb');
  });
});

describe('isValidPlayerGlbPath', () => {
  it('accepts app-root paths and https URLs to .glb', () => {
    expect(isValidPlayerGlbPath('/models/Volodka.glb')).toBe(true);
    expect(isValidPlayerGlbPath('/models-external/Volodka.glb')).toBe(true);
    expect(isValidPlayerGlbPath('https://cdn.example.com/player.glb')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isValidPlayerGlbPath(undefined)).toBe(false);
    expect(isValidPlayerGlbPath('')).toBe(false);
    expect(isValidPlayerGlbPath('/undefined')).toBe(false);
    expect(isValidPlayerGlbPath('/models/foo')).toBe(false);
    expect(isValidPlayerGlbPath('relative.glb')).toBe(false);
  });

  it('volodka entry is a valid path', () => {
    expect(isValidPlayerGlbPath(MODEL_URLS.volodka)).toBe(true);
  });
});
