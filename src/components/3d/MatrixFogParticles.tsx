
/* ─── Volodka RPG – Matrix-Style Digital Fog Particles ───
 *  Green-tinted particles with a digital, matrix-like appearance
 *  used exclusively in the battle scene.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

const BASE_PARTICLE_COUNT = 200;
const BOX_SIZE: [number, number, number] = [12, 8, 12];

export function MatrixFogParticles() {
  const isMobile = useIsMobileVisual();
  const { visualLite, effectsScale } = useMobileVisualPerf();
  const reducedMotion = useEffectiveReducedMotion();
  const particleCount = useMemo(
    () => getParticleCount(BASE_PARTICLE_COUNT, isMobile, visualLite, effectsScale, reducedMotion),
    [isMobile, visualLite, effectsScale, reducedMotion],
  );

  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const { positions, phases, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const pha = new Float32Array(particleCount);
    const vel = new Float32Array(particleCount * 3);

    const [bx, by, bz] = BOX_SIZE;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      pos[i3] = (Math.random() - 0.5) * bx;
      pos[i3 + 1] = Math.random() * by;
      pos[i3 + 2] = (Math.random() - 0.5) * bz;

      pha[i] = Math.random() * Math.PI * 2;

      // Slow drift with digital grid-aligned movement
      vel[i3] = (Math.random() - 0.5) * 0.15;
      vel[i3 + 1] = (Math.random() - 0.3) * 0.08;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.15;
    }

    return { positions: pos, phases: pha, velocities: vel };
  }, [particleCount]);

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
    const [bx, by, bz] = BOX_SIZE;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const phase = phases[i];

      // Base drift
      posArray[i3] += velocities[i3] * delta;
      posArray[i3 + 1] += velocities[i3 + 1] * delta;
      posArray[i3 + 2] += velocities[i3 + 2] * delta;

      // Digital-style jerky movement — snap to grid occasionally
      const snap = Math.sin(t * 2 + phase) > 0.9;
      if (snap) {
        posArray[i3] += (Math.random() - 0.5) * 0.3;
        posArray[i3 + 2] += (Math.random() - 0.5) * 0.3;
      }

      // Gentle swirling
      posArray[i3] += Math.sin(t * 0.4 + phase) * 0.005 * delta;
      posArray[i3 + 1] += Math.cos(t * 0.3 + phase * 2) * 0.003 * delta;
      posArray[i3 + 2] += Math.cos(t * 0.35 + phase * 1.5) * 0.005 * delta;

      // Wrap around
      if (posArray[i3] > bx / 2) posArray[i3] = -bx / 2;
      if (posArray[i3] < -bx / 2) posArray[i3] = bx / 2;
      if (posArray[i3 + 1] > by) posArray[i3 + 1] = 0;
      if (posArray[i3 + 1] < 0) posArray[i3 + 1] = by;
      if (posArray[i3 + 2] > bz / 2) posArray[i3 + 2] = -bz / 2;
      if (posArray[i3 + 2] < -bz / 2) posArray[i3 + 2] = bz / 2;
    }

    posAttr.needsUpdate = true;

    // Pulsing digital glow
    if (materialRef.current) {
      materialRef.current.opacity = 0.35 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color="#00ff44"
        size={0.05}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
