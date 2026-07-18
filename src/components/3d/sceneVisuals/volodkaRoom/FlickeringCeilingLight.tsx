import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { seededRand } from '@/shared/utils/seededRand';
import * as THREE from 'three';

/**
 * A ceiling-mounted point light that randomly flickers every 3–8 seconds.
 * Brightness dips subtly then recovers — cheap, no React state.
 */
export function FlickeringCeilingLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const nextFlickerRef = useRef(3 + seededRand(42) * 5); // first flicker 3–8s (deterministic)
  const flickerPhaseRef = useRef<'idle' | 'dip' | 'recover'>('idle');
  const flickerTimerRef = useRef(0);

  const baseIntensity = 0.6;
  const dipIntensity = 0.15;
  const dipDuration = 0.08; // 80ms sharp dip
  const recoverDuration = 0.25; // 250ms smooth recovery

  useFrameTick('misc', ({ delta }) => {
    const light = lightRef.current;
    if (!light) return;
    timeRef.current += delta;

    const phase = flickerPhaseRef.current;

    if (phase === 'idle') {
      if (timeRef.current >= nextFlickerRef.current) {
        // Start a flicker
        flickerPhaseRef.current = 'dip';
        flickerTimerRef.current = 0;
      }
      light.intensity = baseIntensity;
    } else if (phase === 'dip') {
      flickerTimerRef.current += delta;
      light.intensity = dipIntensity;
      if (flickerTimerRef.current >= dipDuration) {
        flickerPhaseRef.current = 'recover';
        flickerTimerRef.current = 0;
      }
    } else if (phase === 'recover') {
      flickerTimerRef.current += delta;
      const t = Math.min(flickerTimerRef.current / recoverDuration, 1);
      // ease-out recovery
      light.intensity = dipIntensity + (baseIntensity - dipIntensity) * (1 - (1 - t) * (1 - t));
      if (t >= 1) {
        flickerPhaseRef.current = 'idle';
        nextFlickerRef.current = timeRef.current + 3 + seededRand(77) * 5;
      }
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 2.85, -1]}
      color="#ffe8cc"
      intensity={baseIntensity}
      distance={8}
      decay={2}
    />
  );
}