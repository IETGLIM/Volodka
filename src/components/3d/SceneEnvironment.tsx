'use client';

/* ─── Volodka RPG – Scene environment (fog, background, env map, animated fog) ─── */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

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
  volodka_corridor:   '#0a0e18', // near-black blue — dim corridor at night
  home_evening:       '#1a1208', // dark warm amber — kitchen at night
  cafe_evening:       '#0c1020', // deep blue-black — hazy café with blue neon

  // ─── CyberPunk2077 ───
  street_night:       '#080418', // deep purple-black — neon streets

  // ─── Gothic ───
  park_day:           '#2a3828', // misty green-gray (Gothic forest)
  abandoned_factory:  '#1a1008', // dark rust (Gothic industrial)

  // ─── Bank / IT Support ───
  office_day:         '#c8d4e0', // sterile blue-white

  // ─── Dark Fantasy ───
  sleep_dream:        '#100828', // deep purple fog (Dark Fantasy dreamscape)
  battle:             '#180808', // dark blood (Dark Fantasy combat)

  // ─── Noir ───
  rooftop_edge:       '#1a1008', // dark orange haze (Noir skyline)

  // ─── Desolate ───
  street_winter:      '#8090a8', // cold blue-gray
  library_day:        '#2a2018', // dark aged paper
  zarema_albert_room: '#181008', // dark warm domestic
};

/** Background colors (deeper than fog for atmospheric depth).
 *  Indoor rooms: very dark to simulate unlit corners / ceiling void. */
const SCENE_BG_COLORS: Record<string, string> = {
  volodka_room:       '#080c14',  // very dark blue-black
  volodka_corridor:   '#060a14',  // near-black
  home_evening:       '#120c04',  // dark amber
  cafe_evening:       '#080c18',  // dark blue-black
  street_night:       '#040210',  // near-black purple
  park_day:           '#101810',
  abandoned_factory:  '#100804',
  office_day:         '#b0bcc8',
  sleep_dream:        '#060210',
  battle:             '#0a0202',
  rooftop_edge:       '#100804',
  street_winter:      '#7080a0',
  library_day:        '#1a1408',
  zarema_albert_room: '#100a04',
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
  volodka_corridor:   { pulseFreq: 0.05, nearAmplitude: 0.08, farAmplitude: 0.05, altFogColor: '#080d18', colorShiftAmp: 0.2 },
  home_evening:       { pulseFreq: 0.06, nearAmplitude: 0.04, farAmplitude: 0.02, colorShiftAmp: 0 },
  street_night:       { pulseFreq: 0.1,  nearAmplitude: 0.1,  farAmplitude: 0.08, altFogColor: '#0a001a', colorShiftAmp: 0.25 },
  cafe_evening:       { pulseFreq: 0.07, nearAmplitude: 0.05, farAmplitude: 0.03, altFogColor: '#0d0818', colorShiftAmp: 0.15 },
  office_day:         { pulseFreq: 0.03, nearAmplitude: 0.02, farAmplitude: 0.01, colorShiftAmp: 0 },
  park_day:           { pulseFreq: 0.04, nearAmplitude: 0.12, farAmplitude: 0.1,  altFogColor: '#1a2a18', colorShiftAmp: 0.3 },
  library_day:        { pulseFreq: 0.02, nearAmplitude: 0.03, farAmplitude: 0.02, colorShiftAmp: 0 },
  battle:             { pulseFreq: 0.3,  nearAmplitude: 0.15, farAmplitude: 0.1,  altFogColor: '#200505', colorShiftAmp: 0.3 },
  sleep_dream:        { pulseFreq: 0.02, nearAmplitude: 0.2,  farAmplitude: 0.15, altFogColor: '#100830', colorShiftAmp: 0.4 },
  rooftop_edge:       { pulseFreq: 0.06, nearAmplitude: 0.08, farAmplitude: 0.06, altFogColor: '#1a1008', colorShiftAmp: 0.2 },
  abandoned_factory:  { pulseFreq: 0.08, nearAmplitude: 0.1,  farAmplitude: 0.08, altFogColor: '#1a1205', colorShiftAmp: 0.2 },
  street_winter:      { pulseFreq: 0.04, nearAmplitude: 0.1,  farAmplitude: 0.08, altFogColor: '#90a0b8', colorShiftAmp: 0.15 },
  zarema_albert_room: { pulseFreq: 0.05, nearAmplitude: 0.03, farAmplitude: 0.02, colorShiftAmp: 0 },
};

