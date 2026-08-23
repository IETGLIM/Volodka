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
import { useWeatherDirector } from '@/hooks/useWeatherDirector';
import {
  SCENE_BASE_WEATHER,
  type BaseWeatherType,
} from '@/engine/world/weatherDirector';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';

/** Weather types the controller can render.
 *  rain_dynamic — динамическое окно дождя режиссёра в сухой уличной сцене. */
type WeatherType = BaseWeatherType | 'rain_dynamic';

/** Weather controller — активирует погодные системы по сцене и режиссёру погоды.
 *
 * Интенсивность частиц здесь не хардкодится: useWeatherDirector плавно ведёт
 * rainIntensity в сторе (см. engine/world/weatherDirector.ts), а RainSystem/
 * SnowSystem умножают её на базовый множитель сцены (heavy 1.0 / light 0.4 /
 * snow_light 0.35). Базовая карта сцена→тип живёт в SCENE_BASE_WEATHER. */
export function WeatherController() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const { preset } = useGraphicsQuality();
  const fxTier = tierFromPresetId(preset.id);
  const fxBudget = getFxBudget(fxTier);

  // Режиссёр погоды: пишет интенсивность в стор, здесь нужны только решения
  // о монтировании систем (базовый дождь сцены / динамическое окно).
  const { rainActive } = useWeatherDirector();

  const heavyFx = useMemo(
    () => resolveSceneHeavyFx(fxTier, sceneId, {
      weatherEnabled,
      // Для сцен с базовым дождём — прежний гейтинг sceneWantsRain (undefined);
      // для сухих уличных сцен бюджетный слот нужен только пока идёт окно дождя.
      wantsRain: (SCENE_BASE_WEATHER[resolveDerivedSceneId(sceneId)] ?? 'none') === 'none'
        ? rainActive
        : undefined,
      wantsFog: false,
      wantsGodRays: false,
    }),
    [fxTier, sceneId, weatherEnabled, rainActive],
  );

  const weatherType = useMemo<WeatherType>(() => {
    if (!weatherEnabled) return 'none';
    const rootScene = resolveDerivedSceneId(sceneId);
    const base = SCENE_BASE_WEATHER[rootScene] ?? 'none';
    if (base === 'rain_heavy' || base === 'rain_light') {
      return fxBudget.allowRain && heavyFx.rain ? base : 'none';
    }
    // Снег не занимает heavy-fx слот (см. fxGovernor.sceneWantsRain).
    if (base === 'snow' || base === 'snow_light') return base;
    // Сухая уличная сцена: редкое окно лёгкого дождя от директора.
    if (rainActive && fxBudget.allowRain && heavyFx.rain) return 'rain_dynamic';
    return 'none';
  }, [sceneId, weatherEnabled, fxBudget.allowRain, heavyFx.rain, rainActive]);

  switch (weatherType) {
    case 'rain_heavy':
      return <RainSystem intensity={1.0} />;
    case 'rain_light':
      return <RainSystem intensity={0.4} />;
    case 'rain_dynamic':
      // Директор уже держит в сторе лёгкий дождь 0.15–0.35 — базовый множитель 1.
      return <RainSystem intensity={1.0} />;
    case 'snow':
      return <SnowSystem intensity={1.0} />;
    case 'snow_light':
      return <SnowSystem intensity={0.35} />;
    case 'none':
    default:
      return null;
  }
}
