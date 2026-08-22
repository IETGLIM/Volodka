/* ─── Volodka RPG – NPC relation thresholds (shared layer) ─── */
/*
 * Pure numeric thresholds for NPC relation bands. Lives in shared/ so
 * `@/shared/npcBark.ts` (which decides bark band from relation value) does
 * not need to import `@/engine/npcRelationship/npcRelationshipConstants` —
 * a no-restricted-imports violation.
 *
 * The engine's `npcRelationshipConstants.ts` re-exports these constants for
 * backward compatibility with existing engine/component callers
 * (`DialogueRelationBar`, `npcRelationshipPresentation`, etc.).
 *
 * Keep in lock-step with `RelationMilestone` thresholds authored on
 * `NPCDefinition.relationMilestones` — the friendly threshold (65) MUST
 * match the "Союзник" (Ally) badge threshold in the relationship UI.
 */

/** Relation value at or above which an NPC is considered an ally (≥ 65). */
export const NPC_RELATION_ALLY_THRESHOLD = 65;

/** Relation value at or below which an NPC is considered an enemy (≤ 30). */
export const NPC_RELATION_ENEMY_THRESHOLD = 30;
