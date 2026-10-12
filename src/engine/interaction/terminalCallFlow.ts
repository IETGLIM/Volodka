/* ─── Terminal Call Flow — cutscene gate for the room terminal (v4.48.13) ───
 *
 * QA report: «при выборе терминала должна быть кат-сцена с экраном
 * терминала и созвоном с коллегами или чатом в чёрно-зелёной классической
 * цветовой схеме баша».
 *
 * Flow: E/ЛКМ на терминале → InteractionController.triggerLinkedContent →
 * beginTerminalCall(zone) (game phase → 'cutscene', локомоция заблокирована)
 * → TerminalCallCutscene overlay проигрывает bash-лог + созвон →
 * completeTerminalCall() → стандартная цепочка терминала (QTE-гейт →
 * codebreaker) продолжается как раньше.
 *
 * The overlay subscribes to `terminal_call:start` / `terminal_call:end`
 * on the EventBus — this module owns zero React state.
 */

import { eventBus } from '@/engine/EventBus';
import type { TriggerZone } from '@/data/triggerZones';
import { startQteMinigameGate } from '@/engine/qte/qteTriggers';
import { setActiveCutsceneFromEngine } from '@/shared/gameBridge/storeLifecycleHost';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/** Cutscene-store id while the call plays (locks locomotion via gamePhase). */
export const TERMINAL_CALL_CUTSCENE_ID = 'terminal_call';

let pendingZone: TriggerZone | null = null;
let active = false;

export function isTerminalCallActive(): boolean {
  return active;
}

/** Open the call cutscene for a terminal zone (idempotent per activation). */
export function beginTerminalCall(zone: TriggerZone): void {
  if (active) return;
  active = true;
  pendingZone = zone;
  // Game phase → 'cutscene': locomotion gate + interaction prompts lock.
  setActiveCutsceneFromEngine(TERMINAL_CALL_CUTSCENE_ID);
  eventBus.emit('terminal_call:start', {});
}

/** Call finished (or was skipped) — unlock and resume the terminal chain. */
export function completeTerminalCall(): void {
  if (!active) return;
  active = false;
  const zone = pendingZone;
  pendingZone = null;
  setActiveCutsceneFromEngine(null);
  eventBus.emit('terminal_call:end', {});
  if (zone) {
    // Standard terminal flow: QTE gate → minigame (or straight open).
    startQteMinigameGate(zone);
  }
}

/** Safety valve: scene transition / dispose — drop the pending chain. */
export function cancelTerminalCall(): void {
  if (!active) return;
  active = false;
  pendingZone = null;
  setActiveCutsceneFromEngine(null);
  eventBus.emit('terminal_call:end', {});
}

/* Scene transition while the call plays (fast exit during skip) — cancel
 * instead of resuming a minigame into a dying scene. */
eventBus.on('scene:enter', () => cancelTerminalCall());

registerHmrDispose(() => {
  cancelTerminalCall();
});
