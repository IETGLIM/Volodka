'use client';

import { memo } from 'react';
import * as THREE from 'three';

/**
 * Минимальная «кабина» лифта: металл + полоса неона — только пока активен DOM-оверлей спуска.
 */
export const IntroElevatorShaftVisual = memo(function IntroElevatorShaftVisual({
  active,
}: {
  active: boolean;
}) {
  if (!active) return null;

  return (
    <group position={[0.35, 1.15, 3.12]} name="IntroElevatorShaftVisual" userData={{ noCameraCollision: true }}>
      <mesh>
        <boxGeometry args={[2.35, 2.45, 2.35]} />
        <meshStandardMaterial
          color="#2a323c"
          metalness={0.72}
          roughness={0.38}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh position={[0, 0.35, 1.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 0.14]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#22c55e"
          emissiveIntensity={0.85}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      <pointLight position={[0, 1.05, 0.4]} intensity={0.55} color="#38bdf8" distance={4} decay={2} />
      <pointLight position={[0.55, 0.35, -0.55]} intensity={0.25} color="#f59e0b" distance={3} decay={2} />
    </group>
  );
});
