/**
 * Warm narrative packs + NPC GLB when the player approaches an NPC
 * (hint / proximity), before they confirm with E.
 */

import { findNpcById } from '@/data/gameDataLoader';
import { prefetchDialogueFrontier, prefetchStoryNodes } from '@/data/gameDataLoader';
import { preloadNpcModel } from '@/engine/scene/sceneGpuLifecycle';
import { resolveNpcNarrativeTarget } from '@/engine/interaction/npcNarrativeRouting';
import type { SceneId } from '@/shared/types/game';

const warmedNpcIds = new Set<string>();

/** Prefetch dialogue/story for the NPC under the approach hint. Idempotent per NPC. */
export function prefetchNpcNarrativeOnApproach(
  npcId: string,
  sceneId: SceneId,
): void {
  if (!npcId || warmedNpcIds.has(npcId)) return;
  warmedNpcIds.add(npcId);

  preloadNpcModel(npcId);

  const npcDef = findNpcById(npcId);
  const target = resolveNpcNarrativeTarget(npcId, npcDef?.dialogueNodeId, sceneId);
  if (!target) return;

  if (target.kind === 'story') {
    prefetchStoryNodes([target.nodeId]);
  } else {
    // Root + choice frontier depth-2 so talk open does not hitch on pack load.
    prefetchDialogueFrontier([target.nodeId], 2);
  }
}

/** Test / scene-reset helper. */
export function resetNpcNarrativePrefetchForTests(): void {
  warmedNpcIds.clear();
}
