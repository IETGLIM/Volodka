
/* ─── Volodka RPG – Exploration lighting ───
 *  Per-scene lighting with noir-friendly indoor settings.
 *  Indoor rooms rely on scene-specific point lights (monitor, lamp, window)
 *  rather than bright uniform ambient, preserving atmospheric shadows.
 */

import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { resolveSceneRenderingPipeline } from '@/engine/graphics/resolveSceneRenderingPipeline';
import { SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { getShadowMapResolution } from '@/engine/graphics/TimeOfDayLighting';
import type { SceneId } from '@/shared/types/game';
import { useRef, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useThree } from '@react-three/fiber';
import { computeTimeOfDayLighting } from '@/engine/graphics/TimeOfDayLighting';
import * as THREE from 'three';

/** Shadow config constants — tuned to prevent z-fighting/shadow acne */
const SHADOW_BIAS = -0.002;
const SHADOW_NORMAL_BIAS = 0.04;

/**
 * Canonical shadow bias constants — exported so per-scene visual components
 * can apply the SAME tuned values to their own castShadow lights. Using ad-hoc
 * values (or omitting shadow-normalBias → defaults to 0) produces shadow acne
 * or peter-panning. See AUDIT-VISUAL H1.
 */
export const CANONICAL_SHADOW_BIAS = SHADOW_BIAS;
export const CANONICAL_SHADOW_NORMAL_BIAS = SHADOW_NORMAL_BIAS;

/** Per-scene indoor ambient overrides — noir rooms need very low ambient
 *  to let scene-specific lights (monitor, lamp, window) drive the atmosphere.
 *  Format: { color, intensity } */
const INDOOR_AMBIENT: Record<string, { color: string; intensity: number }> = {
  volodka_room:       { color: '#2a2538', intensity: 0.55 },
  volodka_corridor:   { color: '#2a2438', intensity: 0.52 },
  home_evening:       { color: '#4a3828', intensity: 0.62 },
  cafe_evening:       { color: '#2a3048', intensity: 0.58 },
  office_day:         { color: '#c0c8d0', intensity: 0.65 },
  library_day:        { color: '#4a4438', intensity: 0.62 },
  library_basement:   { color: '#2a2418', intensity: 0.42 },
  abandoned_factory:  { color: '#3a3228', intensity: 0.58 },
  factory_basement:   { color: '#283830', intensity: 0.55 },
  solnysh_room:       { color: '#3a3428', intensity: 0.6 },
  sleep_dream:        { color: '#3a2850', intensity: 0.58 },
  guild_mainframe:    { color: '#1a2838', intensity: 0.48 },
  albert_backroom:    { color: '#2a2038', intensity: 0.5 },
  underground_bunker: { color: '#1a2820', intensity: 0.46 },
};
const DEFAULT_INDOOR_AMBIENT = { color: '#2a2a3a', intensity: 0.52 };

/** Per-scene indoor fill light overrides — subtle fill to prevent
 *  completely black corners while preserving noir shadows.
 *  Format: { position, intensity, color, distance } or null to disable */
const INDOOR_FILL: Record<string, { position: [number, number, number]; intensity: number; color: string; distance: number } | null> = {
  volodka_room:       { position: [0, 2.2, -0.5], intensity: 1.05, color: '#62566f', distance: 9 },
  volodka_corridor:   { position: [0, 2.2, 0], intensity: 1.4, color: '#998877', distance: 12 },
  home_evening:       { position: [0, 2.2, 0], intensity: 2.2, color: '#ddaa77', distance: 12 },
  cafe_evening:       { position: [0, 2.5, -1], intensity: 1.75, color: '#aa99cc', distance: 13 },
  office_day:         { position: [0, 2.5, 0], intensity: 2.8, color: '#dde8f8', distance: 16 },
  library_day:        { position: [0, 2.5, 0], intensity: 1.85, color: '#ccaa77', distance: 14 },
  library_basement:   { position: [0, 2.0, -1], intensity: 1.15, color: '#aa8844', distance: 10 },
  abandoned_factory:  { position: [0, 3.0, 0], intensity: 1.45, color: '#cc9966', distance: 16 },
  factory_basement:   { position: [0, 2.4, 0], intensity: 1.35, color: '#668877', distance: 14 },
  zarema_albert_room: { position: [0, 2.2, 0], intensity: 1.65, color: '#aa9977', distance: 12 },
  solnysh_room:       { position: [0, 2.2, 0], intensity: 1.7, color: '#ccaa88', distance: 11 },
  sleep_dream:        { position: [0, 2.4, 0], intensity: 1.5, color: '#8866aa', distance: 14 },
  guild_mainframe:    { position: [0, 2.4, -1], intensity: 1.85, color: '#66ccaa', distance: 11 },
  albert_backroom:    { position: [0, 2.0, -0.5], intensity: 1.75, color: '#ddaa77', distance: 9 },
  underground_bunker: { position: [0, 2.3, -1], intensity: 1.55, color: '#66aa88', distance: 12 },
};
const OUTDOOR_READABILITY_AMBIENT: Record<string, { intensity: number; color: string }> = {
  park_day:         { intensity: 0.14, color: '#8a9888' },
  rooftop_edge:     { intensity: 0.12, color: '#8899aa' },
  river_pier:       { intensity: 0.13, color: '#778899' },
  city_square:      { intensity: 0.13, color: '#6a7890' },
  chk_forest_zorge: { intensity: 0.11, color: '#6a7868' },
  chk_campfire_night: { intensity: 0.14, color: '#5a6858' },
};
const DEFAULT_INDOOR_FILL: NonNullable<typeof INDOOR_FILL[string]> = {
  position: [0, 2.2, 0], intensity: 1.6, color: '#998877', distance: 12,
};

/** Scene-specific point lights rendered from scene config */
function ScenePointLights() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const { preset } = useGraphicsQuality();
  const config = getSceneConfig(sceneId);
  const lights = config.lights ?? [];
  const heroLocalShadowScene =
    sceneId === 'volodka_room' ||
    sceneId === 'street_night' ||
    sceneId === 'city_square' ||
    sceneId === 'cafe_evening' ||
    sceneId === 'abandoned_factory';

  // Shadow quality tiers: low=off, medium=512, high=1024, ultra=2048
  const pointShadowSize = getShadowMapResolution(preset.id as any);

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
          decay={2}
          castShadow={preset.shadows && heroLocalShadowScene && i < 2 && pointShadowSize > 0}
          shadow-mapSize-width={pointShadowSize}
          shadow-mapSize-height={pointShadowSize}
          shadow-bias={SHADOW_BIAS}
          shadow-normalBias={SHADOW_NORMAL_BIAS}
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
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const rendering = resolveSceneRenderingPipeline(
    sceneId,
    preset,
    visualLite,
    selectedPreset,
    isMobile,
  );
  const config = getSceneConfig(sceneId);
  // Shadow quality tiers: low=off (0), medium=512, high=1024, ultra=2048
  const dirShadowRes = isMobile ? 512 : getShadowMapResolution(preset.id as any);
  const shadowSize = dirShadowRes > 0
    ? Math.min(4096, Math.round(dirShadowRes * rendering.shadowMapScale))
    : 0;

  const ambientColor = config.ambientColor ?? '#1a1a2e';
  const ambientIntensity =
    (config.ambientIntensity ?? 1.2) * SCENE_VISIBILITY.ambientScale;
  const groundColor = config.groundColor ?? '#1a1a1a';

  // Different light settings per scene type
  const isIndoor = config.hasCeiling;
  const visualSceneId = resolveDerivedSceneId(sceneId);
  const isNight =
    sceneId === 'street_night'
    || sceneId === 'city_square'
    || sceneId === 'cafe_evening'
    || visualSceneId === 'river_pier';
  const isStreet =
    sceneId === 'street_night'
    || sceneId === 'city_square'
    || sceneId === 'street_winter';
  const isChkForest = sceneId === 'chk_forest_zorge' || sceneId === 'chk_campfire_night';
  const isDream = sceneId === 'sleep_dream';
  const isPier = visualSceneId === 'river_pier';

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
  const outdoorReadability = !isIndoor
    ? (OUTDOOR_READABILITY_AMBIENT[sceneId]
      ?? OUTDOOR_READABILITY_AMBIENT[resolveDerivedSceneId(sceneId)])
    : null;

  // Scene-dimension-aware shadow camera frustum sizing
  const shadowHalfW = Math.max(15, (config.dimensions?.[0] ?? 15) * 0.6);
  const shadowHalfD = Math.max(15, (config.dimensions?.[2] ?? 15) * 0.6);

  return (
    <>
      {/* Main directional light with shadows */}
      <directionalLight
        position={dirPosition}
        intensity={dirIntensity}
        color={dirColor}
        castShadow={preset.shadows && shadowSize > 0}
        shadow-mapSize-width={shadowSize || 512}
        shadow-mapSize-height={shadowSize || 512}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-shadowHalfW}
        shadow-camera-right={shadowHalfW}
        shadow-camera-top={shadowHalfD}
        shadow-camera-bottom={-shadowHalfD}
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

      {sceneId === 'city_square' && (
        <ambientLight intensity={0.4} color="#586878" />
      )}

      {isPier && (
        <ambientLight intensity={0.38} color="#4a5870" />
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
          decay={2}
        />
      )}

      {outdoorReadability && (
        <ambientLight intensity={outdoorReadability.intensity} color={outdoorReadability.color} />
      )}

      {/* Scene-specific point lights from config */}
      <ScenePointLights />

      {/* ── Enhanced scene-specific accent lights ── */}
      <SceneAccentLights sceneId={sceneId} isMobile={isMobile} />

      {/* ── Time-of-day lighting adjustments (outdoor scenes only) ── */}
      <TimeOfDayAdjuster
        timeOfDay={timeOfDay}
        isIndoor={isIndoor}
        baseDirIntensity={dirIntensity}
        baseDirColor={dirColor}
      />
    </>
  );
}

