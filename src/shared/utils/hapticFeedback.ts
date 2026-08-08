/* ─── Volodka RPG – Centralized Haptic Feedback Utility ───
 *
 * Provides a unified API for haptic (vibration) feedback across the game.
 * Uses the Vibration API (navigator.vibrate) with a safe fallback.
 *
 * Usage:
 *   import { hapticLight } from '@/shared/utils/hapticFeedback';
 *   hapticLight();  // subtle tap
 *
 * Intensity levels:
 *   - hapticLight()    — 10ms, UI taps, item hover, menu navigation
 *   - hapticMedium()  — 20ms, item pickup, dialogue choice, NPC interaction
 *   - hapticHeavy()   — 40ms, combat hit, level up, quest complete
 *   - hapticPattern() — custom sequence, special events
 */

/* ─── Internal: safe vibrate wrapper ─── */

/** Cached reference — avoids property lookups on every call. */
let vibrateFn: ((pattern: VibratePattern) => boolean) | null = null;

function getVibrateFn(): ((pattern: VibratePattern) => boolean) | null {
  if (vibrateFn !== null) return vibrateFn;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    vibrateFn = null;
    return null;
  }
  try {
    // Test call — some browsers expose the API but deny it at runtime.
    const ok = navigator.vibrate(0);
    vibrateFn = ok ? navigator.vibrate.bind(navigator) : null;
  } catch {
    vibrateFn = null;
  }
  return vibrateFn;
}

/* ─── Public API ─── */

/**
 * Light haptic — 10ms tap.
 * Use for: menu navigation, UI taps, button presses, gentle confirmations.
 */
export function hapticLight(): void {
  const fn = getVibrateFn();
  if (fn) fn(10);
}

/**
 * Medium haptic — 20ms tap.
 * Use for: item pickup, dialogue choice selection, NPC interaction,
 * skill check result, poetry power activation.
 */
export function hapticMedium(): void {
  const fn = getVibrateFn();
  if (fn) fn(20);
}

/**
 * Heavy haptic — 40ms tap.
 * Use for: combat hit received, level up, quest complete,
 * boss encounter start, critical failure.
 */
export function hapticHeavy(): void {
  const fn = getVibrateFn();
  if (fn) fn(40);
}

/**
 * Custom haptic pattern — sequence of vibration/pause intervals in ms.
 * Use for: dramatic events, complex feedback sequences.
 *
 * @example
 *   hapticPattern([10, 50, 20]);    // short tap, pause, longer tap
 *   hapticPattern([50, 30, 50, 30, 100]); // double-hit then slam
 */
export function hapticPattern(pattern: number[]): void {
  const fn = getVibrateFn();
  if (fn && pattern.length > 0) fn(pattern);
}

/* ─── Semantic presets ─── */

/** Item pickup — satisfying double-tap */
export function hapticItemPickup(): void {
  hapticPattern([12, 40, 8]);
}

/** Combat hit received — sharp thud */
export function hapticCombatHit(): void {
  hapticPattern([30, 20, 15]);
}

/** Combat hit dealt — lighter confirmation */
export function hapticCombatDealt(): void {
  hapticPattern([15, 30, 10]);
}

/** Dialogue choice selected */
export function hapticDialogueChoice(): void {
  hapticMedium();
}

/** Level up — triumphant triple pulse */
export function hapticLevelUp(): void {
  hapticPattern([20, 60, 20, 60, 40]);
}

/** Quest completed — satisfying ascending pattern */
export function hapticQuestComplete(): void {
  hapticPattern([10, 50, 15, 50, 20, 50, 35]);
}

/** NPC interaction start — gentle double-tap */
export function hapticNpcInteraction(): void {
  hapticPattern([14, 50, 10]);
}

/** Error / denied — short buzz */
export function hapticError(): void {
  hapticPattern([30, 20, 30]);
}

/** Poetry power activation — mystical wave */
export function hapticPoemPower(): void {
  hapticPattern([8, 30, 12, 30, 8, 30, 20]);
}
