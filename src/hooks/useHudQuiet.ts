/* ─── Volodka RPG – quiet HUD controller ───
 *  Ambient HUD elements (stats, minimap, compass, toolbars) fade to a faint
 *  ghost after a few seconds without player input, so the noir scene owns the
 *  screen. Any input, combat event or notification wakes them up.
 *
 *  Shared module state + useSyncExternalStore — one set of window listeners
 *  regardless of how many HUD components subscribe.
 */

import { useSyncExternalStore, type CSSProperties } from 'react';
import { eventBus, type EventBusUnsubscribe } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';

const QUIET_AFTER_MS = 6000;
const CHECK_INTERVAL_MS = 1000;
/** Ghost opacity while quiet — glanceable, not gone */
export const HUD_QUIET_OPACITY = 0.14;

let lastActivityTs = Date.now();
let quiet = false;
let subscriberCount = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let busUnsubs: EventBusUnsubscribe[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

/** Wake the HUD (resets the idle timer). Safe to call from anywhere. */
export function markHudActivity(): void {
  lastActivityTs = Date.now();
  if (quiet) {
    quiet = false;
    notifyListeners();
  }
}

function tick(): void {
  // Never fade during combat, narrative overlays, or journal — the player
  // is reading / deciding and ambient chrome should stay legible.
  const state = useGameStore.getState();
  const phase = readGamePhase(state);
  const shouldStayAwake =
    phase === 'combat'
    || state.showStoryOverlay
    || state.diegeticNarrative != null
    || state.journalOpen;
  const idle = Date.now() - lastActivityTs > QUIET_AFTER_MS;
  const next = idle && !shouldStayAwake;
  if (next !== quiet) {
    quiet = next;
    notifyListeners();
  }
}

let lastPointerMark = 0;
function onPointerMove(): void {
  // Throttle pointermove — waking once per 500 ms is plenty
  const now = Date.now();
  if (now - lastPointerMark > 500) {
    lastPointerMark = now;
    markHudActivity();
  }
}

/** Ignore key auto-repeat so WASD hold doesn't spam the quiet-HUD path. */
function onKeyDown(e: KeyboardEvent): void {
  if (e.repeat) return;
  markHudActivity();
}

function attach(): void {
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', markHudActivity, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('wheel', markHudActivity, { passive: true });
  busUnsubs = [
    eventBus.on('combat:hit', markHudActivity),
    eventBus.on('toast:add', markHudActivity),
    eventBus.on('scene:enter', markHudActivity),
  ];
  intervalId = setInterval(tick, CHECK_INTERVAL_MS);
}

function detach(): void {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerdown', markHudActivity);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('wheel', markHudActivity);
  for (const unsub of busUnsubs) unsub();
  busUnsubs = [];
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  if (++subscriberCount === 1) attach();
  return () => {
    listeners.delete(onStoreChange);
    if (--subscriberCount === 0) detach();
  };
}

function getSnapshot(): boolean {
  return quiet;
}

/** Whether ambient HUD should currently be faded out. */
export function useHudQuiet(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Ready-made style for ambient HUD roots: ghost opacity + smooth transition. */
export function useHudQuietStyle(): CSSProperties {
  const isQuiet = useHudQuiet();
  return {
    opacity: isQuiet ? HUD_QUIET_OPACITY : 1,
    transition: 'opacity 0.9s ease',
  };
}
