
/* ─── Volodka RPG – AAA Weather & Atmospheric Particles ───
 *  Rain, snow, dust motes, embers, fireflies — per scene
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { seededRand } from '@/shared/utils/seededRand';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

/** Particle type per scene */
type ParticleType = 'rain' | 'snow' | 'dust' | 'embers' | 'fireflies' | 'sparks';

/** Scene → particle type mapping */
const SCENE_PARTICLES: Record<string, ParticleType> = {
  street_night: 'rain',
  street_winter: 'snow',
  volodka_room: 'dust',
  volodka_corridor: 'dust',
  home_evening: 'dust',
  cafe_evening: 'dust',
  library_day: 'dust',
  office_day: 'dust',
  zarema_albert_room: 'dust',
  abandoned_factory: 'embers',
  park_day: 'fireflies',
  rooftop_edge: 'dust',
  sleep_dream: 'fireflies',
  battle: 'sparks',
};

/** Per-type configuration */
interface ParticleConfig {
  count: number;
  boxSize: [number, number, number]; // spawn box dimensions
  colors: string[];
  sizeRange: [number, number]; // [min, max] size
  opacityRange: [number, number]; // [min, max] opacity
  depthWrite: boolean;
  blending: THREE.Blending;
}

const PARTICLE_CONFIGS: Record<ParticleType, ParticleConfig> = {
  rain: {
    count: 3000,
    boxSize: [40, 25, 40],
    colors: ['#aabbcc', '#99aacc', '#bbccdd'],
    sizeRange: [0.015, 0.03],
    opacityRange: [0.3, 0.6],
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
  snow: {
    count: 1500,
    boxSize: [40, 25, 40],
    colors: ['#ffffff', '#e8e8f0', '#d0d0e0'],
    sizeRange: [0.04, 0.1],
    opacityRange: [0.5, 0.9],
    depthWrite: false,
    blending: THREE.NormalBlending,
  },
  dust: {
    count: 200,
    boxSize: [15, 8, 15],
    colors: ['#ffdd88', '#ffe4a0', '#ffcc66'],
    sizeRange: [0.03, 0.06],
    opacityRange: [0.15, 0.4],
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
  embers: {
    count: 400,
    boxSize: [20, 15, 20],
    colors: ['#ff6622', '#ff8844', '#ffaa33', '#ff4400'],
    sizeRange: [0.04, 0.08],
    opacityRange: [0.6, 1.0],
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
  fireflies: {
    count: 60,
    boxSize: [25, 10, 25],
    colors: ['#44ff66', '#66ff88', '#33ff55', '#88ffaa'],
    sizeRange: [0.08, 0.15],
    opacityRange: [0.3, 0.8],
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
  sparks: {
    count: 800,
    boxSize: [20, 15, 20],
    colors: ['#ff8833', '#ffaa44', '#ff6611'],
    sizeRange: [0.04, 0.08],
    opacityRange: [0.5, 1.0],
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  },
};

/** Weather particles: rain, snow, dust, embers, fireflies based on sceneId */
export function ExplorationParticles() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();

  const particleType = useMemo<ParticleType | null>(() => {
    return SCENE_PARTICLES[sceneId] ?? null;
  }, [sceneId]);

  if (!particleType) return null;

  return (
    <ParticleSystem
      type={particleType}
      isMobile={isMobile}
      visualLite={visualLite}
      effectsScale={effectsScale}
      reducedMotion={reducedMotion}
    />
  );
}

/** AAA Particle system with pre-computed positions and per-type behavior */
function ParticleSystem({
  type,
  isMobile,
  visualLite,
  effectsScale,
  reducedMotion,
}: {
  type: ParticleType;
  isMobile: boolean;
  visualLite: boolean;
  effectsScale: number;
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const baseConfig = PARTICLE_CONFIGS[type];
  const config = useMemo(
    () => ({
      ...baseConfig,
      count: getParticleCount(baseConfig.count, isMobile, visualLite, effectsScale, reducedMotion),
    }),
    [baseConfig, isMobile, visualLite, effectsScale, reducedMotion],
  );

  // Pre-computed particle data (no Math.random in useFrame)
  const { positions, phases, sizes, initialVelocities } = useMemo(() => {
    const count = config.count;
    const [bx, by, bz] = config.boxSize;

    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const pha = new Float32Array(count); // phase offsets for varied animation
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Spawn within box
      pos[i3] = (Math.random() - 0.5) * bx;
      pos[i3 + 1] = Math.random() * by;
      pos[i3 + 2] = (Math.random() - 0.5) * bz;

      // Random phase for animation variety
      pha[i] = Math.random() * Math.PI * 2;

      // Random size within range
      const [sMin, sMax] = config.sizeRange;
      siz[i] = sMin + Math.random() * (sMax - sMin);

      // Per-type velocity
      switch (type) {
        case 'rain':
          // Fast falling, slight wind drift
          vel[i3] = (Math.random() - 0.5) * 0.5;      // slight X drift
          vel[i3 + 1] = -(12 + Math.random() * 6);     // fast fall
          vel[i3 + 2] = (Math.random() - 0.5) * 0.3;   // slight Z drift
          break;
        case 'snow':
          // Slow drift with lateral wander
          vel[i3] = (Math.random() - 0.5) * 0.4;
          vel[i3 + 1] = -(0.4 + Math.random() * 0.6);
          vel[i3 + 2] = (Math.random() - 0.5) * 0.4;
          break;
        case 'dust':
          // Very slow floating, gentle drift
          vel[i3] = (Math.random() - 0.5) * 0.08;
          vel[i3 + 1] = (Math.random() - 0.3) * 0.05; // mostly hovering
          vel[i3 + 2] = (Math.random() - 0.5) * 0.08;
          break;
        case 'embers':
          // Rising with random lateral motion
          vel[i3] = (Math.random() - 0.5) * 1.5;
          vel[i3 + 1] = 0.5 + Math.random() * 2;
          vel[i3 + 2] = (Math.random() - 0.5) * 1.5;
          break;
        case 'fireflies':
          // Very slow wandering
          vel[i3] = (Math.random() - 0.5) * 0.2;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.1;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.2;
          break;
        case 'sparks':
          // Fast rising then falling
          vel[i3] = (Math.random() - 0.5) * 2;
          vel[i3 + 1] = 1 + Math.random() * 3;
          vel[i3 + 2] = (Math.random() - 0.5) * 2;
          break;
      }
    }

    return { positions: pos, initialVelocities: vel, phases: pha, sizes: siz };
  }, [type, config]);

  // Mutable velocity storage (ref allows modification in useFrame without lint issues)
  const velocitiesRef = useRef<Float32Array | null>(null);
  const resetGenRef = useRef<Uint32Array | null>(null);
  useEffect(() => {
    if (!velocitiesRef.current || velocitiesRef.current.length !== initialVelocities.length) {
      velocitiesRef.current = new Float32Array(initialVelocities);
    }
    resetGenRef.current = new Uint32Array(config.count);
  }, [initialVelocities, config.count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes.slice(), 1));
    return geo;
  }, [positions, sizes]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Material properties for declarative rendering (avoids immutability lint issues)
  const matProps = useMemo(() => {
    const baseColor = config.colors[0];
    const blendNum = config.blending === THREE.AdditiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending;

    const base: { color: string; size: number; transparent: boolean; opacity: number; depthWrite: boolean; sizeAttenuation: boolean; blending: THREE.Blending } = {
      color: baseColor,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
      depthWrite: config.depthWrite,
      sizeAttenuation: true,
      blending: blendNum,
    };

    switch (type) {
      case 'rain':      return { ...base, size: 0.025, opacity: 0.5 };
      case 'snow':      return { ...base, size: 0.08,  opacity: 0.8 };
      case 'dust':      return { ...base, size: 0.05,  opacity: 0.3 };
      case 'embers':    return { ...base, size: 0.06,  opacity: 0.9 };
      case 'fireflies': return { ...base, size: 0.12,  opacity: 0.6 };
      case 'sparks':    return { ...base, size: 0.06,  opacity: 0.9 };
    }
  }, [type, config]);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;

    const velocities = velocitiesRef.current;
    const resetGen = resetGenRef.current;
    if (!velocities || !resetGen) return;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const count = config.count;
    const [bx, by, bz] = config.boxSize;
    const time = timeRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Base movement
      posArray[i3] += velocities[i3] * dt;
      posArray[i3 + 1] += velocities[i3 + 1] * dt;
      posArray[i3 + 2] += velocities[i3 + 2] * dt;

      // Per-type special behavior
      switch (type) {
        case 'rain':
          // Rain streaks fall fast, reset when below ground
          if (posArray[i3 + 1] < -1) {
            const gen = ++resetGen[i];
            const seed = i * 1000 + gen * 100;
            posArray[i3] = (seededRand(seed + 0) - 0.5) * bx;
            posArray[i3 + 1] = by + seededRand(seed + 1) * 3;
            posArray[i3 + 2] = (seededRand(seed + 2) - 0.5) * bz;
          }
          break;

        case 'snow':
          // Snow drifts laterally with sinusoidal wind
          posArray[i3] += Math.sin(time * 0.5 + phase) * 0.02 * dt;
          posArray[i3 + 2] += Math.cos(time * 0.3 + phase * 1.3) * 0.015 * dt;
          if (posArray[i3 + 1] < -1) {
            const gen = ++resetGen[i];
            const seed = i * 1000 + gen * 100;
            posArray[i3] = (seededRand(seed + 0) - 0.5) * bx;
            posArray[i3 + 1] = by + seededRand(seed + 1) * 3;
            posArray[i3 + 2] = (seededRand(seed + 2) - 0.5) * bz;
          }
          break;

        case 'dust':
          // Dust motes float in slow circular paths
          posArray[i3] += Math.sin(time * 0.3 + phase) * 0.005 * dt;
          posArray[i3 + 1] += Math.sin(time * 0.2 + phase * 2) * 0.003 * dt;
          posArray[i3 + 2] += Math.cos(time * 0.25 + phase * 1.5) * 0.005 * dt;
          // Wrap around box boundaries
          if (posArray[i3] > bx / 2) posArray[i3] = -bx / 2;
          if (posArray[i3] < -bx / 2) posArray[i3] = bx / 2;
          if (posArray[i3 + 1] > by) posArray[i3 + 1] = 0;
          if (posArray[i3 + 1] < 0) posArray[i3 + 1] = by;
          if (posArray[i3 + 2] > bz / 2) posArray[i3 + 2] = -bz / 2;
          if (posArray[i3 + 2] < -bz / 2) posArray[i3 + 2] = bz / 2;
          break;

        case 'embers':
          // Embers rise, decelerate, and drift
          velocities[i3 + 1] -= 0.5 * dt; // slight gravity
          posArray[i3] += Math.sin(time * 1.5 + phase) * 0.03 * dt;
          // Reset when too high or fallen
          if (posArray[i3 + 1] > by || posArray[i3 + 1] < -1) {
            const gen = ++resetGen[i];
            const seed = i * 1000 + gen * 100;
            posArray[i3] = (seededRand(seed + 0) - 0.5) * bx * 0.6;
            posArray[i3 + 1] = seededRand(seed + 1) * 2;
            posArray[i3 + 2] = (seededRand(seed + 2) - 0.5) * bz * 0.6;
            velocities[i3 + 1] = 0.5 + seededRand(seed + 3) * 2;
          }
          break;

        case 'fireflies':
          // Fireflies wander slowly with pulsing glow
          posArray[i3] += Math.sin(time * 0.4 + phase) * 0.08 * dt;
          posArray[i3 + 1] += Math.sin(time * 0.25 + phase * 2.1) * 0.05 * dt;
          posArray[i3 + 2] += Math.cos(time * 0.35 + phase * 1.7) * 0.08 * dt;
          // Wrap around
          if (posArray[i3] > bx / 2) posArray[i3] = -bx / 2;
          if (posArray[i3] < -bx / 2) posArray[i3] = bx / 2;
          if (posArray[i3 + 1] > by) posArray[i3 + 1] = 0.5;
          if (posArray[i3 + 1] < 0) posArray[i3 + 1] = by * 0.8;
          if (posArray[i3 + 2] > bz / 2) posArray[i3 + 2] = -bz / 2;
          if (posArray[i3 + 2] < -bz / 2) posArray[i3 + 2] = bz / 2;
          break;

        case 'sparks':
          // Sparks: gravity pulls them down
          velocities[i3 + 1] -= 3 * dt;
          if (posArray[i3 + 1] < -1) {
            const gen = ++resetGen[i];
            const seed = i * 1000 + gen * 100;
            posArray[i3] = (seededRand(seed + 0) - 0.5) * bx * 0.5;
            posArray[i3 + 1] = seededRand(seed + 1) * 2;
            posArray[i3 + 2] = (seededRand(seed + 2) - 0.5) * bz * 0.5;
            velocities[i3] = (seededRand(seed + 3) - 0.5) * 2;
            velocities[i3 + 1] = 1 + seededRand(seed + 4) * 3;
            velocities[i3 + 2] = (seededRand(seed + 5) - 0.5) * 2;
          }
          break;
      }
    }

    posAttr.needsUpdate = true;

    // Animate material opacity for firefly pulsing
    if (type === 'fireflies' && materialRef.current) {
      const pulse = 0.3 + Math.sin(time * 2) * 0.3;
      materialRef.current.opacity = pulse;
    }

    // Animate dust opacity for slow breathing
    if (type === 'dust' && materialRef.current) {
      const breathe = 0.2 + Math.sin(time * 0.5) * 0.1;
      materialRef.current.opacity = breathe;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={matProps.color}
        size={matProps.size}
        transparent={matProps.transparent}
        opacity={matProps.opacity}
        depthWrite={matProps.depthWrite}
        sizeAttenuation={matProps.sizeAttenuation}
        blending={matProps.blending}
      />
    </points>
  );
}
