/* ─── Volodka RPG – Gamepad API helpers ─── */

/** Standard Xbox / "standard" mapping button indices */
export const GAMEPAD = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  LS: 10,
  RS: 11,
} as const;

export const DEFAULT_DEADZONE = 0.15;
export const GAMEPAD_ORBIT_SENSITIVITY = 2.4;
export const GAMEPAD_ZOOM_SPEED = 2.5;

export interface GamepadStick {
  x: number;
  y: number;
}

export interface GamepadFrame {
  connected: boolean;
  index: number;
  id: string;
  leftStick: GamepadStick;
  rightStick: GamepadStick;
  buttons: boolean[];
  /** Normalized trigger pressure 0–1 (LT, RT) */
  lt: number;
  rt: number;
}

const emptyFrame: GamepadFrame = {
  connected: false,
  index: -1,
  id: '',
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  buttons: [],
  lt: 0,
  rt: 0,
};

/** Apply per-axis deadzone for single-axis inputs (triggers). */
export function applyDeadzone(value: number, deadzone = DEFAULT_DEADZONE): number {
  if (Math.abs(value) < deadzone) return 0;
  const sign = Math.sign(value);
  return sign * ((Math.abs(value) - deadzone) / (1 - deadzone));
}

/** Circular deadzone for analog sticks — preserves direction and consistent magnitude. */
export function applyRadialDeadzone(
  x: number,
  y: number,
  deadzone = DEFAULT_DEADZONE,
): GamepadStick {
  const magnitude = Math.hypot(x, y);
  if (magnitude < deadzone) return { x: 0, y: 0 };
  const rescaled = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
  const scale = rescaled / magnitude;
  return { x: x * scale, y: y * scale };
}

/** Clamp stick vector to unit circle. */
export function normalizeStick(x: number, y: number): GamepadStick {
  const len = Math.hypot(x, y);
  if (len <= 1 || len === 0) return { x, y };
  return { x: x / len, y: y / len };
}

function readTrigger(button: GamepadButton | undefined): number {
  if (!button) return 0;
  return button.value > 0.05 ? button.value : 0;
}

function isButtonPressed(button: GamepadButton | undefined): boolean {
  return Boolean(button && (button.pressed || button.value > 0.5));
}

/** Pick the first connected gamepad (player slot 0 preferred). */
export function getActiveGamepad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;

  const pads = navigator.getGamepads();
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (pad?.connected) return pad;
  }
  return null;
}

/** Read current gamepad state (call once per animation frame). */
export function pollGamepad(deadzone = DEFAULT_DEADZONE): GamepadFrame {
  const pad = getActiveGamepad();
  if (!pad) return emptyFrame;

  const leftRaw = applyRadialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, deadzone);
  const rightRaw = applyRadialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, deadzone);
  const leftStick = normalizeStick(leftRaw.x, leftRaw.y);
  const rightStick = normalizeStick(rightRaw.x, rightRaw.y);

  const buttons = pad.buttons.map((b) => isButtonPressed(b));
  const lt = Math.max(readTrigger(pad.buttons[GAMEPAD.LT]), pad.axes[4] !== undefined ? applyDeadzone(pad.axes[4], 0.05) : 0);
  const rt = Math.max(readTrigger(pad.buttons[GAMEPAD.RT]), pad.axes[5] !== undefined ? applyDeadzone(pad.axes[5], 0.05) : 0);

  return {
    connected: true,
    index: pad.index,
    id: pad.id,
    leftStick,
    rightStick,
    buttons,
    lt,
    rt,
  };
}

/** Edge-detect button press for a specific gamepad index. */
export function consumeButtonPress(
  padIndex: number,
  buttonIndex: number,
  pressed: boolean,
  previousButtonsRef: { current: Map<number, boolean[]> },
): boolean {
  let prev = previousButtonsRef.current.get(padIndex);
  if (!prev) {
    prev = [];
    previousButtonsRef.current.set(padIndex, prev);
  }

  const wasPressed = prev[buttonIndex] ?? false;
  prev[buttonIndex] = pressed;
  return pressed && !wasPressed;
}

/** Convert left stick to virtual movement axes (browser Y is inverted). */
export function stickToVirtualMovement(stick: GamepadStick): {
  forward: number;
  backward: number;
  left: number;
  right: number;
} {
  return {
    forward: Math.max(0, -stick.y),
    backward: Math.max(0, stick.y),
    left: Math.max(0, -stick.x),
    right: Math.max(0, stick.x),
  };
}
