/* ─── Volodka RPG – Relation milestone bridge ───
 * When an NPC's relation value crosses a `relationMilestones` threshold
 * (rising or falling), emit `npc:relation_milestone` so the UI can open the
 * authored milestone dialogue node. Milestones are one-shot per crossing —
 * to re-fire, the relation must leave the threshold and cross it again.
 */

import { eventBus } from '@/engine/EventBus';
import { findNpcById } from '@/data/allNpcDefinitions';

export interface RelationMilestonePayload {
  /** Canonical NPC id (resolved via `resolveCanonicalNpcId`). */
  npcId: string;
  /** Threshold value that was crossed (0–100). */
  milestoneValue: number;
  /** Dialogue node id to open to surface the milestone. */
  dialogueNodeId: string;
  /** Direction of the crossing — `rising` if value increased, `falling` if decreased. */
  direction: 'rising' | 'falling';
}

/**
 * Detects any `relationMilestones` thresholds on the NPC definition that were
 * crossed between `oldRelation` and `newRelation`, and emits a
 * `npc:relation_milestone` event for each. No-op when the NPC has no
 * milestones defined, when `oldRelation === newRelation`, or when no
 * threshold was crossed.
 *
 * Crossing rules (matches the spec in `RelationMilestone`):
 *  - Rising:  `oldRelation < value && value <= newRelation`
 *  - Falling: `oldRelation > value && value >= newRelation`
 *
 * The function is pure w.r.t. the game store — it only consults the NPC
 * registry and the event bus. Callers should invoke it AFTER the new
 * relation has been committed so listeners (DialogueRenderer) read the
 * fresh value.
 */
export function checkRelationMilestones(
  npcId: string,
  oldRelation: number,
  newRelation: number,
): void {
  if (oldRelation === newRelation) return;

  const def = findNpcById(npcId);
  const milestones = def?.relationMilestones;
  if (!milestones || milestones.length === 0) return;

  const rising = newRelation > oldRelation;
  for (const m of milestones) {
    const crossed = rising
      ? oldRelation < m.value && m.value <= newRelation
      : oldRelation > m.value && m.value >= newRelation;
    if (!crossed) continue;

    eventBus.emit('npc:relation_milestone', {
      npcId: def.id,
      milestoneValue: m.value,
      dialogueNodeId: m.dialogueNodeId,
      direction: rising ? 'rising' : 'falling',
    });
  }
}