const DEFAULT_FOG_ANIM: FogAnimConfig = { pulseFreq: 0.05, nearAmplitude: 0.05, farAmplitude: 0.03, colorShiftAmp: 0 };

/** Optimized scene environment: fog, background, environment preset, animated fog */
export function SceneEnvironment() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const config = getSceneConfig(sceneId);

  const fogRef = useRef<THREE.Fog>(null);
  const timeRef = useRef(0);

  const fogNear = config.fogNear ?? 5;
  const fogFar = config.fogFar ?? 20;
  const isIndoor = config.hasCeiling;

  // Use style-pillar-matched fog colors, fall back to scene config ambient
  const fogColor = SCENE_FOG_COLORS[sceneId] ?? config.ambientColor ?? '#1a1a2e';
  const bgColor = SCENE_BG_COLORS[sceneId] ?? fogColor;

  // Indoor fog: tight near/far for claustrophobic depth, but far enough
  // to not swallow the room. Small rooms (5x7) need fogFar ~1.5x max dimension.
  // Outdoor fog: spread far for depth and atmosphere.
  let effectiveFogNear: number;
  let effectiveFogFar: number;
  if (isIndoor) {
    // Indoor: use scene config values directly (they're already tuned per-room)
    // but clamp so fog doesn't start inside the camera's near plane
    effectiveFogNear = Math.max(fogNear, 3);
    effectiveFogFar = Math.max(fogFar, 8);
  } else {
    effectiveFogNear = fogNear;
    effectiveFogFar = fogFar;
  }

  // Choose environment preset based on scene
  const envPreset = getEnvPreset(sceneId);

  // Fog animation config
  const fogAnim = SCENE_FOG_ANIM[sceneId] ?? DEFAULT_FOG_ANIM;

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
  useFrame((_, delta) => {
    if (!fogRef.current || fogAnim.pulseFreq <= 0) return;

    timeRef.current += delta;
    const time = timeRef.current;

    // Pulsing fog near/far
    const pulse = Math.sin(time * fogAnim.pulseFreq * Math.PI * 2);
    fogRef.current.near = effectiveFogNear + pulse * effectiveFogNear * fogAnim.nearAmplitude;
    fogRef.current.far = effectiveFogFar + pulse * effectiveFogFar * fogAnim.farAmplitude;

    // Fog color shift
    if (fogAnim.colorShiftAmp > 0 && fogAnim.altFogColor) {
      const blend = (pulse * fogAnim.colorShiftAmp + fogAnim.colorShiftAmp) / 2; // 0 to colorShiftAmp
      tempColor.copy(baseFogColor).lerp(altFogColor, blend);
      fogRef.current.color.copy(tempColor);
    }
  });

  return (
    <>
      {/* Fog — style-pillar-matched colors, reduced density for indoor scenes, animated pulsing */}
      <fog ref={fogRef} attach="fog" args={[fogColor, effectiveFogNear, effectiveFogFar]} />

      {/* Background color — deeper than fog for atmospheric depth */}
      <color attach="background" args={[bgColor]} />

      {/* Environment map for reflections */}
      {!isIndoor && (
        <Environment
          preset={envPreset}
          background={false}
          environmentIntensity={0.3}
        />
      )}
    </>
  );
}

function getEnvPreset(sceneId: string): 'night' | 'dawn' | 'sunset' | 'city' | 'park' | 'warehouse' | 'forest' {
  switch (sceneId) {
    case 'street_night':
      return 'night';
    case 'street_winter':
      return 'dawn';
    case 'park_day':
      return 'forest';
    case 'office_day':
      return 'warehouse';
    case 'abandoned_factory':
      return 'warehouse';
    case 'rooftop_edge':
      return 'sunset';
    case 'sleep_dream':
      return 'night';
    default:
      return 'city';
  }
}
