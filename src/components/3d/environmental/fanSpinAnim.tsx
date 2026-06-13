import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

export function FanSpinAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 3.0;

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Fan hub */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Fan blades */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0.2, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.08]} />
          <meshStandardMaterial color="#777777" metalness={0.4} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
