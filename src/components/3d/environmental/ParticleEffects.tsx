/* ─── Volodka RPG – Reusable Particle Effects System ───
 * Types: dust_motes, fireflies, embers, snow
 * Max 200 particles per instance, auto-recycle dead particles.
 * Uses the existing useFrameTick budget system for GPU-friendly updates.
 */

import { useRef, useMemo, useEffect } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, ShaderMaterial } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

export type ParticleType = 'dust_motes' | 'fireflies' | 'embers' | 'snow';

interface ParticleConfig {
  /** Max simultaneous particles (performance budget) */
  maxParticles: number;
  /** Particles spawned per second */
  spawnRate: number;
  /** Lifetime range [min, max] in seconds */
  lifetimeRange: [number, number];
  /** Size range [min, max] */
  sizeRange: [number, number];
  /** Velocity range [min, max] for each axis */
  velocityRange: { x: [number, number]; y: [number, number]; z: [number, number]; };
  /** Spread radius for spawn position */
  spawnSpread: number;
  /** Base color hex */
  color: string;
  /** Max opacity (0-1) */
  maxOpacity: number;
  /** Whether particles glow (additive blending) */
  glow: boolean;
  /** Gravity multiplier (positive = down, negative = up) */
  gravity: number;
  /** Damping factor per second (1.0 = no damping) */
  damping: number;
  /** Opacity fade mode */
  fadeMode: 'in-out' | 'out-only' | 'in-only';
}

/* ══════════════════════════════════════════════════════════════
   PRESETS
   ══════════════════════════════════════════════════════════════ */

const PARTICLE_PRESETS: Record<ParticleType, ParticleConfig> = {
  dust_motes: {
    maxParticles: 200,
    spawnRate: 4,
    lifetimeRange: [6, 14],
    sizeRange: [0.01, 0.03],
    velocityRange: { x: [-0.03, 0.03], y: [0.01, 0.06], z: [-0.03, 0.03] },
    spawnSpread: 3.0,
    color: '#d4c8a0',
    maxOpacity: 0.35,
    glow: true,
    gravity: -0.005,
    damping: 0.98,
    fadeMode: 'in-out',
  },
  fireflies: {
    maxParticles: 80,
    spawnRate: 2,
    lifetimeRange: [4, 10],
    sizeRange: [0.03, 0.06],
    velocityRange: { x: [-0.08, 0.08], y: [-0.04, 0.04], z: [-0.08, 0.08] },
    spawnSpread: 5.0,
    color: '#aadd44',
    maxOpacity: 0.9,
    glow: true,
    gravity: 0,
    damping: 0.95,
    fadeMode: 'in-out',
  },
  embers: {
    maxParticles: 120,
    spawnRate: 8,
    lifetimeRange: [1.5, 4],
    sizeRange: [0.01, 0.025],
    velocityRange: { x: [-0.1, 0.1], y: [0.15, 0.4], z: [-0.1, 0.1] },
    spawnSpread: 0.8,
    color: '#ff6622',
    maxOpacity: 0.8,
    glow: true,
    gravity: -0.02,
    damping: 0.99,
    fadeMode: 'out-only',
  },
  snow: {
    maxParticles: 200,
    spawnRate: 15,
    lifetimeRange: [5, 12],
    sizeRange: [0.02, 0.05],
    velocityRange: { x: [-0.05, 0.05], y: [-0.15, -0.06], z: [-0.05, 0.05] },
    spawnSpread: 6.0,
    color: '#e8eef8',
    maxOpacity: 0.7,
    glow: false,
    gravity: 0.01,
    damping: 0.995,
    fadeMode: 'in-out',
  },
};

/* ══════════════════════════════════════════════════════════════
   PARTICLE DATA
   ══════════════════════════════════════════════════════════════ */

interface ParticleData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number;
  maxLife: number;
  size: number;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */

export interface ParticleEffectsProps {
  type: ParticleType;
  /** Center position of the particle volume */
  position?: [number, number, number];
  /** Whether the system is visible */
  visible?: boolean;
}

