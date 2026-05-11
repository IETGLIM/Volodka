'use client';

/* ─── Volodka RPG – Weather Alert Notification ─── */
/* Dramatic cyberpunk notification that appears when weather changes.
 * Shows weather type icon, Russian name, temperature with color coding,
 * and any applied debuffs. Auto-dismisses after 4 seconds.
 * Listens on EventBus `weather:changed` event.
 * Also listens on `weather:rain` and `weather:snow` for real-time detection. */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  CloudRain,
  CloudSnow,
  Cloud,
  Wind,
  Zap,
  Thermometer,
  AlertTriangle,
} from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { WEATHER_EFFECTS, determineWeatherType } from '@/data/weatherEffects';
import type { EventWeatherType } from '@/shared/types/game';
import type { SceneId } from '@/shared/types/game';

/* ─── Types ─── */

interface WeatherAlertData {
  id: string;
  weatherType: EventWeatherType;
  temperature: number;
  debuffs: string[];
  createdAt: number;
}

/* ─── Constants ─── */

const NOTIFICATION_DURATION_MS = 4000;
const MAX_ALERTS = 3;

/* ─── Weather icon mapping ─── */

const WEATHER_ICONS: Record<EventWeatherType, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  clear: Sun,
  rain: CloudRain,
  snow: CloudSnow,
  fog: Cloud,
  storm: Wind,
};

/* ─── Weather name in Russian ─── */

const WEATHER_NAMES_RU: Record<EventWeatherType, string> = {
  clear: 'Ясно',
  rain: 'Дождь',
  snow: 'Снег',
  fog: 'Туман',
  storm: 'Гроза',
};

/* ─── Severity classification ─── */

type Severity = 'normal' | 'warning' | 'danger';

function getSeverity(weatherType: EventWeatherType): Severity {
  if (weatherType === 'storm') return 'danger';
  if (weatherType === 'snow' || weatherType === 'fog') return 'warning';
  return 'normal';
}

/* ─── Accent colours by severity ─── */

const ACCENT_MAP: Record<Severity, {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  shadow: string;
  iconBg: string;
}> = {
  normal: {
    primary: '#22d3ee',     // cyan-400
    glow: 'rgba(34, 211, 238, 0.15)',
    border: 'rgba(34, 211, 238, 0.35)',
    bg: 'rgba(8, 20, 30, 0.82)',
    shadow: '0 0 12px rgba(34, 211, 238, 0.12)',
    iconBg: 'rgba(34, 211, 238, 0.12)',
  },
  warning: {
    primary: '#fbbf24',     // amber-400
    glow: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.35)',
    bg: 'rgba(20, 16, 8, 0.82)',
    shadow: '0 0 12px rgba(251, 191, 36, 0.12)',
    iconBg: 'rgba(251, 191, 36, 0.12)',
  },
  danger: {
    primary: '#fb7185',     // rose-400
    glow: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.35)',
    bg: 'rgba(30, 12, 16, 0.82)',
    shadow: '0 0 12px rgba(251, 113, 133, 0.12)',
    iconBg: 'rgba(251, 113, 133, 0.12)',
  },
};

/* ─── Temperature helpers ─── */

function formatTemp(temp: number): string {
  if (temp > 0) return `+${temp}°C`;
  if (temp < 0) return `${temp}°C`;
  return '0°C';
}

function getTempColor(temp: number): string {
  if (temp <= -10) return '#60a5fa';   // blue-400
  if (temp <= 0) return '#22d3ee';     // cyan-400
  if (temp <= 15) return '#34d399';    // emerald-400
  if (temp <= 25) return '#34d399';    // emerald-400 (comfortable)
  return '#f87171';                    // red-400
}

/* ─── Debuff name lookup (Russian) ─── */

