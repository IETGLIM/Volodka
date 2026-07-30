
/* ─── Volodka RPG – Scene environment (fog, background, env map, animated fog) ─── */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import * as THREE from 'three';
import { liftHexColor, SCENE_VISIBILITY } from '@/shared/constants/sceneVisibility';
import { ENV_MAP_WARMUP_FRAMES } from '@/shared/constants/transitionTimings';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import type { QualityPresetId } from '@/engine/graphics/qualityPresets';
import { isHeroScene } from '@/config/sceneVisualProfiles';
import { VolumetricLightShafts } from './VolumetricLightShaft';
import { HeroEnvironment } from './HeroEnvironment';
import { usesPhotographicHdriBackground } from '@/config/polyhavenAssets';

/** Per-scene fog color overrides matching style pillars:
 *  Noir, CyberPunk2077, Gothic, Dark Fantasy, Glitch, MatrixRain
 *
 *  Indoor scenes use tighter fog (lower near) for claustrophobic feel,
 *  outdoor scenes use distant fog for depth.
 *  Fog color should be DARKER than the room's brightest surfaces to
 *  create depth without swallowing the scene. */
const SCENE_FOG_COLORS: Record<string, string> = {
  // ─── Noir / Cyberpunk ───
  volodka_room:       '#0c1018', // deep blue-black — monitor glow pierces this
  volodka_corridor:   '#0c101c', // rainy blue-black — dim corridor at night
  home_evening:       '#1a1208', // dark warm amber — kitchen at night
  cafe_evening:       '#0c1020', // deep blue-black — hazy café with blue neon

  // ─── CyberPunk2077 ───
  street_night:       '#323448', // gray rainy night haze
  procedural_aaa:     '#2a3048',

  // ─── Gothic ───
  park_day:           '#2a3828', // misty green-gray (Gothic forest)
  abandoned_factory:  '#1a1008', // dark rust (Gothic industrial)
  factory_basement:   '#0a1410', // machine-core green-black

  // ─── Bank / IT Support ───
  office_day:         '#c8d4e0', // sterile blue-white
  guild_mainframe:    '#081820', // cold teal server-rack haze

  // ─── Dark Fantasy ───
  sleep_dream:        '#100828', // deep purple fog (Dark Fantasy dreamscape)
  battle:             '#180808', // dark blood (Dark Fantasy combat)

  // ─── Noir ───
  rooftop_edge:       '#1a1008', // dark orange haze (Noir skyline)

  // ─── Desolate ───
  street_winter:      '#8090a8', // cold blue-gray
  library_day:        '#2a2018', // dark aged paper
  zarema_albert_room: '#181008', // dark warm domestic

  // ─── CHK forest ───
  chk_forest_zorge:   '#142018', // dark pine night mist

  // ─── Thin / outdoor hubs (visualSceneId roots) ───
  river_pier:         '#1a2830', // cold water mist vs warm pier lights
  solnysh_room:       '#1a140c', // warm domestic dusk
};

/** Background colors (deeper than fog for atmospheric depth).
 *  Indoor rooms: very dark to simulate unlit corners / ceiling void. */
const SCENE_BG_COLORS: Record<string, string> = {
  volodka_room:       '#080c14',  // very dark blue-black
  volodka_corridor:   '#060a14',  // near-black
  home_evening:       '#120c04',  // dark amber
  cafe_evening:       '#080c18',  // dark blue-black
  street_night:       '#1a1a2c',  // gray rainy night sky
  procedural_aaa:     '#121820',
  park_day:           '#101810',
  abandoned_factory:  '#100804',
  factory_basement:   '#060a08',
  office_day:         '#b0bcc8',
  guild_mainframe:    '#040c10',
  sleep_dream:        '#060210',
  battle:             '#0a0202',
  rooftop_edge:       '#100804',
  street_winter:      '#7080a0',
  library_day:        '#1a1408',
  zarema_albert_room: '#100a04',
  chk_forest_zorge:   '#0c1810',
  river_pier:         '#0e1820',
  solnysh_room:       '#100c06',
};

/** Per-scene fog animation parameters */
interface FogAnimConfig {
  /** Pulse frequency in Hz (0 = no animation) */
  pulseFreq: number;
  /** Pulse amplitude — how much fog near/far shifts as fraction of base (0–0.5) */
  nearAmplitude: number;
  farAmplitude: number;
  /** Optional slow color shift — fog color oscillates between base and this color */
  altFogColor?: string;
  /** Color shift blend amplitude (0–1) */
  colorShiftAmp: number;
}

