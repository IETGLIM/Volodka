import { describe, expect, it } from 'vitest';
import { explorationStrategy } from '@/engine/camera/strategies/explorationStrategy';
import { getExplorationCameraMotionScale } from '@/engine/player/playerLocomotionPresentation';
import { updateMoveBlendRef } from '@/engine/player/playerLocomotionPresentation';

describe('explorationStrategy', () => {
  it('is always eligible as default camera mode', () => {
    expect(explorationStrategy.isActive({} as Parameters<typeof explorationStrategy.isActive>[0])).toBe(true);
  });
});

describe('exploration camera motion scale', () => {
  it('dampens bob while the player is moving', () => {
    const idle = getExplorationCameraMotionScale(0);
    const moving = getExplorationCameraMotionScale(1);
    expect(moving.breathingScale).toBeLessThan(idle.breathingScale);
    expect(moving.bobScale).toBeLessThan(idle.bobScale);
  });
});

describe('playerMainMovement degraded blend', () => {
  it('updates moveBlend during degraded horizontal motion', () => {
    const blend = { current: 0 };
    updateMoveBlendRef(blend, 1, 0.1);
    expect(blend.current).toBeGreaterThan(0);
  });
});
