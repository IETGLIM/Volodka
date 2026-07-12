/* ─── Narrative overlay coordinator ───
 * Atomic open/close for story + dialogue overlays to avoid races where
 * showStoryOverlay and currentNodeId update in separate store writes.
 */

import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import type { NarrativeKind } from '@/shared/types/narrativeKind';

/** Open narrative overlay with node id in a single store write. */
export function openNarrativeOverlay(nodeId: string, kind: NarrativeKind): void {
  dispatchGameAction({ type: 'story/openNarrativeOverlay', nodeId, kind });
}

/** Open compact diegetic HUD (Act 1) — world stays visible, movement unlocked. */
export function openDiegeticNarrative(nodeId: string, kind: NarrativeKind): void {
  dispatchGameAction({ type: 'story/openDiegeticNarrative', nodeId, kind });
}

/** Close narrative overlay (node id retained for save/resume). */
export function closeNarrativeOverlay(): void {
  dispatchGameAction({ type: 'story/closeNarrativeOverlay' });
}

/** Close diegetic HUD only. */
export function closeDiegeticNarrative(): void {
  dispatchGameAction({ type: 'story/closeDiegeticNarrative' });
}
