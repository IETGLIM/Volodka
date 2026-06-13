import { describe, expect, it } from 'vitest';
import { applyRadialDeadzone, DEFAULT_DEADZONE } from './gamepad';

describe('applyRadialDeadzone', () => {
  it('returns zero inside the deadzone', () => {
    expect(applyRadialDeadzone(0.1, 0.1, DEFAULT_DEADZONE)).toEqual({ x: 0, y: 0 });
  });

  it('preserves direction outside the deadzone', () => {
    const { x, y } = applyRadialDeadzone(0.5, 0.5, DEFAULT_DEADZONE);
    expect(x).toBeCloseTo(y);
    expect(Math.hypot(x, y)).toBeGreaterThan(0);
  });

  it('zeros stick input when vector magnitude is inside the deadzone', () => {
    expect(applyRadialDeadzone(0.08, 0.08, DEFAULT_DEADZONE)).toEqual({ x: 0, y: 0 });
  });
});
