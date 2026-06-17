
/* ─── Volodka RPG – Weather & Atmospheric Particle Systems ───
 *  Scene-specific animated particle systems for atmospheric effects:
 *  - Dust motes (volodka_room, library_day)
 *  - Floating embers (abandoned_factory)
 *  Rain/snow are handled by WeatherController → RainSystem/SnowSystem (GPU).
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

// ═══════════════════════════════════════════════════
//  DUST MOTES — small, slow particles caught in light
// ═══════════════════════════════════════════════════

interface DustConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  sizeRange: [number, number];
  speed: number;
  color: string;
}

const DUST_CONFIGS: Record<string, DustConfig> = {
  volodka_room: {
    count: 50,
    position: [0, 1.5, -1],
    spread: [4, 2.5, 5],
    sizeRange: [0.008, 0.02],
    speed: 0.08,
    color: '#aaffaa',
  },
  library_day: {
    count: 60,
    position: [2, 2, -2],
    spread: [8, 3, 8],
    sizeRange: [0.008, 0.018],
    speed: 0.06,
    color: '#ffddaa',
  },
};

export function DustMotes({ sceneId }: { sceneId: string }) {
  const baseConfig = DUST_CONFIGS[sceneId];
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
  return <DustSystem config={config} />;
}

function DustSystem({ config }: { config: DustConfig }) {
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
      pos[i3 + 1] = config.position[1] + (Math.random() - 0.5) * config.spread[1];
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;

      // Very slow random drift
      vel[i3] = (Math.random() - 0.5) * config.speed;
      vel[i3 + 1] = (Math.random() - 0.5) * config.speed * 0.5;
      vel[i3 + 2] = (Math.random() - 0.5) * config.speed;
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

      // Gentle floating in light — sinusoidal drift + slow velocity
      posArray[i3] += (velocities[i3] + Math.sin(t * 0.3 + phase) * 0.002) * delta;
      posArray[i3 + 1] += (velocities[i3 + 1] + Math.sin(t * 0.2 + phase * 1.5) * 0.001) * delta;
      posArray[i3 + 2] += (velocities[i3 + 2] + Math.cos(t * 0.25 + phase * 0.8) * 0.002) * delta;

      // Wrap within bounds
      for (let axis = 0; axis < 3; axis++) {
        const center = config.position[axis];
        const halfSpread = config.spread[axis] / 2;
        if (posArray[i3 + axis] > center + halfSpread) {
          posArray[i3 + axis] = center - halfSpread;
        } else if (posArray[i3 + axis] < center - halfSpread) {
          posArray[i3 + axis] = center + halfSpread;
        }
      }
    }

    posAttr.needsUpdate = true;

    // Subtle opacity pulsing to simulate light catching particles
    if (materialRef.current) {
      materialRef.current.opacity = 0.2 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={(config.sizeRange[0] + config.sizeRange[1]) / 2}
        transparent
        opacity={0.25}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════
//  FLOATING EMBERS — glowing particles rising slowly
// ═══════════════════════════════════════════════════

interface EmberConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  riseSpeed: number;
  color: string;
}

const EMBER_CONFIGS: Record<string, EmberConfig> = {
  abandoned_factory: {
    count: 40,
    position: [0, 1, -4],
    spread: [8, 5, 8],
    riseSpeed: 0.6,
    color: '#ff6622',
  },
};

export function EmberParticles({ sceneId }: { sceneId: string }) {
  const baseConfig = EMBER_CONFIGS[sceneId];
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
  return <EmberSystem config={config} />;
}

function EmberSystem({ config }: { config: EmberConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const { positions, phases, sizes: _sizes } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
      pos[i3 + 1] = config.position[1] + Math.random() * config.spread[1];
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;
      siz[i] = 0.02 + Math.random() * 0.04;
    }

    return { positions: pos, phases: pha, sizes: siz };
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

      // Rise upward with drift
      posArray[i3 + 1] += (config.riseSpeed + Math.sin(t * 0.5 + phase) * 0.2) * delta;
      posArray[i3] += Math.sin(t * 0.8 + phase) * 0.05 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.6 + phase * 1.3) * 0.05 * delta;

      // Reset at top
      if (posArray[i3 + 1] > config.position[1] + config.spread[1]) {
        posArray[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
        posArray[i3 + 1] = config.position[1] + Math.random() * 0.5;
        posArray[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];
      }
    }

    posAttr.needsUpdate = true;

    // Ember glow pulsing
    if (materialRef.current) {
      materialRef.current.opacity = 0.4 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={0.04}
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

