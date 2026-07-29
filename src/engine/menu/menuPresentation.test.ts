import { describe, expect, it } from 'vitest';
import { getMenuScreenFx, getMenuParticleCounts } from '@/engine/menu/menuFxTier';
import {
  buildMenuItems,
  getFilmicMenuItemClass,
  parseMenuSavePreview,
} from '@/engine/menu/menuPresentation';

describe('menuFxTier', () => {
  it('keeps filmic plate without matrix/ASCII soup on low tier', () => {
    const fx = getMenuScreenFx('low', false);
    expect(fx.matrixRain).toBe(false);
    expect(fx.asciiDecoration).toBe(false);
    expect(fx.atmosphericPan).toBe(true);
    expect(fx.menuParticles).toBe(false);
    expect(fx.particleSystem).toBe(false);
    expect(fx.fullScreenScanLine).toBe(false);
  });

  it('keeps filmic high-tier title without cyber soup', () => {
    const fx = getMenuScreenFx('high', false);
    expect(fx.atmosphericPan).toBe(true);
    expect(fx.cinematicBars).toBe(true);
    expect(fx.matrixRain).toBe(false);
    expect(fx.asciiDecoration).toBe(false);
    expect(fx.crtSweep).toBe(false);
    expect(fx.circuitGridLines).toBe(false);
    expect(fx.filmGrain).toBe(true);
  });

  it('pause and title share filmic language (no matrix/ASCII/CRT)', () => {
    for (const tier of ['low', 'medium', 'high'] as const) {
      const fx = getMenuScreenFx(tier, false);
      expect(fx.matrixRain).toBe(false);
      expect(fx.asciiDecoration).toBe(false);
      expect(fx.crtSweep).toBe(false);
      expect(fx.cinematicBars).toBe(true);
    }
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

  it('returns filmic menu item classes without neon card chrome', () => {
    expect(getFilmicMenuItemClass(true, false)).toContain('cinematic-menu-item--selected');
    expect(getFilmicMenuItemClass(false, true)).toContain('cinematic-menu-item--muted');
  });

  it('returns null save preview when no save exists', () => {
    expect(parseMenuSavePreview()).toBeNull();
  });
});
