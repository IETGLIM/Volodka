
/* ─── Volodka RPG – Atmospheric Effects Controller ───
 *  Reads the current scene from the game store and renders the
 *  appropriate volumetric fog, god rays, and special particles.
 *
 *  | Scene              | Effects                                            |
 *  |--------------------|----------------------------------------------------|
 *  | volodka_room       | Light monitor glow ray, minimal dust               |
 *  | volodka_corridor   | Light fog in distance, flickering overhead ray      |
 *  | street_night       | Heavy fog, rain mist at ground level, rain streaks  |
 *  | street_winter      | Ground fog, sun rays through clouds, snow drift     |
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
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { VolumetricFog } from './VolumetricFog';
import { FOG_PRESETS } from './fogPresets';
import { GodRays } from './GodRays';
import { GODRAY_PRESETS } from './godRayPresets';
import { SteamParticles } from './SteamParticles';
import { MatrixFogParticles } from './MatrixFogParticles';
import { DustMotes, RainStreaks, EmberParticles, SnowDrift } from './WeatherParticles';

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
const DUST_SCENES = new Set(['volodka_room', 'library_day']);

/** Scenes that get rain streaks */
const RAIN_SCENES = new Set(['street_night']);

/** Scenes that get floating embers */
const EMBER_SCENES = new Set(['abandoned_factory']);

/** Scenes that get snow drift */
const SNOW_SCENES = new Set(['street_winter']);

/** Main controller: renders appropriate atmospheric effects per scene */
export function AtmosphericEffects() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const heavyEffects = visualLite || effectsScale < 0.85;

  const showFog = sceneHasFog(sceneId);
  const showGodRays = sceneHasGodRays(sceneId);
  const showSteam = STEAM_SCENES.has(sceneId);
  const showMatrixFog = MATRIX_FOG_SCENES.has(sceneId);
  const showDust = DUST_SCENES.has(sceneId);
  const showRain = RAIN_SCENES.has(sceneId);
  const showEmbers = EMBER_SCENES.has(sceneId);
  const showSnow = SNOW_SCENES.has(sceneId);

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

      {/* Rain streaks for rainy streets */}
      {showRain && <RainStreaks sceneId={sceneId} />}

      {/* Floating embers from fire/industrial sources */}
      {showEmbers && <EmberParticles sceneId={sceneId} />}

      {/* Snow drift for winter scenes */}
      {showSnow && <SnowDrift sceneId={sceneId} />}
    </>
  );
}
