import { afterEach, describe, expect, it } from 'vitest';
import {
  N8AO_FORCE_FLAG_KEY,
  isN8aoForceFlagEnabled,
  resetN8aoForceFlagForTests,
  shouldMountN8ao,
} from './ambientOcclusionGate';

function gateOptions(overrides: Partial<Parameters<typeof shouldMountN8ao>[0]> = {}) {
  return {
    selectedPreset: 'ultra' as const,
    resolvedPresetId: 'ultra',
    visualLite: false,
    isSoftwareRenderer: false,
    coarsePointer: false,
    ...overrides,
  };
}

describe('shouldMountN8ao (v4.48.7 NaN-расследование)', () => {
  afterEach(() => {
    resetN8aoForceFlagForTests();
    try {
      window.localStorage.removeItem(N8AO_FORCE_FLAG_KEY);
    } catch {
      // jsdom без localStorage — некритично
    }
  });

  it('mounts on desktop high/ultra real GPU', () => {
    expect(shouldMountN8ao(gateOptions({ selectedPreset: 'high', resolvedPresetId: 'high' }))).toBe(true);
    expect(shouldMountN8ao(gateOptions())).toBe(true);
  });

  it('never mounts on auto/medium/low (preset policy)', () => {
    expect(shouldMountN8ao(gateOptions({ selectedPreset: 'auto', resolvedPresetId: 'auto' }))).toBe(false);
    expect(shouldMountN8ao(gateOptions({ selectedPreset: 'medium', resolvedPresetId: 'medium' }))).toBe(false);
    expect(shouldMountN8ao(gateOptions({ selectedPreset: 'low', resolvedPresetId: 'low' }))).toBe(false);
  });

  it('does not mount when selected preset is high but resolved tier is not (auto)', () => {
    // selectedPreset='high' проходит allowsHeavyGfxFeature, но resolved='auto'
    // (слабое железо) — тяжёлые фичи недоступны.
    expect(shouldMountN8ao(gateOptions({ selectedPreset: 'high', resolvedPresetId: 'auto' }))).toBe(false);
  });

  it('keeps N8AO off on software renderers (SwiftShader NaN, v4.45.2)', () => {
    expect(shouldMountN8ao(gateOptions({ isSoftwareRenderer: true }))).toBe(false);
  });

  it('force flag overrides the software-renderer gate (debug/sandbox QA)', () => {
    try {
      window.localStorage.setItem(N8AO_FORCE_FLAG_KEY, '1');
    } catch {
      // jsdom без localStorage — тест теряет смысл
      return;
    }
    resetN8aoForceFlagForTests();
    expect(isN8aoForceFlagEnabled()).toBe(true);
    expect(shouldMountN8ao(gateOptions({ isSoftwareRenderer: true }))).toBe(true);
  });

  it('force flag with any other value does not override', () => {
    try {
      window.localStorage.setItem(N8AO_FORCE_FLAG_KEY, '0');
    } catch {
      return;
    }
    resetN8aoForceFlagForTests();
    expect(shouldMountN8ao(gateOptions({ isSoftwareRenderer: true }))).toBe(false);
  });

  it('gates visualLite off regardless of preset', () => {
    expect(shouldMountN8ao(gateOptions({ visualLite: true }))).toBe(false);
  });

  it('gates coarse pointer (mobile) off — 60fps budget on tiled GPUs', () => {
    expect(shouldMountN8ao(gateOptions({ coarsePointer: true }))).toBe(false);
  });
});
