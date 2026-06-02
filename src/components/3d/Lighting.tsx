'use client';

/* ─── Volodka RPG – Exploration lighting ───
 *  Per-scene lighting with noir-friendly indoor settings.
 *  Indoor rooms rely on scene-specific point lights (monitor, lamp, window)
 *  rather than bright uniform ambient, preserving atmospheric shadows.
 */

import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { useIsMobileVisual } from '@/hooks/use-mobile';

/** Shadow config constants — tuned to prevent z-fighting/shadow acne */
const SHADOW_BIAS = -0.002;
const SHADOW_NORMAL_BIAS = 0.04;

/** Per-scene indoor ambient overrides — noir rooms need very low ambient
 *  to let scene-specific lights (monitor, lamp, window) drive the atmosphere.
 *  Format: { color, intensity } */
const INDOOR_AMBIENT: Record<string, { color: string; intensity: number }> = {
  volodka_room:       { color: '#1a1525', intensity: 0.25 },  // very low — monitor is primary
  volodka_corridor:   { color: '#1a1520', intensity: 0.3 },
  home_evening:       { color: '#2a1a10', intensity: 0.35 },
  cafe_evening:       { color: '#101828', intensity: 0.3 },
  office_day:         { color: '#c0c8d0', intensity: 0.5 },
  library_day:        { color: '#3a3020', intensity: 0.35 },
  abandoned_factory:  { color: '#1a1510', intensity: 0.3 },
  zarema_albert_room: { color: '#1a1510', intensity: 0.35 },
};
const DEFAULT_INDOOR_AMBIENT = { color: '#1a1a2a', intensity: 0.35 };

/** Per-scene indoor fill light overrides — subtle fill to prevent
 *  completely black corners while preserving noir shadows.
 *  Format: { position, intensity, color, distance } or null to disable */
const INDOOR_FILL: Record<string, { position: [number, number, number]; intensity: number; color: string; distance: number } | null> = {
  volodka_room:       null,  // no fill — monitor + lamp + window provide all lighting
  volodka_corridor:   { position: [0, 2.2, 0], intensity: 1.2, color: '#887766', distance: 12 },
  home_evening:       { position: [0, 2.2, 0], intensity: 1.5, color: '#aa8855', distance: 10 },
  cafe_evening:       { position: [0, 2.5, -1], intensity: 1.0, color: '#887799', distance: 10 },
  office_day:         { position: [0, 2.5, 0], intensity: 2.0, color: '#c0c8d8', distance: 14 },
  library_day:        { position: [0, 2.5, 0], intensity: 1.2, color: '#aa9966', distance: 12 },
  abandoned_factory:  { position: [0, 2.5, 0], intensity: 0.8, color: '#886644', distance: 14 },
  zarema_albert_room: { position: [0, 2.2, 0], intensity: 1.0, color: '#887755', distance: 10 },
};
const DEFAULT_INDOOR_FILL: NonNullable<typeof INDOOR_FILL[string]> = {
  position: [0, 2.2, 0], intensity: 1.2, color: '#887766', distance: 12,
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
          intensity={light.intensity}
          color={light.color}
          distance={light.distance}
        />
      ))}
    </>
  );
}

/** Exploration lighting: directional + hemisphere + ambient + scene-specific lights */
export function ExplorationLighting() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const isMobile = useIsMobileVisual();
  const config = getSceneConfig(sceneId);
  const shadowSize = isMobile ? 512 : 2048;

  const ambientColor = config.ambientColor ?? '#1a1a2e';
  const ambientIntensity = config.ambientIntensity ?? 1.2;
  const groundColor = config.groundColor ?? '#1a1a1a';

  // Different light settings per scene type
  const isIndoor = config.hasCeiling;
  const isNight = sceneId === 'street_night' || sceneId === 'cafe_evening';
  const isDream = sceneId === 'sleep_dream';

  // Directional light — very dim indoors (barely-there ceiling bounce)
  // to let scene-specific point lights dominate the atmosphere
  const dirIntensity = isIndoor ? 0.8 : isDream ? 1.0 : isNight ? 1.2 : 2.0;
  const dirColor = isIndoor ? '#2a2540' : isNight ? '#1a1a4a' : isDream ? '#2a1040' : '#ffffff';
  const dirPosition: [number, number, number] = isIndoor
    ? [2, 4, 2]
    : [5, 10, 5];

  // Indoor ambient — per-scene tuned (very low for noir rooms)
  const indoorAmb = isIndoor ? (INDOOR_AMBIENT[sceneId] ?? DEFAULT_INDOOR_AMBIENT) : null;

  // Indoor fill — per-scene tuned or disabled
  const indoorFill = isIndoor ? (INDOOR_FILL[sceneId] ?? DEFAULT_INDOOR_FILL) : null;

  return (
    <>
      {/* Main directional light with shadows */}
      <directionalLight
        position={dirPosition}
        intensity={dirIntensity}
        color={dirColor}
        castShadow={!isMobile}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
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
        args={[ambientColor, groundColor, isIndoor ? ambientIntensity * 0.6 : ambientIntensity * 1.5]}
      />

      {/* Indoor ambient — per-scene tuned (very low for noir rooms like volodka_room) */}
      {indoorAmb && (
        <ambientLight intensity={indoorAmb.intensity} color={indoorAmb.color} />
      )}

      {/* Extra ambient for very dark outdoor scenes */}
      {isNight && !isIndoor && (
        <ambientLight intensity={0.35} color="#3a3a6a" />
      )}

      {isDream && (
        <ambientLight intensity={0.5} color="#4a2870" />
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

      {/* Scene-specific point lights from config */}
      <ScenePointLights />
    </>
  );
}