const SCENE_FOG_ANIM: Record<string, FogAnimConfig> = {
  volodka_room:       { pulseFreq: 0.08, nearAmplitude: 0.05, farAmplitude: 0.03, altFogColor: '#0a1015', colorShiftAmp: 0.15 },
  volodka_corridor:   { pulseFreq: 0.06, nearAmplitude: 0.1, farAmplitude: 0.06, altFogColor: '#101828', colorShiftAmp: 0.22 },
  home_evening:       { pulseFreq: 0.06, nearAmplitude: 0.04, farAmplitude: 0.02, colorShiftAmp: 0 },
  street_night:       { pulseFreq: 0.05, nearAmplitude: 0.06, farAmplitude: 0.04, altFogColor: '#404458', colorShiftAmp: 0.18 },
  cafe_evening:       { pulseFreq: 0.07, nearAmplitude: 0.05, farAmplitude: 0.03, altFogColor: '#0d0818', colorShiftAmp: 0.15 },
  office_day:         { pulseFreq: 0.03, nearAmplitude: 0.02, farAmplitude: 0.01, altFogColor: '#b8c8dc', colorShiftAmp: 0.08 },
  guild_mainframe:    { pulseFreq: 0.05, nearAmplitude: 0.06, farAmplitude: 0.04, altFogColor: '#0a2830', colorShiftAmp: 0.14 },
  library_day:        { pulseFreq: 0.02, nearAmplitude: 0.03, farAmplitude: 0.02, altFogColor: '#1a1810', colorShiftAmp: 0.06 },
  park_day:           { pulseFreq: 0.04, nearAmplitude: 0.12, farAmplitude: 0.1,  altFogColor: '#1a2a18', colorShiftAmp: 0.3 },
  battle:             { pulseFreq: 0.3,  nearAmplitude: 0.15, farAmplitude: 0.1,  altFogColor: '#200505', colorShiftAmp: 0.3 },
  sleep_dream:        { pulseFreq: 0.02, nearAmplitude: 0.2,  farAmplitude: 0.15, altFogColor: '#100830', colorShiftAmp: 0.4 },
  rooftop_edge:       { pulseFreq: 0.06, nearAmplitude: 0.08, farAmplitude: 0.06, altFogColor: '#1a1008', colorShiftAmp: 0.2 },
  abandoned_factory:  { pulseFreq: 0.08, nearAmplitude: 0.12, farAmplitude: 0.1, altFogColor: '#1a1205', colorShiftAmp: 0.22 },
  factory_basement:   { pulseFreq: 0.06, nearAmplitude: 0.1, farAmplitude: 0.08, altFogColor: '#102018', colorShiftAmp: 0.2 },
  street_winter:      { pulseFreq: 0.04, nearAmplitude: 0.1,  farAmplitude: 0.08, altFogColor: '#90a0b8', colorShiftAmp: 0.15 },
  zarema_albert_room: { pulseFreq: 0.05, nearAmplitude: 0.03, farAmplitude: 0.02, colorShiftAmp: 0 },
  chk_forest_zorge:   { pulseFreq: 0.03, nearAmplitude: 0.1, farAmplitude: 0.08, altFogColor: '#1a3020', colorShiftAmp: 0.2 },
};

const DEFAULT_FOG_ANIM: FogAnimConfig = { pulseFreq: 0.05, nearAmplitude: 0.05, farAmplitude: 0.03, colorShiftAmp: 0 };

/** Outdoor scenes that use exponential squared fog (FogExp2) for cinematic
 *  depth perception. Density is tuned per-scene — subtle enough to not
 *  obscure gameplay but adds atmospheric distance fade.
 *  Replaces the linear <fog> attach for these scenes only. */
const OUTDOOR_EXP_FOG_DENSITY: Record<string, number> = {
  park_day:         0.018,  // subtle forest mist
  rooftop_edge:     0.020,  // city haze at sunset
  river_pier:       0.022,  // water mist over the river
  chk_forest_zorge: 0.020,  // forest depth
  street_night:     0.020,  // rain haze
  procedural_aaa:   0.024,
  street_winter:    0.015,  // cold crisp air (less fog)
};

const DEFAULT_OUTDOOR_EXP_FOG_DENSITY = 0.018;

function isOutdoorExpFogScene(sceneId: string): boolean {
  return sceneId in OUTDOOR_EXP_FOG_DENSITY;
}

