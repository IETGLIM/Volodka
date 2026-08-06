import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameMode } from '@/store/selectors';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useVisualSettings } from '@/hooks/useVisualSettings';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { isPostProcessingEnabled } from '@/engine/graphics/qualityPresets';
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
import { IndustrialSparkles } from './IndustrialSparkles';
import { NeonRainReflections } from './NeonRainReflections';
import { ServerRoomMist } from './ServerRoomMist';
import { FlickeringLightEffect } from './FlickeringLightEffect';

function sceneHasFog(sceneId: string): boolean {
  return sceneId in FOG_PRESETS;
}

function sceneHasGodRays(sceneId: string): boolean {
  return sceneId in GODRAY_PRESETS;
}

const STEAM_SCENES = new Set(['cafe_evening', 'home_evening']);
const MATRIX_FOG_SCENES = new Set(['battle']);
const DUST_SCENES = new Set([
  'volodka_room', 'volodka_corridor', 'library_day', 'park_day', 'home_evening', 'battle',
  'abandoned_factory',
  // Cron-tick 9: extension scenes — cozy rooms and dusty basements get atmospheric dust motes
  'solnysh_room', 'library_basement', 'albert_backroom', 'zarema_room',
  // Cron-tick 10: more rooms and industrial scenes
  'zarema_albert_room', 'factory_roof',
  // AAA continuation: more living atmosphere in key hubs (pier, office, guild, dream, CHK)
  'river_pier', 'pier_evening', 'office_day', 'guild_mainframe', 'sleep_dream',
  'chk_forest_zorge', 'chk_campfire_night', 'factory_basement', 'underground_bunker',
]);
const EMBER_SCENES = new Set([
  'abandoned_factory', 'battle',
  // Cron-tick 9: campfire night gets glowing embers
  'chk_campfire_night',
  // AAA: more warm industrial/fire scenes
  'factory_roof', 'river_pier', 'pier_evening', 'home_evening',
  // AAA Phase A: pier fire embers + river reflections
  'river_pier', 'pier_evening',
]);
const NEON_REFLECTION_SCENES = new Set(['street_night', 'city_square', 'river_pier', 'pier_evening']);
const MIST_SCENES = new Set([
  'guild_mainframe',
  // Cron-tick 9: resistance bunker gets CRT mist
  'underground_bunker',
  // Cron-tick 10: forest scenes get atmospheric mist
  'chk_forest_zorge', 'forest_clearing',
  // AAA: more moody mist for industrial, pier, dream, library
  'factory_basement', 'river_pier', 'pier_evening', 'sleep_dream', 'library_basement', 'office_day',
]);
const FLICKERING_LIGHT_SCENES = new Set([
  'factory_basement', 'abandoned_factory',
  // Cron-tick 9: resistance bunker and dusty basement get flickering
  'underground_bunker', 'library_basement',
  // Cron-tick 10: office fluorescent hum
  'office_day',
]);

/** Main controller: renders appropriate atmospheric effects per scene */
export function AtmosphericEffects() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const gameMode = useGameMode();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const coarsePointer = useIsMobileVisual();
  const { particlesEnabled, postfxEnabled } = useVisualSettings();
  const { preset, selectedPreset } = useGraphicsQuality();
  const postfxActive = isPostProcessingEnabled(preset, postfxEnabled);
  const reducedMotion = useEffectiveReducedMotion();
  const fxTier = tierFromPresetId(preset.id);
  const heroScene = isHeroScene(sceneId as SceneId);
  const heavyEffects = (visualLite || effectsScale < 0.85) && !heroScene;
  const effectsEnabled = gameMode !== 'menu' && postfxActive;

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
        return { ...fogPreset, opacity: heavyEffects ? 0.028 : 0.035, planeCount: heavyEffects ? 3 : 4 };
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
  const showNeonReflections = particlesEnabled && NEON_REFLECTION_SCENES.has(sceneId) && weatherEnabled;
  const showMist = particlesEnabled && MIST_SCENES.has(sceneId);
  const showFlickeringLights = FLICKERING_LIGHT_SCENES.has(sceneId);

  // AAA: cinematic atmosphere boost from cutscenes (dense god rays + dust during luxurious scenes)
  const [cinematicBoost, setCinematicBoost] = useState(0);
  useEffect(() => {
    const unsub = eventBus.on('cinematic:atmosphere_boost', ({ intensity }: any) => {
      setCinematicBoost(Math.min(1.2, intensity || 0.7));
    });
    return unsub;
  }, []);

  const effectiveDust = showDust || cinematicBoost > 0.2;
  const effectiveGodRays = showGodRays || cinematicBoost > 0.3;
  const effectiveEmbers = showEmbers || cinematicBoost > 0.5;

  return (
    <>
      {showFog && <VolumetricFog sceneId={sceneId} config={fogConfig} />}

      {(effectiveGodRays || cinematicBoost > 0) && (
        <GodRays sceneId={sceneId} liteMode={heavyEffects} />
      )}

      {showSteam && <SteamParticles sceneId={sceneId} />}

      {showMatrixFog && <MatrixFogParticles />}

      {effectiveDust && <DustMotes sceneId={sceneId} />}

      {effectiveEmbers && <EmberParticles sceneId={sceneId} />}

      {particlesEnabled && <IndustrialSparkles sceneId={sceneId} />}

      {/* ── New atmospheric effects ── */}
      {showNeonReflections && <NeonRainReflections sceneId={sceneId} />}
      {showMist && <ServerRoomMist sceneId={sceneId} />}
      {showFlickeringLights && <FlickeringLightEffect sceneId={sceneId} />}

      {/* Extra cinematic density during cutscenes (god-ray dust + thick air) */}
      {cinematicBoost > 0.15 && (
        <group>
          {/* Subtle extra dust layer for luxurious cutscenes */}
          <mesh position={[0, 2.2, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[28, 28]} />
            <meshBasicMaterial
              color="#d4c8a8"
              transparent
              opacity={0.035 * cinematicBoost}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
    </>
  );
}
