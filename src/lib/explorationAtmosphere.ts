import type { SceneId } from '@/data/types';

export type ExplorationWeather = 'clear' | 'drizzle' | 'rain' | 'snow' | 'fog';

function normHour(h: number): number {
  return ((h % 24) + 24) % 24;
}

/** Глубокая ночь / раннее утро — опаснее на улице. */
export function isDeepNight(hour: number): boolean {
  const t = normHour(hour);
  return t >= 22 || t < 6;
}

export function getExplorationWeather(sceneId: SceneId, hour: number): ExplorationWeather {
  if (sceneId === 'street_winter') return 'snow';
  if (sceneId === 'street_night') {
    return isDeepNight(hour) ? 'fog' : 'drizzle';
  }
  if (sceneId === 'memorial_park' && isDeepNight(hour)) return 'fog';
  return 'clear';
}

/**
 * Дополнительный стресс за один тик (вызывается редко из оркестратора), только уличные сцены.
 */
export function getExplorationAmbientStressPerTick(sceneId: SceneId, hour: number): number {
  if (sceneId === 'street_night') {
    let v = isDeepNight(hour) ? 0.4 : 0.12;
    const w = getExplorationWeather(sceneId, hour);
    if (w === 'fog' || w === 'drizzle') v *= 1.12;
    return Math.min(0.85, v);
  }
  if (sceneId === 'street_winter') {
    let v = isDeepNight(hour) ? 0.28 : 0.16;
    v *= 1.06;
    return Math.min(0.75, v);
  }
  return 0;
}
