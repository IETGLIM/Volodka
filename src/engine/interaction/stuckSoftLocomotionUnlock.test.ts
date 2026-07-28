import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  isStuckSoftLocomotionUnlockActive,
  resetStuckSoftLocomotionUnlockForTests,
  triggerStuckSoftLocomotionUnlock,
} from './stuckSoftLocomotionUnlock';

vi.mock('@/engine/camera/cinematicPresentation', () => ({
  setCinematicHoldActive: vi.fn(),
}));

vi.mock('@/engine/player/playerLocomotionGate', () => ({
  setPanelStackLocomotionGate: vi.fn(),
  setMinigameLocomotionGate: vi.fn(),
}));

describe('stuckSoftLocomotionUnlock', () => {
  beforeEach(() => {
    resetStuckSoftLocomotionUnlockForTests();
  });

  it('activates soft unlock window', () => {
    expect(isStuckSoftLocomotionUnlockActive()).toBe(false);
    triggerStuckSoftLocomotionUnlock(500);
    expect(isStuckSoftLocomotionUnlockActive()).toBe(true);
  });

  it('expires after duration', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000);
    triggerStuckSoftLocomotionUnlock(500);
    expect(isStuckSoftLocomotionUnlockActive()).toBe(true);
    expect(isStuckSoftLocomotionUnlockActive()).toBe(false);
  });
});
