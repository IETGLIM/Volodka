
/* ─── Volodka RPG – Exploration lighting ───
 *  Per-scene lighting with noir-friendly indoor settings.
 *  Indoor rooms rely on scene-specific point lights (monitor, lamp, window)
 *  rather than bright uniform ambient, preserving atmospheric shadows.
 */

import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { resolveSceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import type { SceneId } from '@/shared/types/game';

/** Shadow config constants — tuned to prevent z-fighting/shadow acne */
const SHADOW_BIAS = -0.002;
const SHADOW_NORMAL_BIAS = 0.04;

/** Per-scene indoor ambient overrides — noir rooms need very low ambient
 *  to let scene-specific lights (monitor, lamp, window) drive the atmosphere.
 *  Format: { color, intensity } */
const INDOOR_AMBIENT: Record<string, { color: string; intensity: number }> = {
  volodka_room:       { color: '#3a3548', intensity: 0.62 },
  volodka_corridor:   { color: '#383448', intensity: 0.66 },
  home_evening:       { color: '#4a3828', intensity: 0.62 },
  cafe_evening:       { color: '#2a3048', intensity: 0.58 },
  office_day:         { color: '#c0c8d0', intensity: 0.65 },
  library_day:        { color: '#4a4438', intensity: 0.62 },
  abandoned_factory:  { color: '#3a3228', intensity: 0.58 },
  factory_basement:   { color: '#283830', intensity: 0.55 },
  solnysh_room:       { color: '#3a3428', intensity: 0.6 },
  sleep_dream:        { color: '#3a2850', intensity: 0.58 },
};
const DEFAULT_INDOOR_AMBIENT = { color: '#2a2a3a', intensity: 0.52 };

/** Per-scene indoor fill light overrides — subtle fill to prevent
 *  completely black corners while preserving noir shadows.
 *  Format: { position, intensity, color, distance } or null to disable */
const INDOOR_FILL: Record<string, { position: [number, number, number]; intensity: number; color: string; distance: number } | null> = {
  volodka_room:       { position: [0, 2.0, 0], intensity: 1.35, color: '#887799', distance: 10 },
  volodka_corridor:   { position: [0, 2.2, 0], intensity: 2.1, color: '#bbAA88', distance: 14 },
  home_evening:       { position: [0, 2.2, 0], intensity: 2.2, color: '#ddaa77', distance: 12 },
  cafe_evening:       { position: [0, 2.5, -1], intensity: 1.75, color: '#aa99cc', distance: 13 },
  office_day:         { position: [0, 2.5, 0], intensity: 2.8, color: '#dde8f8', distance: 16 },
  library_day:        { position: [0, 2.5, 0], intensity: 1.85, color: '#ccaa77', distance: 14 },
  abandoned_factory:  { position: [0, 3.0, 0], intensity: 1.45, color: '#cc9966', distance: 16 },
  factory_basement:   { position: [0, 2.4, 0], intensity: 1.35, color: '#668877', distance: 14 },
  zarema_albert_room: { position: [0, 2.2, 0], intensity: 1.65, color: '#aa9977', distance: 12 },
  solnysh_room:       { position: [0, 2.2, 0], intensity: 1.7, color: '#ccaa88', distance: 11 },
  sleep_dream:        { position: [0, 2.4, 0], intensity: 1.5, color: '#8866aa', distance: 14 },
};
const OUTDOOR_READABILITY_AMBIENT: Record<string, { intensity: number; color: string }> = {
  park_day:         { intensity: 0.14, color: '#8a9888' },
  rooftop_edge:     { intensity: 0.12, color: '#8899aa' },
  river_pier:       { intensity: 0.13, color: '#778899' },
  chk_forest_zorge: { intensity: 0.11, color: '#6a7868' },
};
const DEFAULT_INDOOR_FILL: NonNullable<typeof INDOOR_FILL[string]> = {
  position: [0, 2.2, 0], intensity: 1.6, color: '#998877', distance: 12,
};

/** Scene-specific point lights rendered from scene config */
function ScenePointLights() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const config = getSceneConfig(sceneId);
  const lights = config.lights ?? [];

  if (lights.length === 0) return null;

  return (
    <>
      {lights.map((light, i) => (
        <pointLight
          key={`scene-light-${sceneId}-${i}`}
          position={light.position}
          intensity={light.intensity * SCENE_VISIBILITY.pointLightScale}
          color={light.color}
          distance={light.distance}
        />
      ))}
    </>
  );
}

