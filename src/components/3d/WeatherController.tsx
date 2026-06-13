import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  getFxBudget,
  resolveSceneHeavyFx,
  tierFromPresetId,
} from '@/engine/graphics/fxGovernor';
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
  const fxTier = tierFromPresetId(preset.id);
  const fxBudget = getFxBudget(fxTier);

  const heavyFx = useMemo(
    () => resolveSceneHeavyFx(fxTier, sceneId, {
      weatherEnabled,
      wantsFog: false,
      wantsGodRays: false,
    }),
    [fxTier, sceneId, weatherEnabled],
  );

  const weatherType = useMemo<WeatherType>(() => {
    if (!weatherEnabled) return 'none';
    if (!fxBudget.allowRain && SCENE_WEATHER[sceneId]?.startsWith('rain')) return 'none';
    if (!heavyFx.rain && SCENE_WEATHER[sceneId]?.startsWith('rain')) return 'none';
    return SCENE_WEATHER[sceneId] ?? 'none';
  }, [sceneId, weatherEnabled, fxBudget.allowRain, heavyFx.rain]);

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
