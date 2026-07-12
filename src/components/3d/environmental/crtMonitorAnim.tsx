import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';

export function CRTMonitorAnim({ anim }: { anim: EnvAnimation }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);

  const baseIntensity = anim.config.baseIntensity ?? 4.0;
  const pulseAmp = anim.config.pulseAmp ?? 0.1; // ±10%
  const pulseSpeed = anim.config.pulseSpeed ?? 60; // ~60Hz CRT refresh
  const flickerChance = anim.config.flickerChance ?? 0.005; // occasional bright flicker per frame

  // Pre-allocated
  const currentEmissiveRef = useRef(baseIntensity);

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Simulate CRT refresh — rapid high-frequency intensity oscillation
    const crtPulse = Math.sin(t * pulseSpeed * Math.PI * 2) * pulseAmp * baseIntensity;

    // Occasional bright flicker
    const flickerBoost = Math.random() < flickerChance ? baseIntensity * 0.3 : 0;

    const targetE = baseIntensity + crtPulse + flickerBoost;
    // Smooth toward target to avoid jarring jumps
    currentEmissiveRef.current += (targetE - currentEmissiveRef.current) * Math.min(delta * 20, 1);
    materialRef.current.emissiveIntensity = currentEmissiveRef.current;
  });

  return (
    <mesh position={anim.position}>
      <planeGeometry args={[0.55, 0.35]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#001100"
        emissive="#00ff44"
        emissiveIntensity={baseIntensity}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
