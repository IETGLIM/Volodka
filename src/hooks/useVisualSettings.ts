/* ─── React binding for engine/visualSettings ─── */

import { useSyncExternalStore } from 'react';
import {
  getVisualSettings,
  VISUAL_SETTINGS_CHANGED,
  type VisualSettingsSnapshot,
} from '@/engine/visualSettings';

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(VISUAL_SETTINGS_CHANGED, onStoreChange);
  return () => window.removeEventListener(VISUAL_SETTINGS_CHANGED, onStoreChange);
}

/** Reactive visual settings snapshot (postfx, brightness, shake, sensitivity…). */
export function useVisualSettings(): VisualSettingsSnapshot {
  return useSyncExternalStore(subscribe, getVisualSettings, getVisualSettings);
}
