import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clearCanvasTextureCacheForTests } from './cachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  getContactShadowTexture,
  releaseContactShadowTexture,
} from './contactShadowTexture';

describe('contactShadowTexture', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          createRadialGradient: () => ({ addColorStop: vi.fn() }),
          fillRect: vi.fn(),
        }),
      }),
    });
  });

  afterEach(() => {
    clearCanvasTextureCacheForTests();
    vi.unstubAllGlobals();
  });

  it('reuses the same texture per variant key', () => {
    const a = getContactShadowTexture({ variant: 'player' });
    const b = getContactShadowTexture({ variant: 'player' });
    expect(a).toBe(b);
  });

  it('creates distinct textures for player and npc variants', () => {
    const player = getContactShadowTexture({ variant: 'player' });
    const npc = getContactShadowTexture({ variant: 'npc' });
    expect(player).not.toBe(npc);
  });

  it('disposes after last release', () => {
    getContactShadowTexture({ variant: 'npc' });
    getContactShadowTexture({ variant: 'npc' });
    const tex = getContactShadowTexture({ variant: 'npc' });
    vi.spyOn(tex, 'dispose');
    releaseContactShadowTexture({ variant: 'npc' });
    releaseContactShadowTexture({ variant: 'npc' });
    releaseContactShadowTexture({ variant: 'npc' });
    expect(tex.dispose).toHaveBeenCalledTimes(1);
  });

  it('exposes stable cache keys for player and npc', () => {
    expect(CONTACT_SHADOW_CACHE_KEYS.player).toBe('contact_shadow:player:128');
    expect(CONTACT_SHADOW_CACHE_KEYS.npc).toBe('contact_shadow:npc:64');
  });
});
