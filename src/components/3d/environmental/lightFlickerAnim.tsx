import { useRef, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Group, PointLight } from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

export function LightFlickerAnim({ anim }: { anim: EnvAnimation }) {
  const rootRef = useRef<Group>(null);
  const lightRef = useRef<PointLight>(null);
  const timeRef = useRef(0);
  const rng = useMemo(() => seededRandom(hashString(anim.id)), [anim.id]);
  const nextFlickerRef = useRef(0);
  const targetIntensityRef = useRef((anim.config.minIntensity + anim.config.maxIntensity) / 2);
  const currentIntensityRef = useRef((anim.config.minIntensity + anim.config.maxIntensity) / 2);

  const minI = anim.config.minIntensity ?? 0.2;
  const maxI = anim.config.maxIntensity ?? 0.8;
  const flickerRate = anim.config.flickerRate ?? 0.03;

  useFrameTick('misc', ({ delta }) => {
    if (!lightRef.current) return;
    timeRef.current += delta;

    // Time-based flicker — pick a new target intensity at intervals
    if (timeRef.current >= nextFlickerRef.current) {
      targetIntensityRef.current = minI + rng() * (maxI - minI);
      nextFlickerRef.current = timeRef.current + 1 / (flickerRate * 60 + 1);
    }

    // Smooth interpolation toward target
    currentIntensityRef.current += (targetIntensityRef.current - currentIntensityRef.current) * Math.min(delta * 8, 1);
    lightRef.current.intensity = currentIntensityRef.current;
  }, { visibilityRef: rootRef });

  return (
    <group ref={rootRef}>
      <pointLight
      ref={lightRef}
      position={anim.position}
      color="#ffcc88"
      intensity={(minI + maxI) / 2}
      distance={6}
    />
    </group>
  );
}
