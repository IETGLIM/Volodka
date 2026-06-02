'use client';

/* ─── Volodka RPG – useWeatherEffects hook ─── */
/* Reads weather state from the game store, determines the active weather type,
 * returns the current WeatherEffect, and applies ongoing effects
 * (energy drain, stress from prolonged bad weather). */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import {
  type WeatherType,
  type WeatherEffect,
  WEATHER_EFFECT_CLEAR,
  determineWeatherType,
  getWeatherEffect,
} from '@/data/weatherEffects';

/* ─── Ongoing effect application interval (ms) ─── */
const EFFECT_TICK_MS = 10_000; // 10 seconds

/* ─── Returned hook shape ─── */

export interface WeatherEffectsState {
  /** Current weather type */
  weatherType: WeatherType;
  /** Current weather effect modifiers */
  effect: WeatherEffect;
  /** Whether weather is currently active (not clear) */
  isActive: boolean;
  /** How long the current weather has been active (in seconds) */
  durationSeconds: number;
  /** Snow state tracked from eventBus events */
  snowActive: boolean;
  /** Snow intensity (0–1) */
  snowIntensity: number;
}

export function useWeatherEffects(): WeatherEffectsState {
  // ── Store state ──
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const addEnergy = useGameStore((s) => s.addEnergy);
  const addStress = useGameStore((s) => s.addStress);

  // ── Snow state (tracked from eventBus since store only has rain) ──
  const [snowActive, setSnowActive] = useState(false);
  const [snowIntensity, setSnowIntensity] = useState(0);

  // ── Duration tracking ──
  const weatherStartRef = useRef<number>(Date.now());
  const prevWeatherTypeRef = useRef<WeatherType>('clear');
  const [durationSeconds, setDurationSeconds] = useState(0);

  // ── Compute current weather type ──
  const weatherType = determineWeatherType(
    weatherEnabled,
    rainIntensity,
    snowActive,
    currentSceneId,
    timeOfDay,
  );

  // ── Get the effect for the computed type ──
  const effect = getWeatherEffect(weatherType);

  // ── Reset duration timer when weather type changes ──
  useEffect(() => {
    prevWeatherTypeRef.current = weatherType;
    weatherStartRef.current = Date.now();
    queueMicrotask(() => setDurationSeconds(0));
  }, [weatherType]);

  // ── Tick duration counter ──
  useEffect(() => {
    const tick = setInterval(() => {
      setDurationSeconds((Date.now() - weatherStartRef.current) / 1000);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const isActive = weatherType !== 'clear';

  // ── Listen for weather events on the eventBus ──
  useEffect(() => {
    const unsubRain = eventBus.on('weather:rain', (payload) => {
      // Rain intensity is tracked by the store; this event is for
      // any side effects or UI notifications the rain event triggers.
      // No additional state needed — rainIntensity comes from the store.
      void payload; // Acknowledge the event
    });

    const unsubSnow = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
      setSnowIntensity(payload.intensity);
    });

    return () => {
      unsubRain();
      unsubSnow();
    };
  }, []);

  // ── Apply ongoing effects (energy drain, stress) ──
  const lastTickRef = useRef<number>(Date.now());

  const applyOngoingEffects = useCallback(() => {
    if (weatherType === 'clear') return;

    const effectConfig = getWeatherEffect(weatherType);

    // Energy drain: if regen rate < 1.0, the player loses energy over time
    if (effectConfig.energyRegenRate < 1.0) {
      const energyDrain = Math.round((1.0 - effectConfig.energyRegenRate) * 2);
      if (energyDrain > 0) {
        addEnergy(-energyDrain);
      }
    }

    // Stress from prolonged bad weather: after 60+ seconds, stress increases
    const weatherDuration = (Date.now() - weatherStartRef.current) / 1000;
    if (weatherDuration > 60 && effectConfig.stressRate > 1.0) {
      const stressGain = Math.round((effectConfig.stressRate - 1.0) * 2);
      if (stressGain > 0) {
        addStress(stressGain);
      }
    }
  }, [weatherType, addEnergy, addStress]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      if (elapsed >= EFFECT_TICK_MS) {
        lastTickRef.current = now;
        applyOngoingEffects();
      }
    }, EFFECT_TICK_MS);

    return () => clearInterval(interval);
  }, [applyOngoingEffects]);

  return {
    weatherType,
    effect,
    isActive,
    durationSeconds,
    snowActive,
    snowIntensity,
  };
}
