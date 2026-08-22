/* ─── Volodka RPG – Gamepad Rumble (Vibration) Utility ───
 * Wraps the Gamepad API vibrate method for haptic feedback via gamepad.
 * Falls back to navigator.vibrate when gamepad vibration is unavailable.
 */

import { getActiveGamepad } from '@/shared/input/getActiveGamepad';

/** Cached navigator.vibrate reference (from hapticFeedback.ts pattern). */
let navVibrateFn: ((pattern: VibratePattern) => boolean) | null = null;

function getNavVibrateFn(): ((pattern: VibratePattern) => boolean) | null {
  if (navVibrateFn !== null) return navVibrateFn;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    navVibrateFn = null;
    return null;
  }
  try {
    const ok = navigator.vibrate(0);
    navVibrateFn = ok ? navigator.vibrate.bind(navigator) : null;
  } catch {
    navVibrateFn = null;
  }
  return navVibrateFn;
}

/** Internal: play a dual-rumble effect on the active gamepad's haptic actuator. */
function playDualRumble(params: { startDelay: number; duration: number; strongMagnitude: number; weakMagnitude: number }): boolean {
  const pad = getActiveGamepad();
  if (!pad || !('vibrationActuator' in pad) || !pad.vibrationActuator) return false;
  const actuator = pad.vibrationActuator as GamepadHapticActuator;
  if (typeof actuator.playEffect !== 'function') return false;
  try {
    actuator.playEffect('dual-rumble', params).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Trigger vibration on the active gamepad (supports strong/weak motor). */
export function gamepadRumble(
  strongDuration: number,
  weakDuration = 0,
  strongMagnitude = 1,
  weakMagnitude = 0,
): void {
  try {
    const played = playDualRumble({
      startDelay: 0,
      duration: Math.max(strongDuration, weakDuration),
      strongMagnitude: Math.min(1, Math.max(0, strongMagnitude)),
      weakMagnitude: Math.min(1, Math.max(0, weakMagnitude)),
    });
    if (played) return;
    // Fallback to navigator.vibrate
    const fn = getNavVibrateFn();
    if (fn) fn(strongDuration);
  } catch {
    /* Silent — vibration is best-effort */
  }
}

/* ─── Semantic presets (matching hapticFeedback.ts pattern) ─── */

/** Combat hit received — sharp heavy rumble */
export function gamepadRumbleCombatHit(): void {
  gamepadRumble(40, 30, 1, 0.6);
}

/** Combat hit dealt — lighter confirmation */
export function gamepadRumbleCombatDealt(): void {
  gamepadRumble(25, 15, 0.7, 0.3);
}

/** Dialogue choice selected — gentle tap */
export function gamepadRumbleDialogueChoice(): void {
  gamepadRumble(15, 0, 0.5, 0);
}

/** Discovery / loot — satisfying double-pulse */
export function gamepadRumbleDiscovery(): void {
  try {
    const a = playDualRumble({ startDelay: 0, duration: 15, strongMagnitude: 0.6, weakMagnitude: 0.3 });
    if (a) {
      playDualRumble({ startDelay: 80, duration: 10, strongMagnitude: 0.4, weakMagnitude: 0.5 });
      return;
    }
    const fn = getNavVibrateFn();
    if (fn) fn([12, 60, 8]);
  } catch {
    /* silent */
  }
}

/** Level up — triumphant ascending pattern */
export function gamepadRumbleLevelUp(): void {
  try {
    const a = playDualRumble({ startDelay: 0, duration: 20, strongMagnitude: 0.5, weakMagnitude: 0.2 });
    if (a) {
      playDualRumble({ startDelay: 120, duration: 30, strongMagnitude: 0.8, weakMagnitude: 0.5 });
      playDualRumble({ startDelay: 240, duration: 40, strongMagnitude: 1, weakMagnitude: 0.8 });
      return;
    }
    const fn = getNavVibrateFn();
    if (fn) fn([20, 60, 20, 60, 40]);
  } catch {
    /* silent */
  }
}

/** Error / denied — short buzz */
export function gamepadRumbleError(): void {
  gamepadRumble(30, 20, 0.7, 0.4);
}

/** Menu navigation — very light tap */
export function gamepadRumbleMenuNav(): void {
  gamepadRumble(8, 0, 0.3, 0);
}

/** Minigame complete — celebratory pattern */
export function gamepadRumbleMinigameComplete(): void {
  try {
    const a = playDualRumble({ startDelay: 0, duration: 15, strongMagnitude: 0.6, weakMagnitude: 0.4 });
    if (a) {
      playDualRumble({ startDelay: 60, duration: 15, strongMagnitude: 0.8, weakMagnitude: 0.6 });
      playDualRumble({ startDelay: 120, duration: 30, strongMagnitude: 1, weakMagnitude: 0.8 });
      return;
    }
    const fn = getNavVibrateFn();
    if (fn) fn([10, 50, 15, 50, 25]);
  } catch {
    /* silent */
  }
}