/* ─── Time-of-Day Lighting Adjuster ───
 *  Imperatively adjusts the scene's directional and ambient lights based on
 *  the game clock (0–24). Outdoor scenes get full time-of-day modulation;
 *  indoor scenes get very subtle ambient tint only (artificial lights dominate).
 *
 *  Uses computeTimeOfDayLighting() (pure math, no React) inside useFrameTick
 *  for zero-allocation per-frame updates.
 */
function TimeOfDayAdjuster({
  timeOfDay,
  isIndoor,
  baseDirIntensity,
  baseDirColor,
}: {
  timeOfDay: number;
  isIndoor: boolean;
  baseDirIntensity: number;
  baseDirColor: string;
}) {
  const { scene } = useThree();
  const baseDirCol = useMemo(() => new THREE.Color(baseDirColor), [baseDirColor]);
  const tmpColorRef = useRef(new THREE.Color());
  // How strongly time-of-day modulates the scene (0 = no effect, 1 = full override)
  const todInfluence = isIndoor ? 0.08 : 0.35;
  // Directional light sun position follows time-of-day (outdoor only)
  const sunPosInfluence = isIndoor ? 0 : 1;

  // Pre-compute direction of the sun for shadow position
  const sunAngle = useMemo(() => {
    // Map 0–24h to a rotation: 6h = sunrise (east), 12h = noon (top), 18h = sunset (west)
    const h = ((timeOfDay % 24) + 24) % 24;
    return ((h - 6) / 12) * Math.PI; // 0 at 6am, π at 6pm
  }, [timeOfDay]);

  const sunX = Math.sin(sunAngle) * 10;
  const sunY = Math.max(1, Math.cos(sunAngle) * 10);
  const sunZ = 5;

  useFrameTick('misc', () => {
    if (!scene) return;

    const tod = computeTimeOfDayLighting(timeOfDay);
    const tmpColor = tmpColorRef.current;

    // Find directional light in scene
    for (const obj of scene.children) {
      if (obj instanceof THREE.DirectionalLight) {
        // Modulate intensity: blend base intensity with time-of-day intensity
        obj.intensity = baseDirIntensity * (1 - todInfluence) + tod.dirIntensity * todInfluence;

        // Modulate color: blend base color toward time-of-day color
        tmpColor.setRGB(
          tod.dirColor[0],
          tod.dirColor[1],
          tod.dirColor[2],
        );
        obj.color.copy(baseDirCol).lerp(tmpColor, todInfluence);

        // Adjust sun position for outdoor scenes
        if (sunPosInfluence > 0) {
          obj.position.set(sunX, sunY, sunZ);
        }
        break;
      }
    }

    // For indoor scenes, very subtle ambient tint from time-of-day
    if (isIndoor) {
      for (const obj of scene.children) {
        if (obj instanceof THREE.HemisphereLight) {
          // Very slight color shift — indoor rooms barely notice
          tmpColor.setRGB(tod.ambientColor[0], tod.ambientColor[1], tod.ambientColor[2]);
          // Blend the sky color of the hemisphere light slightly toward tod
          obj.color.lerp(tmpColor, 0.05);
          break;
        }
      }
    }
  });

  return null;
}

