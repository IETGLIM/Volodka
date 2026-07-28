/* ─── Volodka RPG – NPC Emotion Type Definitions ───
 *
 * Centralized type definition for NPC emotional states.
 * Used by emotional reactions, ambient barks, head tracking, and animation.
 */

export type { NpcEmotion } from '@/shared/types/definitions/npc';

/** All available NpcEmotion values for exhaustive checks. */
export const NPC_EMOTIONS: readonly NpcEmotion[] = [
  'neutral',
  'curious',
  'alarmed',
  'contemplative',
  'annoyed',
  'respectful',
  'fearful',
];

/** Human-readable labels for each emotion (Russian). */
export const NPC_EMOTION_LABELS: Record<NpcEmotion, string> = {
  neutral: 'Нейтральный',
  curious: 'Любопытный',
  alarmed: 'Встревоженный',
  contemplative: 'Задумчивый',
  annoyed: 'Недовольный',
  respectful: 'Почтительный',
  fearful: 'Испуганный',
};
