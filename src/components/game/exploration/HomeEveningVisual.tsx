'use client';

import { memo } from 'react';

/** Общая зона квартиры: короб + зона кухня/диван/стол. Коллайдеры — только периметр (см. `HomeEveningColliders`). */
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

      {/* Ковёр в центре */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color="#5a4838" roughness={0.94} />
      </mesh>

      {/* «Кухонный» угол: столешница вдоль северной стены (z отрицательный = север) */}
      <group position={[-2.4, 0.48, -5.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.06, 0.75]} />
          <meshStandardMaterial color="#3d3430" roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.35, 0.15]} castShadow>
          <boxGeometry args={[1.0, 0.65, 0.5]} />
          <meshStandardMaterial color="#b8b8b8" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[1.4, 0.2, 0.12]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.45]} />
          <meshStandardMaterial color="#c4a574" roughness={0.8} />
        </mesh>
      </group>

      {/* Диван + журнальный столик */}
      <group position={[-2.2, 0.32, 2.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.4, 0.95]} />
          <meshStandardMaterial color="#4a3d50" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.28, -0.2]} castShadow>
          <boxGeometry args={[2.1, 0.35, 0.12]} />
          <meshStandardMaterial color="#3d3348" roughness={0.92} />
        </mesh>
      </group>
      <mesh position={[-0.2, 0.28, 1.0]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.2, 0.55]} />
        <meshStandardMaterial color="#5c4a3a" roughness={0.75} />
      </mesh>

      {/* Обеденный стол + стулья (визуал) */}
      <group position={[3, 0.4, -1.5]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.5, 0.06, 20]} />
          <meshStandardMaterial color="#3d2d24" roughness={0.7} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          const r = 0.85;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * r, 0.22, Math.cos(a) * r]}
              castShadow
            >
              <boxGeometry args={[0.4, 0.44, 0.4]} />
              <meshStandardMaterial color="#3a3028" roughness={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* Торшер у дивана */}
      <group position={[-3.5, 0, 3.2]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.75, 8]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial
            color="#fffdeb"
            emissive="#fff5cc"
            emissiveIntensity={0.4}
            roughness={0.35}
          />
        </mesh>
        <pointLight position={[0, 1.6, 0]} intensity={0.55} color="#fff0d0" distance={8} decay={2} />
      </group>

      <pointLight position={[2, 2.5, 2]} intensity={0.5} color="#ffcc99" distance={20} decay={2} />
      <pointLight position={[-2, 2.5, -2]} intensity={0.45} color="#ffe0cc" distance={18} decay={2} />
    </group>
  );
});
