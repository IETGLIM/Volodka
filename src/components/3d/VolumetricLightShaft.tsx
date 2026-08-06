
/* ─── Volodka RPG – Volumetric Light Shaft (cinematic cone shader) ───
 *  Cone-shaped volumetric light shafts for scenes with strong directional
 *  light through windows. Uses a custom shader material with additive
 *  blending, depth-write off, soft radial falloff, and procedural noise
 *  dust motes for cinematic AAA atmosphere.
 *
 *  Performance:
 *  - Mobile/coarse pointer: limited to 2 shafts per scene
 *  - Desktop high/ultra: up to 4 shafts per scene
 *  - Reduced motion: disables flicker animation (steady glow)
 *  - Shader material is memoized per-config to avoid recompilation
 *  - All GPU resources disposed on unmount
 */

/* eslint-disable react-refresh/only-export-components -- co-located helpers */
import { useEffect, useMemo, useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  finitePositive,
  sanitizeBufferGeometryPositions,
  sanitizePositionArray,
} from '@/engine/three/bufferGeometrySanitize';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';

/* ── Config ── */

export interface VolumetricShaftConfig {
  /** World-space origin of the shaft (apex of the cone — where the light enters) */
  position: [number, number, number];
  /** Apex radius (small — light source size) */
  topRadius: number;
  /** Base radius (wide — where the light spreads out and hits the floor) */
  bottomRadius: number;
  /** Height of the cone (apex → base) */
  height: number;
  /** Light color */
  color: string;
  /** Base opacity (0.15–0.25 recommended for cinematic subtlety) */
  opacity: number;
  /** Flicker speed (Hz, 0 = no flicker) */
  flickerSpeed: number;
  /** Flicker amplitude (0–1 fraction of base opacity) */
  flickerAmp: number;
  /** Slow cone rotation speed (rad/s) — gives the dust subtle parallax */
  rotationSpeed: number;
  /** Initial Y rotation (radians) */
  initialRotation: number;
  /** Tilt X (radians) — slant the shaft (e.g. light through a window) */
  tiltX?: number;
  /** Tilt Z (radians) */
  tiltZ?: number;
  /** Dust mote density (0–1, scales the noise contribution) */
  dustDensity: number;
  /** Dust motion speed */
  dustSpeed: number;
}

const DEFAULT_SHAFT: VolumetricShaftConfig = {
  position: [0, 4, 0],
  topRadius: 0.15,
  bottomRadius: 1.2,
  height: 4,
  color: '#fff4cc',
  opacity: 0.2,
  flickerSpeed: 0.18,
  flickerAmp: 0.25,
  rotationSpeed: 0.015,
  initialRotation: 0,
  dustDensity: 0.6,
  dustSpeed: 0.35,
};

/** Per-scene volumetric shaft presets. Each scene can have multiple shafts.
 *  Limited at runtime to 2 on mobile, 4 on desktop. */
