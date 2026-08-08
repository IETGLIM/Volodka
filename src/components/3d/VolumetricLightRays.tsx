/** ─── Volodka RPG — Geometry-Based Volumetric Light Rays ───
 *  Simple god-ray effect using transparent cone/cylinder meshes.
 *  These complement the postprocessing GodRays (screen-space) with
 *  world-space volumetric shafts that interact with scene geometry.
 *
 *  Quality-gated: high/ultra only. Volumetric rays are disabled on
 *  low/medium presets and when reducedMotion is active.
 *
 *  Cyberpunk palette: cyan #00e5ff, amber #ffaa44, emerald #00ff88.
 */

'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { SceneId } from '@/shared/types/game';

interface VolumetricRayConfig {
  position: [number, number, number];
  direction: [number, number, number];
  color: string;
  length: number;
  radiusTop: number;
  radiusBottom: number;
  opacity: number;
}

/** Per-scene volumetric ray presets. Positions align with accent lights. */
const SCENE_VOLUMETRIC_RAYS: Partial<Record<SceneId, VolumetricRayConfig[]>> = {
  street_night: [
    { position: [-6, 3, -2], direction: [0, -1, 0], color: '#d88a9c', length: 5, radiusTop: 0.15, radiusBottom: 1.2, opacity: 0.06 },
    { position: [5, 3, -3], direction: [0, -1, 0], color: '#8fb8b8', length: 4.5, radiusTop: 0.12, radiusBottom: 1.0, opacity: 0.05 },
    { position: [7, 2.8, 0], direction: [0, -1, 0.1], color: '#8da8d8', length: 4, radiusTop: 0.1, radiusBottom: 0.9, opacity: 0.05 },
  ],
  city_square: [
    { position: [0, 4.2, 0], direction: [0, -1, 0], color: '#aaccff', length: 6, radiusTop: 0.2, radiusBottom: 1.8, opacity: 0.05 },
    { position: [-8, 3.4, -6], direction: [0.2, -1, 0.1], color: '#55e8dd', length: 5, radiusTop: 0.15, radiusBottom: 1.4, opacity: 0.06 },
    { position: [8, 3.2, 7], direction: [-0.1, -1, -0.1], color: '#ff6688', length: 5, radiusTop: 0.15, radiusBottom: 1.3, opacity: 0.05 },
  ],
  home_evening: [
    { position: [0.5, 1.8, -0.5], direction: [0.1, -1, 0], color: '#ff9944', length: 2.5, radiusTop: 0.08, radiusBottom: 0.8, opacity: 0.08 },
  ],
  cafe_evening: [
    { position: [-3, 2.5, -1], direction: [0, -1, 0.2], color: '#6688cc', length: 3.5, radiusTop: 0.1, radiusBottom: 1.0, opacity: 0.05 },
  ],
  abandoned_factory: [
    { position: [-2, 2.5, 2], direction: [0, -1, 0], color: '#ff8833', length: 4, radiusTop: 0.15, radiusBottom: 1.5, opacity: 0.06 },
    { position: [4, 2, -3], direction: [0.1, -1, 0], color: '#dd6622', length: 3.5, radiusTop: 0.12, radiusBottom: 1.2, opacity: 0.05 },
  ],
  factory_basement: [
    { position: [0, 2.6, -5], direction: [0, -1, 0], color: '#22ff88', length: 4.5, radiusTop: 0.15, radiusBottom: 1.5, opacity: 0.07 },
    { position: [2, 2, -2], direction: [0, -1, 0.2], color: '#44ffaa', length: 3.5, radiusTop: 0.1, radiusBottom: 1.0, opacity: 0.05 },
  ],
  rooftop_edge: [
    { position: [-3, 3, 0], direction: [0.1, -0.8, -0.2], color: '#ff8844', length: 6, radiusTop: 0.2, radiusBottom: 2.0, opacity: 0.05 },
    { position: [4, 2.5, -2], direction: [-0.1, -0.8, 0.1], color: '#ff6633', length: 5, radiusTop: 0.15, radiusBottom: 1.6, opacity: 0.04 },
  ],
  chk_campfire_night: [
    { position: [0, 1.5, 0], direction: [0, -0.7, 0], color: '#ff8833', length: 3, radiusTop: 0.2, radiusBottom: 1.2, opacity: 0.08 },
    { position: [0, 3, 0], direction: [0, -1, 0], color: '#ff6622', length: 5, radiusTop: 0.1, radiusBottom: 1.8, opacity: 0.04 },
  ],
  sleep_dream: [
    { position: [0, 4, 0], direction: [0, -1, 0], color: '#aa66ff', length: 6, radiusTop: 0.15, radiusBottom: 2.0, opacity: 0.04 },
    { position: [-3, 3, -2], direction: [0.2, -1, 0.1], color: '#8844dd', length: 4, radiusTop: 0.1, radiusBottom: 1.2, opacity: 0.03 },
  ],
  river_pier: [
    { position: [0, 2, -1], direction: [0, -1, 0], color: '#ff9944', length: 3.5, radiusTop: 0.15, radiusBottom: 1.3, opacity: 0.07 },
  ],
};

/** Single volumetric light shaft — transparent cone mesh. */
function VolumetricShaft({ config, seed }: { config: VolumetricRayConfig; seed: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Align cylinder along the light direction
  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3(...config.direction).normalize();
    const defaultDir = new THREE.Vector3(0, -1, 0);
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(defaultDir, dir);
    return q;
  }, [config.direction]);

  // Position at the midpoint of the shaft
  const midPosition = useMemo((): [number, number, number] => {
    const dir = new THREE.Vector3(...config.direction).normalize();
    const origin = new THREE.Vector3(...config.position);
    const mid = origin.clone().add(dir.clone().multiplyScalar(config.length * 0.5));
    return [mid.x, mid.y, mid.z];
  }, [config.position, config.direction, config.length]);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(
      Math.max(0.01, config.radiusTop),
      Math.max(0.01, config.radiusBottom),
      config.length,
      12, 1, true, // open-ended cone, low poly for perf
    ),
    [config.radiusTop, config.radiusBottom, config.length],
  );

  useFrameTick('misc', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    // Subtle opacity pulsing — gives the shafts a living, breathing quality
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.5 + seed * 1.7);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = config.opacity * pulse;
  });

  return (
    <mesh
      ref={meshRef}
      position={midPosition}
      quaternion={quaternion}
      geometry={geometry}
      renderOrder={999} // render after opaque geometry
    >
      <meshBasicMaterial
        color={config.color}
        transparent
        opacity={config.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * VolumetricLightRays — renders geometry-based light shafts for scenes
 * that have volumetric presets. Quality-gated: high/ultra only.
 */
export function VolumetricLightRays({ sceneId }: { sceneId: SceneId }) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();

  // Volumetric rays: high/ultra only, not reduced motion
  const enabled =
    !reducedMotion
    && (preset.id === 'high' || preset.id === 'ultra')
    && (selectedPreset === 'high' || selectedPreset === 'ultra');

  const rays = SCENE_VOLUMETRIC_RAYS[sceneId];
  if (!enabled || !rays || rays.length === 0) return null;

  return (
    <group>
      {rays.map((ray, i) => (
        <VolumetricShaft
          key={`vol-ray-${sceneId}-${i}`}
          config={ray}
          seed={i * 773}
        />
      ))}
    </group>
  );
}
