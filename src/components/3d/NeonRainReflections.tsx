
/* ─── Volodka RPG – Neon Rain Reflections ───
 *  Colored ground reflections for the street_night scene.
 *  Simulates neon lights reflecting off wet pavement using
 *  animated additive-blend circles at ground level.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

interface NeonReflectionConfig {
  count: number;
  /** Each neon reflection pool definition */
  pools: Array<{
    position: [number, number, number];
    color: string;
    radius: number;
    intensity: number;
    pulseSpeed: number;
    pulsePhase: number;
  }>;
}

const NEON_CONFIGS: Record<string, NeonReflectionConfig> = {
  street_night: {
    count: 80,
    pools: [
      // Left neon sign — magenta
      { position: [-6, 0.02, -2], color: '#ff22aa', radius: 3.5, intensity: 0.35, pulseSpeed: 0.4, pulsePhase: 0 },
      // Right neon sign — cyan
      { position: [5, 0.02, -3], color: '#22ffdd', radius: 3.0, intensity: 0.30, pulseSpeed: 0.35, pulsePhase: 1.2 },
      // Bar window — amber
      { position: [2, 0.02, 1], color: '#ffaa22', radius: 2.5, intensity: 0.25, pulseSpeed: 0.5, pulsePhase: 2.4 },
      // Distant billboard — purple
      { position: [-3, 0.02, -5], color: '#aa44ff', radius: 4.0, intensity: 0.20, pulseSpeed: 0.25, pulsePhase: 0.8 },
      // Shop sign — electric blue
      { position: [7, 0.02, 0], color: '#4488ff', radius: 2.8, intensity: 0.28, pulseSpeed: 0.45, pulsePhase: 3.6 },
    ],
  },
  city_square: {
    count: 64,
    pools: [
      { position: [-8, 0.02, -6], color: '#55e8dd', radius: 3.8, intensity: 0.32, pulseSpeed: 0.38, pulsePhase: 0.2 },
      { position: [8, 0.02, 7], color: '#ff6688', radius: 3.4, intensity: 0.3, pulseSpeed: 0.42, pulsePhase: 1.4 },
      { position: [0, 0.02, 0], color: '#aaccff', radius: 4.2, intensity: 0.26, pulseSpeed: 0.28, pulsePhase: 2.1 },
      { position: [6, 0.02, -4], color: '#ffaa66', radius: 2.8, intensity: 0.24, pulseSpeed: 0.48, pulsePhase: 3.0 },
      { position: [-5, 0.02, 5], color: '#9b86bc', radius: 3.0, intensity: 0.22, pulseSpeed: 0.33, pulsePhase: 0.9 },
    ],
  },
  // Pier scenes — wet boards already reflect via MeshReflectorMaterial; these colored
  // additive pools add warm fire / string-light shimmer + a cold distant water reflection.
  river_pier: {
    count: 48,
    pools: [
      // Barrel fire — warm orange
      { position: [0, 0.02, -2],  color: '#ff8833', radius: 3.0, intensity: 0.32, pulseSpeed: 0.4,  pulsePhase: 0 },
      // String lights — warm amber
      { position: [3, 0.02, 0],   color: '#ffbb55', radius: 2.4, intensity: 0.22, pulseSpeed: 0.5,  pulsePhase: 1.2 },
      { position: [-2, 0.02, 1],  color: '#ffcc66', radius: 2.0, intensity: 0.18, pulseSpeed: 0.45, pulsePhase: 2.4 },
      // Distant cold water reflection
      { position: [5, 0.02, -8],  color: '#8aa0c0', radius: 3.6, intensity: 0.15, pulseSpeed: 0.25, pulsePhase: 0.8 },
    ],
  },
  pier_evening: {
    count: 48,
    pools: [
      { position: [0, 0.02, -1],  color: '#ff9944', radius: 2.8, intensity: 0.30, pulseSpeed: 0.4,  pulsePhase: 0 },
      { position: [-4, 0.02, -3], color: '#ffaa66', radius: 2.6, intensity: 0.22, pulseSpeed: 0.5,  pulsePhase: 1.4 },
      { position: [4, 0.02, 2],   color: '#aabbcc', radius: 3.2, intensity: 0.14, pulseSpeed: 0.3,  pulsePhase: 2.0 },
    ],
  },
};