export const SCENE_VOLUMETRIC_LIGHTS: Partial<Record<string, VolumetricShaftConfig[]>> = {
  // ── Volodka's room — cold window light slanting in from the left wall ──
  volodka_room: [
    {
      ...DEFAULT_SHAFT,
      position: [-3.4, 2.6, -1.2],
      topRadius: 0.12,
      bottomRadius: 0.9,
      height: 2.6,
      color: '#aab0d8',     // cold blue window light
      opacity: 0.18,
      flickerSpeed: 0.12,
      flickerAmp: 0.18,
      rotationSpeed: 0.008,
      initialRotation: 0.4,
      tiltX: -0.35,          // slant inward through the window
      tiltZ: 0.05,
      dustDensity: 0.55,
      dustSpeed: 0.25,
    },
    {
      ...DEFAULT_SHAFT,
      position: [1.6, 2.5, -3.1],
      topRadius: 0.08,
      bottomRadius: 0.55,
      height: 2.5,
      color: '#66ffaa',     // monitor green glow shaft (subtler, colder)
      opacity: 0.16,
      flickerSpeed: 0.3,
      flickerAmp: 0.35,      // monitor flicker
      rotationSpeed: 0.005,
      initialRotation: 0,
      tiltX: -0.1,
      dustDensity: 0.4,
      dustSpeed: 0.4,
    },
  ],
  // ── Library day — warm window light through dusty reading room ──
  library_day: [
    {
      ...DEFAULT_SHAFT,
      position: [5.2, 3.2, 0.5],
      topRadius: 0.18,
      bottomRadius: 1.1,
      height: 3.2,
      color: '#ffe6a8',     // warm amber window light
      opacity: 0.22,
      flickerSpeed: 0.08,
      flickerAmp: 0.12,
      rotationSpeed: 0.006,
      initialRotation: 0,
      tiltX: -0.25,
      dustDensity: 0.85,    // dusty library — high dust density
      dustSpeed: 0.18,
    },
    {
      ...DEFAULT_SHAFT,
      position: [3.4, 3.2, -3.2],
      topRadius: 0.14,
      bottomRadius: 0.85,
      height: 3.0,
      color: '#ffd882',
      opacity: 0.18,
      flickerSpeed: 0.1,
      flickerAmp: 0.14,
      rotationSpeed: 0.008,
      initialRotation: 0.5,
      tiltX: -0.2,
      dustDensity: 0.7,
      dustSpeed: 0.22,
    },
  ],
  // ── Office day — cold fluorescent window spill ──
  office_day: [
    {
      ...DEFAULT_SHAFT,
      position: [4.0, 3.0, 0],
      topRadius: 0.16,
      bottomRadius: 1.0,
      height: 3.0,
      color: '#dde8f8',     // cold overcast daylight
      opacity: 0.2,
      flickerSpeed: 0.25,
      flickerAmp: 0.28,      // fluorescent hum flicker
      rotationSpeed: 0.004,
      initialRotation: 0,
      tiltX: -0.2,
      dustDensity: 0.4,
      dustSpeed: 0.3,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-4.0, 3.0, 1.5],
      topRadius: 0.14,
      bottomRadius: 0.85,
      height: 2.8,
      color: '#cdd8ec',
      opacity: 0.17,
      flickerSpeed: 0.3,
      flickerAmp: 0.32,
      rotationSpeed: 0.006,
      initialRotation: 0.6,
      tiltX: -0.18,
      dustDensity: 0.35,
      dustSpeed: 0.32,
    },
  ],
  // ── Cafe evening — street light through window, mixed warm/cold ──
  cafe_evening: [
    {
      ...DEFAULT_SHAFT,
      position: [-3.6, 2.6, -1.0],
      topRadius: 0.13,
      bottomRadius: 0.85,
      height: 2.6,
      color: '#ffaa44',     // warm street lamp through window
      opacity: 0.21,
      flickerSpeed: 0.15,
      flickerAmp: 0.22,
      rotationSpeed: 0.01,
      initialRotation: 0.3,
      tiltX: -0.3,
      dustDensity: 0.55,
      dustSpeed: 0.28,
    },
    {
      ...DEFAULT_SHAFT,
      position: [2.4, 2.5, 1.5],
      topRadius: 0.1,
      bottomRadius: 0.6,
      height: 2.5,
      color: '#4488ff',     // cold neon spill through opposite window
      opacity: 0.17,
      flickerSpeed: 0.2,
      flickerAmp: 0.25,
      rotationSpeed: 0.012,
      initialRotation: 0.9,
      tiltX: -0.22,
      dustDensity: 0.4,
      dustSpeed: 0.34,
    },
  ],
  // ── Home evening (кухня, вечер) — warm pendant over the kitchen table +
  //    amber corner lamp + soft warm fill. Positions mirror the GodRays sun
  //    mesh at [0,2.5,0] #ffaa44 so the volumetric cones emanate from the
  //    same origin as the postprocessing rays (complementary layers).
  //    Ceiling at y=3.1 clips the top of each cone naturally. ──
  home_evening: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 2.5, 0],     // ceiling pendant — matches GodRays sun origin
      topRadius: 0.14,
      bottomRadius: 1.4,         // wide warm pool on the table/counter
      height: 2.4,
      color: '#ffaa44',          // warm amber pendant
      opacity: 0.22,
      flickerSpeed: 0.14,        // gentle thermal flicker of an old bulb
      flickerAmp: 0.16,
      rotationSpeed: 0.006,
      initialRotation: 0,
      tiltX: 0,
      dustDensity: 0.5,          // kitchen dust — cooking steam motes
      dustSpeed: 0.22,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-1.5, 1.5, -1], // warm corner lamp
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 1.4,
      color: '#ff9933',          // hotter amber corner spill
      opacity: 0.18,
      flickerSpeed: 0.22,
      flickerAmp: 0.2,
      rotationSpeed: 0.008,
      initialRotation: 0.3,
      tiltX: -0.2,
      dustDensity: 0.45,
      dustSpeed: 0.28,
    },
    {
      ...DEFAULT_SHAFT,
      position: [1, 1.8, 2],     // soft warm fill light
      topRadius: 0.08,
      bottomRadius: 0.55,
      height: 1.6,
      color: '#ffcc88',          // mellow warm wash
      opacity: 0.15,
      flickerSpeed: 0.18,
      flickerAmp: 0.14,
      rotationSpeed: 0.005,
      initialRotation: 0.7,
      tiltX: -0.12,
      dustDensity: 0.35,
      dustSpeed: 0.3,
    },
  ],
  // ── Factory basement (подвал завода) — «Заря-М» monolith green glow +
  //    red emergency lights + cold aisle spill. The hero green shaft
  //    matches the GodRays sun at [0,2.6,-5.2] #22ff88. Ceiling at y=3.4
  //    clips the cone tops. Dust is denser (old basement, stale air). ──
  factory_basement: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 2.6, -5.2],  // «Заря-М» monolith glow — matches GodRays sun
      topRadius: 0.16,
      bottomRadius: 1.2,         // green pool washing the monolith base
      height: 2.4,
      color: '#22ff88',          // guild terminal green
      opacity: 0.24,             // hero element — slightly stronger
      flickerSpeed: 0.35,        // CRT-style flicker of a live terminal
      flickerAmp: 0.32,
      rotationSpeed: 0.004,
      initialRotation: 0,
      tiltX: 0,
      dustDensity: 0.7,          // stale basement air — heavy dust
      dustSpeed: 0.18,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-4, 2.8, 2],    // left red emergency light
      topRadius: 0.12,
      bottomRadius: 0.9,
      height: 2.6,
      color: '#ff3322',          // alarm red spill
      opacity: 0.2,
      flickerSpeed: 0.5,         // erratic emergency flicker
      flickerAmp: 0.4,
      rotationSpeed: 0.003,
      initialRotation: 0.2,
      tiltX: -0.15,
      dustDensity: 0.6,
      dustSpeed: 0.2,
    },
    {
      ...DEFAULT_SHAFT,
      position: [4, 2.8, 2],     // right red emergency light (mirrored)
      topRadius: 0.12,
      bottomRadius: 0.9,
      height: 2.6,
      color: '#ff3322',
      opacity: 0.2,
      flickerSpeed: 0.5,
      flickerAmp: 0.4,
      rotationSpeed: 0.003,
      initialRotation: 0.8,
      tiltX: -0.15,
      dustDensity: 0.6,
      dustSpeed: 0.2,
    },
    {
      ...DEFAULT_SHAFT,
      position: [0, 2.5, 5],     // cold aisle spill near entrance
      topRadius: 0.1,
      bottomRadius: 0.8,
      height: 2.3,
      color: '#8899aa',          // cold fluorescent wash
      opacity: 0.16,
      flickerSpeed: 0.28,
      flickerAmp: 0.22,
      rotationSpeed: 0.005,
      initialRotation: 0,
      tiltX: 0,
      dustDensity: 0.5,
      dustSpeed: 0.25,
    },
  ],
  // ── Abandoned factory (заброшенный цех) — broken skylight shafts piercing
  //    through a collapsed roof. 2–3 warm amber beams from above, heavy dust
  //    suspended in stale industrial air. Ceiling at y≈3.4. ──
  abandoned_factory: [
    {
      ...DEFAULT_SHAFT,
      position: [-1.5, 3.2, 0.8],    // main skylight beam — centre-left
      topRadius: 0.18,
      bottomRadius: 1.3,
      height: 3.0,
      color: '#e8a840',              // warm amber from broken skylight
      opacity: 0.2,
      flickerSpeed: 0.12,            // slow thermal convection flicker
      flickerAmp: 0.18,
      rotationSpeed: 0.006,
      initialRotation: 0.15,
      tiltX: -0.28,                  // slant through the gap in the roof
      tiltZ: 0.08,
      dustDensity: 0.85,            // high dust — decades of disuse
      dustSpeed: 0.2,
    },
    {
      ...DEFAULT_SHAFT,
      position: [2.8, 3.1, -2.4],   // second skylight — right side
      topRadius: 0.14,
      bottomRadius: 0.95,
      height: 2.8,
      color: '#d4963a',              // slightly deeper amber
      opacity: 0.18,
      flickerSpeed: 0.1,
      flickerAmp: 0.16,
      rotationSpeed: 0.008,
      initialRotation: 0.6,
      tiltX: -0.22,
      tiltZ: -0.06,
      dustDensity: 0.8,
      dustSpeed: 0.22,
    },
    {
      ...DEFAULT_SHAFT,
      position: [0.5, 3.0, 3.5],    // third beam — far side, cracked panel
      topRadius: 0.1,
      bottomRadius: 0.7,
      height: 2.6,
      color: '#c89030',              // dimmer amber, partial obstruction
      opacity: 0.15,
      flickerSpeed: 0.14,
      flickerAmp: 0.2,
      rotationSpeed: 0.005,
      initialRotation: 1.1,
      tiltX: -0.18,
      dustDensity: 0.75,
      dustSpeed: 0.18,
    },
  ],
  // ── Underground bunker (подземный бункер) — emergency lighting.
  //    Green CRT glow from a monitoring station + red emergency strip.
  //    Ceiling at y≈2.8. Stale, claustrophobic atmosphere. ──
  underground_bunker: [
    {
      ...DEFAULT_SHAFT,
      position: [1.2, 2.5, -1.8],   // CRT monitor station glow
      topRadius: 0.12,
      bottomRadius: 0.85,
      height: 2.3,
      color: '#33ff88',              // green CRT phosphor glow
      opacity: 0.18,
      flickerSpeed: 0.3,             // CRT refresh flicker
      flickerAmp: 0.3,
      rotationSpeed: 0.004,
      initialRotation: 0,
      tiltX: -0.1,
      dustDensity: 0.5,             // medium dust — filtered air
      dustSpeed: 0.15,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-2.5, 2.6, 1.5],   // red emergency strip light
      topRadius: 0.1,
      bottomRadius: 0.75,
      height: 2.4,
      color: '#ff2828',              // alarm red emergency light
      opacity: 0.2,
      flickerSpeed: 0.5,             // erratic emergency flicker
      flickerAmp: 0.38,
      rotationSpeed: 0.003,
      initialRotation: 0.4,
      tiltX: -0.12,
      dustDensity: 0.45,
      dustSpeed: 0.18,
    },
  ],
  // ── CHK campfire night (костёр ЧК, ночь) — campfire glow cone rising
  //    from ground level. 2 shafts: primary upward cone + secondary warm
  //    spill. Open sky, no ceiling constraint. ──
  chk_campfire_night: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 0.3, 0],        // campfire at ground level
      topRadius: 0.2,
      bottomRadius: 1.6,             // wide base — fire illuminates a circle
      height: 3.0,                   // rises upward into the night
      color: '#ff8830',              // warm orange campfire glow
      opacity: 0.2,
      flickerSpeed: 0.4,             // campfire flicker — active flames
      flickerAmp: 0.3,
      rotationSpeed: 0.012,
      initialRotation: 0,
      tiltX: 0,
      dustDensity: 0.35,            // low dust — outdoor, breeze disperses
      dustSpeed: 0.45,
    },
    {
      ...DEFAULT_SHAFT,
      position: [0.8, 0.25, -0.6],  // secondary ember glow — offset
      topRadius: 0.12,
      bottomRadius: 0.9,
      height: 2.5,
      color: '#ff6622',              // deeper orange ember
      opacity: 0.16,
      flickerSpeed: 0.45,
      flickerAmp: 0.35,
      rotationSpeed: 0.015,
      initialRotation: 0.7,
      tiltX: 0.08,
      dustDensity: 0.3,
      dustSpeed: 0.5,
    },
  ],
  // ── Library basement (подвал библиотеки) — bare bulb shafts from
  //    overhead fixtures. 2 bulbs: warm amber, high dust in stale air.
  //    Ceiling at y≈2.8. ──
  library_basement: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 2.7, 0],        // main bare bulb — centre of room
      topRadius: 0.1,
      bottomRadius: 1.0,
      height: 2.5,
      color: '#ffcc66',              // warm amber bare bulb
      opacity: 0.2,
      flickerSpeed: 0.12,            // old bulb subtle flicker
      flickerAmp: 0.2,
      rotationSpeed: 0.005,
      initialRotation: 0,
      tiltX: 0,
      dustDensity: 0.8,             // high dust — old basement, no ventilation
      dustSpeed: 0.15,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-2.5, 2.6, 2.0],   // second bulb — back corner
      topRadius: 0.08,
      bottomRadius: 0.7,
      height: 2.3,
      color: '#e8b850',              // slightly dimmer amber
      opacity: 0.17,
      flickerSpeed: 0.14,
      flickerAmp: 0.22,
      rotationSpeed: 0.007,
      initialRotation: 0.5,
      tiltX: -0.08,
      dustDensity: 0.75,
      dustSpeed: 0.18,
    },
  ],
  // ── Albert's backroom (каморка Альберта) — dim single desk lamp.
  //    2 shafts: main desk lamp + faint window spill. Low dust, intimate.
  //    Ceiling at y≈2.6. ──
  albert_backroom: [
    {
      ...DEFAULT_SHAFT,
      position: [-1.2, 2.0, -0.5],  // desk lamp — warm pool over the desk
      topRadius: 0.1,
      bottomRadius: 0.75,
      height: 1.8,
      color: '#e8a040',              // warm amber desk lamp
      opacity: 0.18,
      flickerSpeed: 0.12,            // gentle old bulb flicker
      flickerAmp: 0.16,
      rotationSpeed: 0.004,
      initialRotation: 0,
      tiltX: -0.15,
      dustDensity: 0.35,            // low dust — small room, kept tidy
      dustSpeed: 0.2,
    },
    {
      ...DEFAULT_SHAFT,
      position: [2.0, 2.4, -1.5],   // faint window spill — side wall
      topRadius: 0.08,
      bottomRadius: 0.55,
      height: 2.2,
      color: '#c8a860',              // muted warm window light
      opacity: 0.14,
      flickerSpeed: 0.08,
      flickerAmp: 0.12,
      rotationSpeed: 0.006,
      initialRotation: 0.8,
      tiltX: -0.25,
      dustDensity: 0.3,
      dustSpeed: 0.22,
    },
  ],
  // AAA Phase A: skyline sunset + industrial rooftop shafts (warm dusk light catching haze + embers)
  rooftop_edge: [
    {
      ...DEFAULT_SHAFT,
      position: [-3.2, 3.4, -0.8],   // main sunset hero light
      topRadius: 0.22,
      bottomRadius: 1.55,
      height: 3.8,
      color: '#ffcc88',
      opacity: 0.19,
      flickerSpeed: 0.09,
      flickerAmp: 0.18,
      rotationSpeed: 0.005,
      initialRotation: 0.25,
      tiltX: -0.32,
      dustDensity: 0.65,             // city haze + sunset dust
      dustSpeed: 0.18,
    },
    {
      ...DEFAULT_SHAFT,
      position: [2.5, 3.6, 1.2],
      topRadius: 0.15,
      bottomRadius: 1.1,
      height: 3.4,
      color: '#ffaa66',
      opacity: 0.15,
      flickerSpeed: 0.07,
      flickerAmp: 0.14,
      rotationSpeed: 0.008,
      initialRotation: -0.4,
      tiltX: -0.18,
      dustDensity: 0.55,
      dustSpeed: 0.22,
    },
  ],
  factory_roof: [
    {
      ...DEFAULT_SHAFT,
      position: [-2.8, 3.8, -3.2],   // distant industrial sodium + dusk
      topRadius: 0.18,
      bottomRadius: 1.35,
      height: 4.0,
      color: '#ffbb55',
      opacity: 0.17,
      flickerSpeed: 0.11,
      flickerAmp: 0.2,
      rotationSpeed: 0.006,
      initialRotation: 0.5,
      tiltX: -0.25,
      dustDensity: 0.7,              // industrial dust + wind
      dustSpeed: 0.28,
    },
    {
      ...DEFAULT_SHAFT,
      position: [3.1, 3.5, 0.6],
      topRadius: 0.13,
      bottomRadius: 1.0,
      height: 3.2,
      color: '#ff9944',
      opacity: 0.14,
      flickerSpeed: 0.14,
      flickerAmp: 0.22,
      rotationSpeed: 0.009,
      initialRotation: 1.1,
      tiltX: -0.15,
      dustDensity: 0.6,
      dustSpeed: 0.25,
    },
  ],
  // AAA Phase A: cool neon plaza shafts for city_square — wet reflective haze catching blue/pink neon + street lamps
  city_square: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 4.4, -1.5],      // central plaza lamp cool blue-white
      topRadius: 0.12,
      bottomRadius: 1.4,
      height: 4.2,
      color: '#aaccff',
      opacity: 0.16,
      flickerSpeed: 0.28,
      flickerAmp: 0.32,              // neon hum flicker
      rotationSpeed: 0.004,
      initialRotation: 0,
      tiltX: -0.1,
      dustDensity: 0.55,             // wet night haze + reflections
      dustSpeed: 0.32,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-5.5, 3.2, 2.8],    // side pink neon spill
      topRadius: 0.1,
      bottomRadius: 0.95,
      height: 3.1,
      color: '#ff99cc',
      opacity: 0.14,
      flickerSpeed: 0.18,
      flickerAmp: 0.24,
      rotationSpeed: 0.007,
      initialRotation: 0.8,
      tiltX: -0.22,
      dustDensity: 0.48,
      dustSpeed: 0.38,
    },
  ],
  // AAA Phase A: rich cinematic volumetric shafts on river/pier (fire + water mist + dusk light catching dust)
  river_pier: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 1.6, -1.2],     // barrel fire primary shaft
      topRadius: 0.18,
      bottomRadius: 1.35,
      height: 3.2,
      color: '#ff9944',
      opacity: 0.23,
      flickerSpeed: 0.45,
      flickerAmp: 0.38,
      rotationSpeed: 0.012,
      initialRotation: 0.1,
      dustDensity: 0.75,            // water mist + smoke
      dustSpeed: 0.42,
    },
    {
      ...DEFAULT_SHAFT,
      position: [1.8, 2.8, -3.5],   // side warm pier light
      topRadius: 0.12,
      bottomRadius: 0.95,
      height: 2.9,
      color: '#ffbb66',
      opacity: 0.18,
      flickerSpeed: 0.22,
      flickerAmp: 0.26,
      rotationSpeed: 0.009,
      initialRotation: 0.7,
      tiltX: -0.18,
      dustDensity: 0.65,
      dustSpeed: 0.35,
    },
  ],
  pier_evening: [
    {
      ...DEFAULT_SHAFT,
      position: [0, 1.8, -1.5],
      topRadius: 0.16,
      bottomRadius: 1.25,
      height: 3.0,
      color: '#ff8833',
      opacity: 0.21,
      flickerSpeed: 0.38,
      flickerAmp: 0.32,
      rotationSpeed: 0.01,
      initialRotation: 0,
      dustDensity: 0.72,
      dustSpeed: 0.4,
    },
    {
      ...DEFAULT_SHAFT,
      position: [-2.2, 2.6, -2.8],
      topRadius: 0.11,
      bottomRadius: 0.85,
      height: 2.7,
      color: '#ffaa55',
      opacity: 0.17,
      flickerSpeed: 0.18,
      flickerAmp: 0.22,
      rotationSpeed: 0.007,
      initialRotation: -0.6,
      tiltX: -0.12,
      dustDensity: 0.6,
      dustSpeed: 0.32,
    },
  ],
};

