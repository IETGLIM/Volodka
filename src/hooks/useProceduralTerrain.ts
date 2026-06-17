
/* ─── Volodka RPG – Procedural terrain generation with FastNoiseLite ─── */

import { useMemo, useRef, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  createAnimatedTerrainMaterial,
  setAnimatedTerrainTime,
} from '@/engine/three/animatedTerrainMaterial';
import * as THREE from 'three';
import FastNoiseLite from 'fastnoise-lite';

/* ═══════════════════════════════════════════════════════════════════ */
/*  CONFIGURATION PRESETS                                            */
/* ═══════════════════════════════════════════════════════════════════ */

export interface TerrainPreset {
  /** Noise seed for deterministic generation (saves stay consistent) */
  seed: number;
  /** Noise algorithm */
  noiseType: string;
  /** Base frequency — lower = smoother, larger features */
  frequency: number;
  /** Fractal layering mode */
  fractalType: string;
  /** Number of octaves — more = finer detail */
  octaves: number;
  /** How much each octave contributes */
  lacunarity: number;
  /** Smoothness between octaves */
  gain: number;
  /** Maximum height displacement in Three.js units */
  amplitude: number;
  /** Domain warp amplitude — makes terrain more organic/surreal */
  warpAmp: number;
  /** Domain warp type */
  warpType: string;
}

/** Dream scene — surreal, undulating, otherworldly */
export const DREAM_TERRAIN: TerrainPreset = {
  seed: 42,
  noiseType: FastNoiseLite.NoiseType.OpenSimplex2,
  frequency: 0.035,
  fractalType: FastNoiseLite.FractalType.FBm,
  octaves: 5,
  lacunarity: 2.0,
  gain: 0.45,
  amplitude: 3.0,
  warpAmp: 15.0,
  warpType: FastNoiseLite.DomainWarpType.OpenSimplex2,
};

/** Park scene — gentle rolling hills */
export const PARK_TERRAIN: TerrainPreset = {
  seed: 101,
  noiseType: FastNoiseLite.NoiseType.OpenSimplex2S,
  frequency: 0.02,
  fractalType: FastNoiseLite.FractalType.FBm,
  octaves: 4,
  lacunarity: 2.0,
  gain: 0.4,
  amplitude: 1.5,
  warpAmp: 3.0,
  warpType: FastNoiseLite.DomainWarpType.OpenSimplex2Reduced,
};

/** Stable serialized key for terrain preset — avoids fragile per-field useMemo deps */
export function serializePreset(preset: TerrainPreset): string {
  return [
    preset.seed,
    preset.noiseType,
    preset.frequency,
    preset.fractalType,
    preset.octaves,
    preset.lacunarity,
    preset.gain,
    preset.amplitude,
    preset.warpAmp,
    preset.warpType,
  ].join('|');
}

