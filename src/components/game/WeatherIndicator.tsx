
/* ─── Volodka RPG – Weather Indicator (HUD Widget) ─── */
/* Compact weather widget showing current conditions derived
 * from scene + time of day. Cyberpunk aesthetic with animated
 * transitions between weather states. */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Sun,
  Moon,
  Wind,
  Thermometer,
} from 'lucide-react';
import { useWeatherIndicatorState } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { SceneId } from '@/shared/types/game';

/* ── Weather types ── */
type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
type WindLevel = 'calm' | 'light' | 'strong';
type AirQuality = 'clean' | 'dusty' | 'smoggy';

interface WeatherState {
  type: WeatherType;
  temperature: number;
  wind: WindLevel;
  airQuality: AirQuality;
}

/* ── Weather icon mapping ── */
const WEATHER_ICONS: Record<WeatherType, React.ComponentType<{ className?: string }>> = {
  clear: Sun,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
  storm: CloudLightning,
};

/* ── Weather accent colors for border glow ── */
const WEATHER_ACCENT: Record<WeatherType, { border: string; glow: string; icon: string }> = {
  clear: { border: 'rgba(251,191,36,0.35)', glow: 'rgba(251,191,36,0.12)', icon: 'text-amber-400' },
  rain: { border: 'rgb(var(--cyber-cyan-rgb) / 0.35)', glow: 'rgb(var(--cyber-cyan-rgb) / 0.12)', icon: 'text-cyan-400' },
  snow: { border: 'rgba(203,213,225,0.35)', glow: 'rgba(203,213,225,0.12)', icon: 'text-slate-300' },
  fog: { border: 'rgba(148,163,184,0.35)', glow: 'rgba(148,163,184,0.12)', icon: 'text-slate-400' },
  storm: { border: 'rgba(168,85,247,0.35)', glow: 'rgba(168,85,247,0.12)', icon: 'text-purple-400' },
};

/* ── Wind display labels ── */
const WIND_LABELS: Record<WindLevel, { text: string; icon: string }> = {
  calm: { text: 'Штиль', icon: 'text-slate-500' },
  light: { text: 'Лёгкий', icon: 'text-slate-400' },
  strong: { text: 'Сильный', icon: 'text-amber-400' },
};

/* ── Air quality labels ── */
const AIR_LABELS: Record<AirQuality, { text: string; color: string }> = {
  clean: { text: 'Чистый', color: 'text-emerald-400' },
  dusty: { text: 'Пыльный', color: 'text-amber-400' },
  smoggy: { text: 'Смог', color: 'text-rose-400' },
};

/* ── Russian weather labels ── */
const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: 'Ясно',
  rain: 'Дождь',
  snow: 'Снег',
  fog: 'Туман',
  storm: 'Гроза',
};

