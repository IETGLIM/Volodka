/* ─── Volodka RPG – NPC Ambient Idle Variants ───
 *
 * Instead of every NPC using the same static idle pose, each NPC
 * gets one of 5 idle variants based on their personality/role:
 *
 *   idle_relaxed  — slight sway, occasional deep breath
 *   idle_alert    — head turns, scanning environment
 *   idle_bored    — shifts weight, looks around slowly
 *   idle_working  — subtle hand movements (typing, writing)
 *   idle_social   — gestures, occasional nods
 *
 * The NPC definition specifies which variant they prefer via
 * `idleVariant`. When an emotion overrides the idle, the
 * emotion's idle variant takes priority.
 */

import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import type { NpcEmotion } from '@/engine/npc/npcEmotionTypes';
import { resolveEmotionBehavior } from '@/engine/npc/npcEmotionalReactions';

/* ─── Idle variant definitions ─── */

export type { NpcIdleVariant } from '@/shared/types/definitions/npc';

/** All available idle variant values. */
export const NPC_IDLE_VARIANTS: readonly NpcIdleVariant[] = [
  'idle_relaxed',
  'idle_alert',
  'idle_bored',
  'idle_working',
  'idle_social',
];

/** Human-readable labels for each idle variant (Russian). */
export const NPC_IDLE_VARIANT_LABELS: Record<NpcIdleVariant, string> = {
  idle_relaxed: 'Расслабленный',
  idle_alert: 'Настороженный',
  idle_bored: 'Скучающий',
  idle_working: 'Работающий',
  idle_social: 'Общительный',
};

/** Idle variant → suggested animation clip overrides. */
const IDLE_VARIANT_CLIP_MAP: Record<NpcIdleVariant, NpcAnimationClipOverrides> = {
  idle_relaxed: { idle: 'idle_relaxed' },
  idle_alert: { idle: 'idle_alert' },
  idle_bored: { idle: 'idle_bored' },
  idle_working: { idle: 'idle_working' },
  idle_social: { idle: 'idle_social' },
};

/** Idle variant → secondary clip suggestions (for walk/talk variants). */
const IDLE_VARIANT_SECONDARY_CLIPS: Record<NpcIdleVariant, Partial<NpcAnimationClipOverrides>> = {
  idle_relaxed: {},
  idle_alert: { walk: 'walk_alert' },
  idle_bored: {},
  idle_working: { sit: 'working' },
  idle_social: { talk: 'talk_social' },
};

/* ─── Role → default idle variant mapping ─── */

/** NPC role/activity type → preferred idle variant. */
export type NpcRole = 'philosopher' | 'guard' | 'worker' | 'barista' | 'social' | 'bystander' | 'official';

const ROLE_TO_IDLE_VARIANT: Record<NpcRole, NpcIdleVariant> = {
  philosopher: 'idle_relaxed',
  guard: 'idle_alert',
  worker: 'idle_working',
  barista: 'idle_working',
  social: 'idle_social',
  bystander: 'idle_bored',
  official: 'idle_social',
};

/** Resolve the default idle variant for an NPC role. */
export function resolveIdleVariantForRole(role: NpcRole): NpcIdleVariant {
  return ROLE_TO_IDLE_VARIANT[role];
}

/* ─── Clip override resolution ─── */

/** Resolve clip overrides for an NPC's idle variant. */
export function resolveIdleVariantClipOverrides(
  variant: NpcIdleVariant,
): NpcAnimationClipOverrides {
  return {
    ...IDLE_VARIANT_CLIP_MAP[variant],
    ...IDLE_VARIANT_SECONDARY_CLIPS[variant],
  };
}

/**
 * Resolve the effective idle variant for an NPC, considering:
 *   1. If an emotion is active, use the emotion's idle variant.
 *   2. If the NPC has an explicit idle variant in its definition, use that.
 *   3. Otherwise, fall back to the default 'idle' clip.
 *
 * Returns the clip override that should be applied.
 */
export function resolveEffectiveIdleClipOverrides(
  emotion: NpcEmotion,
  definitionVariant?: NpcIdleVariant,
): NpcAnimationClipOverrides | undefined {
  // Priority 1: emotion-driven variant
  if (emotion !== 'neutral') {
    const emotionBehavior = resolveEmotionBehavior(emotion);
    const emotionOverride = emotionBehavior.clipOverride;
    if (emotionOverride) return emotionOverride;
  }

  // Priority 2: definition-driven variant
  if (definitionVariant) {
    return resolveIdleVariantClipOverrides(definitionVariant);
  }

  // No override needed — use the default idle clip
  return undefined;
}
