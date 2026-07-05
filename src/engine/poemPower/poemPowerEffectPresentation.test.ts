import { describe, expect, it } from 'vitest';
import {
  inferPoemPowerAct,
  inferPoemPowerColorTheme,
  resolvePoemPowerActLabel,
  resolvePoemPowerColor,
  resolvePoemPowerEffectMeta,
} from '@/engine/poemPower/poemPowerEffectPresentation';
import type { PoemPower } from '@/engine/PoemPowerSystem';

describe('poemPowerEffectPresentation', () => {
  it('infers act ranges from poem id', () => {
    expect(inferPoemPowerAct('poem_1')).toBe(1);
    expect(inferPoemPowerAct('poem_9')).toBe(2);
    expect(inferPoemPowerAct('poem_15')).toBe(3);
  });

  it('infers color themes including combat and defense overrides', () => {
    expect(inferPoemPowerColorTheme('poem_5')).toBe('combat');
    expect(inferPoemPowerColorTheme('poem_10')).toBe('defense');
    expect(inferPoemPowerColorTheme('poem_2')).toBe('act1');
  });

  it('resolves act labels and colors', () => {
    expect(resolvePoemPowerActLabel(2)).toBe('АКТ 2');
    expect(resolvePoemPowerColor('combat')).toBe('#ff4444');
  });

  it('prefers explicit power metadata overrides', () => {
    const power: PoemPower = {
      poemId: 'poem_1',
      name: 'Test',
      description: 'Desc',
      cooldownMs: 1000,
      act: 3,
      colorTheme: 'defense',
      effect: () => {},
    };
    expect(resolvePoemPowerEffectMeta(power)).toMatchObject({
      act: 3,
      colorTheme: 'defense',
      actLabel: 'АКТ 3',
      color: '#4488ff',
    });
  });
});