/* ─── Scene-specific accent lights ───
 *  Dramatic, per-scene accent point lights for atmosphere:
 *  - Neon color-cycling lights for street_night
 *  - Warm candlelight flicker for home_evening
 *  - Cold blue backlight for guild_mainframe
 *  - Orange industrial light for abandoned_factory
 *  - Personal warm lighting for volodka_room
 */

interface AccentLight {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  /** If true, this light animates (color cycle or flicker) */
  animated?: 'neon_cycle' | 'candle_flicker' | 'cold_pulse';
  /** Quality-gated local shadow for hero practicals only. */
  shadowCaster?: boolean;
}

const SCENE_ACCENT_LIGHTS: Record<string, AccentLight[]> = {
  street_night: [
    { position: [-6, 3, -2], color: '#d88a9c', intensity: 0.95, distance: 10, animated: 'neon_cycle' },
    { position: [5, 3, -3], color: '#8fb8b8', intensity: 0.9, distance: 9, animated: 'neon_cycle' },
    { position: [2, 2.5, 1], color: '#ffaa66', intensity: 1.15, distance: 8, shadowCaster: true },
    { position: [-3, 3.5, -5], color: '#9b86bc', intensity: 0.72, distance: 12, animated: 'neon_cycle' },
    { position: [7, 2.8, 0], color: '#8da8d8', intensity: 0.95, distance: 8, shadowCaster: true },
    { position: [-8, 3, 5], color: '#cf8f96', intensity: 0.82, distance: 10, animated: 'neon_cycle' },
  ],
  city_square: [
    { position: [-8, 3.4, -6], color: '#55e8dd', intensity: 0.95, distance: 14, animated: 'neon_cycle' },
    { position: [8, 3.2, 7], color: '#ff6688', intensity: 0.9, distance: 13, animated: 'neon_cycle' },
    { position: [0, 4.2, 0], color: '#aaccff', intensity: 1.15, distance: 16, shadowCaster: true },
    { position: [-5, 3.0, 5], color: '#9b86bc', intensity: 0.75, distance: 12, animated: 'neon_cycle' },
    { position: [6, 2.8, -4], color: '#ffaa66', intensity: 1.05, distance: 11, shadowCaster: true },
    { position: [-3, 3.6, -8], color: '#8fb8b8', intensity: 0.82, distance: 12, animated: 'cold_pulse' },
  ],
  home_evening: [
    { position: [0.5, 1.8, -0.5], color: '#ff9944', intensity: 2.0, distance: 8, animated: 'candle_flicker' },
    { position: [-1, 1.5, 1], color: '#ffbb66', intensity: 1.2, distance: 6, animated: 'candle_flicker' },
  ],
  cafe_evening: [
    { position: [-3, 2.5, -1], color: '#6688cc', intensity: 1.15, distance: 9, animated: 'cold_pulse', shadowCaster: true },
    { position: [2, 2.2, 2], color: '#5f74aa', intensity: 0.95, distance: 8, animated: 'cold_pulse' },
    { position: [0, 1.5, -3], color: '#ff9966', intensity: 1.0, distance: 6, shadowCaster: true },
  ],
  volodka_corridor: [
    { position: [0, 2.5, 0], color: '#ccaa55', intensity: 1.6, distance: 10, animated: 'candle_flicker' },
    { position: [0, 2.2, -6], color: '#3355aa', intensity: 1.2, distance: 8, animated: 'cold_pulse' },
    { position: [0, 2.2, 6], color: '#223388', intensity: 0.8, distance: 7, animated: 'cold_pulse' },
  ],
  office_day: [
    { position: [0, 2.6, -2], color: '#ccdde8', intensity: 1.2, distance: 14, animated: 'cold_pulse' },
    { position: [3, 2.5, 2], color: '#bbccdd', intensity: 0.8, distance: 12, animated: 'cold_pulse' },
    { position: [-3, 2.5, 2], color: '#aab8cc', intensity: 0.8, distance: 12, animated: 'cold_pulse' },
  ],
  library_day: [
    { position: [0, 1.8, -2], color: '#ddaa55', intensity: 1.5, distance: 8, animated: 'candle_flicker' },
    { position: [2, 2.2, 0], color: '#cc9944', intensity: 0.8, distance: 7, animated: 'candle_flicker' },
    { position: [-2.2, 2.0, 1.5], color: '#8899aa', intensity: 0.55, distance: 9, animated: 'cold_pulse' }, // window cool fill
  ],
  park_day: [
    { position: [2, 4, -1], color: '#ffdd88', intensity: 1.6, distance: 14 },
    { position: [-3, 3.5, 2], color: '#ffcc77', intensity: 1.2, distance: 12 },
    { position: [0, 2.5, -4], color: '#eebb66', intensity: 0.9, distance: 10 },
    { position: [-1.5, 1.8, 3], color: '#889988', intensity: 0.45, distance: 9, animated: 'cold_pulse' }, // canopy cool fill
  ],
  guild_mainframe: [
    { position: [-3, 2, -2], color: '#22aadd', intensity: 2.2, distance: 10, animated: 'cold_pulse' },
    { position: [3, 2, -4], color: '#44ddff', intensity: 2.0, distance: 9, animated: 'cold_pulse' },
    { position: [0, 3, 0], color: '#1188cc', intensity: 1.6, distance: 12 },
    { position: [0, 2.2, -5.2], color: '#00ffaa', intensity: 1.4, distance: 8, animated: 'cold_pulse' },
  ],
  abandoned_factory: [
    { position: [-2, 2.5, 2], color: '#ff8833', intensity: 2.4, distance: 12, animated: 'candle_flicker', shadowCaster: true },
    { position: [4, 2, -3], color: '#dd6622', intensity: 1.7, distance: 10, animated: 'candle_flicker' },
    { position: [0, 3, -4], color: '#ffaa44', intensity: 1.4, distance: 8, animated: 'candle_flicker' },
    { position: [-2, 1.8, -3.5], color: '#22aa66', intensity: 0.9, distance: 6, animated: 'cold_pulse' },
  ],
  volodka_room: [
    { position: [1.2, 1.4, -2.5], color: '#5a9a88', intensity: 0.75, distance: 5.5, animated: 'cold_pulse' },  // monitor phosphor (filmic, not candy)
    { position: [1.98, 1.6, 2.16], color: '#ffcc88', intensity: 0.72, distance: 4.5, animated: 'candle_flicker', shadowCaster: true }, // bedside lamp (above the bedside nightstand GLB at [1.98, 0.52, 2.16])
    { position: [0, 0.3, -2.5], color: '#ff9944', intensity: 0.35, distance: 3 },     // under-desk warm glow
    { position: [2.3, 0.2, 1.0], color: '#334488', intensity: 0.3, distance: 4 },    // floor-level cold bounce from window wall
  ],
  factory_basement: [
    { position: [0, 2.4, -5], color: '#22ff88', intensity: 2.0, distance: 10, shadowCaster: true }, // Zarya-M practical
    { position: [2, 2, -2], color: '#44ffaa', intensity: 1.2, distance: 7 },
    { position: [-2.5, 2.1, -3.5], color: '#33cc88', intensity: 0.85, distance: 6, animated: 'cold_pulse' },
    { position: [0, 0.4, -3.2], color: '#116644', intensity: 0.4, distance: 4 }, // floor bounce under monolith
  ],
  rooftop_edge: [
    { position: [-3, 3, 0], color: '#ff8844', intensity: 1.8, distance: 14, shadowCaster: true }, // sunset warm + ground contact
    { position: [4, 2.5, -2], color: '#ff6633', intensity: 1.4, distance: 12 },        // distant city reflection
    { position: [0, 2, 3], color: '#ffaa66', intensity: 1.0, distance: 10 },         // ambient warmth
  ],
  // factory_roof denser industrial spill (own row — does not fall through to rooftop_edge)
  factory_roof: [
    { position: [-3, 3, 0], color: '#ff7744', intensity: 1.9, distance: 14, shadowCaster: true },
    { position: [4, 2.5, -2], color: '#ff5522', intensity: 1.35, distance: 12 },
    { position: [0, 2, 3], color: '#ff9944', intensity: 1.05, distance: 10 },
    { position: [2, 1.2, -1], color: '#88aacc', intensity: 0.55, distance: 8, animated: 'cold_pulse' },
  ],
  river_pier: [
    { position: [0, 1.5, -1], color: '#ff9944', intensity: 2.0, distance: 8, animated: 'candle_flicker', shadowCaster: true },
    { position: [3, 2.5, 0], color: '#ffbb55', intensity: 1.25, distance: 11 },
    { position: [-2, 2, 1], color: '#ffcc66', intensity: 0.85, distance: 9 },
    { position: [5, 3.2, -8], color: '#8aa0c0', intensity: 0.7, distance: 14, animated: 'cold_pulse' },
    { position: [-4, 2.4, -3], color: '#ffaa66', intensity: 0.95, distance: 10, animated: 'candle_flicker' },
  ],
  // pier_evening inherits via resolveDerivedSceneId fallback in SceneAccentLights
  solnysh_room: [
    { position: [0, 1.6, 0], color: '#ffcc88', intensity: 1.5, distance: 7, animated: 'candle_flicker' },  // table lamp
    { position: [-1, 1.2, 1], color: '#ffbb77', intensity: 1.0, distance: 5, animated: 'candle_flicker' },  // corner lamp
  ],
  zarema_albert_room: [
    { position: [0, 2, -1], color: '#ffbb77', intensity: 1.4, distance: 8 },       // warm overhead
    { position: [1, 1.5, 1], color: '#ffaa55', intensity: 0.8, distance: 6, animated: 'candle_flicker' },  // desk lamp
  ],
  battle: [
    { position: [0, 3, 0], color: '#ff6633', intensity: 2.5, distance: 16, animated: 'candle_flicker' },   // central conflict glow
    { position: [-4, 2, -3], color: '#ff4422', intensity: 1.5, distance: 12 },      // peripheral danger
    { position: [5, 2.5, 2], color: '#ff8844', intensity: 1.2, distance: 10 },       // secondary accent
  ],
  street_winter: [
    { position: [-2, 3, -1], color: '#ccddff', intensity: 1.2, distance: 12 },      // cold moonlight
    { position: [3, 2.5, 0], color: '#aabbdd', intensity: 0.8, distance: 10 },       // snow-reflected fill
    { position: [0, 1.8, 2], color: '#ffddaa', intensity: 0.6, distance: 8 },        // distant window warmth
  ],
  chk_campfire_night: [
    { position: [0, 1.2, 0], color: '#ff8833', intensity: 2.5, distance: 8, animated: 'candle_flicker' },  // campfire
    { position: [0, 2.5, 0], color: '#ff6622', intensity: 1.2, distance: 14, animated: 'candle_flicker' },  // fire uplight
    { position: [2, 1.5, 1], color: '#ffaa44', intensity: 0.6, distance: 6 },        // peripheral warmth
  ],
  albert_backroom: [
    { position: [0, 2, -0.5], color: '#ddaa55', intensity: 1.4, distance: 8, animated: 'candle_flicker' }, // desk lamp
    { position: [-1, 1.5, 1], color: '#cc9944', intensity: 0.8, distance: 6 },       // ambient fill
    { position: [2.2, 1.8, 0], color: '#ff4499', intensity: 0.7, distance: 5, animated: 'neon_cycle' },
  ],
  underground_bunker: [
    { position: [0, 2.2, -4], color: '#44ff88', intensity: 1.8, distance: 11, animated: 'cold_pulse' },
    { position: [-4, 2.0, 2], color: '#ff5544', intensity: 1.1, distance: 9, animated: 'candle_flicker' },
    { position: [3.5, 1.8, 3], color: '#6688aa', intensity: 0.8, distance: 8 },
  ],
  sleep_dream: [
    { position: [0, 2, 0], color: '#aa66ff', intensity: 1.8, distance: 14, animated: 'cold_pulse' },    // dream pulse
    { position: [-3, 1.5, -2], color: '#8844dd', intensity: 1.2, distance: 10, animated: 'cold_pulse' },   // side dream glow
    { position: [2, 3, 1], color: '#cc88ff', intensity: 1.0, distance: 12, animated: 'cold_pulse' },     // floating orb
  ],
};

