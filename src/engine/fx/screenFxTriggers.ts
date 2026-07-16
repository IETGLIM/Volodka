/* ─── Volodka RPG – Screen FX Trigger API ───
   Pure functions that emit EventBus events for screen effects.
   Extracted from ScreenEffects.tsx to fix Vite Fast Refresh (HMR)
   incompatibility caused by co-locating non-component exports with
   the React component.
*/

import { eventBus } from '@/engine/EventBus';

/** Flash the screen with a color overlay */
export function triggerFlash(color: string = 'white', opacity: number = 0.3, duration: number = 300) {
  eventBus.emit('fx:flash', { color, opacity, duration });
}

/** Shake the screen */
export function triggerShake(intensity: number = 8, duration: number = 400) {
  eventBus.emit('fx:shake', { intensity, duration });
}

/** Apply a temporary vignette overlay */
export function triggerVignette(intensity: number = 0.7, duration: number = 2000) {
  eventBus.emit('fx:vignette', { intensity, duration });
}

/** Apply chromatic aberration effect */
export function triggerChromaticAberration(intensity: number = 3, duration: number = 500) {
  eventBus.emit('fx:chromatic', { intensity, duration });
}

/** Trigger XP gain notification (emits fx:xp_gain event) */
export function triggerXpGain(amount: number, source?: string) {
  eventBus.emit('fx:xp_gain', { amount, source });
}

/** Trigger a damage vignette — red flash with heavy vignette */
export function triggerDamageVignette(intensity: number = 0.6, duration: number = 600) {
  eventBus.emit('fx:damage_vignette', { intensity, duration });
}

