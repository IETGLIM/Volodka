import type { MemoryEmotion } from '@/game/memory/types';
import { getDominantEmotion } from '@/game/memory/memoryQueries';

export type WorldStateModifiers = {
  lighting: 'default' | 'dim' | 'warm';
  music: 'default' | 'melancholic' | 'hopeful';
};

/**
 * Лёгкие модификаторы атмосферы по доминирующей эмоции памяти (подключение к сцене/аудио — постепенно).
 */
export function getWorldStateModifiers(): WorldStateModifiers {
  const em: MemoryEmotion = getDominantEmotion();

  if (em === 'sad' || em === 'regret') {
    return { lighting: 'dim', music: 'melancholic' };
  }
  if (em === 'happy' || em === 'love') {
    return { lighting: 'warm', music: 'hopeful' };
  }
  return { lighting: 'default', music: 'default' };
}
