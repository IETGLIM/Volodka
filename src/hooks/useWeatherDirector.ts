
/* ─── Volodka RPG – useWeatherDirector hook ─── */
/* Рантайм-обвязка режиссёра погоды (engine/world/weatherDirector.ts):
 *  - таймер пересчёта раз в 3 секунды (не каждый кадр);
 *  - непрерывное игровое время между тиками world clock (1 игровой час =
 *    4 реальные минуты — worldClockConstants), чтобы цель директора не
 *    «ступеньками» прыгала раз в минуту;
 *  - целевая интенсивность ведётся в стор через существующий setRainIntensity
 *    (плавный рамп 60–90 с на полный размах, без телепорта) — компоненты
 *    (RainSystem/SnowSystem/мокрые поверхности/HUD) читают её сами;
 *  - крупные переходы фаз → eventBus 'weather:changed' (карточка
 *    WeatherAlertNotification + эмоции NPC), не чаще раза в игровой час;
 *  - weatherEnabled=false или внутренняя сцена — директор полностью замолкает
 *    (быстрое затухание до нуля, без событий).
 *
 * Сейв/лоад: директор — чистая функция от (сцена × timeOfDay), состояние
 * не накапливается, поэтому восстановление сохранения даёт ту же погоду.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useExplorationStore } from '@/store/stores/explorationStore';
import { useCurrentSceneId } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import type { SceneId } from '@/shared/types/game';
import {
  WORLD_CLOCK_HOURS_PER_TICK,
  WORLD_CLOCK_TICK_INTERVAL_S,
} from '@/engine/world/worldClockConstants';
import {
  canEmitWeatherAlert,
  computeWeatherDirectorState,
  rampIntensityToward,
  resolveWeatherDirectorAlert,
  WEATHER_FAST_FADE_PER_SECOND,
  type DirectedWeatherPhase,
} from '@/engine/world/weatherDirector';

/** Период пересчёта директора (2–5 с по требованиям производительности). */
const DIRECTOR_TICK_MS = 3000;

/** Верхняя граница шага времени между тиками — переживает сон вкладки. */
const MAX_TICK_DELTA_S = 10;

/** Порог записи в стор: ниже — считаем, что интенсивность «дошла». */
const STORE_WRITE_EPSILON = 0.004;

/** Порог размонтирования частиц дождя при затухании окна (хвост рампа). */
const PARTICLE_FADE_EPSILON = 0.02;

/* ─── Состояние для рендера (потребляет WeatherController) ─── */

export interface WeatherDirectorRuntimeState {
  /** Текущая фаза режиссёра. */
  phase: DirectedWeatherPhase;
  /** Нужно ли монтировать дождевые частицы в этой сцене
   *  (базовый дождь сцены или динамическое окно + хвост затухания). */
  rainActive: boolean;
  /** Идёт ли гроза (пик окна — интенсивность до 1.0). */
  storm: boolean;
}

/** Начальное состояние — синхронный расчёт без ожидания первого тика. */
function computeRuntimeState(sceneId: SceneId, weatherEnabled: boolean): WeatherDirectorRuntimeState {
  const exploration = useExplorationStore.getState();
  const directed = computeWeatherDirectorState({
    sceneId,
    gameHour: exploration.exploration.timeOfDay,
    weatherEnabled,
  });
  const rainActive =
    weatherEnabled &&
    directed.phase !== 'sheltered' &&
    (directed.phase !== 'clear' || exploration.rainIntensity > PARTICLE_FADE_EPSILON);
  return { phase: directed.phase, rainActive, storm: directed.storm };
}

