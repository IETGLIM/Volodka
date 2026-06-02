
/* ─── Volodka RPG – Weather Controller ───
 *  Automatically activates rain/snow based on current scene
 *  street_night → Rain (heavy), street_winter → Snow,
 *  rooftop_edge → Rain (light), others → No weather
 *  Can also be triggered by weather: events
 */

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { RainSystem } from './RainSystem';
import { SnowSystem } from './SnowSystem';
import type { SceneId } from '@/shared/types/game';

/** Scene → weather type mapping */
type WeatherType = 'rain_heavy' | 'rain_light' | 'snow' | 'none';

const SCENE_WEATHER: Record<SceneId, WeatherType> = {
  street_night: 'rain_heavy',
  street_winter: 'snow',
  rooftop_edge: 'rain_light',
  volodka_room: 'none',
  volodka_corridor: 'none',
  home_evening: 'none',
  cafe_evening: 'none',
  office_day: 'none',
  park_day: 'none',
  library_day: 'none',
  battle: 'none',
  sleep_dream: 'none',
  abandoned_factory: 'none',
  zarema_albert_room: 'none',
};

/** Weather controller — activates appropriate weather system per scene */
export function WeatherController() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);

  const weatherType = useMemo<WeatherType>(() => {
    if (!weatherEnabled) return 'none';
    return SCENE_WEATHER[sceneId] ?? 'none';
  }, [sceneId, weatherEnabled]);

  switch (weatherType) {
    case 'rain_heavy':
      return <RainSystem intensity={1.0} />;
    case 'rain_light':
      return <RainSystem intensity={0.4} />;
    case 'snow':
      return <SnowSystem intensity={1.0} />;
    case 'none':
    default:
      return null;
  }
}
