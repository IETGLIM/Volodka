/* ─── Volodka RPG – Scene Ambient Vignette ───
   Full-screen overlay that adds dynamic edge tinting based on:
   - Time of day (warm sunrise, cool night, amber sunset)
   - Weather (blue rain, white-ish snow)
   Creates atmospheric immersion without affecting gameplay.
*/

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHUDControllerState } from '@/store/selectors';
import { determineWeatherType, type WeatherType } from '@/data/weatherEffects';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Map time-of-day (hours 0-24) to vignette class */
function timeVignetteClass(hour: number): string {
  if (hour >= 6 && hour < 10) return 'ambient-vignette-sunrise';
  if (hour >= 10 && hour < 18) return 'ambient-vignette-day';
  if (hour >= 18 && hour < 21) return 'ambient-vignette-evening';
  return 'ambient-vignette-night';
}

/** Weather vignette overrides time vignette when active */
function weatherVignetteClass(weather: WeatherType): string | null {
  switch (weather) {
    case 'rain':
    case 'storm':
      return 'ambient-vignette-rain';
    case 'snow':
      return 'ambient-vignette-snow';
    default:
      return null;
  }
}

/** Static style for weather + time combined tint */
function getVignetteStyle(hour: number, weather: WeatherType): React.CSSProperties {
  let topColor = 'transparent';
  let bottomColor = 'transparent';

  if (hour >= 6 && hour < 10) {
    topColor = 'rgba(255, 140, 50, 0.04)';
    bottomColor = 'rgba(255, 100, 50, 0.02)';
  } else if (hour >= 18 && hour < 21) {
    topColor = 'rgba(200, 80, 40, 0.05)';
    bottomColor = 'rgba(180, 60, 30, 0.03)';
  } else if (hour >= 21 || hour < 6) {
    topColor = 'rgba(10, 20, 60, 0.08)';
    bottomColor = 'rgba(10, 20, 60, 0.05)';
  }

  if (weather === 'rain' || weather === 'storm') {
    topColor = 'rgba(60, 120, 200, 0.06)';
    bottomColor = 'rgba(40, 80, 160, 0.03)';
  } else if (weather === 'snow') {
    topColor = 'rgba(180, 200, 240, 0.04)';
    bottomColor = 'rgba(160, 180, 220, 0.02)';
  }

  return {
    background: `linear-gradient(180deg, ${topColor} 0%, transparent 40%, transparent 60%, ${bottomColor} 100%)`,
  };
}

export function SceneAmbientVignette() {
  const reducedMotion = useEffectiveReducedMotion();
  const { timeOfDay, weatherEnabled, rainIntensity, currentSceneId } = useHUDControllerState();

  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const currentWeather: WeatherType = useMemo(
    () => determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  const timeClass = timeVignetteClass(timeOfDay);
  const weatherClass = weatherVignetteClass(currentWeather);
  const vignetteClass = weatherClass ?? timeClass;
  const vignetteStyle = getVignetteStyle(timeOfDay, currentWeather);

  // Don't render during clear day (minimal effect needed)
  const isClearDay = currentWeather === 'clear' && timeOfDay >= 10 && timeOfDay < 18;
  if (isClearDay && !reducedMotion) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 2, ease: 'easeOut' }}
      className={`fixed inset-0 pointer-events-none hud-filmic-vignette-breathe ${vignetteClass}`}
      style={{ zIndex: 1, ...vignetteStyle }}
      aria-hidden="true"
    />
  );
}