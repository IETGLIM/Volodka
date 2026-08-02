import { describe, expect, it, vi } from 'vitest';
import * as accessibilitySettings from '@/engine/accessibility/accessibilitySettings';
import {
  computeSlopeLocomotionScale,
  getExplorationCameraMotionScale,
  resolveLocomotionClipState,
  resolveLockedLocomotionPresentation,
  resolveMovementIntent,
  resolveRunWalkCrossfadeTarget,
  smoothstep,
} from '@/engine/player/playerLocomotionPresentation';
import { WALK_SPEED, RUN_SPEED } from '@/engine/player/playerConstants';

const ZERO_EXPLORATION_CAMERA_MOTION = {
  breathingScale: 0,
  turnTiltScale: 0,
  bobScale: 0,
} as const;

// Blend band edges (must mirror resolveLocomotionClipState).
// Session 12-B fix: the band now starts AT WALK_SPEED (4) and tops out AT
// RUN_SPEED (7) — so walking at WALK_SPEED is 100% walk clip (no run
// contamination). Previously the band was smoothstep(WALK*0.7, RUN*0.85)
// = smoothstep(2.8, 5.95) which started below walk speed and contaminated
// normal walking with ~32% run clip.
const BLEND_EDGE0 = WALK_SPEED; // 4
const BLEND_EDGE1 = RUN_SPEED; // 7

describe('playerLocomotionPresentation', () => {
  it('resolveLocomotionClipState maps walk/run/idle', () => {
    // hSpeed defaults to 0 — below the blend band — so both walk and run
    // start at runWeight=0. The 'run' state with full sprint speed (RUN_SPEED)
    // saturates the blend to runWeight=1.
    expect(resolveLocomotionClipState('idle').locomotionActive).toBe(false);
    expect(resolveLocomotionClipState('walk').runWeight).toBe(0);
    expect(resolveLocomotionClipState('run').runWeight).toBe(0);
    expect(resolveLocomotionClipState('run', RUN_SPEED).runWeight).toBe(1);
  });

  it('resolveMovementIntent prefers keyboard over virtual', () => {
    const intent = resolveMovementIntent({
      keys: {
        forward: true,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        hasMovement: true,
      },
      virtual: { forward: 0, backward: 1, left: 0, right: 0, run: 0, jump: 0, moveMagnitude: 0.8 },
    });
    expect(intent.fwd).toBe(1);
    expect(intent.bwd).toBe(0);
    expect(intent.analogSpeedScale).toBe(1);
  });

  it('resolveMovementIntent uses analog magnitude for gamepad', () => {
    const intent = resolveMovementIntent({
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        hasMovement: false,
      },
      virtual: {
        forward: 0.5,
        backward: 0,
        left: 0,
        right: 0,
        run: 0,
        jump: 0,
        moveMagnitude: 0.5,
      },
    });
    expect(intent.analogSpeedScale).toBe(0.5);
    expect(intent.isMoving).toBe(true);
  });

  it('computeSlopeLocomotionScale penalizes steep climbs', () => {
    expect(computeSlopeLocomotionScale(0.1, 0, 0.1, true)).toBe(1);
    expect(computeSlopeLocomotionScale(0.1, 0.04, 0.1, true)).toBeLessThan(1);
    expect(computeSlopeLocomotionScale(0.1, 0.04, 0.1, false)).toBe(1);
  });

  it('getExplorationCameraMotionScale dampens bob while moving', () => {
    expect(getExplorationCameraMotionScale(0).breathingScale).toBe(1);
    expect(getExplorationCameraMotionScale(1).breathingScale).toBeLessThan(1);
  });

  it('getExplorationCameraMotionScale zeros motion when reduced motion is effective', () => {
    const spy = vi.spyOn(accessibilitySettings, 'isEffectiveReducedMotion').mockReturnValue(true);
    expect(getExplorationCameraMotionScale(1)).toEqual(ZERO_EXPLORATION_CAMERA_MOTION);
    spy.mockRestore();
  });

  it('resolveRunWalkCrossfadeTarget only fires on threshold crossing', () => {
    expect(resolveRunWalkCrossfadeTarget(0, 0)).toBeNull();
    expect(resolveRunWalkCrossfadeTarget(1, 1)).toBeNull();
    expect(resolveRunWalkCrossfadeTarget(0, 1)).toBe('walk_to_run');
    expect(resolveRunWalkCrossfadeTarget(1, 0)).toBe('run_to_walk');
  });

  it('resolveLockedLocomotionPresentation maps approach and combat', () => {
    expect(resolveLockedLocomotionPresentation({
      externalActive: true,
      vx: 2,
      vz: 0,
      gamePhase: 'exploration',
    })).toMatchObject({ anim: 'walk', moveBlendTarget: 1 });

    expect(resolveLockedLocomotionPresentation({
      externalActive: false,
      vx: 0,
      vz: 0,
      gamePhase: 'exploration',
    })).toMatchObject({ anim: 'idle', moveBlendTarget: 0 });

    expect(resolveLockedLocomotionPresentation({
      externalActive: false,
      vx: 0,
      vz: 0,
      gamePhase: 'combat',
    })).toMatchObject({ anim: 'combat', moveBlendTarget: 0 });
  });
});

