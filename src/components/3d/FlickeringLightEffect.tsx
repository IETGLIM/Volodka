
/* ─── Volodka RPG – Flickering Light Effect ───
 *  Simulates broken/fluorescent lighting in factory_basement
 *  and abandoned_factory. Adds animated point lights with
 *  random intensity flicker for a horror-industrial atmosphere.
 */

import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { PointLight } from 'three';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface FlickerLight {
  position: [number, number, number];
  color: string;
  baseIntensity: number;
  distance: number;
  /** Mean time between flicker bursts (seconds) */
  flickerInterval: number;
  /** How much intensity drops during a flicker (0–1) */
  flickerDepth: number;
  /** How fast the flicker oscillates during a burst */
  flickerSpeed: number;
  /** Duration of a flicker burst (seconds) */
  flickerDuration: number;
}

const FLICKER_CONFIGS: Record<string, FlickerLight[]> = {
  factory_basement: [
    {
      position: [0, 2.4, 0],
      color: '#88ddaa',
      baseIntensity: 2.0,
      distance: 14,
      flickerInterval: 4,
      flickerDepth: 0.7,
      flickerSpeed: 25,
      flickerDuration: 0.4,
    },
    {
      position: [3, 2.4, -3],
      color: '#66bb88',
      baseIntensity: 1.5,
      distance: 10,
      flickerInterval: 6,
      flickerDepth: 0.5,
      flickerSpeed: 18,
      flickerDuration: 0.3,
    },
  ],
  abandoned_factory: [
    {
      position: [0, 3.0, 0],
      color: '#cc9966',
      baseIntensity: 2.5,
      distance: 16,
      flickerInterval: 5,
      flickerDepth: 0.6,
      flickerSpeed: 20,
      flickerDuration: 0.5,
    },
    {
      position: [-4, 2.8, 3],
      color: '#aa7744',
      baseIntensity: 1.8,
      distance: 12,
      flickerInterval: 3.5,
      flickerDepth: 0.8,
      flickerSpeed: 30,
      flickerDuration: 0.6,
    },
    {
      position: [4, 2.8, -2],
      color: '#ddaa77',
      baseIntensity: 1.4,
      distance: 10,
      flickerInterval: 7,
      flickerDepth: 0.4,
      flickerSpeed: 15,
      flickerDuration: 0.25,
    },
  ],
};

export function FlickeringLightEffect({ sceneId }: { sceneId: string }) {
  const lights = FLICKER_CONFIGS[sceneId];
  const isMobile = useIsMobileVisual();
  const reducedMotion = useEffectiveReducedMotion();

  if (!lights || reducedMotion) return null;

  // On mobile, limit to 1 flickering light
  const effectiveLights = isMobile ? lights.slice(0, 1) : lights;

  return (
    <>
      {effectiveLights.map((light, i) => (
        <FlickerPointLight key={`flicker-${sceneId}-${i}`} config={light} seed={i * 1337} />
      ))}
    </>
  );
}

function FlickerPointLight({ config, seed }: { config: FlickerLight; seed: number }) {
  const lightRef = useRef<PointLight>(null);
  const timeRef = useRef(0);
  const nextFlickerRef = useRef(seededRandom(seed) * config.flickerInterval);
  const flickerEndRef = useRef(0);

  useFrameTick('postfx', ({ delta }) => {
    if (!lightRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    if (t >= nextFlickerRef.current) {
      // Start a flicker burst
      flickerEndRef.current = t + config.flickerDuration * (0.5 + seededRandom(seed + Math.floor(t * 10)) * 0.5);
      nextFlickerRef.current = t + config.flickerInterval * (0.7 + seededRandom(seed + Math.floor(t * 7)) * 0.6);
    }

    if (t < flickerEndRef.current) {
      // In a flicker burst — rapid oscillation
      const flickerNoise = Math.sin(t * config.flickerSpeed) * 0.5 + 0.5;
      const intensity = config.baseIntensity * (1 - config.flickerDepth * flickerNoise);
      lightRef.current.intensity = Math.max(0.1, intensity);
    } else {
      // Stable — subtle breathing
      lightRef.current.intensity = config.baseIntensity * (0.95 + 0.05 * Math.sin(t * 0.5));
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={config.position}
      intensity={config.baseIntensity}
      color={config.color}
      distance={config.distance}
    />
  );
}

/** Seeded pseudo-random for deterministic flicker timing */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
