/* ─── Singleton keyboard state — survives player remounts, one listener set ─── */

export type KeyboardAxis = 'forward' | 'backward' | 'left' | 'right';

export interface KeyboardMovementSample {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  jump: boolean;
  interact: boolean;
  /** True when any movement key is held (WASD / arrows). */
  hasMovement: boolean;
}

type AxisCode =
  | 'KeyW'
  | 'ArrowUp'
  | 'KeyS'
  | 'ArrowDown'
  | 'KeyA'
  | 'ArrowLeft'
  | 'KeyD'
  | 'ArrowRight';

const CODE_TO_AXIS: Record<AxisCode, KeyboardAxis> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false,
};

/** Last key pressed on each axis pair — resolves W+S / A+D rollover & ghosting. */
let lastVerticalAxis: 'forward' | 'backward' | null = null;
let lastHorizontalAxis: 'left' | 'right' | null = null;

let listenersInstalled = false;
let onInteractPress: (() => void) | null = null;

function isEditable(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  return target.isContentEditable;
}

function axisFromCode(code: string): KeyboardAxis | null {
  return (CODE_TO_AXIS as Record<string, KeyboardAxis>)[code] ?? null;
}

function setAxis(axis: KeyboardAxis, down: boolean): void {
  keys[axis] = down;
  if (down) {
    if (axis === 'forward' || axis === 'backward') lastVerticalAxis = axis;
    if (axis === 'left' || axis === 'right') lastHorizontalAxis = axis;
  } else {
    if (axis === 'forward' || axis === 'backward') {
      if (lastVerticalAxis === axis) lastVerticalAxis = null;
    }
    if (axis === 'left' || axis === 'right') {
      if (lastHorizontalAxis === axis) lastHorizontalAxis = null;
    }
  }
}

function resolvePair(
  positive: 'forward' | 'left',
  negative: 'backward' | 'right',
  last: 'forward' | 'backward' | 'left' | 'right' | null,
): { positive: boolean; negative: boolean } {
  const posDown = keys[positive];
  const negDown = keys[negative];
  if (posDown && negDown) {
    if (last === positive) return { positive: true, negative: false };
    if (last === negative) return { positive: false, negative: true };
    return { positive: false, negative: false };
  }
  return { positive: posDown, negative: negDown };
}

function onKeyDown(e: KeyboardEvent): void {
  if (isEditable(e.target)) return;
  if (e.repeat && e.code !== 'KeyE') return;

  const axis = axisFromCode(e.code);
  if (axis) {
    setAxis(axis, true);
    return;
  }

  switch (e.code) {
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.run = true;
      break;
    case 'Space':
      keys.jump = true;
      e.preventDefault();
      break;
    case 'KeyE':
      if (!e.repeat) {
        keys.interact = true;
        onInteractPress?.();
      }
      break;
    default:
      break;
  }
}

function onKeyUp(e: KeyboardEvent): void {
  if (isEditable(e.target)) return;

  const axis = axisFromCode(e.code);
  if (axis) {
    setAxis(axis, false);
    return;
  }

  switch (e.code) {
    case 'ShiftLeft':
    case 'ShiftRight':
      keys.run = false;
      break;
    case 'Space':
      keys.jump = false;
      break;
    case 'KeyE':
      keys.interact = false;
      break;
    default:
      break;
  }
}

function onBlur(): void {
  keys.forward = false;
  keys.backward = false;
  keys.left = false;
  keys.right = false;
  keys.run = false;
  keys.jump = false;
  keys.interact = false;
  lastVerticalAxis = null;
  lastHorizontalAxis = null;
}

function attachListeners(): void {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
}

/** Wire interact callback; listeners stay mounted for the session (survives remounts). */
export function bindKeyboardInput(interactPress?: () => void): () => void {
  onInteractPress = interactPress ?? null;
  if (!listenersInstalled) {
    attachListeners();
    listenersInstalled = true;
  }

  return () => {
    onInteractPress = null;
  };
}

/** Movement axes with opposing-key resolution (W+S ghosting). */
export function sampleKeyboardMovement(): KeyboardMovementSample {
  const vertical = resolvePair('forward', 'backward', lastVerticalAxis);
  const horizontal = resolvePair('left', 'right', lastHorizontalAxis);

  const forward = vertical.positive;
  const backward = vertical.negative;
  const left = horizontal.positive;
  const right = horizontal.negative;
  const hasMovement = forward || backward || left || right;

  return {
    forward,
    backward,
    left,
    right,
    run: keys.run,
    jump: keys.jump,
    interact: keys.interact,
    hasMovement,
  };
}
