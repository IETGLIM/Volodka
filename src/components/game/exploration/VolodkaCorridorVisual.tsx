'use client';

import { memo } from 'react';

/**
 * Визуал узкого коридора (стены / потолок / торцы).
 * Используется в `RPGGameCanvas` (обход) и в `OptimizedSceneEnvironment` (VN-слой).
 * Пол и Rapier — в `PhysicsSceneColliders` / визуальный пол в `RPGGameCanvas`.
 */
export const VolodkaCorridorVisual = memo(function VolodkaCorridorVisual() {
  const w = 3.5;
  const d = 12;
  const h = 2.85;
  const t = 0.09;
  return (
    <group name="VolodkaCorridorVisual">
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
      <pointLight position={[0, 2.4, 0]} intensity={0.72} color="#f5e6d3" distance={16} decay={2} />
    </group>
  );
});