const DEBUFF_NAMES: Record<string, string> = {
  cold: 'Озяб',
  wet: 'Мокрый',
  fog_vision: 'Туман в глазах',
  storm_fear: 'Тревога бури',
  slow: 'Замедление',
  low_energy: 'Упадок сил',
  high_stress: 'Напряжение',
};

/* ─── Determine debuffs from weather type ─── */

function getWeatherDebuffs(weatherType: EventWeatherType): string[] {
  const debuffs: string[] = [];
  switch (weatherType) {
    case 'snow':
      debuffs.push(DEBUFF_NAMES.cold);
      debuffs.push(DEBUFF_NAMES.slow);
      break;
    case 'rain':
      debuffs.push(DEBUFF_NAMES.wet);
      break;
    case 'fog':
      debuffs.push(DEBUFF_NAMES.fog_vision);
      break;
    case 'storm':
      debuffs.push(DEBUFF_NAMES.storm_fear);
      debuffs.push(DEBUFF_NAMES.low_energy);
      debuffs.push(DEBUFF_NAMES.high_stress);
      break;
  }
  return debuffs;
}

/* ─── ID counter ─── */

let nextAlertId = 0;

/* ─── Single alert card ─── */

function WeatherAlertCard({ alert, index }: { alert: WeatherAlertData; index: number }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const severity = getSeverity(alert.weatherType);
  const accent = ACCENT_MAP[severity];
  const WeatherIcon = WEATHER_ICONS[alert.weatherType];
  const weatherName = WEATHER_NAMES_RU[alert.weatherType];
  const tempColor = getTempColor(alert.temperature);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, NOTIFICATION_DURATION_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => {}}>
      {!exiting && (
        <motion.div
          layout
          key={alert.id}
          className="weather-alert-notification pointer-events-auto relative overflow-hidden"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: '8px',
            boxShadow: accent.shadow,
            minWidth: '240px',
            maxWidth: '320px',
          }}
          initial={{ opacity: 0, x: -60, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -40, scale: 0.9 }}
          transition={{
            duration: 0.4,
            delay: index * 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Scan-line sweep animation on entry ── */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `linear-gradient(180deg, transparent 0%, transparent 40%, ${accent.primary}15 50%, transparent 60%, transparent 100%)`,
              backgroundSize: '100% 200%',
            }}
            animate={{ backgroundPosition: ['0% 0%', '0% 200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* ── Hex-grid pattern overlay (subtle) ── */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(accent.primary)}' fill-opacity='0.015'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.6,
            }}
          />

          {/* ── Neon border glow breathing animation ── */}
          <motion.div
            className="absolute inset-0 rounded-[8px] pointer-events-none"
            animate={{
              boxShadow: [
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
                `0 0 16px ${accent.glow}, inset 0 0 6px ${accent.glow}`,
                `0 0 6px ${accent.glow}, inset 0 0 3px ${accent.glow}`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Corner bracket decorations ── */}
          <div className="absolute top-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute top-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderTop: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderLeft: `1px solid ${accent.primary}40` }} />
          <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none z-20" style={{ borderBottom: `1px solid ${accent.primary}40`, borderRight: `1px solid ${accent.primary}40` }} />

          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            {/* Weather icon */}
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
              style={{
                background: accent.iconBg,
                boxShadow: `0 0 8px ${accent.glow}`,
              }}
            >
              {alert.weatherType === 'storm' ? (
                <Zap className="size-4.5" style={{ color: accent.primary }} />
              ) : (
                <WeatherIcon className="size-4.5" style={{ color: accent.primary }} />
              )}
            </div>

            {/* Text area */}
            <div className="flex flex-col gap-0.5 min-w-0">
              {/* Weather name */}
              <span
                className="text-sm font-mono font-bold tracking-wide truncate"
                style={{ color: accent.primary }}
              >
                {weatherName}
              </span>

              {/* Temperature row */}
              <div className="flex items-center gap-1.5">
                <Thermometer className="size-3" style={{ color: tempColor, opacity: 0.7 }} />
                <span
                  className="text-xs font-mono font-semibold"
                  style={{ color: tempColor, textShadow: `0 0 6px ${tempColor}40` }}
                >
                  {formatTemp(alert.temperature)}
                </span>
              </div>

              {/* Debuffs */}
              {alert.debuffs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {alert.debuffs.map((debuff) => (
                    <span
                      key={debuff}
                      className="weather-alert-debuff inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: accent.primary,
                        background: `${accent.primary}10`,
                        border: `1px solid ${accent.primary}20`,
                      }}
                    >
                      <AlertTriangle className="size-2" style={{ color: accent.primary, opacity: 0.6 }} />
                      {debuff}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom countdown bar ── */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.primary, boxShadow: `0 0 6px ${accent.glow}` }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: NOTIFICATION_DURATION_MS / 1000, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main component ─── */

export function WeatherAlertNotification() {
  const [alerts, setAlerts] = useState<WeatherAlertData[]>([]);
  const timersMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const timers = timersMap.current;

  /* ── Track previous weather to detect changes from store ── */
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const weatherEnabled = useGameStore((s) => s.exploration.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.exploration.rainIntensity);

  const prevWeatherRef = useRef<EventWeatherType | null>(null);

  /** Add a weather alert */
  const addAlert = (weatherType: EventWeatherType, temperature: number, debuffs?: string[]) => {
    // Don't show alerts for clear weather returning to clear
    if (weatherType === 'clear' && prevWeatherRef.current === 'clear') return;

    const id = `weather-alert-${++nextAlertId}`;
    const resolvedDebuffs = debuffs ?? getWeatherDebuffs(weatherType);

    const newAlert: WeatherAlertData = {
      id,
      weatherType,
      temperature,
      debuffs: resolvedDebuffs,
      createdAt: Date.now(),
    };

    setAlerts((prev) => [...prev, newAlert].slice(-MAX_ALERTS));

    // Auto-remove after duration + exit animation
    const removeTimer = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      delete timers[id];
    }, NOTIFICATION_DURATION_MS + 600);

    timers[id] = removeTimer;
  };

  /* ── Listen for weather:changed events (explicit) ── */
  useEffect(() => {
    const unsub = eventBus.on('weather:changed', (payload) => {
      addAlert(payload.weatherType, payload.temperature, payload.debuffs);
      prevWeatherRef.current = payload.weatherType;
    });
    return unsub;
  }, []);

  /* ── Detect weather changes from store (reactive fallback) ── */
  const derivedWeather = useMemo(() => {
    // Determine if snow is active based on scene and time
    const isWinterScene = currentSceneId === 'street_winter';
    const snowActive = isWinterScene;
    return determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay);
  }, [weatherEnabled, rainIntensity, currentSceneId, timeOfDay]);

  /** Get temperature for weather type */
  const weatherTemperature = useMemo(() => {
    const effect = WEATHER_EFFECTS[derivedWeather];
    // Use scene-based temperature estimation
    const isNight = timeOfDay >= 21 || timeOfDay < 6;
    switch (derivedWeather) {
      case 'snow': return isNight ? -15 : -8;
      case 'rain': return isNight ? 4 : 7;
      case 'storm': return isNight ? -3 : 2;
      case 'fog': return isNight ? 8 : 12;
      case 'clear': return isNight ? 10 : 20;
      default: return 18;
    }
  }, [derivedWeather, timeOfDay]);

  useEffect(() => {
    if (prevWeatherRef.current !== null && prevWeatherRef.current !== derivedWeather) {
      addAlert(derivedWeather, weatherTemperature);
    }
    prevWeatherRef.current = derivedWeather;
  }, [derivedWeather, weatherTemperature]);

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed top-4 left-4 pointer-events-none flex flex-col gap-2"
      style={{ zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="popLayout">
        {alerts.map((alert, index) => (
          <WeatherAlertCard
            key={alert.id}
            alert={alert}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
