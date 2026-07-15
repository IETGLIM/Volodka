/* ─── Volodka RPG – Generic Ambient Particles ───
 * Reusable floating particle system for various scene atmospheres.
 * Uses Points + PointMaterial from @react-three/drei.
 * Particles drift upward slowly with slight horizontal sin-wave sway.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface AmbientParticlesConfig {
  count?: number;                    // default 200
  boundsX?: [number, number];        // default [-5, 5]
  boundsY?: [number, number];        // default [0, 3]
  boundsZ?: [number, number];        // default [-5, 5]
  driftSpeed?: number;               // default 0.15
  swayAmp?: number;                  // default 0.3
  swayFreq?: number;                 // default 0.5
  sizeMin?: number;                  // default 0.02
  sizeMax?: number;                  // default 0.06
  color?: string;                    // default '#f59e0b' (amber)
  opacity?: number;                  // default 0.35
}

const DEFAULTS: Required<AmbientParticlesConfig> = {
  count: 200,
  boundsX: [-5, 5],
  boundsY: [0, 3],
  boundsZ: [-5, 5],
  driftSpeed: 0.15,
  swayAmp: 0.3,
  swayFreq: 0.5,
  sizeMin: 0.02,
  sizeMax: 0.06,
  color: '#f59e0b',
  opacity: 0.35,
};

export function AmbientParticles(config: AmbientParticlesConfig = {}) {
  const cfg = { ...DEFAULTS, ...config };
  const pointsRef = useRef<THREE.Points>(null);

  const count = cfg.count;
  const [bxMin, bxMax] = cfg.boundsX;
  const [byMin, byMax] = cfg.boundsY;
  const [bzMin, bzMax] = cfg.boundsZ;
  const xRange = bxMax - bxMin;
  const yRange = byMax - byMin;
  const zRange = bzMax - bzMin;

  const { positions, phases, baseX, baseZ } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const bx = new Float32Array(count);
    const bz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = bxMin + Math.random() * xRange;
      const y = byMin + Math.random() * yRange;
      const z = bzMin + Math.random() * zRange;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      bx[i] = x;
      bz[i] = z;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, phases: ph, baseX: bx, baseZ: bz };
  }, [count, bxMin, byMin, bzMin, xRange, yRange, zRange]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Drift upward
      arr[i3 + 1] += cfg.driftSpeed * 0.016;

      // Horizontal sway (sin wave)
      arr[i3] = baseX[i] + Math.sin(t * cfg.swayFreq + phases[i]) * cfg.swayAmp;

      // Wrap Y when above ceiling
      if (arr[i3 + 1] > byMax) {
        arr[i3 + 1] = byMin - 0.1;
        baseX[i] = bxMin + Math.random() * xRange;
        arr[i3] = baseX[i];
        baseZ[i] = bzMin + Math.random() * zRange;
        arr[i3 + 2] = baseZ[i];
      }
    }

    posAttr.needsUpdate = true;
  });

  const avgSize = (cfg.sizeMin + cfg.sizeMax) / 2;

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        opacity={cfg.opacity}
        color={cfg.color}
        size={avgSize}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}