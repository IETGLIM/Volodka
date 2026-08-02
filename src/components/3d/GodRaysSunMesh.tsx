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
 *  shafts (complementary layers, not duplicates). */
const GODRAYS_SUN_CONFIG: Partial<Record<SceneId, GodRaysSunConfig>> = {
  home_evening: {
    position: [0, 2.5, 0],
    color: '#ffaa44',
  },
  factory_basement: {
    position: [0, 2.6, -5.2],
    color: '#22ff88',
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
