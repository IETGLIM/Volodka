/** Interactive-object auto-close timers — shared module (no store/engine imports). */

import { registerHmrDispose } from '@/shared/dev/hmrDispose';

interface AutoCloseEntry {
  timer: ReturnType<typeof setTimeout> | number;
  generation: number;
}

const autoCloseTimers = new Map<string, AutoCloseEntry>();
let autoCloseGeneration = 0;
let autoCloseSchedulingSuspended = false;

export function getAutoCloseGeneration(): number {
  return autoCloseGeneration;
}

export function isAutoCloseSchedulingSuspended(): boolean {
  return autoCloseSchedulingSuspended;
}

export function trackAutoCloseTimer(
  id: string,
  timer: ReturnType<typeof setTimeout> | number,
  generation: number,
): void {
  if (generation !== autoCloseGeneration) {
    clearTimeout(timer);
    return;
  }
  autoCloseTimers.set(id, { timer, generation });
}

export function clearAutoCloseTimer(id: string): (ReturnType<typeof setTimeout> | number) | undefined {
  const existing = autoCloseTimers.get(id);
  if (existing !== undefined) {
    autoCloseTimers.delete(id);
    return existing.timer;
  }
  return undefined;
}

export function deleteAutoCloseTimer(id: string): void {
  autoCloseTimers.delete(id);
}

/** Clear all pending auto-close timers (game reset / engine dispose / HMR). */
export function clearAutoCloseTimers(): void {
  autoCloseGeneration++;
  for (const { timer } of autoCloseTimers.values()) {
    clearTimeout(timer);
  }
  autoCloseTimers.clear();
}

/** Block new timers and invalidate pending ones (engine dispose / StrictMode unmount). */
export function suspendAutoCloseTimers(): void {
  clearAutoCloseTimers();
  autoCloseSchedulingSuspended = true;
}

/** Drop dead-zone timers and re-allow scheduling (engine revive / StrictMode remount). */
export function resumeAutoCloseTimers(): void {
  clearAutoCloseTimers();
  autoCloseSchedulingSuspended = false;
}

registerHmrDispose(suspendAutoCloseTimers);
