
/* ─── Volodka RPG – AAA Snow Particle System ───
 *  Gentle snowflakes with organic drift, for winter street scene
 *  High-performance using THREE.Points with BufferGeometry
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/** Snow configuration */
interface SnowConfig {
  count: number;
  boxSize: [number, number, number];
  fallSpeedRange: [number, number];
  driftStrength: number;
  driftFrequency: number;
  sizeRange: [number, number];
  opacity: number;
  color: string;
}

const SNOW_CONFIGS: Record<'light' | 'medium' | 'heavy', SnowConfig> = {
  light: {
    count: 2000,
    boxSize: [40, 25, 40],
    fallSpeedRange: [0.3, 0.7],
    driftStrength: 0.6,
    driftFrequency: 0.4,
    sizeRange: [0.05, 0.12],
    opacity: 0.7,
    color: '#f0f0ff',
  },
  medium: {
    count: 3500,
    boxSize: [45, 28, 45],
    fallSpeedRange: [0.4, 0.9],
    driftStrength: 0.8,
    driftFrequency: 0.35,
    sizeRange: [0.06, 0.15],
    opacity: 0.8,
    color: '#e8e8f8',
  },
  heavy: {
    count: 5000,
    boxSize: [50, 30, 50],
    fallSpeedRange: [0.5, 1.2],
    driftStrength: 1.0,
    driftFrequency: 0.3,
    sizeRange: [0.07, 0.18],
    opacity: 0.85,
    color: '#dde0f0',
  },
};

/** High-performance snow particle system */
export function SnowSystem({ intensity = 1 }: { intensity?: number }) {
  const weatherEnabled = useGameStore((s) => s.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.rainIntensity);
  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();

  const configLevel = useMemo(() => {
    const effective = intensity * rainIntensity;
    if (effective < 0.33) return 'light' as const;
    if (effective < 0.66) return 'medium' as const;
    return 'heavy' as const;
  }, [intensity, rainIntensity]);

  const config = useMemo(() => {
    const base = SNOW_CONFIGS[configLevel];
    return {
      ...base,
      count: getParticleCount(base.count, isMobile, visualLite),
    };
  }, [configLevel, isMobile, visualLite]);

  if (!weatherEnabled) return null;

  return <SnowParticles config={config} intensity={intensity * rainIntensity} />;
}

function SnowParticles({ config, intensity }: { config: SnowConfig; intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);
  const hasEmittedEvent = useRef(false);

  const [bx, by, bz] = config.boxSize;

  // Pre-compute particle data
  const { positions, velocities, phases, sizes } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random spawn within box
      pos[i3] = (Math.random() - 0.5) * bx;
      pos[i3 + 1] = Math.random() * by;
      pos[i3 + 2] = (Math.random() - 0.5) * bz;

      // Slow drift velocity
      const fallSpeed = config.fallSpeedRange[0] + Math.random() * (config.fallSpeedRange[1] - config.fallSpeedRange[0]);
      vel[i3] = (Math.random() - 0.5) * 0.3;  // gentle X drift
      vel[i3 + 1] = -fallSpeed;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.3;  // gentle Z drift

      // Phase for organic movement variety
      pha[i] = Math.random() * Math.PI * 2;

      // Random size within range
      siz[i] = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
    }

    return { positions: pos, velocities: vel, phases: pha, sizes: siz };
  }, [config, bx, by, bz]);

  // Geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes.slice(), 1));
    return geo;
  }, [positions, sizes]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Emit weather:snow event once when snow starts
  useEffect(() => {
    if (!hasEmittedEvent.current) {
      eventBus.emit('weather:snow', { active: true, intensity });
      hasEmittedEvent.current = true;
    }
    return () => {
      if (hasEmittedEvent.current) {
        eventBus.emit('weather:snow', { active: false, intensity: 0 });
        hasEmittedEvent.current = false;
      }
    };
  }, [intensity]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;

    const clampedDelta = Math.min(delta, 0.05);
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;
    const time = timeRef.current;
    const drift = config.driftStrength;
    const freq = config.driftFrequency;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Base velocity movement
      posArray[i3] += velocities[i3] * clampedDelta * intensity;
      posArray[i3 + 1] += velocities[i3 + 1] * clampedDelta * intensity;
      posArray[i3 + 2] += velocities[i3 + 2] * clampedDelta * intensity;

      // Organic sinusoidal drift — snowflakes sway like real ones
      posArray[i3] += Math.sin(time * freq + phase) * drift * clampedDelta * intensity;
      posArray[i3 + 2] += Math.cos(time * freq * 0.7 + phase * 1.3) * drift * 0.6 * clampedDelta * intensity;

      // Slight vertical wobble
      posArray[i3 + 1] += Math.sin(time * freq * 1.5 + phase * 2.1) * 0.08 * clampedDelta * intensity;

      // Recycle when below ground
      if (posArray[i3 + 1] < -0.5) {
        posArray[i3] = (Math.random() - 0.5) * bx;
        posArray[i3 + 1] = by + Math.random() * 3;
        posArray[i3 + 2] = (Math.random() - 0.5) * bz;
      }

      // Wrap horizontally
      if (posArray[i3] > bx / 2) posArray[i3] = -bx / 2;
      if (posArray[i3] < -bx / 2) posArray[i3] = bx / 2;
      if (posArray[i3 + 2] > bz / 2) posArray[i3 + 2] = -bz / 2;
      if (posArray[i3 + 2] < -bz / 2) posArray[i3 + 2] = bz / 2;
    }

    posAttr.needsUpdate = true;

    // Animate material for subtle pulsing effect
    if (materialRef.current) {
      const breathe = config.opacity + Math.sin(time * 0.3) * 0.05;
      materialRef.current.opacity = breathe * intensity;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={0.1}
        transparent
        opacity={config.opacity * intensity}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
