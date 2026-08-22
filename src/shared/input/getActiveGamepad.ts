/* ─── Volodka RPG – shared Gamepad API reader ─── */
/* Pure function — no engine or store imports.
 * Lives in shared/ so `@/shared/utils/gamepadRumble.ts` (which calls it) stays
 * free of `@/engine/**` imports per the no-restricted-imports boundary.
 * The engine's `@/engine/input/gamepad.ts` re-exports this for backward
 * compatibility with engine/component callers (`pollGamepad` etc.).
 */

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