/* ── Derive weather from scene + time ── */
function deriveWeather(sceneId: SceneId, timeOfDay: number): WeatherState {
  const isNight = timeOfDay >= 21 || timeOfDay < 6;
  const isMorning = timeOfDay >= 6 && timeOfDay < 10;
  const isDay = timeOfDay >= 10 && timeOfDay < 18;
  const isEvening = timeOfDay >= 18 && timeOfDay < 21;

  switch (sceneId) {
    /* ── Indoor scenes — always clear/calm ── */
    case 'volodka_room':
      return { type: 'clear', temperature: 21, wind: 'calm', airQuality: 'clean' };
    case 'volodka_corridor':
      return { type: 'clear', temperature: 20, wind: 'calm', airQuality: 'clean' };
    case 'home_evening':
      return { type: 'clear', temperature: 22, wind: 'calm', airQuality: 'clean' };
    case 'zarema_albert_room':
      return { type: 'clear', temperature: 21, wind: 'calm', airQuality: 'clean' };

    /* ── Street night — rain at night, clear otherwise ── */
    case 'street_night': {
      if (isNight) return { type: 'rain', temperature: 4, wind: 'light', airQuality: 'smoggy' };
      if (isMorning) return { type: 'fog', temperature: 8, wind: 'light', airQuality: 'smoggy' };
      if (isDay) return { type: 'clear', temperature: 14, wind: 'light', airQuality: 'smoggy' };
      return { type: 'rain', temperature: 7, wind: 'light', airQuality: 'smoggy' };
    }

    /* ── Street winter — always snow ── */
    case 'street_winter':
      return { type: 'snow', temperature: isNight ? -15 : -8, wind: 'strong', airQuality: 'dusty' };

    /* ── Cafe — indoor, slight haze ── */
    case 'cafe_evening':
      return { type: 'clear', temperature: 23, wind: 'calm', airQuality: 'clean' };

    /* ── Office — clean air-con ── */
    case 'office_day':
      return { type: 'clear', temperature: 22, wind: 'calm', airQuality: 'clean' };

    /* ── Park — morning fog, otherwise clear ── */
    case 'park_day': {
      if (isMorning) return { type: 'fog', temperature: 12, wind: 'calm', airQuality: 'clean' };
      if (isNight) return { type: 'clear', temperature: 10, wind: 'light', airQuality: 'clean' };
      return { type: 'clear', temperature: 20, wind: 'light', airQuality: 'clean' };
    }

    /* ── Library — indoor ── */
    case 'library_day':
      return { type: 'clear', temperature: 20, wind: 'calm', airQuality: 'clean' };

    /* ── Battle — storm ── */
    case 'battle':
      return { type: 'storm', temperature: 2, wind: 'strong', airQuality: 'dusty' };

    /* ── Dream — ethereal fog ── */
    case 'sleep_dream':
      return { type: 'fog', temperature: 15, wind: 'calm', airQuality: 'clean' };

    /* ── CHK forest — winter night gathering, light snow and fog ── */
    case 'chk_forest_zorge': {
      if (isNight || isEvening) {
        return { type: 'snow', temperature: -8, wind: 'light', airQuality: 'clean' };
      }
      if (isMorning) return { type: 'fog', temperature: -4, wind: 'calm', airQuality: 'clean' };
      return { type: 'fog', temperature: -2, wind: 'light', airQuality: 'clean' };
    }

    /* ── Rooftop — strong winds, clear or storm at night ── */
    case 'rooftop_edge': {
      if (isNight) return { type: 'storm', temperature: -3, wind: 'strong', airQuality: 'smoggy' };
      return { type: 'clear', temperature: 2, wind: 'strong', airQuality: 'smoggy' };
    }

    /* ── Factory — dusty, foggy ── */
    case 'abandoned_factory':
      return { type: 'fog', temperature: isNight ? 8 : 14, wind: 'light', airQuality: 'dusty' };

    /* ── Fallback ── */
    default:
      return { type: 'clear', temperature: 18, wind: 'calm', airQuality: 'clean' };
  }
}

/* ── Temperature display with sign ── */
function formatTemp(temp: number): string {
  if (temp > 0) return `+${temp}°`;
  if (temp < 0) return `${temp}°`;
  return '0°';
}

/* ── Temperature color based on value ── */
function tempColor(temp: number): string {
  if (temp <= -10) return 'text-blue-400';
  if (temp <= 0) return 'text-cyan-400';
  if (temp <= 10) return 'text-slate-300';
  if (temp <= 20) return 'text-emerald-400';
  return 'text-amber-400';
}

