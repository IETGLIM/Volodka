import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';

export function karmaColor(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'text-cyan-400';
  if (karma <= KARMA_LOW_THRESHOLD) return 'text-rose-400';
  return 'text-amber-400';
}

export function karmaStroke(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'var(--cyber-cyan)';
  if (karma <= KARMA_LOW_THRESHOLD) return '#fb7185';
  return '#fbbf24';
}

export function timeLabel(hour: number): string {
  if (hour >= 6 && hour < 10) return 'Утро';
  if (hour >= 10 && hour < 18) return 'День';
  if (hour >= 18 && hour < 21) return 'Вечер';
  return 'Ночь';
}

export function formatGameClock(timeOfDay: number): string {
  const hours = Math.floor(timeOfDay).toString().padStart(2, '0');
  const minutes = ((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