function SceneAccentLights({ sceneId, isMobile }: { sceneId: string; isMobile: boolean }) {
  const { preset } = useGraphicsQuality();
  // Variant scenes (pier_evening → river_pier, factory_roof → rooftop_edge, …)
  // share parent accents unless they define their own row.
  const lights =
    SCENE_ACCENT_LIGHTS[sceneId]
    ?? SCENE_ACCENT_LIGHTS[resolveDerivedSceneId(sceneId as SceneId)];
  if (!lights) return null;

  // Shadow quality tier for accent lights
  const accentShadowRes = getShadowMapResolution(preset.id as any);

  // On mobile, limit accent lights to prevent performance issues
  const effectiveLights = isMobile ? lights.slice(0, 2) : lights;

  return (
    <>
      {effectiveLights.map((light, i) => {
        const castShadow = preset.shadows && !isMobile && light.shadowCaster === true;
        if (light.animated) {
          return (
            <AnimatedAccentLight
              key={`accent-${sceneId}-${i}`}
              config={light}
              seed={i * 997}
              castShadow={castShadow}
              shadowRes={accentShadowRes}
            />
          );
        }
        return (
          <pointLight
            key={`accent-${sceneId}-${i}`}
            position={light.position}
            intensity={light.intensity}
            color={light.color}
            distance={light.distance}
            decay={2}
            castShadow={castShadow}
            shadow-mapSize-width={accentShadowRes}
            shadow-mapSize-height={accentShadowRes}
            shadow-bias={SHADOW_BIAS}
            shadow-normalBias={SHADOW_NORMAL_BIAS}
          />
        );
      })}
    </>
  );
}

