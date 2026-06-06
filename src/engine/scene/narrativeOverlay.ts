/* ─── Narrative overlay coordinator ───
 * Atomic open/close for story + dialogue overlays to avoid races where
 * showStoryOverlay and currentNodeId update in separate store writes.
 */

import { getGameStore } from '@/store/gameStore';

/** Open narrative overlay with node id in a single store write. */
export function openNarrativeOverlay(nodeId: string): void {
  getGameStore().openNarrativeOverlay(nodeId);
}

/** Close narrative overlay (node id retained for save/resume). */
export function closeNarrativeOverlay(): void {
  getGameStore().closeNarrativeOverlay();
}
