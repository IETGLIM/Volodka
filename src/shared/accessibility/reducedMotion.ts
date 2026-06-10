/** User preference for reduced motion (overrides or supplements prefers-reduced-motion). */

export const REDUCED_MOTION_STORAGE_KEY = 'volodka_reduced_motion';
export const REDUCED_MOTION_CHANGED = 'volodka:reduced-motion-changed';

export function readReducedMotionPreference(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function writeReducedMotionPreference(enabled: boolean): void {
  localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(enabled));
  applyReducedMotionDom(enabled);
  window.dispatchEvent(new CustomEvent(REDUCED_MOTION_CHANGED, { detail: { enabled } }));
}

export function applyReducedMotionDom(enabled?: boolean): void {
  if (typeof document === 'undefined') return;
  const active = enabled ?? readReducedMotionPreference();
  document.documentElement.dataset.reducedMotion = active ? 'true' : 'false';
}

export function isReducedMotionActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.reducedMotion === 'true';
}