function ParticleSystemInner({ type, position = [0, 0, 0], visible = true }: ParticleEffectsProps) {
  const config = PARTICLE_PRESETS[type];
  const maxParticles = config.maxParticles;
  const groupRef = useRef<Group>(null);
  const spawnAccumRef = useRef(0);
  const particlesRef = useRef<ParticleData[]>([]);
  const timeRef = useRef(0);

  // Pre-allocate BufferGeometry + custom ShaderMaterial
  const { geometry, positionAttr, opacityAttr, sizeAttr, colorAttr, material } = useMemo(() => {
    const positions = new Float32Array(maxParticles * 3);
    const opacities = new Float32Array(maxParticles);
    const sizes = new Float32Array(maxParticles);
    const colors = new Float32Array(maxParticles * 3);

    // Hide all particles initially
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3 + 1] = -100;
      opacities[i] = 0;
      sizes[i] = 0;
    }

    const posAttr = new BufferAttribute(positions, 3);
    const opacAttr = new BufferAttribute(opacities, 1);
    const sizeAttr = new BufferAttribute(sizes, 1);
    const colAttr = new BufferAttribute(colors, 3);

    const geo = new BufferGeometry();
    geo.setAttribute('position', posAttr);
    geo.setAttribute('aOpacity', opacAttr);
    geo.setAttribute('aSize', sizeAttr);
    geo.setAttribute('aColor', colAttr);
    geo.setDrawRange(0, 0);

    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: config.glow ? AdditiveBlending : undefined,
      uniforms: {},
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        attribute vec3 aColor;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
          vOpacity = aOpacity;
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 300.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.12, dist) * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    return {
      geometry: geo,
      positionAttr: posAttr,
      opacityAttr: opacAttr,
      sizeAttr,
      colorAttr: colAttr,
      material: mat,
    };
  }, [maxParticles]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispose on unmount
  useEffect(() => {
    const geo = geometry;
    const mat = material;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geometry, material]);

  // Firefly color cycling — precompute two target colors
  const fireflyColorA = useMemo(() => new Color('#aadd44'), []);
  const fireflyColorB = useMemo(() => new Color('#88cc22'), []);
  const baseColor = useMemo(() => new Color(config.color), [config.color]);

  // Frame tick — update particles
  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current || !visible) return;
    timeRef.current += delta;

    // Spawn new particles
    spawnAccumRef.current += delta * config.spawnRate;
    while (spawnAccumRef.current >= 1 && particlesRef.current.length < maxParticles) {
      spawnAccumRef.current -= 1;
      const spread = config.spawnSpread;
      particlesRef.current.push({
        x: position[0] + (Math.random() - 0.5) * spread,
        y: position[1] + (Math.random() - 0.5) * spread,
        z: position[2] + (Math.random() - 0.5) * spread,
        vx: randomRange(config.velocityRange.x[0], config.velocityRange.x[1]),
        vy: randomRange(config.velocityRange.y[0], config.velocityRange.y[1]),
        vz: randomRange(config.velocityRange.z[0], config.velocityRange.z[1]),
        life: 0,
        maxLife: randomRange(config.lifetimeRange[0], config.lifetimeRange[1]),
        size: randomRange(config.sizeRange[0], config.sizeRange[1]),
      });
    }

    // Update & compact alive particles
    const posArr = positionAttr.array as Float32Array;
    const opacArr = opacityAttr.array as Float32Array;
    const sizeArr = sizeAttr.array as Float32Array;
    const colArr = colorAttr.array as Float32Array;
    let writeIdx = 0;
    const t = timeRef.current;

    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.life += delta;
      if (p.life >= p.maxLife) continue; // Dead — skip (auto-recycle)

      // Apply velocity + damping
      p.vy += config.gravity * delta;
      p.vx *= Math.pow(config.damping, delta * 60);
      p.vy *= Math.pow(config.damping, delta * 60);
      p.vz *= Math.pow(config.damping, delta * 60);
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;

      // Life ratio for fade
      const lifeRatio = p.life / p.maxLife;

      // Compute opacity based on fade mode
      let opacity: number;
      switch (config.fadeMode) {
        case 'in-out':
          opacity = lifeRatio < 0.2
            ? (lifeRatio / 0.2) * config.maxOpacity
            : lifeRatio > 0.7
              ? ((1 - lifeRatio) / 0.3) * config.maxOpacity
              : config.maxOpacity;
          break;
        case 'out-only':
          opacity = (1 - lifeRatio) * config.maxOpacity;
          break;
        case 'in-only':
          opacity = Math.min(lifeRatio / 0.3, 1) * config.maxOpacity;
          break;
      }

      // Fireflies pulse opacity
      if (type === 'fireflies') {
        opacity *= 0.5 + 0.5 * Math.sin(t * 3.0 + i * 1.7);
      }

      // Snow drift (sinusoidal horizontal wobble)
      if (type === 'snow') {
        p.x += Math.sin(t * 0.5 + i * 0.7) * 0.002;
        p.z += Math.cos(t * 0.3 + i * 1.1) * 0.002;
      }

      // Dust motes drift (slow sinusoidal)
      if (type === 'dust_motes') {
        p.x += Math.sin(t * 0.2 + i * 2.3) * 0.001;
        p.z += Math.cos(t * 0.15 + i * 1.9) * 0.001;
      }

      // Size growth for embers (cooling particles expand)
      const currentSize = type === 'embers'
        ? p.size * (1 + lifeRatio * 1.5)
        : p.size;

      // Write to buffers
      posArr[writeIdx * 3] = p.x;
      posArr[writeIdx * 3 + 1] = p.y;
      posArr[writeIdx * 3 + 2] = p.z;
      opacArr[writeIdx] = opacity;
      sizeArr[writeIdx] = currentSize;

      // Per-particle color (firefly cycling between yellow-green and green)
      if (type === 'fireflies') {
        const blend = 0.5 + 0.5 * Math.sin(t * 1.2 + i * 2.1);
        colArr[writeIdx * 3] = fireflyColorA.r * (1 - blend) + fireflyColorB.r * blend;
        colArr[writeIdx * 3 + 1] = fireflyColorA.g * (1 - blend) + fireflyColorB.g * blend;
        colArr[writeIdx * 3 + 2] = fireflyColorA.b * (1 - blend) + fireflyColorB.b * blend;
      } else {
        colArr[writeIdx * 3] = baseColor.r;
        colArr[writeIdx * 3 + 1] = baseColor.g;
        colArr[writeIdx * 3 + 2] = baseColor.b;
      }

      particlesRef.current[writeIdx] = p;
      writeIdx++;
    }
    particlesRef.current.length = writeIdx;

    // Zero out stale slots
    for (let i = writeIdx; i < maxParticles; i++) {
      opacArr[i] = 0;
      sizeArr[i] = 0;
    }

    geometry.setDrawRange(0, writeIdx);
    positionAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}

/** 3D particle system rendered inside a Canvas (R3F). */
export function ParticleEffects(props: ParticleEffectsProps) {
  if (props.visible === false) return null;
  return <ParticleSystemInner {...props} />;
}

/* ══════════════════════════════════════════════════════════════
   HOOK: useParticleSystem
   ══════════════════════════════════════════════════════════════ */

export interface UseParticleSystemOptions {
  type: ParticleType;
  position?: [number, number, number];
  visible?: boolean;
}

/** React hook that returns everything needed to render the particle system.
 *  Usage: const particles = useParticleSystem('fireflies');
 *  Then render <ParticleEffects {...particles} /> inside R3F Canvas.
 */
export function useParticleSystem(options: UseParticleSystemOptions): ParticleEffectsProps {
  return {
    type: options.type,
    position: options.position,
    visible: options.visible ?? true,
  };
}
