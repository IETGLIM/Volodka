import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NPC_ANIMATION_LOD,
  NPC_MIXER_HZ,
  NPC_MIXER_MAX_STEP_S,
  accumulateNpcMixerDelta,
  resolveNpcAnimationLod,
  resolveNpcShadowCasting,
  scaleNpcAnimationLodThresholds,
} from './npcAnimationLod';

describe('resolveNpcAnimationLod', () => {
  it('keeps full rate inside the interaction band', () => {
    expect(resolveNpcAnimationLod(2, 'full')).toBe('full');
    expect(resolveNpcAnimationLod(8.9, 'full')).toBe('full');
  });

  it('downgrades full → reduced at reducedOut', () => {
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.reducedOut, 'full')).toBe('reduced');
  });

  it('downgrades full → minimal directly at minimalOut', () => {
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.minimalOut, 'full')).toBe('minimal');
  });

  it('applies hysteresis: reduced restores full only below reducedIn', () => {
    expect(resolveNpcAnimationLod(8, 'reduced')).toBe('reduced');
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.reducedIn, 'reduced')).toBe('reduced');
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.reducedIn - 0.1, 'reduced')).toBe('full');
  });

  it('applies hysteresis: minimal restores reduced only below minimalIn', () => {
    expect(resolveNpcAnimationLod(14, 'minimal')).toBe('minimal');
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.minimalIn, 'minimal')).toBe('minimal');
    expect(resolveNpcAnimationLod(DEFAULT_NPC_ANIMATION_LOD.minimalIn - 0.1, 'minimal')).toBe('reduced');
  });

  it('restores full from minimal when player comes close', () => {
    expect(resolveNpcAnimationLod(3, 'minimal')).toBe('full');
  });

  it('forceFull pins the tier at any distance (dialogue/interaction)', () => {
    expect(resolveNpcAnimationLod(30, 'minimal', undefined, true)).toBe('full');
    expect(resolveNpcAnimationLod(30, 'reduced', undefined, true)).toBe('full');
    expect(resolveNpcAnimationLod(1, 'full', undefined, true)).toBe('full');
  });
});

describe('scaleNpcAnimationLodThresholds', () => {
  it('shrinks thresholds when lodBias < 1 (low presets throttle sooner)', () => {
    const low = scaleNpcAnimationLodThresholds(DEFAULT_NPC_ANIMATION_LOD, 0.6);
    expect(low.reducedOut).toBeCloseTo(DEFAULT_NPC_ANIMATION_LOD.reducedOut * 0.6);
    expect(low.shadowOut).toBeCloseTo(DEFAULT_NPC_ANIMATION_LOD.shadowOut * 0.6);
  });

  it('expands thresholds when lodBias > 1 (ultra keeps full rate longer)', () => {
    const ultra = scaleNpcAnimationLodThresholds(DEFAULT_NPC_ANIMATION_LOD, 1.25);
    expect(ultra.reducedOut).toBeCloseTo(DEFAULT_NPC_ANIMATION_LOD.reducedOut * 1.25);
  });

  it('clamps extreme biases to [0.25, 1.25]', () => {
    const tiny = scaleNpcAnimationLodThresholds(DEFAULT_NPC_ANIMATION_LOD, 0.01);
    expect(tiny.reducedOut).toBeCloseTo(DEFAULT_NPC_ANIMATION_LOD.reducedOut * 0.25);
    const huge = scaleNpcAnimationLodThresholds(DEFAULT_NPC_ANIMATION_LOD, 10);
    expect(huge.reducedOut).toBeCloseTo(DEFAULT_NPC_ANIMATION_LOD.reducedOut * 1.25);
  });
});

describe('resolveNpcShadowCasting', () => {
  it('keeps shadows on inside the near band', () => {
    expect(resolveNpcShadowCasting(3, true)).toBe(true);
    expect(resolveNpcAnimationLod(3, 'full')).toBe('full');
  });

  it('turns shadows off at shadowOut with hysteresis restore below shadowIn', () => {
    expect(resolveNpcShadowCasting(DEFAULT_NPC_ANIMATION_LOD.shadowOut, true)).toBe(false);
    expect(resolveNpcShadowCasting(9, false)).toBe(false);
    expect(resolveNpcShadowCasting(DEFAULT_NPC_ANIMATION_LOD.shadowIn, false)).toBe(false);
    expect(resolveNpcShadowCasting(DEFAULT_NPC_ANIMATION_LOD.shadowIn - 0.1, false)).toBe(true);
  });
});

describe('accumulateNpcMixerDelta', () => {
  it('passes every frame through at full tier and resets the accumulator', () => {
    expect(accumulateNpcMixerDelta(0.02, 0.016, 'full')).toEqual({ acc: 0, updateDelta: 0.016 });
  });

  it('accumulates reduced-tier frames until the 30 Hz interval, then flushes', () => {
    const first = accumulateNpcMixerDelta(0, 0.016, 'reduced');
    expect(first.updateDelta).toBeNull();
    expect(first.acc).toBeCloseTo(0.016);

    const second = accumulateNpcMixerDelta(first.acc, 0.016, 'reduced');
    expect(second.updateDelta).toBeNull();
    expect(second.acc).toBeCloseTo(0.032);

    const third = accumulateNpcMixerDelta(second.acc, 0.016, 'reduced');
    expect(third.updateDelta).not.toBeNull();
    expect(third.updateDelta!).toBeGreaterThanOrEqual(1 / NPC_MIXER_HZ.reduced);
    expect(third.acc).toBe(0);
  });

  it('flushes roughly every other frame at reduced (30 Hz from 60 fps)', () => {
    let acc = 0;
    let updates = 0;
    for (let frame = 0; frame < 60; frame += 1) {
      const step = accumulateNpcMixerDelta(acc, 1 / 60, 'reduced');
      acc = step.acc;
      if (step.updateDelta !== null) updates += 1;
    }
    expect(updates).toBe(30);
  });

  it('flushes a quarter of frames at minimal (15 Hz from 60 fps)', () => {
    let acc = 0;
    let updates = 0;
    for (let frame = 0; frame < 60; frame += 1) {
      const step = accumulateNpcMixerDelta(acc, 1 / 60, 'minimal');
      acc = step.acc;
      if (step.updateDelta !== null) updates += 1;
    }
    expect(updates).toBe(15);
  });

  it('caps a huge accumulated step after a frame stall', () => {
    const step = accumulateNpcMixerDelta(0.3, 0.05, 'minimal');
    expect(step.updateDelta).toBe(NPC_MIXER_MAX_STEP_S);
    expect(step.acc).toBe(0);
  });

  it('animation time stays exact: flushed deltas sum to real elapsed time', () => {
    let acc = 0;
    let animated = 0;
    let elapsed = 0;
    for (let frame = 0; frame < 120; frame += 1) {
      const dt = 1 / 60;
      elapsed += dt;
      const step = accumulateNpcMixerDelta(acc, dt, 'reduced');
      acc = step.acc;
      if (step.updateDelta !== null) animated += step.updateDelta;
    }
    // Loses at most one pending interval at the tail.
    expect(animated).toBeGreaterThan(elapsed - 1 / NPC_MIXER_HZ.reduced);
  });
});
