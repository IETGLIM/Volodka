import type { Memory, MemoryEmotion } from './types';

/** Вклад эмоции одного воспоминания (масштаб × intensity в `recalculateRelationship`). */
const EMOTION_DELTA: Record<MemoryEmotion, number> = {
  love: 20,
  happy: 10,
  neutral: 0,
  sad: -8,
  regret: -10,
  anger: -20,
};

/**
 * Пересчёт раппорта 0..100 по воспоминаниям сущности: база 50 + эмоции (с intensity) + лёгкий бонус за «плотность» моментов.
 */
export function recalculateRelationship(entityId: string, allMemories: Memory[]): number {
  const list = allMemories.filter((m) => m.relatedEntityId === entityId);
  let score = 50;
  const engagement = Math.min(12, list.length * 2);
  score += engagement;

  for (const m of list) {
    if (!m.emotion) continue;
    const delta = EMOTION_DELTA[m.emotion] ?? 0;
    const inten = m.intensity ?? 0.5;
    score += delta * inten;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