function normalizeShaftConfig(config: VolumetricShaftConfig): VolumetricShaftConfig {
  return {
    ...config,
    topRadius: finitePositive(config.topRadius, DEFAULT_SHAFT.topRadius),
    bottomRadius: finitePositive(config.bottomRadius, DEFAULT_SHAFT.bottomRadius),
    height: finitePositive(config.height, DEFAULT_SHAFT.height),
  };
}

/* ── Shader ── */

const SHAFT_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SHAFT_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uFlicker;
  uniform float uDustDensity;
  uniform float uDustSpeed;

  varying vec2 vUv;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  /* 2D hash + value noise (cheap procedural dust) */
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  /* FBM for soft dust clouds */
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * valueNoise(p);
      p *= 2.1;
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    /* vUv.y: 0 at apex (top, narrow), 1 at base (bottom, wide) —
     * the cone geometry is built bottom-up so we invert. */
    float along = 1.0 - vUv.y;            // 0 at base, 1 at apex

    /* Radial falloff — strong at apex (light source), soft fade toward base.
     * vUv.x wraps around the cone circumference; we use it for angular dust streaks. */
    float radial = sin(along * 3.14159);  // 0 at ends, peaks mid-shaft

    /* Soft vertical fade — light is brightest at apex (window), fades to floor */
    float verticalFade = mix(0.35, 1.0, along);

    /* Dust streaks: angular noise that drifts downward over time,
     * modulated by radial position so it concentrates mid-shaft. */
    vec2 dustUv = vec2(
      vUv.x * 6.0 + uTime * uDustSpeed * 0.4,
      vUv.y * 3.0 - uTime * uDustSpeed * 0.6
    );
    float dust = fbm(dustUv);
    /* Streak elongation — stretch vertically to suggest falling motes */
    float streak = fbm(dustUv * vec2(0.5, 2.0));
    float dustFinal = mix(dust, streak, 0.6) * uDustDensity;

    /* Subtle view-distance fade so distant shafts read softer */
    float viewDist = length(vViewPos);
    float distFade = clamp(1.0 - (viewDist - 4.0) / 22.0, 0.25, 1.0);

    /* Combine: base intensity * radial * vertical * dust boost * dist fade */
    float intensity = radial * verticalFade * distFade;
    intensity += dustFinal * radial * 0.5;

    /* Flicker modulation — multiplied uniformly across the shaft */
    float flick = 1.0 - uFlicker * 0.5 + uFlicker * 0.5 * sin(uTime * 6.28318 * 1.0);

    vec3 col = uColor * intensity * flick;
    float alpha = uOpacity * intensity * flick;

    /* Additive blending: clamp alpha for soft additive look */
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/* ── Component ── */