describe('smoothstep', () => {
  it('clamps to 0 below edge0 and at edge0', () => {
    expect(smoothstep(2, 5, -10)).toBe(0);
    expect(smoothstep(2, 5, 0)).toBe(0);
    expect(smoothstep(2, 5, 2)).toBe(0);
  });

  it('clamps to 1 above edge1 and at edge1', () => {
    expect(smoothstep(2, 5, 5)).toBe(1);
    expect(smoothstep(2, 5, 7)).toBe(1);
    expect(smoothstep(2, 5, 9999)).toBe(1);
  });

  it('returns 0.5 at the midpoint (symmetric)', () => {
    // smoothstep(2, 5, 3.5): t = 0.5 → 0.25 * (3 - 1) = 0.5
    expect(smoothstep(2, 5, 3.5)).toBeCloseTo(0.5, 5);
  });

  it('is monotonically increasing across the band', () => {
    const xs = [2, 2.5, 3, 3.5, 4, 4.5, 5];
    const ys = xs.map((x) => smoothstep(2, 5, x));
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    }
  });

  it('handles edge0 === edge1 without dividing by zero (clamped to 0/1 for x≠edge)', () => {
    // Degenerate edge — (x - edge0) / 0 → ±Infinity, which the clamp coerces
    // to 1 (above) or 0 (below). We do not exercise x === edge0 here, since
    // 0/0 → NaN is an undefined input the helper does not defend against
    // (the blend band is always non-degenerate at the call sites).
    expect(smoothstep(3, 3, 4)).toBe(1);
    expect(smoothstep(3, 3, 2)).toBe(0);
  });
});

