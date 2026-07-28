/* ─── Screen effects imperative API (EventBus triggers) ─── */

import { eventBus } from '@/engine/EventBus';

export function triggerFlash(
  color: string = 'white',
  opacity: number = 0.3,
  duration: number = 300,
) {
  eventBus.emit('fx:flash', { color, opacity, duration });
}

export function triggerShake(intensity: number = 8, duration: number = 400) {
  eventBus.emit('fx:shake', { intensity, duration });
}

export function triggerVignette(intensity: number = 0.7, duration: number = 2000) {
  eventBus.emit('fx:vignette', { intensity, duration });
}

export function triggerChromaticAberration(intensity: number = 3, duration: number = 500) {
  eventBus.emit('fx:chromatic', { intensity, duration });
}

export function triggerSlowMotion(duration: number = 800) {
  eventBus.emit('fx:slowmo', { duration });
}

export function triggerAchievement(title: string, description: string, icon?: string) {
  eventBus.emit('fx:achievement', { title, description, icon });
}

export function triggerXpGain(amount: number, source?: string) {
  eventBus.emit('fx:xp_gain', { amount, source });
}
