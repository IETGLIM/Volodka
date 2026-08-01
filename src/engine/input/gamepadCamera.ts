/* ─── Volodka RPG – gamepad camera orbit state (read from FollowCamera useFrame) ─── */

import type { MutableRefObject } from 'react';
import { MIN_DISTANCE, MAX_DISTANCE } from '@/engine/camera/cameraConstants';
import { GAMEPAD_ORBIT_SENSITIVITY, GAMEPAD_ZOOM_SPEED, type GamepadFrame } from '@/engine/input/gamepad';
import { getVisualSettings } from '@/engine/visualSettings';

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.3;

/** Latest right-stick / trigger input from the gamepad poll loop. */
let pendingOrbit: GamepadFrame | null = null;

export function setPendingGamepadOrbit(frame: GamepadFrame | null): void {
  pendingOrbit = frame?.connected ? frame : null;
}

/**
 * Apply pending stick/trigger input to camera refs (call inside useFrame).
 * @returns true when right-stick is actively orbiting (manual look this frame).
 */
export function applyPendingGamepadOrbit(
  yawRef: MutableRefObject<number>,
  pitchRef: MutableRefObject<number>,
  distanceRef: MutableRefObject<number>,
  interactionDistanceRef: MutableRefObject<number>,
  delta: number,
): boolean {
  const frame = pendingOrbit;
  if (!frame) return false;

  const { mouseSensitivity, invertY } = getVisualSettings();
  const pitchSign = invertY ? -1 : 1;

  let manualLook = false;
  const { rightStick, lt, rt } = frame;
  if (rightStick.x !== 0 || rightStick.y !== 0) {
    yawRef.current -= rightStick.x * GAMEPAD_ORBIT_SENSITIVITY * mouseSensitivity * delta;
    pitchRef.current = Math.max(
      PITCH_MIN,
      Math.min(
        PITCH_MAX,
        pitchRef.current
          + rightStick.y * GAMEPAD_ORBIT_SENSITIVITY * mouseSensitivity * pitchSign * delta,
      ),
    );
    manualLook = true;
  }

  const zoomDelta = (lt - rt) * GAMEPAD_ZOOM_SPEED * delta;
  if (Math.abs(zoomDelta) > 0.0001) {
    const newDist = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, distanceRef.current + zoomDelta));
    distanceRef.current = newDist;
    interactionDistanceRef.current = newDist;
  }

  return manualLook;
}
