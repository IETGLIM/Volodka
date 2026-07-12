/* ─── Volodka RPG – default NPC GLB clip overrides ─── */
/* Matches canonical names in mixamoAnimationCatalog + Quaternius PascalCase aliases. */

import type { NPCAnimationClips } from '@/shared/types/definitions/npc';

/** Shared clip overrides for rigged NPCs (Quaternius + staged animation GLBs). */
export const DEFAULT_NPC_ANIMATION_CLIPS: NPCAnimationClips = {
  idle: 'idle',
  walk: 'walking',
  talk: 'talking',
  sit: 'sitting',
};
