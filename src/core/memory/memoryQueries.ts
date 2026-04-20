import type { MemoryEmotion } from './types';
import { useMemoryStore } from './memoryStore';

export { getRelationshipScore as getRelationship } from './relationshipAccess';

const EMOTION_WEIGHT: Record<MemoryEmotion, number> = {
  love: 1,
  happy: 0.65,
  neutral: 0,
  sad: -0.45,
  regret: -0.55,
  anger: -0.85,
};

export function hasMemory(tag: string): boolean {
  return useMemoryStore.getState().getMemoriesByTag(tag).length > 0;
}

/** Доминирующая эмоция по недавним записям с полем `emotion` (вес ~ intensity). */
export function getDominantEmotion(): MemoryEmotion {
  const memories = useMemoryStore.getState().memories;
  const scores = new Map<MemoryEmotion, number>();
  for (const m of memories) {
    if (!m.emotion) continue;
    const w = (m.intensity ?? 0.5) * (EMOTION_WEIGHT[m.emotion] ?? 0);
    scores.set(m.emotion, (scores.get(m.emotion) ?? 0) + w);
  }
  let best: MemoryEmotion = 'neutral';
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const [emo, score] of scores) {
    if (score > bestScore) {
      bestScore = score;
      best = emo;
    }
  }
  return best;
}