/** Optimized scene environment: fog, background, environment preset, animated fog */
export function SceneEnvironment() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const visualSceneId = resolveDerivedSceneId(sceneId);
  const config = getSceneConfig(sceneId);
  const { preset } = useGraphicsQuality();
  const [envMapReady, setEnvMapReady] = useState(false);
  const envWarmupFrames = useRef(0);

  const isIndoor = config.hasCeiling;
  const heroScene = isHeroScene(visualSceneId);
  // Outdoor IBL on medium+; indoor hero IBL on high/ultra for rich indirect bounce
  // without the plastic flat-ambient look of rooms lit only by point lights.
  const enableEnvMap =
    !preset.visualLite
    && (
      !isIndoor
      || (heroScene && (preset.id === 'high' || preset.id === 'ultra'))
    );

  useEffect(() => {
    envWarmupFrames.current = 0;
    // Hero scenes need IBL/env presence before the first readable frame; keep
    // delayed warmup only for secondary scenes where local lights are enough.
    setEnvMapReady(enableEnvMap && heroScene);
  }, [sceneId, enableEnvMap, heroScene]);

  useFrameTick('misc', () => {
    if (!enableEnvMap || envMapReady) return;
    envWarmupFrames.current += 1;
    if (envWarmupFrames.current >= ENV_MAP_WARMUP_FRAMES) {
      setEnvMapReady(true);
    }
  });

  const fogRef = useRef<THREE.Fog>(null);
  const fogExpRef = useRef<THREE.FogExp2>(null);
  const timeRef = useRef(0);

  const fogNear = config.fogNear ?? 5;
  const fogFar = config.fogFar ?? 20;

  // Part 5: Outdoor scenes use FogExp2 for cinematic depth perception.
  const useExpFog = isOutdoorExpFogScene(visualSceneId);
  const expFogDensity = useExpFog
    ? (OUTDOOR_EXP_FOG_DENSITY[visualSceneId] ?? DEFAULT_OUTDOOR_EXP_FOG_DENSITY)
    : 0;

  // Use style-pillar-matched fog colors, fall back to scene config ambient
  const fogColor = liftHexColor(
    config.fog?.fogColor ?? SCENE_FOG_COLORS[visualSceneId] ?? config.ambientColor ?? '#1a1a2e',
    SCENE_VISIBILITY.fogColorLift,
  );
  const bgColor = liftHexColor(
    SCENE_BG_COLORS[visualSceneId] ?? fogColor,
    SCENE_VISIBILITY.fogColorLift * 0.85,
  );

  // Indoor fog: tight near/far for claustrophobic depth, but far enough
  // to not swallow the room. Small rooms (5x7) need fogFar ~1.5x max dimension.
  // Outdoor fog: spread far for depth and atmosphere.
  let effectiveFogNear: number;
  let effectiveFogFar: number;
  if (isIndoor) {
    effectiveFogNear = Math.max(fogNear * SCENE_VISIBILITY.fogNearScale, 4);
    effectiveFogFar = Math.max(fogFar * SCENE_VISIBILITY.fogFarScale, 12);
  } else {
    effectiveFogNear = fogNear * SCENE_VISIBILITY.fogNearScale;
    effectiveFogFar = fogFar * SCENE_VISIBILITY.fogFarScale;
  }

  // Choose environment preset based on scene
  const envPreset = getEnvPreset(visualSceneId);
  const envIntensity = getEnvironmentIntensity(visualSceneId, heroScene, preset.id, isIndoor);

  // Fog animation config
  const fogAnim = SCENE_FOG_ANIM[visualSceneId] ?? DEFAULT_FOG_ANIM;

  // Pre-compute fog color and alternate color as THREE.Color for blending
  const baseFogColor = useMemo(() => new THREE.Color(fogColor), [fogColor]);
  const altFogColor = useMemo(() => {
    if (fogAnim.altFogColor) {
      return new THREE.Color(fogAnim.altFogColor);
    }
    return baseFogColor.clone();
  }, [fogAnim.altFogColor, baseFogColor]);

  // Temp color for blending (avoid allocation in useFrame)
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Animated fog: pulsing density and optional color shift
  useFrameTick('weather', ({ delta }) => {
    if (fogAnim.pulseFreq <= 0) return;

    timeRef.current += delta;
    const time = timeRef.current;
    const pulse = Math.sin(time * fogAnim.pulseFreq * Math.PI * 2);

    // Linear fog: pulse near/far
    if (fogRef.current) {
      fogRef.current.near = effectiveFogNear + pulse * effectiveFogNear * fogAnim.nearAmplitude;
      fogRef.current.far = effectiveFogFar + pulse * effectiveFogFar * fogAnim.farAmplitude;
    }

    // Exp2 fog: pulse density (subtle — keeps depth perception stable)
    if (fogExpRef.current) {
      const densityPulse = 1 + pulse * 0.08; // ±8% density modulation
      fogExpRef.current.density = expFogDensity * densityPulse;
    }

    // Fog color shift (both fog types share the same color)
    const activeFog = fogRef.current ?? fogExpRef.current;
    if (activeFog && fogAnim.colorShiftAmp > 0 && fogAnim.altFogColor) {
      const blend = (pulse * fogAnim.colorShiftAmp + fogAnim.colorShiftAmp) / 2; // 0 to colorShiftAmp
      tempColor.copy(baseFogColor).lerp(altFogColor, blend);
      activeFog.color.copy(tempColor);
    }
  });

  return (
    <>
      {/* Fog — style-pillar-matched colors, reduced density for indoor scenes, animated pulsing.
          Outdoor scenes use FogExp2 for cinematic depth (Part 5); indoor scenes keep linear fog. */}
      {useExpFog ? (
        <fogExp2 ref={fogExpRef} attach="fog" args={[fogColor, expFogDensity]} />
      ) : (
        <fog ref={fogRef} attach="fog" args={[fogColor, effectiveFogNear, effectiveFogFar]} />
      )}

      {/* Solid bg — skipped when photographic HDRI is the sky */}
      {!usesPhotographicHdriBackground(visualSceneId) ? (
        <color attach="background" args={[bgColor]} />
      ) : null}

      {/* Environment map — custom hero bake when available; stock preset otherwise */}
      {enableEnvMap && envMapReady && (
        <HeroEnvironment
          sceneId={visualSceneId}
          intensity={envIntensity}
          fallbackPreset={envPreset}
        />
      )}

      {/* Volumetric light shafts — cone-shaped god rays for window-lit scenes.
          Quality-gated: high/ultra only, mobile caps at 2, disabled in reduced motion. */}
      <VolumetricLightShafts sceneId={sceneId} />
    </>
  );
}

