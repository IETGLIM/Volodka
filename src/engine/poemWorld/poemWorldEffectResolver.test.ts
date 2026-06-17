import { describe, expect, it } from 'vitest';
import {
  inferPoemWorldCategory,
  resolvePoemWorldEffect,
  resolvePoemWorldHintFlagKey,
} from '@/engine/poemWorld/poemWorldEffectResolver';

describe('resolvePoemWorldEffect', () => {
  it('returns full override for poem_1 (dialogue / truth voice)', () => {
    const profile = resolvePoemWorldEffect('poem_1');
    expect(profile.category).toBe('dialogue');
    expect(profile.visualPreset).toBe('letterbox_truth');
    expect(profile.audioCue).toBe('emotional');
    expect(profile.narrationLine).toMatch(/правду/i);
    expect(profile.worldHint).toBe('npc_shimmer');
  });

  it('returns guiding star exploration profile for poem_3', () => {
    const profile = resolvePoemWorldEffect('poem_3');
    expect(profile.category).toBe('exploration');
    expect(profile.visualPreset).toBe('god_rays_gold');
    expect(profile.worldHint).toBe('exit_glow');
    expect(profile.narrationLine).toMatch(/Звезда/i);
  });

  it('returns combat storm profile for poem_5', () => {
    const profile = resolvePoemWorldEffect('poem_5');
    expect(profile.category).toBe('combat');
    expect(profile.visualPreset).toBe('storm_break');
    expect(profile.audioCue).toBe('danger');
  });

  it('falls back to category default for unmapped override poem', () => {
    const profile = resolvePoemWorldEffect('poem_7');
    expect(profile.category).toBe('exploration');
    expect(profile.visualPreset).toBe('god_rays_gold');
    expect(profile.narrationLine).toBeUndefined();
  });

  it('uses utility fallback for unknown poem ids', () => {
    expect(inferPoemWorldCategory('poem_unknown')).toBe('utility');
    const profile = resolvePoemWorldEffect('poem_unknown');
    expect(profile.visualPreset).toBe('matrix_pulse');
  });
});

describe('resolvePoemWorldHintFlagKey', () => {
  it('maps hints to TTL flag keys', () => {
    expect(resolvePoemWorldHintFlagKey('exit_glow')).toBe('poem_hint_exit_glow_active');
    expect(resolvePoemWorldHintFlagKey('none')).toBeNull();
  });
});
