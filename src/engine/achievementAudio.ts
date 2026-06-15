import { audioEngine } from '@/engine/AudioEngine';
import { DEFAULT_ACHIEVEMENT_SOUND } from '@/data/achievementHelpers';

type StingerId = 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery';

const STINGER_IDS = new Set<string>(['tension', 'discovery', 'danger', 'emotional', 'mystery']);

/** Play per-achievement unlock sound (stinger:discovery or sfx preset notify). */
export function playAchievementUnlockSound(soundEffect?: string): void {
  const effect = soundEffect ?? DEFAULT_ACHIEVEMENT_SOUND;
  try {
    if (effect.startsWith('stinger:')) {
      const id = effect.slice('stinger:'.length);
      if (STINGER_IDS.has(id)) {
        audioEngine.playStinger(id as StingerId);
        return;
      }
    }
    audioEngine.playSfx(effect);
  } catch {
    audioEngine.playStinger('discovery');
  }
}
