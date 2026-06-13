
/* ─── Volodka RPG – Weather Controller ───
 *  Automatically activates rain/snow based on current scene
 *  street_night → Rain (heavy), street_winter → Snow,
 *  rooftop_edge → Rain (light), chk_forest_zorge → Snow (light), others → No weather
 *  Can also be triggered by weather: events
 */

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getFxBudget } from '@/engine/graphics/fxGovernor';
import { RainSystem } from './RainSystem';
import { SnowSystem } from './SnowSystem';
import type { SceneId } from '@/shared/types/game';

/** Scene → weather type mapping */
type WeatherType = 'rain_heavy' | 'rain_light' | 'snow' | 'snow_light' | 'none';

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
  solnysh_room: 'none',
  chk_forest_zorge: 'snow_light',
  factory_basement: 'none',
  river_pier: 'none',
};

/** Weather controller — activates appropriate weather system per scene */
export function WeatherController() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const { preset } = useGraphicsQuality();
  const fxTier = preset.id === 'low' ? 'low' : preset.id === 'high' || preset.id === 'ultra' ? 'high' : 'medium';
  const fxBudget = getFxBudget(fxTier);

  const weatherType = useMemo<WeatherType>(() => {
    if (!weatherEnabled) return 'none';
    if (!fxBudget.allowRain && SCENE_WEATHER[sceneId]?.startsWith('rain')) return 'none';
    return SCENE_WEATHER[sceneId] ?? 'none';
  }, [sceneId, weatherEnabled, fxBudget.allowRain]);

  switch (weatherType) {
    case 'rain_heavy':
      return <RainSystem intensity={1.0} />;
    case 'rain_light':
      return <RainSystem intensity={0.4} />;
    case 'snow':
      return <SnowSystem intensity={1.0} />;
    case 'snow_light':
      return <SnowSystem intensity={0.35} />;
    case 'none':
    default:
      return null;
  }
}
