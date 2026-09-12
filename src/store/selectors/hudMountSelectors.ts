/* ─── Volodka RPG – HUD-mount selectors ───
 * Selectors and hooks for newly mounted orphaned HUD widgets:
 *   - EnvironmentalEffectsOverlay
 *   - BuffDebuffTracker
 *   - SkillRechargeHUD
 *
 * These read from existing store slices and map to the prop shapes
 * expected by each widget. All selectors are additive — no state writes.
 */

import { useEffect, useMemo, useState } from 'react';
import { determineWeatherType } from '@/data/weatherEffects';
import type { WeatherType as OverlayWeatherType, LocationType } from '@/components/game/hud/parts/EnvironmentalEffectsOverlay';
import type { ActiveEffect } from '@/components/game/hud/parts/BuffDebuffTracker';
import type { SkillSlot } from '@/components/game/hud/parts/SkillRechargeHUD';
import { useGameSelector, useGamePrimitive } from './hooks';

/* ─── Progressive HUD disclosure ─── */

/**
 * Keep the first room focused on objective, interaction, and core controls.
 * Existing progression signals unlock the secondary HUD: completing/skipping
 * onboarding in-place, or discovering any scene after the starting room.
 */
export function useIsInitialHudFocus(): boolean {
  return useGamePrimitive((s) => (
    s.exploration.currentSceneId === 'volodka_room'
    && s.discoveredScenes.length <= 1
    && !s.tutorialFlags.tutorialsCompleted
    && !s.tutorialFlags.tutorialsDisabled
  ));
}

/* ─── EnvironmentalEffectsOverlay selectors ─── */

/** Map store WeatherType → overlay WeatherType (overlay is a superset). */
function mapToOverlayWeather(storeWeather: string): OverlayWeatherType {
  const mapping: Record<string, OverlayWeatherType> = {
    clear: 'clear',
    rain: 'rain',
    snow: 'snow',
    fog: 'fog',
    storm: 'storm',
  };
  return mapping[storeWeather] ?? 'clear';
}

/** Derive LocationType from the current scene ID. */
function deriveLocationType(sceneId: string): LocationType {
  const outdoorScenes = new Set([
    'street_night', 'street_winter', 'park_day',
    'rooftop_edge', 'chk_forest_zorge', 'river_pier',
  ]);
  const undergroundScenes = new Set([
    'factory_basement', 'abandoned_factory',
  ]);
  const industrialScenes = new Set([
    'abandoned_factory', 'factory_basement',
  ]);

  if (outdoorScenes.has(sceneId)) return 'outdoor';
  if (undergroundScenes.has(sceneId)) return 'underground';
  if (industrialScenes.has(sceneId)) return 'industrial';
  return 'indoor';
}

/**
 * Hook that reads the game store and returns the props object
 * needed by <EnvironmentalEffectsOverlay />.
 */
export function useEnvironmentalEffectsOverlayProps() {
  const weatherEnabled = useGamePrimitive((s) => s.weatherEnabled);
  const rainIntensity = useGamePrimitive((s) => s.rainIntensity);
  const currentSceneId = useGamePrimitive((s) => s.exploration.currentSceneId);
  const timeOfDay = useGamePrimitive((s) => s.exploration.timeOfDay);
  const energy = useGamePrimitive((s) => s.playerState.energy);
  const mode = useGameSelector((s) => {
    const phase = (s as any).mode ?? 'exploration';
    return phase;
  });

  const storeWeather = useMemo(
    () => determineWeatherType(weatherEnabled, rainIntensity, false, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, currentSceneId, timeOfDay],
  );

  const weather = mapToOverlayWeather(storeWeather);
  const locationType = deriveLocationType(currentSceneId);
  const healthPercent = Math.max(0, Math.min(100, energy));
  const inCombat = mode === 'combat';

  return {
    weather,
    timeOfDay,
    locationType,
    inCombat,
    healthPercent,
    enabled: true,
  };
}

