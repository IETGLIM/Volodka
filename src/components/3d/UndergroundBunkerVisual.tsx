/* ─── Underground Bunker: resistance hideout ───
 * Green terminal glow, sandbags, radio desk — not factory basement.
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

interface UndergroundBunkerVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 18;
const D = 16;
const H = 3.6;

const matFloor = getSharedStandardMaterial({
  color: '#1c2220',
  roughness: 0.88,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const matWall = getSharedStandardMaterial({ color: '#1a221c', roughness: 0.9 });
const matCeil = getSharedStandardMaterial({ color: '#121816', roughness: 0.95 });
const matSandbag = getSharedStandardMaterial({ color: '#5a6a48', roughness: 0.95 });
const matMetal = getSharedStandardMaterial({ color: '#2a3230', metalness: 0.55, roughness: 0.4 });
const matTerminal = getSharedStandardMaterial({
  color: '#001a10',
  emissive: '#44ff88',
  emissiveIntensity: 1.5,
});
const matWarn = getSharedStandardMaterial({
  color: '#220800',
  emissive: '#ff5544',
  emissiveIntensity: 1.1,
});

export function UndergroundBunkerVisual(_props: UndergroundBunkerVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const flicker = 1.2 + Math.sin(tRef.current * 7.5) * 0.15 + Math.sin(tRef.current * 19) * 0.08;
      if (screenRef.current) {
        (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)} material={matFloor} />
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />

      {[
        { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.2] as [number, number, number] },
        { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.2] as [number, number, number] },
        { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.2, H, D] as [number, number, number] },
        { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.2, H, D] as [number, number, number] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
      ))}

      {[
        [-4, -3],
        [-2.5, -3.4],
        [3.5, -2.8],
        [5, -3.2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow geometry={getSharedBoxGeometry(1.4, 0.7, 0.55)} material={matSandbag} />
      ))}

      <mesh position={[0, 0.55, -4.5]} castShadow geometry={getSharedBoxGeometry(2.4, 0.12, 1.0)} material={matMetal} />
      <mesh position={[-0.7, 0.28, -4.5]} geometry={getSharedBoxGeometry(0.12, 0.55, 0.9)} material={matMetal} />
      <mesh position={[0.7, 0.28, -4.5]} geometry={getSharedBoxGeometry(0.12, 0.55, 0.9)} material={matMetal} />
      <mesh ref={screenRef} position={[0, 1.15, -4.85]} geometry={getSharedBoxGeometry(1.1, 0.7, 0.06)} material={matTerminal} />
      <mesh position={[1.0, 0.85, -4.5]} geometry={getSharedCylinderGeometry(0.12, 0.12, 0.35, 10)} material={matWarn} />

      <mesh position={[-5.5, 0.45, 2]} castShadow geometry={getSharedBoxGeometry(1.3, 0.9, 0.9)} material={matMetal} />
      <mesh position={[5.2, 0.45, 1.5]} castShadow geometry={getSharedBoxGeometry(1.1, 0.9, 1.0)} material={matMetal} />

      <pointLight position={[0, 2.4, -4]} intensity={1.7} color="#44ff88" distance={12} />
      <pointLight position={[-4, 2.2, 2]} intensity={0.75} color="#ff5544" distance={9} />
      <pointLight position={[3.5, 2.0, 3]} intensity={0.5} color="#6688aa" distance={8} />
    </group>
  );
}
