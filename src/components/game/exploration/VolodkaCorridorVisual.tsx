'use client';

import { memo } from 'react';

/**
 * Визуал коридора: стены, потолок, дверные блоки + тумба обуви и батарея (как в коллайдерах).
 */
export const VolodkaCorridorVisual = memo(function VolodkaCorridorVisual() {
  const w = 3.5;
  const d = 12;
  const h = 2.85;
  const t = 0.09;
  return (
    <group name="VolodkaCorridorVisual" userData={{ noCameraCollision: true }}>
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.25]} />
        <meshStandardMaterial color="#d4c4b0" roughness={0.86} />
      </mesh>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.25]} />
        <meshStandardMaterial color="#d4c4b0" roughness={0.86} />
      </mesh>
      <mesh position={[0, h - 0.07, 0]} receiveShadow>
        <boxGeometry args={[w - 0.12, 0.12, d - 0.28]} />
        <meshStandardMaterial color="#c8bdb0" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + 0.36]} castShadow>
        <boxGeometry args={[1.06, h * 0.9, 0.12]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.78} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 - 0.36]} castShadow>
        <boxGeometry args={[1.06, h * 0.9, 0.12]} />
        <meshStandardMaterial color="#4a3f35" roughness={0.78} />
      </mesh>

      {/* Дорожка по центру пола */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} receiveShadow>
        <planeGeometry args={[1.1, 10.5]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.95} />
      </mesh>

      {/* Тумба / обувница (коллайдер shoe) */}
      <group position={[-1.15, 0.26, -4.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.64, 0.52, 0.28]} />
          <meshStandardMaterial color="#5c4033" roughness={0.9} />
        </mesh>
        {[-0.12, 0.12].map((ox, i) => (
          <mesh key={i} position={[ox, 0.1, 0.02]} castShadow>
            <boxGeometry args={[0.18, 0.08, 0.2]} />
            <meshStandardMaterial color="#2a2018" roughness={0.88} />
          </mesh>
        ))}
      </group>

      {/* Радиатор (коллайдер radiator) */}
      <mesh position={[1.22, 0.24, -0.8]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.48, 2.35]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.45} metalness={0.35} />
      </mesh>

      {/* Плафоны вдоль коридора */}
      {[-4, 0, 4].map((z) => (
        <group key={z} position={[0, h - 0.2, z]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.28, 0.08, 16]} />
            <meshStandardMaterial color="#f5f0e6" emissive="#fff7ed" emissiveIntensity={0.25} />
          </mesh>
          <pointLight position={[0, -0.15, 0]} intensity={0.45} color="#fff5e0" distance={5} decay={2} />
        </group>
      ))}

      <pointLight position={[0, 2.4, 0]} intensity={0.5} color="#f5e6d3" distance={16} decay={2} />
    </group>
  );
});
