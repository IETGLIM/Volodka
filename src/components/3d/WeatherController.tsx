import { useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  getFxBudget,
  resolveSceneHeavyFx,
  tierFromPresetId,
} from '@/engine/graphics/fxGovernor';
import { RainSystem } from './RainSystem';
import { SnowSystem } from './SnowSystem';
import { useGlobalWeatherControls } from '@/store/selectors';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';

/** Scene → weather type mapping */
type WeatherType = 'rain_heavy' | 'rain_light' | 'snow' | 'snow_light' | 'fog_heavy' | 'fog_light' | 'none';

const SCENE_WEATHER: Partial<Record<SceneId, WeatherType>> = {
  street_night: 'rain_heavy',
  street_winter: 'snow',
  rooftop_edge: 'rain_light',
  volodka_room: 'none',
  volodka_corridor: 'none',
  home_evening: 'none',
  cafe_evening: 'none',
  office_day: 'none',
  park_day: 'fog_light',
  library_day: 'none',
  battle: 'none',
  sleep_dream: 'none',
  abandoned_factory: 'none',
  zarema_albert_room: 'none',
  solnysh_room: 'none',
  chk_forest_zorge: 'snow_light',
  chk_campfire_night: 'snow_light',
  factory_basement: 'none',
  factory_roof: 'rain_heavy',
  underground_bunker: 'none',
  guild_mainframe: 'none',
  library_basement: 'none',
  albert_backroom: 'none',
  city_square: 'rain_light',
  procedural_aaa: 'rain_heavy',
  // Misty pier — wet ground without full storm.
  river_pier: 'fog_light',
};

/** Volumetric fog system using Three.js FogExp2 */
function FogSystem({ intensity = 1 }: { intensity?: number }) {
  const { weatherEnabled } = useGlobalWeatherControls();
  const { scene } = useThree();

  const fog = useMemo(() => {
    const isHeavy = intensity >= 0.7;
    const density = isHeavy
      ? 0.06 + intensity * 0.09
      : 0.015 + intensity * 0.035;
    const color = isHeavy ? '#1a1a2e' : '#2a2a3e';
    return new THREE.FogExp2(color, density);
  }, [intensity]);

  useEffect(() => {
    if (!weatherEnabled) return;
    const prev = scene.fog;
    scene.fog = fog;
    return () => { scene.fog = prev; };
  }, [scene, fog, weatherEnabled]);

  if (!weatherEnabled) return null;
  return null;
}

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
    const rootScene = resolveDerivedSceneId(sceneId);
    const w = SCENE_WEATHER[rootScene];
    if (!w) return 'none';
    if (w.startsWith('rain') && (!fxBudget.allowRain || !heavyFx.rain)) return 'none';
    return w;
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
    case 'fog_heavy':
      return <FogSystem intensity={1.0} />;
    case 'fog_light':
      return <FogSystem intensity={0.4} />;
    case 'none':
    default:
      return null;
  }
}
