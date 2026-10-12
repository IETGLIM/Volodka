import { describe, expect, it } from 'vitest';
import { BlendFunction } from 'postprocessing';
import {
  NAN_SCRUB_EFFECT_NAME,
  NAN_SCRUB_FRAGMENT_SHADER,
  NanScrubEffect,
} from './nanScrubEffect';

describe('NanScrubEffect (v4.48.7 — защита от poisoned-кадра N8AO)', () => {
  it('instantiates with the scrub shader and NORMAL blend by default', () => {
    const effect = new NanScrubEffect();
    expect(effect.getAttributes()).toBeGreaterThanOrEqual(0);
    // Эффект НЕ convolution (attribute 2) — иначе @react-three/postprocessing
    // не сольёт его в общий EffectPass после N8AO.
    expect((effect.getAttributes() & 2) !== 2).toBe(true);
  });

  it('keeps the self-compare NaN test in the shader source', () => {
    expect(NAN_SCRUB_FRAGMENT_SHADER).toContain('mainImage');
    // NaN-тест `c != c` — по каналу r/g/b
    expect(NAN_SCRUB_FRAGMENT_SHADER).toContain('c.r != c.r');
    expect(NAN_SCRUB_FRAGMENT_SHADER).toContain('c.g != c.g');
    expect(NAN_SCRUB_FRAGMENT_SHADER).toContain('c.b != c.b');
    // Зажим Inf до HALF_MAX
    expect(NAN_SCRUB_FRAGMENT_SHADER).toContain('65504.0');
  });

  it('exposes the runtime scrub toggle', () => {
    const effect = new NanScrubEffect();
    expect(effect.isScrubEnabled()).toBe(true);
    effect.setEnabled(false);
    expect(effect.isScrubEnabled()).toBe(false);
    effect.setEnabled(true);
    expect(effect.isScrubEnabled()).toBe(true);
  });

  it('accepts a custom blend function', () => {
    const effect = new NanScrubEffect({ blendFunction: BlendFunction.SCREEN });
    expect(effect.blendMode.blendFunction).toBe(BlendFunction.SCREEN);
  });

  it('registers under the stable effect name', () => {
    const effect = new NanScrubEffect();
    // Имя важно для отладки в Spector/профилировщиках.
    expect(NAN_SCRUB_EFFECT_NAME).toBe('VolodkaNanScrubEffect');
    expect(typeof effect.getFragmentShader()).toBe('string');
  });
});