export function NeonRainReflections({ sceneId }: { sceneId: string }) {
  const baseConfig = NEON_CONFIGS[sceneId];
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();

  const config = useMemo(() => {
    if (!baseConfig) return null;
    return {
      ...baseConfig,
      count: getParticleCount(baseConfig.count, isMobile, visualLite, effectsScale, reducedMotion),
    };
  }, [baseConfig, isMobile, visualLite, effectsScale, reducedMotion]);

  if (!config) return null;
  return <NeonReflectionSystem config={config} />;
}

function NeonReflectionSystem({ config }: { config: NeonReflectionConfig }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const timeRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useMemo(() => new Float32Array(config.count * 3), [config.count]);

  // Base geometry — flat disc for each reflection
  const geometry = useMemo(() => new THREE.CircleGeometry(1, 8), []);

  // Material with vertex colors for per-instance neon colors
  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
    });
    return mat;
  }, []);

  // Pre-assign each particle to a pool
  const poolAssignments = useMemo(() => {
    const assignments: number[] = [];
    for (let i = 0; i < config.count; i++) {
      assignments.push(i % config.pools.length);
    }
    return assignments;
  }, [config.count, config.pools.length]);

  // Pre-compute per-particle phase offsets and radius jitter
  const particleMeta = useMemo(() => {
    const phases = new Float32Array(config.count);
    const radiusJitter = new Float32Array(config.count);
    const angleJitter = new Float32Array(config.count);
    for (let i = 0; i < config.count; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      radiusJitter[i] = Math.random() * 0.8 + 0.2;
      angleJitter[i] = Math.random() * Math.PI * 2;
    }
    return { phases, radiusJitter, angleJitter };
  }, [config.count]);

  // Pre-compute pool base colors as raw RGB to avoid per-frame `new THREE.Color()`
  // allocations (80 instances × 60fps = 4800 Color objects/sec → GC pressure).
  const poolRgb = useMemo(
    () => config.pools.map((p) => new THREE.Color(p.color)),
    [config.pools],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrameTick('weather', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    for (let i = 0; i < config.count; i++) {
      const poolIdx = poolAssignments[i];
      const pool = config.pools[poolIdx];
      const phase = particleMeta.phases[i];
      const rJitter = particleMeta.radiusJitter[i];
      const aJitter = particleMeta.angleJitter[i];

      // Position: scattered around pool center
      const r = pool.radius * rJitter;
      const angle = aJitter + t * 0.05;
      const x = pool.position[0] + Math.cos(angle) * r;
      const z = pool.position[2] + Math.sin(angle) * r;

      dummy.position.set(x, pool.position[1], z);

      // Scale: pulsing with rain shimmer
      const shimmer = 0.5 + 0.5 * Math.sin(t * pool.pulseSpeed * Math.PI * 2 + phase);
      const scale = (0.15 + shimmer * 0.25) * pool.intensity;
      dummy.scale.set(scale, scale, scale);

      // Rotate flat on ground
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color: blend pool color with slight variation
      const baseColor = poolRgb[poolIdx];
      const variation = 0.85 + 0.15 * Math.sin(t * 0.3 + phase);
      colorArray[i * 3] = baseColor.r * variation;
      colorArray[i * 3 + 1] = baseColor.g * variation;
      colorArray[i * 3 + 2] = baseColor.b * variation;
    }

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Global material opacity — simulate rain disturbance
    material.opacity = 0.08 + 0.04 * Math.sin(t * 0.7);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, config.count]}
      frustumCulled={false}
    />
  );
}
