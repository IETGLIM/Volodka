
/* ─── Volodka RPG – Atmospheric Effects Controller ───
 *  Reads the current scene from the game store and renders the
 *  appropriate volumetric fog, god rays, and special particles.
 *
 *  | Scene              | Effects                                            |
 *  |--------------------|----------------------------------------------------|
 *  | volodka_room       | Light monitor glow ray, minimal dust               |
 *  | volodka_corridor   | Light fog in distance, flickering overhead ray      |
 *  | street_night       | Heavy fog, rain mist (rain itself via WeatherController) |
 *  | street_winter      | Ground fog, sun rays (snow itself via WeatherController) |
 *  | cafe_evening       | Steam from coffee (small upward particles), warm glow |
 *  | park_day           | God rays through trees, light morning fog          |
 *  | library_day        | Window light shafts, dust motes                    |
 *  | rooftop_edge       | Strong god rays, cloud movement                    |
 *  | abandoned_factory  | Dense industrial fog, shafts through broken roof, embers |
 *  | battle             | Digital fog (green tint), matrix-style particles   |
 *  | sleep_dream        | Ethereal swirling fog (purple tint)                |
 *  | office_day         | Fluorescent light rays, AC airflow                 |
 *  | home_evening       | Warm kitchen glow, steam                           |
 *  | zarema_albert_room | Soft warm light, gentle fog                        |
 */

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameMode } from '@/store/selectors';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { useVisualSettings } from '@/hooks/useVisualSettings';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getFxBudget } from '@/engine/graphics/fxGovernor';
import { VolumetricFog, FOG_PRESETS } from './VolumetricFog';
import { GodRays, GODRAY_PRESETS } from './GodRays';
import { SteamParticles } from './SteamParticles';
import { MatrixFogParticles } from './MatrixFogParticles';
import { DustMotes, EmberParticles } from './WeatherParticles';

/** Whether a scene should have volumetric fog
 *  Indoor scenes get subtle fog for depth, outdoor get heavier fog */
function sceneHasFog(sceneId: string): boolean {
  return sceneId in FOG_PRESETS;
}

/** Whether a scene should have god rays
 *  Indoor: only from interior light sources (monitor, lamp)
 *  Outdoor: from sun/moon/environment */
function sceneHasGodRays(sceneId: string): boolean {
  return sceneId in GODRAY_PRESETS;
}

/** Scenes that get special coffee steam particles */
const STEAM_SCENES = new Set(['cafe_evening', 'home_evening']);

/** Scenes that get matrix-style digital fog particles */
const MATRIX_FOG_SCENES = new Set(['battle']);

/** Scenes that get floating dust motes */
const DUST_SCENES = new Set(['volodka_room', 'volodka_corridor', 'library_day']);

/** Scenes that get floating embers */
const EMBER_SCENES = new Set(['abandoned_factory']);

// NOTE: rain (street_night) and snow (street_winter, chk_forest_zorge) are
// handled by WeatherController → RainSystem/SnowSystem (GPU). The old
// RainStreaks/SnowDrift point systems were removed to avoid double weather.

/** Main controller: renders appropriate atmospheric effects per scene */
export function AtmosphericEffects() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const gameMode = useGameMode();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const { particlesEnabled, postfxEnabled } = useVisualSettings();
  const { preset } = useGraphicsQuality();
  const fxTier = preset.id === 'low' ? 'low' : preset.id === 'high' || preset.id === 'ultra' ? 'high' : 'medium';
  const fxBudget = getFxBudget(fxTier);
  const heavyEffects = visualLite || effectsScale < 0.85;
  const effectsEnabled = gameMode !== 'menu' && postfxEnabled;

  const fogConfig = useMemo(() => {
    const preset = FOG_PRESETS[sceneId] ?? {};
    // Boost fog density for specific atmospheric scenes
    switch (sceneId) {
      case 'street_night':
        return { ...preset, opacity: heavyEffects ? 0.025 : 0.03, planeCount: heavyEffects ? 2 : 3 };
      case 'abandoned_factory':
        // Always keep factory effects lighter — full stack caused hard freezes on entry
        return {
          ...preset,
          opacity: heavyEffects ? 0.035 : 0.04,
          planeCount: heavyEffects ? 2 : 3,
        };
      case 'sleep_dream':
        return { ...preset, opacity: 0.07, planeCount: heavyEffects ? 4 : 7 };
      default:
        return preset;
    }
  }, [sceneId, heavyEffects]);

  if (!effectsEnabled) return null;

  const showFog = fxBudget.allowFog && sceneHasFog(sceneId);
  const showGodRays = fxBudget.allowGodRays && sceneHasGodRays(sceneId);
  const showSteam = particlesEnabled && STEAM_SCENES.has(sceneId);
  const showMatrixFog = particlesEnabled && MATRIX_FOG_SCENES.has(sceneId);
  const showDust = particlesEnabled && DUST_SCENES.has(sceneId);
  const showEmbers = particlesEnabled && EMBER_SCENES.has(sceneId);

  return (
    <>
      {/* Volumetric fog planes */}
      {showFog && <VolumetricFog sceneId={sceneId} config={fogConfig} />}

      {/* God ray light shafts */}
      {showGodRays && <GodRays sceneId={sceneId} liteMode={heavyEffects} />}

      {/* Special steam particles (café, kitchen) */}
      {showSteam && <SteamParticles sceneId={sceneId} />}

      {/* Matrix-style digital fog particles (battle) */}
      {showMatrixFog && <MatrixFogParticles />}

      {/* Floating dust motes caught in monitor light */}
      {showDust && <DustMotes sceneId={sceneId} />}

      {/* Floating embers from fire/industrial sources */}
      {showEmbers && <EmberParticles sceneId={sceneId} />}
    </>
  );
}
