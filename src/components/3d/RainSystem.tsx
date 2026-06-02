'use client';

/* ─── Volodka RPG – AAA Rain Particle System ───
 *  High-performance rain using THREE.Points with BufferGeometry
 *  Supports configurable intensity, wind angle, ground splashes
 *  Emits weather:rain event for AudioEngine integration
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/** Rain configuration */
interface RainConfig {
  /** Number of rain particles */
  count: number;
  /** Spawn box dimensions [width, height, depth] */
  boxSize: [number, number, number];
  /** Fall speed range [min, max] */
  fallSpeedRange: [number, number];
  /** Wind angle in radians (0 = straight down, positive = rightward lean) */
  windAngle: number;
  /** Wind strength (horizontal push per second) */
  windStrength: number;
  /** Rain drop length (visual elongation) */
  dropLength: number;
  /** Color of rain drops */
  color: string;
  /** Opacity of rain drops */
  opacity: number;
}

const RAIN_CONFIGS: Record<'light' | 'medium' | 'heavy', RainConfig> = {
  light: {
    count: 3000,
    boxSize: [30, 25, 30],
    fallSpeedRange: [10, 14],
    windAngle: 0.1,
    windStrength: 1.5,
    dropLength: 0.4,
    color: '#a8c0d8',
    opacity: 0.35,
  },
  medium: {
    count: 8000,
    boxSize: [40, 28, 40],
    fallSpeedRange: [12, 18],
    windAngle: 0.15,
    windStrength: 2.5,
    dropLength: 0.5,
    color: '#9ab4cc',
    opacity: 0.45,
  },
  heavy: {
    count: 14000,
    boxSize: [50, 30, 50],
    fallSpeedRange: [14, 22],
    windAngle: 0.2,
    windStrength: 3.5,
    dropLength: 0.6,
    color: '#88a8c4',
    opacity: 0.55,
  },
};

/* ─── Splash System ─── */
const MAX_SPLASHES = 300;
const SPLASH_LIFETIME = 0.4; // seconds

interface SplashData {
  x: number;
  z: number;
  age: number;
  alive: boolean;
  size: number;
}

/** High-performance rain particle system */
export function RainSystem({ intensity = 1 }: { intensity?: number }) {
  const rainEnabled = useGameStore((s) => s.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.rainIntensity);

  // Determine config based on intensity
  const configLevel = useMemo(() => {
    const effectiveIntensity = intensity * rainIntensity;
    if (effectiveIntensity < 0.33) return 'light' as const;
    if (effectiveIntensity < 0.66) return 'medium' as const;
    return 'heavy' as const;
  }, [intensity, rainIntensity]);

  const config = RAIN_CONFIGS[configLevel];

  if (!rainEnabled) return null;

  return <RainParticles config={config} intensity={intensity * rainIntensity} />;
}

