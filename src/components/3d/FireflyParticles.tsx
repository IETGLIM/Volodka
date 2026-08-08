/* ─── Volodka RPG – Firefly / Fairy-tale Ambient Particles ───
 *  Softly pulsing warm light motes for evening/forest/dream scenes.
 *  Glows slowly, drifts organically, fades in and out — fairy-tale atmosphere.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { getParticleCount } from '@/shared/utils/mobileParticleScale';

interface FireflyConfig {
  count: number;
  position: [number, number, number];
  spread: [number, number, number];
  sizeRange: [number, number];
  color: string;
  glowColor: string;
  pulseSpeed: number;
  pulseAmp: number;
  driftSpeed: number;
}

const FIREFLY_CONFIGS: Record<string, FireflyConfig> = {
  street_night: {
    count: 18,
    position: [0, 2.5, 0],
    spread: [16, 4, 16],
    sizeRange: [0.02, 0.07],
    color: '#ffddaa',
    glowColor: '#ffaa44',
    pulseSpeed: 0.5,
    pulseAmp: 0.55,
    driftSpeed: 0.1,
  },
  volodka_room: {
    count: 8,
    position: [0, 1.8, 0],
    spread: [5, 2.5, 5],
    sizeRange: [0.02, 0.05],
    color: '#aaccff',
    glowColor: '#6688cc',
    pulseSpeed: 0.7,
    pulseAmp: 0.4,
    driftSpeed: 0.06,
  },
  chk_forest_zorge: {
    count: 25,
    position: [0, 1.5, 0],
    spread: [14, 3, 14],
    sizeRange: [0.04, 0.12],
    color: '#ffee88',
    glowColor: '#ffcc44',
    pulseSpeed: 0.6,
    pulseAmp: 0.7,
    driftSpeed: 0.15,
  },
  chk_campfire_night: {
    count: 15,
    position: [0, 1.5, 0],
    spread: [10, 3, 10],
    sizeRange: [0.03, 0.09],
    color: '#ffdd88',
    glowColor: '#ffaa44',
    pulseSpeed: 0.5,
    pulseAmp: 0.65,
    driftSpeed: 0.12,
  },
  sleep_dream: {
    count: 35,
    position: [0, 2.5, 0],
    spread: [20, 6, 20],
    sizeRange: [0.04, 0.14],
    color: '#ddbbff',
    glowColor: '#aa66ff',
    pulseSpeed: 0.4,
    pulseAmp: 0.8,
    driftSpeed: 0.1,
  },
  park_day: {
    count: 12,
    position: [0, 2, 0],
    spread: [16, 4, 16],
    sizeRange: [0.02, 0.06],
    color: '#eeffcc',
    glowColor: '#aadd88',
    pulseSpeed: 0.8,
    pulseAmp: 0.5,
    driftSpeed: 0.08,
  },
  river_pier: {
    count: 10,
    position: [0, 2, 0],
    spread: [12, 4, 8],
    sizeRange: [0.03, 0.08],
    color: '#ffddaa',
    glowColor: '#ffaa55',
    pulseSpeed: 0.55,
    pulseAmp: 0.6,
    driftSpeed: 0.1,
  },
  pier_evening: {
    count: 12,
    position: [0, 2, 0],
    spread: [12, 4, 8],
    sizeRange: [0.03, 0.09],
    color: '#ffddaa',
    glowColor: '#ffaa55',
    pulseSpeed: 0.5,
    pulseAmp: 0.65,
    driftSpeed: 0.1,
  },
};

/** Scenes that get firefly particles — fairy-tale / warm evening atmosphere */
export const FIREFLY_SCENES = new Set(Object.keys(FIREFLY_CONFIGS));

export function FireflyParticles({ sceneId }: { sceneId: string }) {
  const baseConfig = FIREFLY_CONFIGS[sceneId];
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
  return <FireflySystem config={config} />;
}

function FireflySystem({ config }: { config: FireflyConfig }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);

  const { positions, phases, sizes: _sizes, pulsePhases: _pulsePhases } = useMemo(() => {
    const count = config.count;
    const pos = new Float32Array(count * 3);
    const pha = new Float32Array(count);
    const siz = new Float32Array(count);
    const pul = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = config.position[0] + (Math.random() - 0.5) * config.spread[0];
      pos[i3 + 1] = config.position[1] + (Math.random() - 0.5) * config.spread[1];
      pos[i3 + 2] = config.position[2] + (Math.random() - 0.5) * config.spread[2];

      pha[i] = Math.random() * Math.PI * 2;
      siz[i] = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
      pul[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, phases: pha, sizes: siz, pulsePhases: pul };
  }, [config]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => { geometry.dispose(); };
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

      // Slow organic drift — figure-8 Lissajous path
      const driftT = t * config.driftSpeed + phase;
      posArray[i3] += Math.sin(driftT * 0.7 + phase) * 0.004 * delta;
      posArray[i3 + 1] += Math.sin(driftT * 0.4 + phase * 2.1) * 0.003 * delta;
      posArray[i3 + 2] += Math.cos(driftT * 0.6 + phase * 1.3) * 0.004 * delta;

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

    // Firefly glow: pulsing opacity simulates bioluminescence
    if (materialRef.current) {
      // Overall slow breathe + individual pulse
      const breathe = 0.4 + 0.2 * Math.sin(t * config.pulseSpeed);
      materialRef.current.opacity = breathe;
      // Size pulsing for glow effect
      const avgSize = (config.sizeRange[0] + config.sizeRange[1]) / 2;
      const sizePulse = avgSize * (1 + config.pulseAmp * 0.3 * Math.sin(t * config.pulseSpeed * 1.5));
      materialRef.current.size = sizePulse;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={config.color}
        size={(config.sizeRange[0] + config.sizeRange[1]) / 2}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