interface VolumetricLightShaftsProps {
  /** Override the scene-derived shaft list (for testing / custom configs). */
  shafts?: VolumetricShaftConfig[];
  /** Scene ID — used to look up SCENE_VOLUMETRIC_LIGHTS. */
  sceneId?: SceneId | string;
}

/** Renders 0–4 cone-shaped volumetric light shafts for the current scene.
 *  Quality-gated: mobile caps at 2, desktop at 4. Disabled in lite/reduced-motion. */
export function VolumetricLightShafts({ shafts, sceneId }: VolumetricLightShaftsProps) {
  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();
  const { preset, selectedPreset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();

  const maxShafts = isMobile ? 2 : 4;

  const configs = useMemo(() => {
    const base = shafts ?? (sceneId ? SCENE_VOLUMETRIC_LIGHTS[sceneId] ?? [] : []);
    return base.slice(0, maxShafts).map((c) => normalizeShaftConfig({ ...DEFAULT_SHAFT, ...c }));
  }, [shafts, sceneId, maxShafts]);

  // Gate: only on high/ultra desktop (or medium if not mobile), not lite, not reduced motion.
  // On mobile we still allow it for high/ultra-selected presets (rare), capped at 2 shafts.
  const enabled =
    configs.length > 0
    && !visualLite
    && !reducedMotion
    && (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra');

  if (!enabled) return null;

  return (
    <group>
      {configs.map((config, idx) => (
        <VolumetricShaft key={`vshaft-${sceneId ?? 'custom'}-${idx}`} config={config} />
      ))}
    </group>
  );
}

/* ── Single volumetric shaft ── */

function VolumetricShaft({ config }: { config: VolumetricShaftConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const c = useMemo(
    () => normalizeShaftConfig({ ...DEFAULT_SHAFT, ...config }),
    [config],
  );

  // Cone geometry (open-ended) — apex at top, base at bottom.
  // CylinderGeometry args: (radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(
      c.topRadius,
      c.bottomRadius,
      c.height,
      16,
      1,
      true,
    );
    sanitizeBufferGeometryPositions(geo);
    return geo;
  }, [c.topRadius, c.bottomRadius, c.height]);

  // Stable uniforms object — updated in-place via useFrameTick.
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(c.color) },
      uOpacity: { value: c.opacity },
      uTime: { value: 0 },
      uFlicker: { value: c.flickerAmp },
      uDustDensity: { value: c.dustDensity },
      uDustSpeed: { value: c.dustSpeed },
    }),
    // We intentionally do NOT include c.color / c.opacity here so that the
    // material is not re-created when those props change — they're applied
    // via the useEffect below. This avoids shader recompilation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: SHAFT_VERTEX_SHADER,
        fragmentShader: SHAFT_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [uniforms],
  );

  // Sync mutable uniform values when config changes (color, opacity, etc.)
  useEffect(() => {
    uniforms.uColor.value.set(c.color);
    uniforms.uOpacity.value = c.opacity;
    uniforms.uFlicker.value = c.flickerAmp;
    uniforms.uDustDensity.value = c.dustDensity;
    uniforms.uDustSpeed.value = c.dustSpeed;
  }, [c.color, c.opacity, c.flickerAmp, c.dustDensity, c.dustSpeed, uniforms]);

  // Dispose geometry + material on unmount / when they change.
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrameTick('postfx', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Slow rotation for dust parallax
    meshRef.current.rotation.y += c.rotationSpeed * delta;

    // Update uniforms
    if (matRef.current) {
      const u = matRef.current.uniforms;
      u.uTime.value = t;
      // Flicker envelope: combine slow + fast sines for organic flicker
      const flickerPhase =
        Math.sin(t * c.flickerSpeed * Math.PI * 2)
        + 0.5 * Math.sin(t * c.flickerSpeed * Math.PI * 4.7 + 1.3);
      u.uFlicker.value = c.flickerAmp * (0.5 + 0.5 * flickerPhase);
    }
  });

  return (
    <group position={c.position} rotation={[c.tiltX ?? 0, c.initialRotation, c.tiltZ ?? 0]}>
      <mesh ref={meshRef} geometry={geometry} material={material} />
      <DustMotesInside config={c} />
    </group>
  );
}

