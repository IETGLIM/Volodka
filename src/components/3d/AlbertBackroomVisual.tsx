/* ─── Albert Backroom: café storage / hush room ───
 * Not CaféVisual — crates, warm desk lamp, magenta neon drip.
 */

import { useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

interface AlbertBackroomVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 8;
const D = 6;
const H = 2.7;

const matFloor = getSharedStandardMaterial({
  color: '#1e1820',
  roughness: 0.8,
  metalness: 0.08,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const matWall = getSharedStandardMaterial({ color: '#221a28', roughness: 0.88 });
const matCeil = getSharedStandardMaterial({ color: '#141018', roughness: 0.92 });
const matCrate = getSharedStandardMaterial({ color: '#3a2a1a', roughness: 0.8 });
const matMetal = getSharedStandardMaterial({ color: '#2a2830', metalness: 0.5, roughness: 0.45 });
const matLamp = getSharedStandardMaterial({
  color: '#2a1808',
  emissive: '#ffaa55',
  emissiveIntensity: 1.5,
});
const matNeon = getSharedStandardMaterial({
  color: '#1a0012',
  emissive: '#ff4499',
  emissiveIntensity: 1.3,
});

export function AlbertBackroomVisual(_props: AlbertBackroomVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const neonRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const neonPulse = 1.1 + Math.sin(tRef.current * 1.9) * 0.35;
      const lampPulse = 1.35 + Math.sin(tRef.current * 3.1) * 0.12;
      if (neonRef.current) {
        (neonRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = neonPulse;
      }
      if (lampRef.current) {
        (lampRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = lampPulse;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)} material={matFloor} />
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />

      {[
        { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.16] as [number, number, number] },
        { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.16] as [number, number, number] },
        { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.16, H, D] as [number, number, number] },
        { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.16, H, D] as [number, number, number] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
      ))}

      {[
        [-2.2, -1.4],
        [-1.4, -1.5],
        [2.0, -1.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} castShadow geometry={getSharedBoxGeometry(0.7, 0.9, 0.55)} material={matCrate} />
      ))}

      <mesh position={[-1.5, 0.55, -1]} castShadow geometry={getSharedBoxGeometry(0.9, 0.85, 0.5)} material={matMetal} />
      <mesh
        ref={lampRef}
        position={[-1.5, 1.15, -0.85]}
        geometry={getSharedCylinderGeometry(0.08, 0.12, 0.1, 12)}
        material={matLamp}
      />

      <mesh
        ref={neonRef}
        position={[2.4, 1.8, 0]}
        rotation-z={Math.PI / 2}
        geometry={getSharedBoxGeometry(1.4, 0.06, 0.04)}
        material={matNeon}
      />
    </group>
  );
}
