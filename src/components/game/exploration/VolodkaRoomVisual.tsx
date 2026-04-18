'use client';

import { memo } from 'react';

/** Комната Володьки в обходе: простой «короб», согласованный с `GROUND_VOLODKA_ROOM` 14×10. */
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
      <pointLight position={[0, 2.35, 0]} intensity={0.65} color="#e8dcc8" distance={18} decay={2} />
    </group>
  );
});