/* ── Component ── */
export function WeatherIndicator() {
  const { currentSceneId, timeOfDay } = useWeatherIndicatorState();

  const weather = useMemo(
    () => deriveWeather(currentSceneId, timeOfDay),
    [currentSceneId, timeOfDay],
  );

  const accent = WEATHER_ACCENT[weather.type];
  const WeatherIcon = WEATHER_ICONS[weather.type];
  const windInfo = WIND_LABELS[weather.wind];
  const airInfo = AIR_LABELS[weather.airQuality];
  const isNight = timeOfDay >= 21 || timeOfDay < 6;

  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      style={{ top: 390, right: 12, zIndex: UI_LAYERS.HUD + 1 }}
    >
      <motion.div
        className="pointer-events-auto rounded-lg border backdrop-blur-md overflow-hidden"
        style={{
          width: 140,
          background: 'linear-gradient(145deg, rgba(0,0,0,0.72) 0%, rgba(15,23,42,0.6) 50%, rgba(0,0,0,0.5) 100%)',
          borderColor: accent.border,
          boxShadow: `0 0 12px ${accent.glow}, 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header: time icon + weather label ── */}
        <div
          className="flex items-center justify-between px-2.5 pt-2 pb-1.5"
          style={{
            borderBottom: '1px solid',
            borderBottomColor: accent.border,
          }}
        >
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`time-${isNight ? 'night' : 'day'}`}
                initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
                transition={{ duration: 0.3 }}
              >
                {isNight ? (
                  <Moon className="size-3.5 text-slate-400" />
                ) : (
                  <Sun className="size-3.5 text-amber-400/80" />
                )}
              </motion.div>
            </AnimatePresence>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
              Погода
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`wlabel-${weather.type}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-mono text-slate-300"
            >
              {WEATHER_LABELS[weather.type]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Main content ── */}
        <div className="px-2.5 py-2 flex flex-col gap-1.5">
          {/* Weather icon + temperature row */}
          <div className="flex items-center gap-2">
            {/* Weather icon with pulse */}
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`icon-${weather.type}`}
                  initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <WeatherIcon className={`size-5 ${accent.icon}`} />
                  {/* Subtle pulse glow behind icon */}
                  <motion.div
                    className={`absolute inset-0 ${accent.icon} opacity-20`}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.2, 0.05, 0.2],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{ filter: 'blur(4px)' }}
                  >
                    <WeatherIcon className="size-5" />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Temperature */}
            <div className="flex flex-col">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`temp-${weather.temperature}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}
                  className={`text-base font-mono font-bold leading-none ${tempColor(weather.temperature)}`}
                  style={{
                    textShadow: `0 0 8px currentColor`,
                  }}
                >
                  {formatTemp(weather.temperature)}
                </motion.span>
              </AnimatePresence>
              <span className="text-[8px] font-mono text-slate-400 mt-0.5 flex items-center gap-0.5">
                <Thermometer className="size-2" />
                Цельсий
              </span>
            </div>
          </div>

          {/* ── Divider ── */}
          <div
            className="h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent.border}, transparent)`,
            }}
          />

          {/* Wind + Air Quality row */}
          <div className="flex items-center justify-between">
            {/* Wind */}
            <div className="flex items-center gap-1.5">
              <Wind className={`size-3 ${windInfo.icon}`} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`wind-${weather.wind}`}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-mono text-slate-400"
                >
                  {windInfo.text}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Air quality */}
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: weather.airQuality === 'clean'
                    ? 'rgba(52,211,153,0.6)'
                    : weather.airQuality === 'dusty'
                    ? 'rgba(251,191,36,0.6)'
                    : 'rgba(244,63,94,0.6)',
                  boxShadow: weather.airQuality === 'clean'
                    ? '0 0 4px rgba(52,211,153,0.4)'
                    : weather.airQuality === 'dusty'
                    ? '0 0 4px rgba(251,191,36,0.4)'
                    : '0 0 4px rgba(244,63,94,0.4)',
                }}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`air-${weather.airQuality}`}
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[10px] font-mono ${airInfo.color}`}
                >
                  {airInfo.text}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Bottom accent line ── */}
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent.border}, transparent)`,
          }}
        />

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-2.5 py-1">
          <span className="text-[8px] text-slate-400 font-mono">volodka://weather</span>
          <span className="text-[8px] text-slate-400 font-mono tabular-nums">
            {Math.floor(timeOfDay).toString().padStart(2, '0')}:{((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
