/* ─── Volodka RPG – Thought Interjection System ───
   Disco Elysium-style: equipped thoughts "speak" as inner voices during dialogue,
   interjecting lines before/after NPC text, before choices, or on skill checks.
*/

import type { DialogueNode } from '@/shared/types/definitions/dialogue';
import type { ThoughtCabinetItem, TrainablePlayerSkill } from '@/shared/types/game';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

export interface ThoughtInterjection {
  /** The thought that's interjecting. */
  thoughtId: string;
  /** Display name for the bracket prefix (e.g. "Серверный Шёпот"). */
  thoughtName: string;
  /** The skill this thought "speaks through" — determines interjection trigger. */
  voice: TrainablePlayerSkill;
  /** The interjection text body (from thought flavorText or custom override). */
  text: string;
  /** When the interjection appears relative to the dialogue node content. */
  timing: 'before_npc' | 'after_npc' | 'before_choice' | 'on_skill_check';
  /** Emotional tone of the inner voice. */
  emotion?: 'calm' | 'angry' | 'sad' | 'whisper' | 'insight';
}

/* ══════════════════════════════════════════════════════════════
   Constants
   ══════════════════════════════════════════════════════════════ */

/** Maximum number of interjections per dialogue node (matches max 3 equipped thoughts). */
const MAX_INTERJECTIONS = 3;

/** Default timing preference per voice skill — which slot thoughts of each skill tend to fill. */
const SKILL_DEFAULT_TIMING: Record<TrainablePlayerSkill, ThoughtInterjection['timing']> = {
  logic: 'before_choice',
  coding: 'before_choice',
  empathy: 'after_npc',
  persuasion: 'after_npc',
  intuition: 'on_skill_check',
  writing: 'before_npc',
  rhythm: 'on_skill_check',
};

/** Default emotion per voice skill — the "flavor" of how each skill's inner voice sounds. */
const SKILL_DEFAULT_EMOTION: Record<TrainablePlayerSkill, ThoughtInterjection['emotion']> = {
  logic: 'calm',
  coding: 'insight',
  empathy: 'sad',
  persuasion: 'calm',
  intuition: 'whisper',
  writing: 'insight',
  rhythm: 'calm',
};

/* ══════════════════════════════════════════════════════════════
   Resolver
   ══════════════════════════════════════════════════════════════ */

/**
 * Find thoughts that should interject for a given dialogue node.
 *
 * A thought interjects when:
 * 1. It's currently equipped.
 * 2. Its voice skill matches the dialogue node's skill check skill.
 * 3. OR its thoughtId is explicitly listed in `node.thoughtInterjections`.
 *
 * Returns up to MAX_INTERJECTIONS (3) interjections, sorted by timing order:
 *   before_npc → after_npc → on_skill_check → before_choice
 */
export function resolveThoughtInterjections(
  dialogueNode: DialogueNode,
  equippedThoughts: ThoughtCabinetItem[],
  playerSkills: Record<TrainablePlayerSkill, number>,
): ThoughtInterjection[] {
  if (equippedThoughts.length === 0) return [];

  // Determine the node's skill check skill (if any)
  const nodeSkill = dialogueNode.condition?.minSkillCheck?.skill;
  const choiceSkills = dialogueNode.choices
    .map((c) => c.condition?.minSkillCheck?.skill)
    .filter(Boolean) as TrainablePlayerSkill[];

  // Collect all skills relevant to this node
  const nodeRelevantSkills = new Set<TrainablePlayerSkill>();
  if (nodeSkill) nodeRelevantSkills.add(nodeSkill);
  for (const s of choiceSkills) nodeRelevantSkills.add(s);

  // Explicitly requested interjection thought IDs
  const explicitThoughtIds = new Set(dialogueNode.thoughtInterjections ?? []);

  const interjections: ThoughtInterjection[] = [];

  for (const thought of equippedThoughts) {
    // Check: thought voice matches a node-relevant skill, OR thought ID is explicitly listed
    const voiceMatches = nodeRelevantSkills.has(thought.voice);
    const explicitlyRequested = explicitThoughtIds.has(thought.id);

    if (!voiceMatches && !explicitlyRequested) continue;

    // Determine timing
    // If this is an explicit interjection AND there's a skill check, use 'on_skill_check'
    // Otherwise use the skill's default timing
    const timing: ThoughtInterjection['timing'] =
      explicitlyRequested && nodeRelevantSkills.size > 0
        ? 'on_skill_check'
        : SKILL_DEFAULT_TIMING[thought.voice];

    // Determine emotion
    const emotion: ThoughtInterjection['emotion'] = SKILL_DEFAULT_EMOTION[thought.voice];

    interjections.push({
      thoughtId: thought.id,
      thoughtName: thought.name,
      voice: thought.voice,
      text: thought.flavorText,
      timing,
      emotion,
    });
  }

  // Sort by timing order: before_npc → after_npc → on_skill_check → before_choice
  const timingOrder: Record<ThoughtInterjection['timing'], number> = {
    before_npc: 0,
    after_npc: 1,
    on_skill_check: 2,
    before_choice: 3,
  };
  interjections.sort((a, b) => timingOrder[a.timing] - timingOrder[b.timing]);

  // Cap at MAX_INTERJECTIONS
  return interjections.slice(0, MAX_INTERJECTIONS);
}
