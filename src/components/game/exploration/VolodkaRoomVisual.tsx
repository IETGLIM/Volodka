'use client';

import { memo } from 'react';

/**
 * Комната Володьки в обходе: «короб» + низкополигональная обстановка.
 * Координаты столов/шкаф/диван совпадают с `VolodkaRoomColliders` (Rapier).
 */
export const VolodkaRoomVisual = memo(function VolodkaRoomVisual() {
  const w = 14;
  const d = 10;
  const h = 2.85;
  const t = 0.1;
  return (
    <group name="VolodkaRoomVisual">
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.2]} />
        <meshStandardMaterial color="#d0c2b2" roughness={0.88} />
      </mesh>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.2]} />
        <meshStandardMaterial color="#d0c2b2" roughness={0.88} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.2, h, t]} />
        <meshStandardMaterial color="#c4b5a5" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 - t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.2, h, t]} />
        <meshStandardMaterial color="#b8a896" roughness={0.88} />
      </mesh>
      <mesh position={[0, h - 0.06, 0]} receiveShadow>
        <boxGeometry args={[w - 0.15, 0.12, d - 0.15]} />
        <meshStandardMaterial color="#c8bdb0" roughness={0.9} />
      </mesh>

      {/* Ковёр у «окна» (север) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -2.2]} receiveShadow>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#6b5344" roughness={0.92} />
      </mesh>

      {/* Рабочий стол + «монитор» (совпадает с коллайдером deskMain) */}
      <group position={[3.2, 0.45, 0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.45, 0.08, 0.78]} />
          <meshStandardMaterial color="#4a3d32" roughness={0.75} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.28, -0.05]} castShadow>
          <boxGeometry args={[0.9, 0.55, 0.04]} />
          <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.15} roughness={0.4} />
        </mesh>
      </group>

      {/* Второй стол (deskSide) */}
      <group position={[0.8, 0.45, -2.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.05, 0.08, 0.58]} />
          <meshStandardMaterial color="#3d3328" roughness={0.8} />
        </mesh>
        <mesh position={[-0.2, 0.22, 0]} castShadow>
          <boxGeometry args={[0.35, 0.4, 0.25]} />
          <meshStandardMaterial color="#e8d4c0" roughness={0.85} />
        </mesh>
      </group>

      {/* Два шкафа */}
      {[
        [5.2, 0.95, 0.2] as const,
        [5.2, 0.95, -1.4] as const,
      ].map((p, i) => (
        <mesh key={`wardrobe-${i}`} position={p} castShadow receiveShadow>
          <boxGeometry args={[0.58, 1.75, 0.68]} />
          <meshStandardMaterial color="#5c4a3a" roughness={0.88} />
        </mesh>
      ))}

      {/* Диван (sofa) */}
      <group position={[-3.8, 0.42, 1.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.52, 0.88]} />
          <meshStandardMaterial color="#4a3d55" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.32, -0.25]} castShadow>
          <boxGeometry args={[1.7, 0.45, 0.15]} />
          <meshStandardMaterial color="#3d3350" roughness={0.92} />
        </mesh>
      </group>

      {/* Кровать в углу (только визуал) */}
      <group position={[-4.8, 0.22, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.35, 2.1]} />
          <meshStandardMaterial color="#5c4a4a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[1.75, 0.2, 2.05]} />
          <meshStandardMaterial color="#7a5c4a" roughness={0.95} />
        </mesh>
      </group>

      <pointLight position={[0, 2.35, 0]} intensity={0.65} color="#e8dcc8" distance={18} decay={2} />
      <pointLight position={[2.2, 2.1, 1.5]} intensity={0.35} color="#fef3c7" distance={10} decay={2} />
    </group>
  );
});
