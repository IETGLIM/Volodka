
/* ─── Volodka RPG – Server Room Mist (guild_mainframe) ───
 *  Low-hanging mist/smoke particles for the cyberpunk server room.
 *  Cold blue-green tint, slow horizontal drift, occasional
 *  digital-style flicker (opacity spikes) to sell the cyberpunk aesthetic.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

interface MistConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  driftSpeed: number;
  color: string;
  sizeRange: [number, number];
  maxHeight: number;
  flickerFreq: number;
}

const MIST_CONFIGS: Record<string, MistConfig> = {
  guild_mainframe: {
    count: 100,
    position: [0, 0.4, -1],
    spread: [8, 1.5, 8],
    driftSpeed: 0.12,
    color: '#44ddbb',
    sizeRange: [0.08, 0.2],
    maxHeight: 1.8,
    flickerFreq: 1.5,
  },
};

export function ServerRoomMist({ sceneId }: { sceneId: string }) {
  const baseConfig = MIST_CONFIGS[sceneId];
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
  return <MistSystem config={config} />;
}

function MistSystem({ config }: { config: MistConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const { positions, phases, velocities } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
      pos[i3 + 1] = config.position[1] + Math.random() * config.maxHeight;
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;

      // Slow horizontal drift, very little vertical
      vel[i3] = (Math.random() - 0.5) * config.driftSpeed;
      vel[i3 + 1] = (Math.random() - 0.3) * 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * config.driftSpeed;
    }

    return { positions: pos, phases: pha, velocities: vel };
  }, [config]);

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

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Slow drift with slight swirling
      posArray[i3] += (velocities[i3] + Math.sin(t * 0.2 + phase) * 0.008) * delta;
      posArray[i3 + 1] += (velocities[i3 + 1] + Math.sin(t * 0.15 + phase * 1.7) * 0.003) * delta;
      posArray[i3 + 2] += (velocities[i3 + 2] + Math.cos(t * 0.18 + phase * 1.3) * 0.008) * delta;

      // Wrap within bounds
      const halfSpreadX = config.spread[0] / 2;
      const halfSpreadZ = config.spread[2] / 2;
      if (posArray[i3] > config.position[0] + halfSpreadX) posArray[i3] = config.position[0] - halfSpreadX;
      if (posArray[i3] < config.position[0] - halfSpreadX) posArray[i3] = config.position[0] + halfSpreadX;
      if (posArray[i3 + 1] > config.position[1] + config.maxHeight) posArray[i3 + 1] = config.position[1];
      if (posArray[i3 + 1] < config.position[1]) posArray[i3 + 1] = config.position[1] + config.maxHeight;
      if (posArray[i3 + 2] > config.position[2] + halfSpreadZ) posArray[i3 + 2] = config.position[2] - halfSpreadZ;
      if (posArray[i3 + 2] < config.position[2] - halfSpreadZ) posArray[i3 + 2] = config.position[2] + halfSpreadZ;
    }

    posAttr.needsUpdate = true;

    // Cyberpunk flicker — occasional opacity spikes simulating electrical interference
    if (materialRef.current) {
      const flicker = Math.sin(t * config.flickerFreq * Math.PI * 2);
      const spike = flicker > 0.92 ? 0.5 : 0;
      materialRef.current.opacity = 0.18 + Math.sin(t * 0.4) * 0.04 + spike;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={(config.sizeRange[0] + config.sizeRange[1]) / 2}
        transparent
        opacity={0.2}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
