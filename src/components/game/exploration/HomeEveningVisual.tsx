'use client';

import { memo } from 'react';

/** Упрощённый интерьер общей зоны квартиры (14×14), только читаемый объём — без дублей с коллайдерами по логике. */
export const HomeEveningVisual = memo(function HomeEveningVisual() {
  const w = 14;
  const d = 14;
  const h = 2.9;
  const t = 0.1;
  return (
    <group name="HomeEveningVisual">
      <mesh position={[w / 2 - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.15]} />
        <meshStandardMaterial color="#c9b8a8" roughness={0.9} />
      </mesh>
      <mesh position={[-w / 2 + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, d - 0.15]} />
        <meshStandardMaterial color="#c9b8a8" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2 + t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.15, h, t]} />
        <meshStandardMaterial color="#bdaa9a" roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 - t / 2]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.15, h, t]} />
        <meshStandardMaterial color="#bdaa9a" roughness={0.9} />
      </mesh>
      <mesh position={[0, h - 0.06, 0]} receiveShadow>
        <boxGeometry args={[w - 0.12, 0.12, d - 0.12]} />
        <meshStandardMaterial color="#d4c4b4" roughness={0.88} />
      </mesh>
      <pointLight position={[2, 2.5, 2]} intensity={0.5} color="#ffcc99" distance={20} decay={2} />
      <pointLight position={[-2, 2.5, -2]} intensity={0.45} color="#ffe0cc" distance={18} decay={2} />
    </group>
  );
});
