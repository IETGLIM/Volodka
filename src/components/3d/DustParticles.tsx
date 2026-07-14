/* ─── Volodka RPG – Environmental Dust Particles ───
 * Ambient floating dust motes in Volodka's room.
 * Uses Points + PointMaterial from @react-three/drei.
 * Particles drift upward slowly with slight horizontal sin-wave sway.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/** Number of dust particles */
const PARTICLE_COUNT = 300;

/** Box volume half-extents (matches Volodka's room ~5×3×7m) */
const BOUNDS_X = 2.4;
const BOUNDS_Y = 1.4;
const BOUNDS_Z = 3.3;

/** Drift speed (m/s) — very slow upward float */
const DRIFT_SPEED = 0.04;

/** Horizontal sway amplitude (m) */
const SWAY_AMP = 0.12;

/** Horizontal sway frequency (rad/s) */
const SWAY_FREQ = 0.4;

/** Slight size variation multiplier range */
const SIZE_MIN = 0.02;
const SIZE_MAX = 0.04;

/** Warm amber-white color */
const DUST_COLOR = '#ffe8c0';

export function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  /* ── Generate initial positions, velocities, phases, and sizes ── */
  const { positions, phases, sizes, baseX } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT);
    const sz = new Float32Array(PARTICLE_COUNT);
    const bx = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = (Math.random() * 2 - 1) * BOUNDS_X;
      const y = Math.random() * BOUNDS_Y * 2;
      const z = (Math.random() * 2 - 1) * BOUNDS_Z;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      bx[i] = x;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN);
    }

    return { positions: pos, phases: ph, sizes: sz, baseX: bx };
  }, []);

  /* ── Animate particles each frame ── */
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const arr = posAttr.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Drift upward
      arr[i3 + 1] += DRIFT_SPEED * 0.016;

      // Horizontal sway (sin wave)
      arr[i3] = baseX[i] + Math.sin(t * SWAY_FREQ + phases[i]) * SWAY_AMP;

      // Wrap Y when above ceiling
      if (arr[i3 + 1] > BOUNDS_Y * 2) {
        arr[i3 + 1] = -0.1;
        // Re-randomize X base on wrap
        baseX[i] = (Math.random() * 2 - 1) * BOUNDS_X;
        arr[i3] = baseX[i];
        arr[i3 + 2] = (Math.random() * 2 - 1) * BOUNDS_Z;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        opacity={0.35}
        color={DUST_COLOR}
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}