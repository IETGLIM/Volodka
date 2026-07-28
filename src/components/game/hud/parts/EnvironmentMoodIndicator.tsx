/* ─── Volodka RPG – Environment Mood Indicator ───
   Shows a subtle bar at the bottom of the top bar indicating the current
   environmental mood/atmosphere of the scene. Derives mood from weather,
   time of day, and scene category.
*/

import { useMemo } from 'react';
import { useCurrentSceneId, useTimeOfDay, useWeatherState } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { SCENE_LOCATION_CATEGORIES } from '@/config/sceneLocationCategories';
import type { SceneId } from '@/config/sceneDefinitions';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface MoodData {
  icon: string;
  label: string;
  intensity: number; // 0-1
  hue: string; // CSS color
}

function deriveMood(
  sceneId: SceneId,
  timeOfDay: number,
  weatherEnabled: boolean,
  rainIntensity: number
): MoodData {
  const _config = SCENE_CONFIG[sceneId];
  const category = SCENE_LOCATION_CATEGORIES[sceneId as SceneId] ?? 'unknown';

  // Night time (20:00-06:00)
  const isNight = timeOfDay >= 20 || timeOfDay < 6;
  const isDusk = timeOfDay >= 17 && timeOfDay < 20;
  const isDawn = timeOfDay >= 5 && timeOfDay < 7;

  // Rain/storm
  const isStormy = weatherEnabled && rainIntensity > 0.6;
  const isRainy = weatherEnabled && rainIntensity > 0;

  // Priority: storm > rain > night > dusk/dawn > category default
  if (isStormy) return { icon: '⛈', label: 'ШТОРМ', intensity: 0.9, hue: 'rgba(148, 163, 184, 0.8)' };
  if (isRainy) return { icon: '🌧', label: 'ДОЖДЬ', intensity: 0.6, hue: 'rgb(var(--cyber-cyan-rgb) / 0.7)' };
  if (isNight) return { icon: '🌙', label: 'НОЧЬ', intensity: 0.7, hue: 'rgba(139, 92, 246, 0.8)' };
  if (isDusk) return { icon: '🌅', label: 'СУМЕРКИ', intensity: 0.5, hue: 'rgba(251, 146, 60, 0.8)' };
  if (isDawn) return { icon: '🌄', label: 'РАССВЕТ', intensity: 0.4, hue: 'rgba(251, 191, 36, 0.8)' };

  // Category defaults — map to actual LocationCategory values
  switch (category) {
    case 'home':
      return { icon: '🏠', label: 'УЮТ', intensity: 0.25, hue: 'rgba(251, 191, 36, 0.7)' };
    case 'rooftop':
    case 'park':
    case 'street':
      return { icon: '☀', label: 'ТИШИНА', intensity: 0.3, hue: 'var(--cyber-cyan)' };
    case 'factory':
    case 'corridor':
      return { icon: '🕳', label: 'ПОДЗЕМЬЕ', intensity: 0.6, hue: 'rgba(148, 163, 184, 0.6)' };
    case 'cafe':
    case 'office':
    case 'library':
      return { icon: '✦', label: 'НЕЙТРАЛЬ', intensity: 0.2, hue: 'var(--cyber-cyan)' };
    default:
      return { icon: '✦', label: 'НЕЙТРАЛЬ', intensity: 0.2, hue: 'var(--cyber-cyan)' };
  }
}

export function EnvironmentMoodIndicator() {
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const { weatherEnabled, rainIntensity } = useWeatherState();
  const reducedMotion = useEffectiveReducedMotion();

  const mood = useMemo(
    () => deriveMood(sceneId, timeOfDay, weatherEnabled, rainIntensity),
    [sceneId, timeOfDay, weatherEnabled, rainIntensity]
  );

  return (
    <div
      className="flex items-center gap-2 px-2 py-0.5 rounded-md"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.08)',
      }}
      aria-label={`Настроение: ${mood.label}`}
      role="status"
    >
      <span
        className={`mood-bar-icon text-xs ${reducedMotion ? '' : ''}`}
        style={{ animation: reducedMotion ? 'none' : undefined }}
      >
        {mood.icon}
      </span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-[48px]">
        <div className="mood-bar-container">
          <div
            className="mood-bar-fill"
            style={{
              width: `${mood.intensity * 100}%`,
              background: `linear-gradient(90deg, ${mood.hue}40, ${mood.hue}, ${mood.hue}40)`,
              backgroundSize: '200% 100%',
              animation: reducedMotion ? 'none' : undefined,
            }}
          />
        </div>
      </div>
      <span
        className="mood-bar-label"
        style={{ color: mood.hue }}
      >
        {mood.label}
      </span>
    </div>
  );
}