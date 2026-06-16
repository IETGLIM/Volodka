import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameMode } from '@/store/selectors';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useVisualSettings } from '@/hooks/useVisualSettings';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  resolveSceneHeavyFx,
  tierFromPresetId,
} from '@/engine/graphics/fxGovernor';
import { isHeroScene } from '@/config/sceneVisualProfiles';
import type { SceneId } from '@/shared/types/game';
import { VolumetricFog, FOG_PRESETS } from './VolumetricFog';
import { GodRays, GODRAY_PRESETS } from './GodRays';
import { SteamParticles } from './SteamParticles';
import { MatrixFogParticles } from './MatrixFogParticles';
import { DustMotes, EmberParticles } from './WeatherParticles';

function sceneHasFog(sceneId: string): boolean {
  return sceneId in FOG_PRESETS;
}

function sceneHasGodRays(sceneId: string): boolean {
  return sceneId in GODRAY_PRESETS;
}

const STEAM_SCENES = new Set(['cafe_evening', 'home_evening']);
const MATRIX_FOG_SCENES = new Set(['battle']);
const DUST_SCENES = new Set(['volodka_room', 'volodka_corridor', 'library_day', 'park_day', 'home_evening']);
const EMBER_SCENES = new Set(['abandoned_factory']);

/** Main controller: renders appropriate atmospheric effects per scene */
export function AtmosphericEffects() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const gameMode = useGameMode();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const coarsePointer = useIsMobileVisual();
  const { particlesEnabled, postfxEnabled } = useVisualSettings();
  const { preset, selectedPreset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();
  const fxTier = tierFromPresetId(preset.id);
  const heroScene = isHeroScene(sceneId as SceneId);
  const heavyEffects = (visualLite || effectsScale < 0.85) && !heroScene;
  const effectsEnabled = gameMode !== 'menu' && postfxEnabled;

  const wantsFog = sceneHasFog(sceneId);
  const wantsGodRays = sceneHasGodRays(sceneId);

  const heavyFx = useMemo(
    () => resolveSceneHeavyFx(fxTier, sceneId, {
      weatherEnabled,
      wantsFog,
      wantsGodRays,
    }),
    [fxTier, sceneId, weatherEnabled, wantsFog, wantsGodRays],
  );

  const fogConfig = useMemo(() => {
    const fogPreset = FOG_PRESETS[sceneId] ?? {};
    switch (sceneId) {
      case 'street_night':
        return { ...fogPreset, opacity: heavyEffects ? 0.025 : 0.03, planeCount: heavyEffects ? 2 : 3 };
      case 'abandoned_factory':
        return {
          ...fogPreset,
          opacity: heavyEffects ? 0.035 : 0.04,
          planeCount: heavyEffects ? 2 : 3,
        };
      case 'sleep_dream':
        return { ...fogPreset, opacity: 0.07, planeCount: heavyEffects ? 4 : 7 };
      default:
        return fogPreset;
    }
  }, [sceneId, heavyEffects]);

  if (!effectsEnabled) return null;

  const showFog = heavyFx.fog;
  const showGodRays =
    heavyFx.godRays
    && allowsHeavyGfxFeature(selectedPreset, 'godRays', { coarsePointer })
    && !reducedMotion;
  const showSteam = particlesEnabled && STEAM_SCENES.has(sceneId);
  const showMatrixFog = particlesEnabled && MATRIX_FOG_SCENES.has(sceneId);
  const showDust = particlesEnabled && DUST_SCENES.has(sceneId);
  const showEmbers = particlesEnabled && EMBER_SCENES.has(sceneId);

  return (
    <>
      {showFog && <VolumetricFog sceneId={sceneId} config={fogConfig} />}

      {showGodRays && <GodRays sceneId={sceneId} liteMode={heavyEffects} />}

      {showSteam && <SteamParticles sceneId={sceneId} />}

      {showMatrixFog && <MatrixFogParticles />}

      {showDust && <DustMotes sceneId={sceneId} />}

      {showEmbers && <EmberParticles sceneId={sceneId} />}
    </>
  );
}
