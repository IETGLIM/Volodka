import type { MemoryEmotion } from './types';
import { getDominantEmotion } from './memoryQueries';
import { useMemoryStore } from './memoryStore';

const POSITIVE: MemoryEmotion[] = ['happy', 'love'];
const NEGATIVE: MemoryEmotion[] = ['sad', 'regret', 'anger'];

/**
 * Сводка эмоционального фона по журналу памяти (для UI / мира).
 */
export function getEmotionalProfile(): {
  dominantEmotion: MemoryEmotion;
  /** 0..1 — разброс интенсивностей по эмоциям */
  stability: number;
  /** 0..1 — доля «позитивных» vs «негативных» меток */
  positivity: number;
} {
  const memories = useMemoryStore.getState().memories;
  const dominantEmotion = getDominantEmotion();

  const intensities: number[] = [];
  let pos = 0;
  let neg = 0;
  for (const m of memories) {
    if (!m.emotion) continue;
    const i = m.intensity ?? 0.5;
    intensities.push(i);
    if (POSITIVE.includes(m.emotion)) pos += i;
    if (NEGATIVE.includes(m.emotion)) neg += i;
  }

  const mean =
    intensities.length > 0 ? intensities.reduce((a, b) => a + b, 0) / intensities.length : 0;
  const variance =
    intensities.length > 1
      ? intensities.reduce((s, v) => s + (v - mean) ** 2, 0) / intensities.length
      : 0;
  const stability = Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));

  const denom = pos + neg;
  const positivity = denom <= 0 ? 0.5 : pos / denom;

  return { dominantEmotion, stability, positivity };
}
