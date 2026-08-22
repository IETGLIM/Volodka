/* ─── NPC bark text resolution + per-frame cache ─── */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { NPCDefinition } from '@/shared/types/game';
import { resolveNpcQuestBark } from '@/engine/npc/npcQuestBark';
import { resolveNpcBarkForRelation } from '@/shared/npcBark';

/** Cached relation value per NPC — updated once per interaction session, not per-frame */
const _barkRelationCache = new Map<string, { value: number; frame: number }>();
let _barkRelationFrame = 0;

/** Compute bark text based on active side quests, then NPC relation level */
export function computeBark(definition: NPCDefinition): string | null {
  const questBark = resolveNpcQuestBark(definition.id);
  if (questBark) return questBark;

  if (!definition.barkTexts) return null;

  // Cache relation lookups per-frame to avoid per-NPC getState() calls
  const cached = _barkRelationCache.get(definition.id);
  if (cached && cached.frame === _barkRelationFrame) {
    return resolveNpcBarkForRelation(definition.barkTexts, cached.value);
  }

  const npcRelations = getGameSnapshot().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === definition.id);
  const value = relation?.value ?? 50;
  _barkRelationCache.set(definition.id, { value, frame: _barkRelationFrame });

  return resolveNpcBarkForRelation(definition.barkTexts, value);
}

/** Call once per frame from any NPC to advance the bark cache frame counter */
export function advanceBarkRelationFrame(): void {
  _barkRelationFrame++;
  if (_barkRelationCache.size > 50) {
    _barkRelationCache.clear();
  }
}
