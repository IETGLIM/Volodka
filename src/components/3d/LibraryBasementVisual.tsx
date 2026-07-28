/* ─── Library Basement: archive vault under the stacks ───
 * Not LibraryDay — low concrete, rusted shelves, amber terminal glow.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

interface LibraryBasementVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 14;
const D = 12;
const H = 2.9;

const matFloor = getSharedStandardMaterial({
  color: '#1a1610',
  roughness: 0.92,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const matWall = getSharedStandardMaterial({ color: '#16120e', roughness: 0.9 });
const matCeil = getSharedStandardMaterial({ color: '#100c08', roughness: 0.95 });
const matShelf = getSharedStandardMaterial({ color: '#3a2e22', roughness: 0.75, metalness: 0.15 });
const matBook = getSharedStandardMaterial({ color: '#4a3020', roughness: 0.85 });
const matTerminal = getSharedStandardMaterial({
  color: '#1a1000',
  emissive: '#ffcc66',
  emissiveIntensity: 1.35,
});
const matPipe = getSharedStandardMaterial({ color: '#2a3230', metalness: 0.55, roughness: 0.4 });

export function LibraryBasementVisual(_props: LibraryBasementVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  const shelves = useMemo(
    () =>
      [
        [-3.2, -2],
        [-3.2, 0.4],
        [-3.2, 2.6],
        [3.2, -2],
        [3.2, 0.4],
        [3.2, 2.6],
      ] as const,
    [],
  );

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 1.15 + Math.sin(tRef.current * 2.4) * 0.25 + Math.sin(tRef.current * 11) * 0.06;
      if (screenRef.current) {
        (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)} material={matFloor} />
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />

      {[
        { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
        { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
        { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
        { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
      ))}

      {shelves.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]} castShadow geometry={getSharedBoxGeometry(0.35, 2.2, 1.4)} material={matShelf} />
          <mesh position={[x < 0 ? 0.22 : -0.22, 1.4, 0]} geometry={getSharedBoxGeometry(0.12, 0.7, 1.1)} material={matBook} />
        </group>
      ))}

      <mesh position={[0, 0.45, -3.2]} castShadow geometry={getSharedBoxGeometry(1.1, 0.9, 0.55)} material={matShelf} />
      <mesh
        ref={screenRef}
        position={[0, 0.95, -2.95]}
        geometry={getSharedBoxGeometry(0.55, 0.35, 0.04)}
        material={matTerminal}
      />

      <mesh position={[-1.5, 2.55, 0]} geometry={getSharedBoxGeometry(4, 0.08, 0.08)} material={matPipe} />
      <mesh position={[2.2, 2.55, -1]} geometry={getSharedBoxGeometry(0.08, 0.08, 3)} material={matPipe} />
    </group>
  );
}
