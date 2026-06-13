import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

export function NeonFlickerAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const isOnRef = useRef(true);
  const nextToggleRef = useRef(0);

  const colorR = anim.config.colorR ?? 0.3;
  const colorG = anim.config.colorG ?? 0.5;
  const colorB = anim.config.colorB ?? 1.0;
  const onProbability = anim.config.onProbability ?? 0.95;
  const flickerSpeed = anim.config.flickerSpeed ?? 8; // toggles per second when off
  const onEmissive = anim.config.onEmissive ?? 1.0;
  const offEmissive = anim.config.offEmissive ?? 0.05;

  const emissiveColor = useMemo(
    () => new THREE.Color(colorR, colorG, colorB),
    [colorR, colorG, colorB],
  );

  // Pre-allocate temp values
  const toggleInterval = 1 / flickerSpeed;

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;

    // Toggle on/off at flicker speed
    if (timeRef.current >= nextToggleRef.current) {
      nextToggleRef.current = timeRef.current + toggleInterval;
      isOnRef.current = Math.random() < onProbability;
    }

    const targetE = isOnRef.current ? onEmissive : offEmissive;
    // Smooth transition for on, instant for off (more realistic neon)
    if (!isOnRef.current) {
      materialRef.current.emissiveIntensity = offEmissive;
    } else {
      materialRef.current.emissiveIntensity += (targetE - materialRef.current.emissiveIntensity) * Math.min(delta * 15, 1);
    }

    if (lightRef.current) {
      lightRef.current.intensity = isOnRef.current ? onEmissive * 0.5 : 0;
    }
  });

  return (
    <group position={anim.position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 0.12, 0.05]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#111111"
          emissive={emissiveColor}
          emissiveIntensity={onEmissive}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.3, 0.5]}
        color={emissiveColor}
        intensity={onEmissive * 0.5}
        distance={6}
      />
    </group>
  );
}