/** Animated accent light with neon color cycling, candle flicker, or cold pulse */
function AnimatedAccentLight({ config, seed, castShadow, shadowRes = 512 }: { config: AccentLight; seed: number; castShadow: boolean; shadowRes?: number }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const baseColor = useMemo(() => new THREE.Color(config.color), [config.color]);

  useFrameTick('postfx', ({ delta }) => {
    if (!lightRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    switch (config.animated) {
      case 'neon_cycle': {
        // Slowly cycle hue while maintaining saturation and lightness
        const hueShift = (Math.sin(t * 0.15 + seed * 0.1) * 0.08);
        const hsl = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(hsl);
        lightRef.current.color.setHSL(
          (hsl.h + hueShift + 1) % 1,
          hsl.s,
          hsl.l,
        );
        // Subtle intensity pulsing
        lightRef.current.intensity = config.intensity * (0.85 + 0.15 * Math.sin(t * 0.4 + seed));
        break;
      }
      case 'candle_flicker': {
        // Warm organic flicker — multiple sine waves at different frequencies
        const flicker =
          0.7
          + 0.15 * Math.sin(t * 3.7 + seed)
          + 0.1 * Math.sin(t * 7.3 + seed * 2)
          + 0.05 * Math.sin(t * 13.1 + seed * 3);
        lightRef.current.intensity = config.intensity * flicker;
        // Subtle color temperature shift (warmer when dimmer)
        const warmth = 1 - (flicker - 0.7) * 0.3;
        lightRef.current.color.setRGB(
          Math.min(1, baseColor.r * warmth * 1.1),
          Math.min(1, baseColor.g * warmth * 0.9),
          Math.min(1, baseColor.b * warmth * 0.7),
        );
        break;
      }
      case 'cold_pulse': {
        // Slow cold pulse — server room data flow feeling
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.3 + seed);
        lightRef.current.intensity = config.intensity * pulse;
        // Slight color shift between blue-green and pure blue
        const blueShift = Math.sin(t * 0.2 + seed * 0.5) * 0.1;
        lightRef.current.color.setRGB(
          Math.max(0, baseColor.r - blueShift * 0.5),
          Math.max(0, baseColor.g + blueShift * 0.3),
          Math.min(1, baseColor.b + blueShift),
        );
        break;
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={config.position}
      intensity={config.intensity}
      color={config.color}
      distance={config.distance}
      decay={2}
      castShadow={castShadow}
      shadow-mapSize-width={shadowRes}
      shadow-mapSize-height={shadowRes}
      shadow-bias={SHADOW_BIAS}
      shadow-normalBias={SHADOW_NORMAL_BIAS}
    />
  );
}