/** Exploration lighting: directional + hemisphere + ambient + scene-specific lights */
export function ExplorationLighting() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;
  const isMobile = useIsMobileVisual();
  const { preset, selectedPreset } = useGraphicsQuality();
  const { visualLite } = useMobileVisualPerf();
  const rendering = resolveSceneRenderingPipeline(
    sceneId,
    preset,
    visualLite,
    selectedPreset,
    isMobile,
  );
  const config = getSceneConfig(sceneId);
  const baseShadow = isMobile ? 512 : preset.id === 'ultra' ? 2048 : 1024;
  const shadowSize = Math.min(
    2048,
    Math.round(baseShadow * rendering.shadowMapScale),
  );

  const ambientColor = config.ambientColor ?? '#1a1a2e';
  const ambientIntensity =
    (config.ambientIntensity ?? 1.2) * SCENE_VISIBILITY.ambientScale;
  const groundColor = config.groundColor ?? '#1a1a1a';

  // Different light settings per scene type
  const isIndoor = config.hasCeiling;
  const isNight = sceneId === 'street_night' || sceneId === 'cafe_evening';
  const isStreet = sceneId === 'street_night' || sceneId === 'street_winter';
  const isChkForest = sceneId === 'chk_forest_zorge';
  const isDream = sceneId === 'sleep_dream';

  // Directional light — very dim indoors (barely-there ceiling bounce)
  // to let scene-specific point lights dominate the atmosphere
  const dirIntensity = isIndoor ? 1.15 : isDream ? 1.2 : isStreet ? 1.85 : isNight ? 1.45 : 2.2;
  const dirColor = isIndoor ? '#2a2540' : isStreet && sceneId === 'street_winter' ? '#d0d8e8' : isNight ? '#3a3a6a' : isDream ? '#2a1040' : '#ffffff';
  const dirPosition: [number, number, number] = isIndoor
    ? [2, 4, 2]
    : [5, 10, 5];

  // Indoor ambient — per-scene tuned (very low for noir rooms)
  const indoorAmb = isIndoor ? (INDOOR_AMBIENT[sceneId] ?? DEFAULT_INDOOR_AMBIENT) : null;

  // Indoor fill — per-scene tuned or disabled
  const indoorFill = isIndoor ? (INDOOR_FILL[sceneId] ?? DEFAULT_INDOOR_FILL) : null;
  const outdoorReadability = !isIndoor ? OUTDOOR_READABILITY_AMBIENT[sceneId] : null;

  return (
    <>
      {/* Main directional light with shadows */}
      <directionalLight
        position={dirPosition}
        intensity={dirIntensity}
        color={dirColor}
        castShadow={preset.shadows}
        shadow-mapSize-width={preset.id === 'medium' ? 512 : shadowSize}
        shadow-mapSize-height={preset.id === 'medium' ? 512 : shadowSize}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={SHADOW_BIAS}
        shadow-normalBias={SHADOW_NORMAL_BIAS}
      />

      {/* Hemisphere light for ambient fill — reduced for indoor noir */}
      <hemisphereLight
        args={[
          ambientColor,
          groundColor,
          isIndoor
            ? ambientIntensity * SCENE_VISIBILITY.indoorHemisphereMul
            : ambientIntensity * SCENE_VISIBILITY.outdoorHemisphereMul,
        ]}
      />

      {/* Base readability fill — prevents crushed blacks in noir rooms */}
      <ambientLight
        intensity={SCENE_VISIBILITY.baseAmbientIntensity}
        color={isIndoor ? '#3a3548' : '#4a5060'}
      />

      {/* Indoor ambient — per-scene tuned (very low for noir rooms like volodka_room) */}
      {indoorAmb && (
        <ambientLight intensity={indoorAmb.intensity} color={indoorAmb.color} />
      )}

      {/* Extra ambient for very dark outdoor scenes */}
      {isNight && !isIndoor && (
        <ambientLight intensity={0.55} color="#5a5a88" />
      )}

      {sceneId === 'street_night' && (
        <ambientLight intensity={0.45} color="#606088" />
      )}

      {sceneId === 'street_winter' && (
        <ambientLight intensity={0.42} color="#c0ccd8" />
      )}

      {isChkForest && !isIndoor && (
        <ambientLight intensity={0.4} color="#5a7058" />
      )}

      {isDream && (
        <ambientLight intensity={0.62} color="#5a3888" />
      )}

      {/* Indoor fill light — per-scene tuned or disabled (null = no fill) */}
      {indoorFill && (
        <pointLight
          position={indoorFill.position}
          intensity={indoorFill.intensity}
          color={indoorFill.color}
          distance={indoorFill.distance}
        />
      )}

      {outdoorReadability && (
        <ambientLight intensity={outdoorReadability.intensity} color={outdoorReadability.color} />
      )}

      {/* Scene-specific point lights from config */}
      <ScenePointLights />
    </>
  );
}
