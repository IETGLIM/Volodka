/* ─── Volodka RPG – HUD-mount selectors ───
 * Selectors and hooks for newly mounted orphaned HUD widgets:
 *   - EnvironmentalEffectsOverlay
 *   - BuffDebuffTracker
 *   - SkillRechargeHUD
 *
 * These read from existing store slices and map to the prop shapes
 * expected by each widget. All selectors are additive — no state writes.
 */

import { useMemo } from 'react';
import { determineWeatherType } from '@/data/weatherEffects';
import type { WeatherType as OverlayWeatherType, LocationType } from '@/components/game/hud/parts/EnvironmentalEffectsOverlay';
import type { ActiveEffect } from '@/components/game/hud/parts/BuffDebuffTracker';
import type { SkillSlot } from '@/components/game/hud/parts/SkillRechargeHUD';
import { useGameSelector, useGamePrimitive } from './hooks';

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

/* ─── BuffDebuffTracker selectors ─── */

/**
 * Hook that reads poem powers and maps them to ActiveEffect[]
 * for <BuffDebuffTracker />. Returns an empty array when no
 * poem powers are active (component renders null when empty).
 */
export function useActiveEffects(): ActiveEffect[] {
  const poemPowers = useGameSelector((s) => s.poemPowers);

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
  }, [poemPowers]);
}

/* ─── SkillRechargeHUD selectors ─── */

/**
 * Hook that reads poem powers and maps them to SkillSlot[]
 * for <SkillRechargeHUD />. Returns an empty array when no
 * poem powers are active (component renders null when empty).
 */
export function useSkillSlots(): SkillSlot[] {
  const poemPowers = useGameSelector((s) => s.poemPowers);

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
  }, [poemPowers]);
}
