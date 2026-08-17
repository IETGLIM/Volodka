/**
 * Module-level singleton tracking whether the ExplorationPostFX EffectComposer
 * is currently mounted and active.
 *
 * Why this exists:
 * - When postfx is ON, the EffectComposer applies ACESFilmic tone mapping as a
 *   pass. The renderer itself must be NoToneMapping to avoid double tone curve.
 * - When postfx is OFF (user disabled, low preset, or menu), there is no
 *   EffectComposer. The renderer must use ACESFilmicToneMapping directly,
 *   otherwise the scene renders with no tone curve → clipped highlights,
 *   crushed darks.
 *
 * RPGGameCanvas's post-frame guard reads this flag to decide which toneMapping
 * to enforce. ExplorationPostFX sets it on mount/unount.
 */

let postfxActive = false;
const listeners = new Set<() => void>();

export function isPostfxActive(): boolean {
  return postfxActive;
}

export function setPostfxActive(active: boolean): void {
  if (postfxActive === active) return;
  postfxActive = active;
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // listener errors are non-fatal — guard state is already updated
    }
  }
}

export function subscribePostfxActive(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reset to defaults — used by engine teardown and tests. */
export function resetPostfxActiveState(): void {
  postfxActive = false;
  listeners.clear();
}
