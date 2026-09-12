
/* ─── Volodka RPG – useWeatherEffects hook ─── */
/* Reads weather state from the game store, determines the active weather type,
 * returns the current WeatherEffect, and applies ongoing effects
 * (energy drain, stress from prolonged bad weather). */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWeatherEffectsInput } from '@/store/selectors';
import { onUiTick, useUiTick } from '@/hooks/useUiTick';
import { eventBus } from '@/engine/EventBus';
import {
  type WeatherType,
  type WeatherEffect,
  determineWeatherType,
  getWeatherEffect } from '@/data/weatherEffects';

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
  const { weatherEnabled, rainIntensity, currentSceneId, timeOfDay } = useWeatherEffectsInput();
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

  const isActive = weatherType !== 'clear';

  // ── Reset duration timer when weather type changes ──
  useEffect(() => {
    prevWeatherTypeRef.current = weatherType;
    weatherStartRef.current = Date.now();
    queueMicrotask(() => setDurationSeconds(0));
  }, [weatherType]);

  // ── Tick duration counter ──
  // perf (v4.25, этап 104): раньше здесь был СВОЙ setInterval(1000), работавший
  // даже в скрытой вкладке и при ясной погоде. Теперь — общий UI-clock:
  // период 1000 только при активной погоде (иначе 0 — подписки нет), тики
  // пропускаются в скрытой вкладке, интервал общий с прочими 1-секундными
  // подписчиками и гаснет, когда последний уходит.
  const durationTick = useUiTick(isActive ? 1000 : 0);
  useEffect(() => {
    void durationTick;
    setDurationSeconds((Date.now() - weatherStartRef.current) / 1000);
  }, [durationTick, weatherType]);

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

  // Актуальный колбэк эффектов для постоянной подписки ниже: applyRef держит
  // последнюю версию applyOngoingEffects без пересоздания подписки на UI-clock.
  const applyRef = useRef(applyOngoingEffects);
  useEffect(() => {
    applyRef.current = applyOngoingEffects;
  }, [applyOngoingEffects]);

  useEffect(() => {
    // perf (v4.25, этап 104): периодические эффекты погоды — на общем
    // UI-clock (один интервал на частоту, скрытая вкладка — тики пропущены).
    // Элапс-гард сохранён: догоняющий бамп после возврата видимости не должен
    // дважды списать энергию/стресс подряд с реальным тиком.
    const lastTickRef: { current: number } = { current: Date.now() };
    return onUiTick(EFFECT_TICK_MS, () => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      if (elapsed >= EFFECT_TICK_MS) {
        lastTickRef.current = now;
        applyRef.current();
      }
    });
  }, []);

  return {
    weatherType,
    effect,
    isActive,
    durationSeconds,
    snowActive,
    snowIntensity };
}
