
/* ─── Volodka RPG – Steam / Coffee Steam Particles ───
 *  Small upward-drifting particles simulating steam from coffee
 *  or kitchen cooking. Used in café and home_evening scenes.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

/* ── Per-scene steam config ── */

interface SteamConfig {
  count: number;
  position: [number, number, number];
  spread: number;
  riseSpeed: number;
  color: string;
  sizeRange: [number, number];
  maxHeight: number;
}

const STEAM_CONFIGS: Record<string, SteamConfig> = {
  cafe_evening: {
    count: 40,
    position: [2, 1.0, 1], // near the warm light
    spread: 0.3,
    riseSpeed: 0.4,
    color: '#ffddbb',
    sizeRange: [0.03, 0.07],
    maxHeight: 1.5,
  },
  home_evening: {
    count: 30,
    position: [0, 1.0, -1], // near kitchen area
    spread: 0.25,
    riseSpeed: 0.35,
    color: '#ffccaa',
    sizeRange: [0.03, 0.06],
    maxHeight: 1.2,
  },
};

export function SteamParticles({ sceneId }: { sceneId: string }) {
  const baseConfig = STEAM_CONFIGS[sceneId];
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

  return <SteamSystem config={config} />;
}

function SteamSystem({ config }: { config: SteamConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  // Pre-compute initial particle data
  const { positions, phases, initialVelocities } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Start near the steam source
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread;
      pos[i3 + 1] = config.position[1] + Math.random() * config.maxHeight * 0.3;
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread;

      pha[i] = Math.random() * Math.PI * 2;
      vel[i] = config.riseSpeed * (0.6 + Math.random() * 0.8);
    }

    return { positions: pos, phases: pha, initialVelocities: vel };
  }, [config]);

  // Mutable velocities stored in a ref to avoid immutability lint issue
  const velocitiesRef = useRef<Float32Array | null>(null);
  useEffect(() => {
    if (!velocitiesRef.current || velocitiesRef.current.length !== initialVelocities.length) {
      velocitiesRef.current = new Float32Array(initialVelocities);
    }
  }, [initialVelocities]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    const velocities = velocitiesRef.current;
    if (!velocities) return;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Rise upward with gentle drift
      posArray[i3 + 1] += velocities[i] * delta;
      posArray[i3] += Math.sin(t * 0.8 + phase) * 0.01 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.6 + phase * 1.3) * 0.01 * delta;

      // Reset when too high — steam dissipates
      if (posArray[i3 + 1] > config.position[1] + config.maxHeight) {
        posArray[i3] = config.position[0] + (Math.random() - 0.5) * config.spread;
        posArray[i3 + 1] = config.position[1] + Math.random() * 0.2;
        posArray[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread;
        velocities[i] = config.riseSpeed * (0.6 + Math.random() * 0.8);
      }
    }

    posAttr.needsUpdate = true;

    // Subtle opacity pulsing
    if (materialRef.current) {
      materialRef.current.opacity = 0.25 + Math.sin(t * 0.4) * 0.08;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={(config.sizeRange[0] + config.sizeRange[1]) / 2}
        transparent
        opacity={0.3}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
