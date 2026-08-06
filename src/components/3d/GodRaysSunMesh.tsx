/* ─── Volodka RPG – God Rays Sun Mesh (postprocessing source) ───
 * Dedicated emissive sphere mesh that serves as the `sun` source for the
 * postprocessing GodRaysEffect in ExplorationPostFX. The mesh is tiny (~0.1m
 * radius), additive-blended, depth-write-disabled, and tone-mapping-disabled
 * so it reads as a pure light source for the GodRays shader.
 *
 * Why a dedicated mesh (not the existing GodRays.tsx cylinders or scene lights):
 * - GodRaysEffect requires a `Mesh | Points` sun prop (not a Three.js Light).
 * - The effect's `update()` re-parents the mesh into a private `lightScene`,
 *   so the mesh must NOT be animated/transformed elsewhere.
 * - Existing GodRays.tsx cylinders have their center at mid-shaft, not at the
 *   light origin — GodRays projects rays FROM the sun mesh's screen position,
 *   so we need the mesh at the actual light bulb position.
 *
 * Positions mirror the existing GODRAY_PRESETS in GodRays.tsx so the
 * postprocessing rays emanate from the same origin as the mesh-based shafts.
 */

import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';

export interface GodRaysSunConfig {
  position: [number, number, number];
  color: string;
}

/** Per-scene sun mesh configs. Positions match GODRAY_PRESETS in GodRays.tsx
 *  so the postprocessing rays emanate from the same origin as the mesh-based
 *  shafts (complementary layers, not duplicates).
 *
 *  Positions + colors are sourced from `SCENE_ACCENT_LIGHTS` in Lighting.tsx
 *  so the sun mesh aligns with the actual visible practical light source
 *  (streetlamp / campfire / sunset / yard lamp) rather than the mesh-shaft
 *  center. This keeps the postprocessing rays anchored to a real bulb. */
const GODRAYS_SUN_CONFIG: Partial<Record<SceneId, GodRaysSunConfig>> = {
  home_evening: {
    position: [0, 2.5, 0],
    color: '#ffaa44',
  },
  factory_basement: {
    position: [0, 2.6, -5.2],
    color: '#22ff88',
  },
  // ── Expansion coverage (ultra-only postprocessing GodRays) ──
  // Positions mirror SCENE_ACCENT_LIGHTS in Lighting.tsx so the sun mesh
  // sits exactly on the visible practical light bulb.
  street_night: {
    // Pink neon streetlamp on the left side of the plaza.
    position: [-6, 3, -2],
    color: '#d88a9c',
  },
  city_square: {
    // Central plaza lamp (shadowCaster) — cool blue-white halo.
    position: [0, 4.2, 0],
    color: '#aaccff',
  },
  river_pier: {
    // Barrel fire at the pier head — warm flickering orange.
    position: [0, 1.5, -1],
    color: '#ff9944',
  },
  rooftop_edge: {
    // Sunset warm practical — rooftop edge hero lamp.
    position: [-3, 3, 0],
    color: '#ff8844',
  },
  chk_campfire_night: {
    // Campfire in the CHK clearing — primary fire light.
    position: [0, 1.2, 0],
    color: '#ff8833',
  },
  factory_roof: {
    // Factory yard lamp — industrial warm sodium.
    position: [-3, 3, 0],
    color: '#ff7744',
  },
  // AAA Phase A: expand ultra post godrays to more hero interiors for luxurious volumetric shafts
  cafe_evening: {
    // Neon bar glow + window spill
    position: [-3, 2.5, 0],
    color: '#4488ff',
  },
  library_day: {
    // Banker lamp / reading light shafts
    position: [5, 3, 0],
    color: '#ffdd99',
  },
  pier_evening: {
    // Pier fire + dusk light
    position: [0, 2.2, -2],
    color: '#ff9944',
  },
};

export function getGodRaysSunConfig(sceneId: SceneId): GodRaysSunConfig | null {
  return GODRAYS_SUN_CONFIG[sceneId] ?? null;
}

export const GODRAYS_POST_SCENES = new Set<SceneId>(
  Object.keys(GODRAYS_SUN_CONFIG) as SceneId[],
);

interface GodRaysSunMeshProps {
  sceneId: SceneId;
}

/** Emissive sphere mesh that acts as the GodRays postprocessing sun source.
 *  Forwarded ref exposes the THREE.Mesh so ExplorationPostFX can pass it to
 *  the <GodRays sun={...} /> effect. */
export const GodRaysSunMesh = forwardRef<THREE.Mesh, GodRaysSunMeshProps>(
  function GodRaysSunMesh({ sceneId }, ref) {
    const config = getGodRaysSunConfig(sceneId);

    const geometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);

    if (!config) return null;

    return (
      <mesh
        ref={ref}
        position={config.position}
        geometry={geometry}
        // GodRaysEffect requires: sun mesh must NOT write depth and must be
        // transparent. The effect's `set lightSource` auto-sets these, but
        // explicit is safer (matches postprocessing docs).
        // toneMapped={false} so the emissive color isn't tone-mapped down
        // before GodRays samples it.
      >
        <meshBasicMaterial
          color={config.color}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    );
  },
);