/* ─── Общий тик кулдаунов (FIX perf v4.22) ───
 * Раньше useActiveEffects и useSkillSlots держали КАЖДЫЙ свой setInterval(500мс),
 * который жил вечно после первого использования стихотворной силы: условие
 * `Object.keys(poemPowers).length > 0` остаётся true и после истечения кулдауна
 * (записи не удаляются), и интервал бесконечно дёргал ре-рендеры трекера и
 * SkillRechargeHUD. Теперь общий хук: интервал запускается только пока реально
 * есть кулдаун в пределах длительности и сам останавливается, когда всё истекло. */
interface PoemPowerCooldownState {
  lastUsed?: number;
  cooldownMs: number;
}

function hasRunningCooldown(poemPowers: Record<string, PoemPowerCooldownState>): boolean {
  const now = Date.now();
  for (const state of Object.values(poemPowers)) {
    if (state.lastUsed && now - state.lastUsed < state.cooldownMs) return true;
  }
  return false;
}

function usePoemPowerCooldownTick(poemPowers: Record<string, PoemPowerCooldownState>): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!hasRunningCooldown(poemPowers)) return;
    let iv: number | undefined = window.setInterval(() => {
      setTick((t) => t + 1);
      // Все кулдауны истекли — гасим интервал, чтобы не тикать впустую.
      if (iv !== undefined && !hasRunningCooldown(poemPowers)) {
        window.clearInterval(iv);
        iv = undefined;
      }
    }, 500);
    return () => {
      if (iv !== undefined) window.clearInterval(iv);
    };
  }, [poemPowers]);
  return tick;
}

/* ─── BuffDebuffTracker selectors ─── */

/**
 * Hook that reads poem powers and maps them to ActiveEffect[]
 * for <BuffDebuffTracker />. Returns an empty array when no
 * poem powers are active (component renders null when empty).
 */
export function useActiveEffects(): ActiveEffect[] {
  const poemPowers = useGameSelector((s) => s.poemPowers);
  // FIX (perf v4.22): общий тик, который останавливается после истечения кулдаунов
  // (см. usePoemPowerCooldownTick) — раньше два вечных 500мс интервала.
  const tick = usePoemPowerCooldownTick(poemPowers);

  return useMemo(() => {
    const entries = Object.entries(poemPowers);
    if (entries.length === 0) return [];

    const now = Date.now();
    return entries
      .filter(([, state]) => {
        if (!state.lastUsed) return false;
        const elapsed = now - state.lastUsed;
        return elapsed < state.cooldownMs;
      })
      .map(([poemId, state]) => {
        const elapsed = now - state.lastUsed;
        const remaining = Math.max(0, state.cooldownMs - elapsed);
        const isWarning = remaining > 0 && remaining < 3000;
        return {
          id: `poem-power-${poemId}`,
          name: poemId,
          icon: 'star',
          type: 'buff' as const,
          remainingTime: remaining,
          duration: state.cooldownMs,
          isWarning,
        };
      });
    // tick — не реальная зависимость данных, но перезапускает расчёт каждую
    // итерацию тика, пока кулдауны активны.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemPowers, tick]);
}

/* ─── SkillRechargeHUD selectors ─── */

/**
 * Hook that reads poem powers and maps them to SkillSlot[]
 * for <SkillRechargeHUD />. Returns an empty array when no
 * poem powers are active (component renders null when empty).
 */
export function useSkillSlots(): SkillSlot[] {
  const poemPowers = useGameSelector((s) => s.poemPowers);
  // FIX (perf v4.22): общий тик кулдаунов с автостопом (см. useActiveEffects).
  const tick = usePoemPowerCooldownTick(poemPowers);

  return useMemo(() => {
    const entries = Object.entries(poemPowers);
    if (entries.length === 0) return [];

    const now = Date.now();
    return entries
      .filter(([, state]) => {
        if (!state.lastUsed) return false;
        const elapsed = now - state.lastUsed;
        return elapsed < state.cooldownMs;
      })
      .map(([poemId, state], index) => {
        const elapsed = now - state.lastUsed;
        const remaining = Math.max(0, state.cooldownMs - elapsed);
        const isReady = remaining <= 0;
        return {
          id: `skill-${poemId}`,
          name: poemId,
          icon: `⚡`,
          keyBinding: `${index + 1}`,
          cooldownRemaining: remaining,
          totalCooldown: state.cooldownMs,
          isReady,
          isActive: false,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemPowers, tick]);
}
