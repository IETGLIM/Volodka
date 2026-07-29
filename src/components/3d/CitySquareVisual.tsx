/* ─── City Square: night plaza with monument + neon street edges ───
 * Not a reused alley — open plaza, central obelisk, wet asphalt sheen.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import { WetStreetGround } from './WetStreetGround';

interface CitySquareVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 28;
const D = 28;

const matStone = getSharedStandardMaterial({ color: '#3a4050', roughness: 0.8 });
const matCurb = getSharedStandardMaterial({ color: '#2e343e', roughness: 0.72, metalness: 0.08 });
const matNeonCyan = getSharedStandardMaterial({
  color: '#001820',
  emissive: '#00e5ff',
  emissiveIntensity: 1.6,
});
const matNeonMagenta = getSharedStandardMaterial({
  color: '#1a0010',
  emissive: '#ff4488',
  emissiveIntensity: 1.4,
});
const matObelisk = getSharedStandardMaterial({ color: '#4a5060', metalness: 0.25, roughness: 0.45 });
const matPlaque = getSharedStandardMaterial({
  color: '#1a2030',
  emissive: '#88aacc',
  emissiveIntensity: 0.55,
  metalness: 0.4,
  roughness: 0.35,
});
const matGlass = getSharedStandardMaterial({
  color: '#88aacc',
  transparent: true,
  opacity: 0.22,
  metalness: 0.1,
  roughness: 0.08,
  depthWrite: false,
});
const matRail = getSharedStandardMaterial({ color: '#3a4450', metalness: 0.65, roughness: 0.38 });
const matLampPost = getSharedStandardMaterial({ color: '#222830', metalness: 0.45, roughness: 0.5 });
const matLampGlow = getSharedStandardMaterial({
  color: '#1a1810',
  emissive: '#ffcc88',
  emissiveIntensity: 1.2,
});

export function CitySquareVisual(_props: CitySquareVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const neonRef = useRef<THREE.Mesh>(null);
  const plaqueRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const rainIntensity = useGameStore((s) => s.rainIntensity);

  const benches = useMemo(
    () =>
      [
        [-6, -4],
        [6, -4],
        [-6, 5],
        [6, 5],
        [0, 8],
        [-9, 1],
        [9, -1],
      ] as const,
    [],
  );

  const lampPosts = useMemo(
    () =>
      [
        [-8, -9],
        [8, -9],
        [-8, 10],
        [8, 10],
        [0, -11],
      ] as const,
    [],
  );

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 1.1 + Math.sin(tRef.current * 1.7) * 0.35;
      if (neonRef.current) {
        (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
      if (plaqueRef.current) {
        (plaqueRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.45 + Math.sin(tRef.current * 2.2) * 0.18;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <WetStreetGround
        sceneId="city_square"
        rainIntensity={rainIntensity}
        size={Math.max(W, D)}
        groundColor="#2a2e38"
      />

      {/* Plaza ring + tram rail hints */}
      <mesh position={[0, 0.04, 0]} rotation-x={-Math.PI / 2} geometry={getSharedCircleGeometry(5.5, 48)} material={matStone} />
      <mesh position={[0, 0.045, 0]} rotation-x={-Math.PI / 2} geometry={getSharedCircleGeometry(6.2, 48)}>
        <meshStandardMaterial color="#252a34" roughness={0.55} metalness={0.12} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.06, -7]} geometry={getSharedBoxGeometry(18, 0.04, 0.12)} material={matRail} />
      <mesh position={[0, 0.06, -6.55]} geometry={getSharedBoxGeometry(18, 0.04, 0.12)} material={matRail} />

      {/* Obelisk + plaque + neon crown */}
      <mesh position={[0, 2.2, 0]} castShadow geometry={getSharedBoxGeometry(0.7, 4.2, 0.7)} material={matObelisk} />
      <mesh position={[0, 0.55, 0.42]} ref={plaqueRef} geometry={getSharedBoxGeometry(0.55, 0.35, 0.06)} material={matPlaque} />
      <mesh ref={neonRef} position={[0, 4.5, 0]} geometry={getSharedBoxGeometry(0.85, 0.18, 0.85)} material={matNeonCyan} />
      <mesh position={[0, 4.75, 0]} geometry={getSharedCylinderGeometry(0.08, 0.08, 0.35, 8)} material={matNeonMagenta} />

      {/* Kiosks / planters */}
      {[
        { pos: [-10, 0.6, -8] as [number, number, number], size: [3.2, 1.2, 1.2] as [number, number, number] },
        { pos: [10, 0.6, -8] as [number, number, number], size: [3.2, 1.2, 1.2] as [number, number, number] },
        { pos: [-10, 0.6, 9] as [number, number, number], size: [2.8, 1.2, 1.4] as [number, number, number] },
        { pos: [10, 0.6, 9] as [number, number, number], size: [2.8, 1.2, 1.4] as [number, number, number] },
      ].map((b, i) => (
        <group key={i} position={b.pos}>
          <mesh castShadow geometry={getSharedBoxGeometry(b.size[0], b.size[1], b.size[2])} material={matStone} />
          <mesh
            position={[0, 0.75, 0.55]}
            geometry={getSharedBoxGeometry(b.size[0] * 0.8, 0.08, 0.06)}
            material={i % 2 === 0 ? matNeonCyan : matNeonMagenta}
          />
          <mesh position={[0, 0.05, 0]} geometry={getSharedBoxGeometry(b.size[0] + 0.4, 0.08, b.size[2] + 0.35)} material={matCurb} />
        </group>
      ))}

      {benches.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.35, 0]} castShadow geometry={getSharedBoxGeometry(1.6, 0.12, 0.45)} material={matStone} />
          <mesh position={[-0.65, 0.18, 0]} geometry={getSharedBoxGeometry(0.12, 0.35, 0.4)} material={matStone} />
          <mesh position={[0.65, 0.18, 0]} geometry={getSharedBoxGeometry(0.12, 0.35, 0.4)} material={matStone} />
          <mesh position={[0, 0.55, -0.18]} geometry={getSharedBoxGeometry(1.5, 0.35, 0.08)} material={matCurb} />
        </group>
      ))}

      {lampPosts.map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 1.6, 0]} castShadow geometry={getSharedCylinderGeometry(0.06, 0.08, 3.2, 8)} material={matLampPost} />
          <mesh position={[0, 3.25, 0]} geometry={getSharedCylinderGeometry(0.18, 0.14, 0.22, 10)} material={matLampGlow} />
          <pointLight position={[0, 3.2, 0]} intensity={0.55} color="#ffcc88" distance={10} />
        </group>
      ))}

      {[
        [-12, 4, -13],
        [12, 5, -12],
        [-11, 3.5, 13],
        [11, 4.5, 12],
      ].map(([x, h, z], i) => (
        <mesh key={`facade-${i}`} position={[x, h / 2, z]} geometry={getSharedBoxGeometry(4.5, h, 0.35)} material={matGlass} />
      ))}

      {/* Corner bollards */}
      {[
        [-4.2, -4.2],
        [4.2, -4.2],
        [-4.2, 4.2],
        [4.2, 4.2],
      ].map(([x, z], i) => (
        <mesh key={`bollard-${i}`} position={[x, 0.35, z]} castShadow geometry={getSharedCylinderGeometry(0.12, 0.14, 0.7, 8)} material={matRail} />
      ))}

      <pointLight position={[0, 5, 0]} intensity={1.6} color="#aaccff" distance={28} />
      <pointLight position={[-9, 3.2, -7]} intensity={1.1} color="#00e5ff" distance={16} />
      <pointLight position={[9, 3.0, 8]} intensity={0.95} color="#ff6688" distance={15} />
    </group>
  );
}
