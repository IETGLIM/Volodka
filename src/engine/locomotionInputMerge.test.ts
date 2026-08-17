import { afterEach, describe, expect, it } from 'vitest';
import {
  applyMouseBothButtonsForward,
  areSharedVirtualControlsWritable,
  clearSharedVirtualControls,
  resetSharedVirtualControlsState,
  setSharedVirtualControlsWritable,
  sharedVirtualControlsRef,
} from '@/engine/VirtualControlsState';
import { resolveMovementIntent } from '@/engine/player/playerLocomotionPresentation';

const idleKeys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  hasMovement: false,
};

describe('locomotion input merge order (Wave 6)', () => {
  afterEach(() => {
    resetSharedVirtualControlsState();
  });

  it('keyboard singleton sample wins over shared virtual axes in resolveMovementIntent', () => {
    // Touch / gamepad write sharedVirtualControlsRef; keyboard is separate.
    sharedVirtualControlsRef.current.forward = 1;
    sharedVirtualControlsRef.current.left = 1;
    sharedVirtualControlsRef.current.moveMagnitude = 1;

    const intent = resolveMovementIntent({
      keys: { ...idleKeys, forward: true, hasMovement: true },
      virtual: { ...sharedVirtualControlsRef.current },
    });

    expect(intent.keyboardDrivesMove).toBe(true);
    expect(intent.fwd).toBe(1);
    // Virtual left discarded while keyboard drives move
    expect(intent.lft).toBe(0);
    expect(intent.analogSpeedScale).toBe(1);
  });

  it('touch/gamepad virtual axes apply when keyboard is idle', () => {
    sharedVirtualControlsRef.current.forward = 0.7;
    sharedVirtualControlsRef.current.left = 0.4;
    sharedVirtualControlsRef.current.moveMagnitude = 0.8;

    const intent = resolveMovementIntent({
      keys: idleKeys,
      virtual: { ...sharedVirtualControlsRef.current },
    });

    expect(intent.keyboardDrivesMove).toBe(false);
    expect(intent.fwd).toBeCloseTo(0.7);
    expect(intent.lft).toBeCloseTo(0.4);
    expect(intent.analogSpeedScale).toBeCloseTo(0.8);
  });

  it('overlay write-gate clear blocks mouse-both-buttons from fighting gamepad zero', () => {
    expect(areSharedVirtualControlsWritable()).toBe(true);
    applyMouseBothButtonsForward(1 | 2, false);
    expect(sharedVirtualControlsRef.current.forward).toBe(1);

    // Gamepad / lock path: single clear API + closed write gate
    setSharedVirtualControlsWritable(false);
    expect(sharedVirtualControlsRef.current.forward).toBe(0);

    // Mouse still held both buttons — must not re-assert forward
    const owns = applyMouseBothButtonsForward(1 | 2, true);
    expect(owns).toBe(false);
    expect(sharedVirtualControlsRef.current.forward).toBe(0);

    clearSharedVirtualControls();
    expect(sharedVirtualControlsRef.current.forward).toBe(0);

    setSharedVirtualControlsWritable(true);
    const ownsAgain = applyMouseBothButtonsForward(1 | 2, false);
    expect(ownsAgain).toBe(true);
    expect(sharedVirtualControlsRef.current.forward).toBe(1);
  });
});