function getEnvironmentIntensity(
  sceneId: string,
  heroScene: boolean,
  presetId: Exclude<QualityPresetId, 'auto'>,
  isIndoor: boolean,
): number {
  const ultraBoost = presetId === 'ultra' ? 0.06 : 0;
  if (isIndoor) {
    // Keep indoor IBL subtle so local lamps/monitor remain the hero light.
    if (sceneId === 'volodka_room') {
      return presetId === 'ultra' ? 0.32 : 0.26;
    }
    return presetId === 'ultra' ? 0.34 : 0.28;
  }
  if (sceneId === 'street_night') {
    return presetId === 'ultra' ? 0.62 : 0.52;
  }
  if (sceneId === 'cafe_evening' || sceneId === 'city_square') {
    return presetId === 'ultra' ? 0.48 : 0.4;
  }
  if (heroScene) {
    return presetId === 'ultra' ? 0.42 + ultraBoost : 0.36;
  }
  return presetId === 'ultra' ? 0.38 : 0.3;
}

type EnvPresetName =
  | 'night'
  | 'dawn'
  | 'sunset'
  | 'city'
  | 'park'
  | 'warehouse'
  | 'forest'
  | 'apartment'
  | 'lobby';

function getEnvPreset(sceneId: string): EnvPresetName {
  switch (sceneId) {
    case 'street_night':
      return 'night';
    case 'street_winter':
      return 'dawn';
    case 'park_day':
    case 'chk_forest_zorge':
    case 'chk_campfire_night':
      return 'forest';
    case 'office_day':
    case 'abandoned_factory':
    case 'factory_basement':
    case 'guild_mainframe':
    case 'underground_bunker':
      return 'warehouse';
    case 'rooftop_edge':
    case 'pier_evening':
    case 'river_pier':
      return 'sunset';
    case 'sleep_dream':
      return 'night';
    case 'volodka_room':
    case 'volodka_corridor':
    case 'home_evening':
    case 'solnysh_room':
    case 'zarema_albert_room':
    case 'zarema_room':
    case 'albert_backroom':
      return 'apartment';
    case 'cafe_evening':
    case 'library_day':
    case 'library_basement':
      return 'lobby';
    case 'city_square':
      return 'city';
    default:
      return 'city';
  }
}
