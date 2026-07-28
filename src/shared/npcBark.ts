/* ─── NPC proximity bark text resolution ─── */

import type { NpcEmotion } from '@/shared/types/definitions/npc';

/** Single line or a pool of variants — engine picks one at runtime. */
export type NPCBarkBand = string | readonly string[];

export interface NPCBarkTexts {
  readonly hostile: NPCBarkBand;
  readonly neutral: NPCBarkBand;
  readonly friendly: NPCBarkBand;
}

/**
 * Ambient barks — short overheard mutterings NPCs produce when the player is
 * NEAR them (within 4 m) but NOT interacting. Different from `barkTexts`
 * (which fire on approach): these are idle background chatter that makes a
 * scene feel inhabited.
 *
 * Each band is a pool of lines; the ambient bark system picks one at random
 * subject to a per-NPC cooldown (≥ 25 s between emissions for the same NPC).
 *
 * - `idle`     → default band, used when the NPC has no specific activity
 * - `working`  → used when the NPC is currently in a `working` animation
 *                (or any schedule-driven work activity)
 * - `pensive`  → rare band; the system rolls a 20 % chance per eligible tick
 *                to surface a more introspective line
 *
 * Emotion-linked barks — new bands keyed by NPC emotional state:
 * When an NPC is in a specific emotion, the emotion band overrides the
 * normal band selection, giving context-aware overheard speech.
 *
 * - `curious`      → «Что это?» «Интересно...»
 * - `alarmed`      → «Эй!» «Что происходит?»
 * - `contemplative` → «Хм...» «Красиво...»
 * - `respectful`   → «Здравствуйте.» «Добрый день.»
 * - `annoyed`      → «Ты мешаешь.» «Отойди.»
 * - `fearful`      → «Не трогай меня!» «Уходи...»
 */
export interface NPCAmbientBarks {
  /** Default idle mutterings (used when no other band qualifies). */
  readonly idle?: NPCBarkBand;
  /** Lines muttered while performing a working animation/activity. */
  readonly working?: NPCBarkBand;
  /** Rare introspective lines — 20 % chance per eligible tick. */
  readonly pensive?: NPCBarkBand;
  /** Emotion-linked barks — override band selection when NPC is in that emotion. */
  readonly curious?: NPCBarkBand;
  readonly alarmed?: NPCBarkBand;
  readonly contemplative?: NPCBarkBand;
  readonly respectful?: NPCBarkBand;
  readonly annoyed?: NPCBarkBand;
  readonly fearful?: NPCBarkBand;
}

/** Default emotion-linked bark pools (Russian). */
export const DEFAULT_EMOTION_BARKS: Record<NpcEmotion, readonly string[]> = {
  neutral: [],
  curious: ['Что это?', 'Интересно...', 'Хм, что-то новенькое.', 'Посмотрим...'],
  alarmed: ['Эй!', 'Что происходит?', 'Это ещё что?', 'Тревога!'],
  contemplative: ['Хм...', 'Красиво...', 'Задумчиво...', 'Надо подумать...'],
  respectful: ['Здравствуйте.', 'Добрый день.', 'Позвольте...', 'Уважаемый...'],
  annoyed: ['Ты мешаешь.', 'Отойди.', 'Не сейчас.', 'Сколько можно...'],
  fearful: ['Не трогай меня!', 'Уходи...', 'Помогите!', 'Страшно...'],
};

export function pickNpcBarkLine(band: NPCBarkBand): string {
  if (typeof band === 'string') return band;
  if (band.length === 0) return '';
  const index = Math.floor(Math.random() * band.length);
  return band[index] ?? band[0];
}

/** Relation bands: ≤30 hostile, ≥70 friendly, otherwise neutral. */
export function resolveNpcBarkForRelation(
  barkTexts: NPCBarkTexts,
  relationValue: number,
): string {
  if (relationValue <= 30) return pickNpcBarkLine(barkTexts.hostile);
  if (relationValue >= 70) return pickNpcBarkLine(barkTexts.friendly);
  return pickNpcBarkLine(barkTexts.neutral);
}

/**
 * Resolve an ambient bark line for an NPC given its current activity, emotion,
 * and a random roll (0–1). Returns `null` if no ambient barks are defined or the
 * rolled band is missing.
 *
 * Emotion-linked barks take priority: if the NPC has a specific emotion band
 * defined in their `ambientBarks`, and that emotion is currently active, the
 * emotion band overrides normal selection. If the NPC doesn't have a custom
 * emotion band, the default pool from `DEFAULT_EMOTION_BARKS` is used.
 *
 * @param ambientBarks  NPC's ambient bark configuration (may be undefined)
 * @param isWorking     True when the NPC is in a `working` animation/activity
 * @param emotion       Current NPC emotional state (affects band selection)
 * @param rng           0–1 random roll controlling pensive vs. idle selection
 */
export function resolveNpcAmbientBark(
  ambientBarks: NPCAmbientBarks | undefined,
  isWorking: boolean,
  emotion: NpcEmotion = 'neutral',
  rng: number = Math.random(),
): string | null {
  if (!ambientBarks) {
    // No custom barks defined — fall through to default emotion barks
    if (emotion !== 'neutral') {
      const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
      if (defaultBark.length > 0) return pickNpcBarkLine(defaultBark);
    }
    return null;
  }

  // Priority 1: emotion-linked bark override
  if (emotion !== 'neutral') {
    const emotionBand = ambientBarks[emotion];
    if (emotionBand) {
      return pickNpcBarkLine(emotionBand);
    }
    // No custom emotion band — fall through to default emotion barks
    const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
    if (defaultBark.length > 0) return pickNpcBarkLine(defaultBark);
  }

  // 20 % chance to surface a pensive line when one is defined.
  if (ambientBarks.pensive && rng < 0.2) {
    return pickNpcBarkLine(ambientBarks.pensive);
  }

  // Working band takes priority when the NPC is actively working.
  if (isWorking && ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  // Default: idle band.
  if (ambientBarks.idle) {
    return pickNpcBarkLine(ambientBarks.idle);
  }

  // Fall back to working if idle is missing.
  if (ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  return null;
}

/**
 * Resolve which bark band was selected (for UI styling / theming).
 * Returns the band key that was actually used.
 */
export function resolveNpcAmbientBarkBand(
  ambientBarks: NPCAmbientBarks | undefined,
  isWorking: boolean,
  emotion: NpcEmotion = 'neutral',
  rng: number = Math.random(),
): NpcEmotion | 'idle' | 'working' | 'pensive' {
  if (!ambientBarks) {
    if (emotion !== 'neutral') return emotion;
    return 'idle';
  }

  // Priority 1: emotion override
  if (emotion !== 'neutral') {
    const emotionBand = ambientBarks[emotion];
    if (emotionBand) return emotion;
    const defaultBark = DEFAULT_EMOTION_BARKS[emotion];
    if (defaultBark.length > 0) return emotion;
  }

  if (ambientBarks.pensive && rng < 0.2) return 'pensive';
  if (isWorking && ambientBarks.working) return 'working';
  if (ambientBarks.idle) return 'idle';
  if (ambientBarks.working) return 'working';

  return 'idle';
}
