
/* ─── Volodka RPG – Weather Alert Notification ─── */
/* Restrained filmic notification that appears when weather changes.
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
import { useWeatherAlertState } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { explorationLootTopPx } from '@/shared/constants/hudLayout';
import { WEATHER_EFFECTS, determineWeatherType } from '@/data/weatherEffects';
import type { EventWeatherType } from '@/shared/types/game';

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
  border: string;
  bg: string;
}> = {
  normal: {
    primary: 'var(--hud-filmic-accent)',
    border: 'var(--hud-filmic-border)',
    bg: 'var(--hud-filmic-plate-strong)',
  },
  warning: {
    primary: 'var(--hud-filmic-warn)',
    border: 'rgba(252, 211, 165, 0.22)',
    bg: 'var(--hud-filmic-plate-strong)',
  },
  danger: {
    primary: 'var(--hud-filmic-danger)',
    border: 'rgba(252, 165, 165, 0.24)',
    bg: 'var(--hud-filmic-plate-strong)',
  },
};

/* ─── Temperature helpers ─── */

function formatTemp(temp: number): string {
  if (temp > 0) return `+${temp}°C`;
  if (temp < 0) return `${temp}°C`;
  return '0°C';
}

function getTempColor(temp: number): string {
  if (temp <= 0) return 'var(--hud-filmic-ink-muted)';
  if (temp <= 25) return 'var(--hud-filmic-accent)';
  return 'var(--hud-filmic-danger)';
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
          className="weather-alert-notification hud-filmic-toast pointer-events-auto relative overflow-hidden"
          style={{
            background: accent.bg,
            borderColor: accent.border,
            minWidth: '240px',
            maxWidth: '320px',
          }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{
            duration: 0.4,
            delay: index * 0.08,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* ── Content ── */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3">
            {/* Weather icon */}
            <div
              className="flex items-center justify-center w-9 h-9 shrink-0 rounded"
              style={{
                border: '1px solid var(--hud-filmic-border)',
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
                className="hud-filmic-kicker truncate"
                style={{ color: accent.primary }}
              >
                {weatherName}
              </span>

              {/* Temperature row */}
              <div className="flex items-center gap-1.5">
                <Thermometer className="size-3" style={{ color: tempColor, opacity: 0.7 }} />
                <span
                  className="hud-filmic-kicker"
                  style={{ color: tempColor, letterSpacing: '0.08em' }}
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
                      className="weather-alert-debuff hud-filmic-kicker inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm"
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
            style={{ background: accent.primary, opacity: 0.55 }}
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
  const slotGranted = useNotificationSlot('weather', NOTIFY_PRIORITY.weather, alerts.length > 0);
  const timersMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const timers = timersMap.current;

  /* ── Track previous weather to detect changes from store ── */
  const { currentSceneId, timeOfDay, weatherEnabled, rainIntensity } = useWeatherAlertState();

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
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
    const _effect = WEATHER_EFFECTS[derivedWeather];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [derivedWeather, weatherTemperature]);

  /* ── Cleanup all timers on unmount ── */
  useEffect(() => {
    return () => {
      for (const key of Object.keys(timers)) {
        clearTimeout(timers[key]);
        delete timers[key];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, []);

  /* ── Render ── */
  return (
    <div
      className="fixed left-3 sm:left-4 pointer-events-none flex flex-col gap-2"
      data-exploration-ui
      style={{
        top: explorationLootTopPx(),
        zIndex: UI_LAYERS.TOASTS,
      }}
    >
      <AnimatePresence mode="popLayout">
        {slotGranted && alerts.map((alert, index) => (
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