function RainParticles({ config, intensity }: { config: RainConfig; intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);
  const hasEmittedEvent = useRef(false);

  // Splash state
  const splashRef = useRef<THREE.Points>(null);
  const splashMaterialRef = useRef<THREE.PointsMaterial>(null);
  const splashesRef = useRef<SplashData[]>([]);
  const splashPoolIdx = useRef(0);

  const [bx, by, bz] = config.boxSize;

  // Pre-compute particle data
  const { positions, velocities, phases } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const pha = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Random spawn within box
      pos[i3] = (Math.random() - 0.5) * bx;
      pos[i3 + 1] = Math.random() * by;
      pos[i3 + 2] = (Math.random() - 0.5) * bz;

      // Velocity: fast downward with wind drift
      const fallSpeed = config.fallSpeedRange[0] + Math.random() * (config.fallSpeedRange[1] - config.fallSpeedRange[0]);
      vel[i3] = Math.sin(config.windAngle) * config.windStrength * (0.8 + Math.random() * 0.4);  // wind X
      vel[i3 + 1] = -fallSpeed;  // fast fall
      vel[i3 + 2] = (Math.random() - 0.5) * 0.3;  // slight Z drift

      // Phase for varied animation
      pha[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, velocities: vel, phases: pha };
  }, [config, bx, by, bz]);

  // Rain geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  // Splash geometry
  const splashGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const splashPositions = new Float32Array(MAX_SPLASHES * 3);
    const splashSizes = new Float32Array(MAX_SPLASHES);
    geo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(splashSizes, 1));
    return geo;
  }, []);

  // Initialize splash pool
  useEffect(() => {
    splashesRef.current = Array.from({ length: MAX_SPLASHES }, () => ({
      x: 0, z: 0, age: SPLASH_LIFETIME + 1, alive: false, size: 0,
    }));
  }, []);

  // Emit weather:rain event once when rain starts
  useEffect(() => {
    if (!hasEmittedEvent.current) {
      eventBus.emit('weather:rain', { active: true, intensity });
      hasEmittedEvent.current = true;
    }
    return () => {
      if (hasEmittedEvent.current) {
        eventBus.emit('weather:rain', { active: false, intensity: 0 });
        hasEmittedEvent.current = false;
      }
    };
  }, [intensity]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    timeRef.current += delta;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;
    const clampedDelta = Math.min(delta, 0.05); // prevent huge jumps on tab switch

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Move particle
      posArray[i3] += velocities[i3] * clampedDelta * intensity;
      posArray[i3 + 1] += velocities[i3 + 1] * clampedDelta * intensity;
      posArray[i3 + 2] += velocities[i3 + 2] * clampedDelta * intensity;

      // Recycle when below ground
      if (posArray[i3 + 1] < -0.5) {
        // Spawn a splash at ground level
        spawnSplash(splashesRef, splashPoolIdx, posArray[i3], posArray[i3 + 2]);

        // Reset to top
        posArray[i3] = (Math.random() - 0.5) * bx;
        posArray[i3 + 1] = by + Math.random() * 5;
        posArray[i3 + 2] = (Math.random() - 0.5) * bz;
      }

      // Wrap horizontally
      if (posArray[i3] > bx / 2) posArray[i3] = -bx / 2;
      if (posArray[i3] < -bx / 2) posArray[i3] = bx / 2;
      if (posArray[i3 + 2] > bz / 2) posArray[i3 + 2] = -bz / 2;
      if (posArray[i3 + 2] < -bz / 2) posArray[i3 + 2] = bz / 2;
    }

    posAttr.needsUpdate = true;

    // Update splashes
    if (splashRef.current) {
      const splashPosAttr = splashRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const splashSizeAttr = splashRef.current.geometry.getAttribute('size') as THREE.BufferAttribute;
      const splashPosArray = splashPosAttr.array as Float32Array;
      const splashSizeArray = splashSizeAttr.array as Float32Array;
      const splashes = splashesRef.current;

      for (let i = 0; i < MAX_SPLASHES; i++) {
        const splash = splashes[i];
        if (!splash.alive) {
          splashSizeArray[i] = 0;
          continue;
        }

        splash.age += clampedDelta;
        if (splash.age >= SPLASH_LIFETIME) {
          splash.alive = false;
          splashSizeArray[i] = 0;
          continue;
        }

        const t = splash.age / SPLASH_LIFETIME;
        const spread = splash.size * t;
        splashPosArray[i * 3] = splash.x;
        splashPosArray[i * 3 + 1] = 0.02;
        splashPosArray[i * 3 + 2] = splash.z;

        // Size expands then shrinks
        splashSizeArray[i] = spread * (1 - t * t) * 2;
      }

      splashPosAttr.needsUpdate = true;
      splashSizeAttr.needsUpdate = true;
    }

    // Subtle material opacity animation for depth
    if (materialRef.current) {
      const breathe = config.opacity + Math.sin(timeRef.current * 0.5) * 0.03;
      materialRef.current.opacity = breathe * intensity;
    }

    if (splashMaterialRef.current) {
      splashMaterialRef.current.opacity = 0.4 * intensity;
    }
  });

  return (
    <group>
      {/* Rain streaks */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          color={config.color}
          size={config.dropLength}
          transparent
          opacity={config.opacity * intensity}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Ground splashes */}
      <points ref={splashRef} geometry={splashGeometry}>
        <pointsMaterial
          ref={splashMaterialRef}
          color="#b0c8e0"
          size={0.3}
          transparent
          opacity={0.4 * intensity}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Spawn a splash particle at the given world position */
function spawnSplash(
  splashesRef: React.MutableRefObject<SplashData[]>,
  poolIdx: React.MutableRefObject<number>,
  x: number,
  z: number,
): void {
  const splashes = splashesRef.current;
  if (!splashes.length) return;

  const idx = poolIdx.current % MAX_SPLASHES;
  poolIdx.current++;

  splashes[idx] = {
    x,
    z,
    age: 0,
    alive: true,
    size: 0.1 + Math.random() * 0.15,
  };
}