/* ── Dust motes (Points) — animated floating particles inside the shaft ── */

function DustMotesInside({ config }: { config: VolumetricShaftConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const c = useMemo(
    () => normalizeShaftConfig({ ...DEFAULT_SHAFT, ...config }),
    [config],
  );

  // 30 motes per shaft — light, performance-friendly
  const MOTE_COUNT = 30;

  const geometry = useMemo(() => {
    const positions = new Float32Array(MOTE_COUNT * 3);
    const phases = new Float32Array(MOTE_COUNT);
    for (let i = 0; i < MOTE_COUNT; i++) {
      const i3 = i * 3;
      // Distribute within cone: 0 = apex (top), 1 = base (bottom)
      const t = Math.random();
      const radius = c.topRadius + (c.bottomRadius - c.topRadius) * t;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = (0.5 - t) * c.height;
      positions[i3 + 2] = Math.sin(angle) * r;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    sanitizeBufferGeometryPositions(geo);
    return geo;
  }, [c.topRadius, c.bottomRadius, c.height]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('postfx', ({ delta }) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const phaseAttr = pointsRef.current.geometry.getAttribute('phase') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const phaseArray = phaseAttr.array as Float32Array;
    const halfHeight = c.height / 2;

    for (let i = 0; i < MOTE_COUNT; i++) {
      const i3 = i * 3;
      const phase = phaseArray[i];

      // Gentle floating motion — falling + lateral drift
      posArray[i3] += Math.sin(t * 0.3 + phase) * 0.002 * delta * 60;
      posArray[i3 + 1] -= 0.012 * delta; // slow downward drift (motes fall)
      posArray[i3 + 2] += Math.cos(t * 0.25 + phase * 1.5) * 0.002 * delta * 60;

      // Wrap Y when falling below the cone base
      if (posArray[i3 + 1] < -halfHeight) {
        posArray[i3 + 1] = halfHeight;
      }
      if (posArray[i3 + 1] > halfHeight) {
        posArray[i3 + 1] = -halfHeight;
      }

      // Clamp radially to stay inside the cone
      const y = posArray[i3 + 1];
      const normalY = (halfHeight - y) / c.height; // 0 at bottom, 1 at top
      const maxR = Math.max(
        0,
        c.topRadius + (c.bottomRadius - c.topRadius) * (1 - normalY),
      );
      const dist = Math.hypot(posArray[i3], posArray[i3 + 2]);
      if (dist > maxR * 0.9 && dist > 1e-6) {
        const scale = (maxR * 0.85) / dist;
        posArray[i3] *= scale;
        posArray[i3 + 2] *= scale;
      }
    }

    if (sanitizePositionArray(posArray)) {
      sanitizeBufferGeometryPositions(pointsRef.current.geometry);
    }
    posAttr.needsUpdate = true;

    // Pulsing opacity synced with the shaft flicker
    if (matRef.current) {
      matRef.current.opacity = 0.4 + 0.15 * Math.sin(t * c.flickerSpeed * Math.PI * 2);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        color={c.color}
        size={0.04}
        transparent
        opacity={0.45}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
