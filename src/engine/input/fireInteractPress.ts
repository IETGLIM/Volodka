/* ─── Volodka RPG – shared interact press (mobile HUD + gamepad) ─── */

import { eventBus } from '@/engine/EventBus';

/** Synthetic KeyE + EventBus, matching ExplorationMobileHud behaviour. */
export function fireInteractPress(source: 'gamepad' | 'mobile_hud' = 'gamepad'): void {
  try {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyE',
        key: 'e',
        bubbles: true,
        cancelable: true,
      }),
    );
    requestAnimationFrame(() => {
      window.dispatchEvent(
        new KeyboardEvent('keyup', {
          code: 'KeyE',
          key: 'e',
          bubbles: true,
          cancelable: true,
        }),
      );
    });
  } catch {
    /* SSR guard */
  }

  try {
    eventBus.emit('interact:press', { source });
  } catch {
    /* ignore */
  }
}
