import { describe, expect, it } from 'vitest';
import { isValidPlayerGlbPath, MODEL_URLS } from './modelUrls';

describe('isValidPlayerGlbPath', () => {
  it('accepts app-root paths and https URLs to .glb', () => {
    expect(isValidPlayerGlbPath('/models/Volodka.glb')).toBe(true);
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
