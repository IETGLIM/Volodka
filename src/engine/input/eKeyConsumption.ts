/* ─── Volodka RPG – E-key interact debounce (shared across world + UI panels) ─── */

let consumed = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** True while a recent E-key press was handled elsewhere (examine continue, world interact). */
export function isEKeyConsumed(): boolean {
  return consumed;
}

/** Block duplicate E-key interact handling for `durationMs` (default 200ms). */
export function consumeEKey(durationMs = 200): void {
  if (timer) clearTimeout(timer);
  consumed = true;
  timer = setTimeout(() => {
    consumed = false;
    timer = undefined;
  }, durationMs);
}

/** Clear debounce — scene enter / teardown. */
export function resetEKeyConsumption(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  consumed = false;
}