/** Winter street — snow drifts and frozen mounds */
export const WINTER_TERRAIN: TerrainPreset = {
  seed: 777,
  noiseType: FastNoiseLite.NoiseType.Cellular,
  frequency: 0.06,
  fractalType: FastNoiseLite.FractalType.FBm,
  octaves: 3,
  lacunarity: 2.0,
  gain: 0.5,
  amplitude: 0.6,
  warpAmp: 5.0,
  warpType: FastNoiseLite.DomainWarpType.OpenSimplex2,
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  HOOK: useProceduralTerrain                                       */
/* ═══════════════════════════════════════════════════════════════════ */

export interface TerrainConfig {
  /** World-space dimensions of the terrain plane */
  width: number;
  depth: number;
  /** Subdivision resolution (segments per side). Higher = smoother but heavier. */
  segments: number;
  /** Terrain generation preset */
  preset: TerrainPreset;
}

/**
 * Generates a procedural heightmap terrain using FastNoiseLite.
 * Returns a BufferGeometry with displaced Y-vertices + a height-at-point query function.
 *
 * All generation happens in useMemo — zero per-frame cost.
 */
export function useProceduralTerrain(config: TerrainConfig) {
  const { width, depth, segments, preset } = config;

  const presetKey = useMemo(() => serializePreset(preset), [preset]);

  const { geometry, getHeightAt } = useMemo(() => {
    // ── Configure noise generator ──
    const noise = new FastNoiseLite(preset.seed);
    noise.SetNoiseType(preset.noiseType);
    noise.SetFrequency(preset.frequency);
    noise.SetFractalType(preset.fractalType);
    noise.SetFractalOctaves(preset.octaves);
    noise.SetFractalLacunarity(preset.lacunarity);
    noise.SetFractalGain(preset.gain);

    // ── Configure domain warp (makes terrain more organic) ──
    const warper = new FastNoiseLite(preset.seed + 1000);
    warper.SetNoiseType(FastNoiseLite.NoiseType.OpenSimplex2);
    warper.SetDomainWarpType(preset.warpType);
    warper.SetDomainWarpAmp(preset.warpAmp);
    warper.SetFractalType(FastNoiseLite.FractalType.DomainWarpIndependent);
    warper.SetFractalOctaves(3);
    warper.SetFrequency(0.02);

    // ── Generate heightmap ──
    const halfW = width / 2;
    const halfD = depth / 2;
    const stepX = width / segments;
    const stepZ = depth / segments;

    const positions: Float32Array = new Float32Array((segments + 1) * (segments + 1) * 3);
    let idx = 0;

    // Store height values for query function
    const heightMap: Float32Array = new Float32Array((segments + 1) * (segments + 1));

    for (let iz = 0; iz <= segments; iz++) {
      for (let ix = 0; ix <= segments; ix++) {
        const x = -halfW + ix * stepX;
        const z = -halfD + iz * stepZ;

        // Domain warp — displace input coordinates for more organic shapes
        const coord = { x, y: z, z: 0 };
        warper.DomainWrap(coord);

        // Sample noise at warped coordinates
        const height = noise.GetNoise(coord.x, coord.y) * preset.amplitude;

        positions[idx] = x;
        positions[idx + 1] = height;
        positions[idx + 2] = z;

        heightMap[iz * (segments + 1) + ix] = height;

        idx += 3;
      }
    }

    // ── Build indices ──
    const indices: Uint32Array = new Uint32Array(segments * segments * 6);
    let iidx = 0;
    for (let iz = 0; iz < segments; iz++) {
      for (let ix = 0; ix < segments; ix++) {
        const a = iz * (segments + 1) + ix;
        const b = a + 1;
        const c = a + (segments + 1);
        const d = c + 1;

        indices[iidx++] = a;
        indices[iidx++] = c;
        indices[iidx++] = b;

        indices[iidx++] = b;
        indices[iidx++] = c;
        indices[iidx++] = d;
      }
    }

    // ── Create BufferGeometry ──
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();

    // ── Height query function (for gameplay: player positioning, collisions) ──
    const getHeightAtPoint = (worldX: number, worldZ: number): number => {
      // Map world coords to heightmap grid
      const gridX = (worldX + halfW) / stepX;
      const gridZ = (worldZ + halfD) / stepZ;

      const ix = Math.floor(gridX);
      const iz = Math.floor(gridZ);

      if (ix < 0 || ix >= segments || iz < 0 || iz >= segments) return 0;

      // Bilinear interpolation for smooth height
      const fx = gridX - ix;
      const fz = gridZ - iz;

      const h00 = heightMap[iz * (segments + 1) + ix];
      const h10 = heightMap[iz * (segments + 1) + ix + 1];
      const h01 = heightMap[(iz + 1) * (segments + 1) + ix];
      const h11 = heightMap[(iz + 1) * (segments + 1) + ix + 1];

      const h0 = h00 + (h10 - h00) * fx;
      const h1 = h01 + (h11 - h01) * fx;

      return h0 + (h1 - h0) * fz;
    };

    return { geometry: geo, getHeightAt: getHeightAtPoint };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [width, depth, segments, presetKey]);

  // Dispose previous geometry when config changes or component unmounts
  useEffect(() => () => {
    geometry.dispose();
  }, [geometry]);

  return { geometry, getHeightAt };
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  HOOK: useAnimatedTerrain                                         */
/* ═══════════════════════════════════════════════════════════════════ */

/**
 * Animated terrain — gentle vertex displacement driven by a GPU shader uniform.
 * Use sparingly (dream scene only). Pass `material` to the mesh; wave motion is
 * visual-only — `getHeightAt` returns the static procedural heightmap.
 */
export function useAnimatedTerrain(config: TerrainConfig, timeScale = 0.15) {
  const { geometry, getHeightAt } = useProceduralTerrain(config);
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () => createAnimatedTerrainMaterial({ timeScale, roughness: 0.9 }),
    [timeScale],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrameTick(
    'misc',
    (ctx) => {
      setAnimatedTerrainTime(material, ctx.state.clock.elapsedTime);
    },
    { label: 'AnimatedTerrain', visibilityRef: meshRef },
  );

  return { geometry, getHeightAt, meshRef, material };
}
