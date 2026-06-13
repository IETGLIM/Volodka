import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

export function LampSwayAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const amplitude = anim.config.amplitude ?? 0.02;
  const frequency = anim.config.frequency ?? 0.5;

  // Pre-allocate position vector
  const posVec = useMemo(() => new THREE.Vector3(...anim.position), [anim.position]);

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Subtle swing like a pendulum
    const swingX = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude;
    const swingZ = Math.cos(timeRef.current * frequency * Math.PI * 2 * 0.7) * amplitude * 0.5;

    groupRef.current.position.set(
      posVec.x + swingX,
      posVec.y,
      posVec.z + swingZ,
    );
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Hanging cord */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.06, 0.08, 8]} />
        <meshStandardMaterial color="#554433" roughness={0.8} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial
          color="#ffdd88"
          emissive="#ffcc66"
          emissiveIntensity={2.0}
        />
      </mesh>
      <pointLight
        position={[0, -0.1, 0]}
        color="#ffcc88"
        intensity={1.5}
        distance={6}
      />
    </group>
  );
}