export function useWeatherDirector(): WeatherDirectorRuntimeState {
  const sceneId = useCurrentSceneId();
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const [runtimeState, setRuntimeState] = useState<WeatherDirectorRuntimeState>(() =>
    computeRuntimeState(sceneId, weatherEnabled),
  );

  /** Предыдущая фаза — живёт между сменами сцены, чтобы вход в ливень
   *  из помещения всё ещё давал уведомление. null только на первом тике. */
  const prevPhaseRef = useRef<DirectedWeatherPhase | null>(null);
  /** Игровая минута последнего уведомления (релей-лимит 1/игровой час). */
  const lastAlertMinuteRef = useRef<number | null>(null);

  useEffect(() => {
    let lastStoreHour: number | null = null;
    let lastStoreChangeMs = Date.now();
    let lastTickMs = Date.now();

    const tick = () => {
      const now = Date.now();

      // ── Непрерывное игровое время ──
      // World clock тикает раз в WORLD_CLOCK_TICK_INTERVAL_S; между тиками
      // экстраполируем с тем же темпом. Кап на один тик не даёт «убежать
      // вперёд» при паузах (оверлеи, сон вкладки): при приземлении тика
      // стора экстраполяция в точности совпадает с новым timeOfDay — без скачка.
      const storeHour = useExplorationStore.getState().exploration.timeOfDay;
      if (lastStoreHour !== storeHour) {
        lastStoreHour = storeHour;
        lastStoreChangeMs = now;
      }
      const withinTickS = Math.min(
        (now - lastStoreChangeMs) / 1000,
        WORLD_CLOCK_TICK_INTERVAL_S,
      );
      const smoothGameHour =
        (storeHour + (withinTickS / WORLD_CLOCK_TICK_INTERVAL_S) * WORLD_CLOCK_HOURS_PER_TICK) % 24;

      // ── Цель директора и плавный рамп в стор ──
      const directed = computeWeatherDirectorState({
        sceneId,
        gameHour: smoothGameHour,
        weatherEnabled,
      });
      const dtS = Math.min((now - lastTickMs) / 1000, MAX_TICK_DELTA_S);
      lastTickMs = now;

      const currentIntensity = useExplorationStore.getState().rainIntensity;
      const fastFade = !weatherEnabled || directed.phase === 'sheltered';
      const nextIntensity = rampIntensityToward(
        currentIntensity,
        directed.intensity,
        dtS,
        fastFade ? WEATHER_FAST_FADE_PER_SECOND : undefined,
      );
      if (Math.abs(nextIntensity - currentIntensity) >= STORE_WRITE_EPSILON) {
        useExplorationStore.getState().setRainIntensity(nextIntensity);
      }

      // ── Крупные переходы → уведомление (не чаще раза в игровой час) ──
      if (prevPhaseRef.current !== directed.phase) {
        const alert = weatherEnabled
          ? resolveWeatherDirectorAlert(prevPhaseRef.current, directed.phase, smoothGameHour)
          : null;
        if (alert) {
          const gameMinute = smoothGameHour * 60;
          if (canEmitWeatherAlert(lastAlertMinuteRef.current, gameMinute)) {
            lastAlertMinuteRef.current = gameMinute;
            // WeatherAlertNotification слушает weather:changed; нарративный
            // текст едёт единственным элементом debuffs — карточка показывает
            // тип («Дождь»/«Гроза»), температуру и текст как подпись.
            eventBus.emit('weather:changed', {
              weatherType: alert.weatherType,
              temperature: alert.temperature,
              debuffs: [alert.text],
            });
          }
        }
        prevPhaseRef.current = directed.phase;
      }

      // ── Состояние для рендера (ре-рендер только на изменение) ──
      const rainActive =
        weatherEnabled &&
        directed.phase !== 'sheltered' &&
        (directed.phase !== 'clear' || nextIntensity > PARTICLE_FADE_EPSILON);
      setRuntimeState((prev) =>
        prev.phase === directed.phase && prev.rainActive === rainActive && prev.storm === directed.storm
          ? prev
          : { phase: directed.phase, rainActive, storm: directed.storm },
      );
    };

    tick();
    const timer = setInterval(tick, DIRECTOR_TICK_MS);
    return () => clearInterval(timer);
  }, [sceneId, weatherEnabled]);

  return runtimeState;
}