describe('resolveLocomotionClipState — continuous walk↔run blend', () => {
  it('idle (regardless of hSpeed) is not locomotion and yields runWeight 0', () => {
    const idle0 = resolveLocomotionClipState('idle', 0);
    expect(idle0.locomotionActive).toBe(false);
    expect(idle0.runWeight).toBe(0);
    // Even at sprint speed, 'idle' anim is not locomotion — blend stays 0.
    const idleSprint = resolveLocomotionClipState('idle', RUN_SPEED);
    expect(idleSprint.locomotionActive).toBe(false);
    expect(idleSprint.runWeight).toBe(0);
  });

  it('walk at hSpeed below the blend band yields runWeight 0 and stays active', () => {
    const clip = resolveLocomotionClipState('walk', 0.5);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBe(0);
  });

  it('walk at exactly WALK_SPEED yields runWeight 0 (pure walk, no run contamination)', () => {
    // Session 12-B: the blend band starts AT WALK_SPEED, so normal walking
    // (hSpeed == WALK_SPEED) is 100% walk clip. This is the key regression
    // fix — previously the band started at WALK*0.7 = 2.8, so walking at 4
    // m/s was contaminated with ~32% run clip.
    const clip = resolveLocomotionClipState('walk', WALK_SPEED);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBe(0);
  });

  it('walk at hSpeed inside the blend band yields a strictly-positive runWeight', () => {
    // 5.0 m/s sits inside the band [4, 7] — smoothstep(4, 7, 5.0) ≈ 0.26.
    // The run clip should begin contributing a small (but non-zero) weight.
    // This is the key new behavior: the blend is no longer binary on the
    // `running` flag.
    const clip = resolveLocomotionClipState('walk', 5.0);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBeGreaterThan(0);
    expect(clip.runWeight).toBeLessThan(0.5);
  });

  it('walk at hSpeed near the middle of the band yields a mid-blend runWeight', () => {
    // smoothstep(4, 7, 5.5): t = 0.5 → 0.5 * 0.5 * (3 - 1) = 0.5. The blend
    // is exactly at the midpoint. Use a range assertion since exact values
    // are fiddly to read at a glance.
    const clip = resolveLocomotionClipState('walk', 5.5);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBeGreaterThan(0.4);
    expect(clip.runWeight).toBeLessThan(0.6);
  });

  it('walk at full sprint saturates the blend to runWeight 1', () => {
    const clip = resolveLocomotionClipState('walk', RUN_SPEED);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBe(1);
  });

  it('run anim with full sprint yields runWeight 1', () => {
    const clip = resolveLocomotionClipState('run', RUN_SPEED);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBe(1);
  });

  it('run anim above RUN_SPEED clamps runWeight to 1', () => {
    // hSpeed > RUN_SPEED saturates the blend (no overshoot).
    const clip = resolveLocomotionClipState('run', RUN_SPEED + 1);
    expect(clip.locomotionActive).toBe(true);
    expect(clip.runWeight).toBe(1);
  });

  it('runWeight is driven by hSpeed, not by the walk/run anim string', () => {
    // Same hSpeed → same runWeight, regardless of whether the hysteresis state
    // resolved to 'walk' or 'run'. This is the core invariant of the continuous
    // blend: it tracks actual speed, not the binary input flag.
    for (const hSpeed of [0, 1, 3, 4, 5, 7, 10]) {
      expect(resolveLocomotionClipState('walk', hSpeed).runWeight)
        .toBeCloseTo(resolveLocomotionClipState('run', hSpeed).runWeight, 5);
    }
  });

  it('runWeight is monotonically non-decreasing with hSpeed', () => {
    const speeds = [0, 1, 2, 3, BLEND_EDGE0, 4.5, 5, 6, BLEND_EDGE1, RUN_SPEED, 10];
    let prev = -Infinity;
    for (const s of speeds) {
      const rw = resolveLocomotionClipState('walk', s).runWeight;
      expect(rw).toBeGreaterThanOrEqual(prev);
      prev = rw;
    }
    expect(prev).toBe(1);
  });

  it('timeScales stay constant across hSpeed (blend is weight-only)', () => {
    // The continuous blend only changes runWeight; the per-clip time scales
    // are constant properties of the locomotion state. (The walk timeScale is
    // scaled with hSpeed separately inside usePlayerLocomotionController, not
    // here.)
    const walkSlow = resolveLocomotionClipState('walk', 0.5);
    const walkFast = resolveLocomotionClipState('walk', RUN_SPEED);
    expect(walkSlow.walkTimeScale).toBe(walkFast.walkTimeScale);
    expect(walkSlow.runTimeScale).toBe(walkFast.runTimeScale);
    expect(walkSlow.walkTimeScale).toBeGreaterThan(0);
    expect(walkSlow.runTimeScale).toBeGreaterThan(walkSlow.walkTimeScale);
  });
});
