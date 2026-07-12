import { describe, expect, it } from 'vitest';
import { getMenuScreenFx, getMenuParticleCounts } from '@/engine/menu/menuFxTier';
import {
  buildMenuItems,
  getAccentColors,
  parseMenuSavePreview,
} from '@/engine/menu/menuPresentation';

describe('menuFxTier', () => {
  it('disables heavy fx on low tier', () => {
    const fx = getMenuScreenFx('low', false);
    expect(fx.matrixRain).toBe(true);
    expect(fx.menuParticles).toBe(false);
    expect(fx.particleSystem).toBe(false);
    expect(fx.fullScreenScanLine).toBe(false);
  });

  it('disables animated fx when reduced motion', () => {
    const fx = getMenuScreenFx('high', true);
    expect(fx.menuParticles).toBe(false);
    expect(fx.titleParallax).toBe(false);
    expect(fx.contentMotion).toBe(false);
  });

  it('reduces particle counts by tier', () => {
    expect(getMenuParticleCounts('low').drift).toBeLessThan(getMenuParticleCounts('high').drift);
  });
});

describe('menuPresentation', () => {
  it('builds menu items with continue disabled without save', () => {
    const items = buildMenuItems(false);
    expect(items.find((item) => item.id === 'continue')?.disabled).toBe(true);
  });

  it('returns accent colors for selected cyan item', () => {
    const colors = getAccentColors('cyan', true);
    expect(colors.border).toContain('cyan-400');
  });

  it('returns null save preview when no save exists', () => {
    expect(parseMenuSavePreview()).toBeNull();
  });
});
