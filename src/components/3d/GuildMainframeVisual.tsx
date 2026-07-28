/* ─── Guild Mainframe: server rack vault under the IT guild ───
 * Dedicated cyber aesthetic — not office desks. Pulsing teal racks,
 * cable trays, raised floor tiles, and a central core column.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';

interface GuildMainframeVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 16;
const D = 14;
const H = 3.4;

const matFloor = getSharedStandardMaterial({
  color: '#1a2228',
  metalness: 0.35,
  roughness: 0.55,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});
const matWall = getSharedStandardMaterial({ color: '#141a20', roughness: 0.85 });
const matCeil = getSharedStandardMaterial({ color: '#0e1418', roughness: 0.9 });
const matRack = getSharedStandardMaterial({ color: '#1c242c', metalness: 0.55, roughness: 0.35 });
const matPanel = getSharedStandardMaterial({
  color: '#001a18',
  emissive: '#00ffaa',
  emissiveIntensity: 0.55,
});
const matCable = getSharedStandardMaterial({ color: '#2a3040', metalness: 0.4, roughness: 0.5 });
const matCore = getSharedStandardMaterial({
  color: '#002218',
  emissive: '#00ff88',
  emissiveIntensity: 1.4,
});
const matAccent = getSharedStandardMaterial({
  color: '#001133',
  emissive: '#4488ff',
  emissiveIntensity: 0.9,
});
const matTile = getSharedStandardMaterial({
  color: '#222a32',
  metalness: 0.5,
  roughness: 0.4,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

export function GuildMainframeVisual(_props: GuildMainframeVisualProps) {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  const racks = useMemo(() => {
    const rows: { x: number; z: number }[] = [];
    for (const x of [-5.2, -2.6, 2.6, 5.2]) {
      for (const z of [-4, -1.2, 1.6]) rows.push({ x, z });
    }
    return rows;
  }, []);

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 0.85 + Math.sin(tRef.current * 2.1) * 0.35;
      if (coreRef.current) {
        (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 * pulse;
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

      {[-4, -1.5, 1.5, 4].flatMap((x) =>
        [-3, 0, 3].map((z) => (
          <mesh
            key={`tile-${x}-${z}`}
            position={[x, 0.02, z]}
            rotation-x={-Math.PI / 2}
            geometry={getSharedPlaneGeometry(1.8, 1.8)}
            material={matTile}
          />
        )),
      )}

      {racks.map((r, i) => (
        <group key={i} position={[r.x, 0, r.z]}>
          <mesh position={[0, 1.15, 0]} castShadow geometry={getSharedBoxGeometry(0.9, 2.3, 0.55)} material={matRack} />
          {[0.45, 0.85, 1.25, 1.65].map((y) => (
            <mesh
              key={y}
              position={[0.42, y, 0]}
              geometry={getSharedBoxGeometry(0.04, 0.18, 0.42)}
              material={i % 2 === 0 ? matPanel : matAccent}
            />
          ))}
        </group>
      ))}

      <mesh position={[0, 2.85, 0]} geometry={getSharedBoxGeometry(12, 0.08, 0.35)} material={matCable} />
      <mesh position={[0, 2.85, -2.5]} geometry={getSharedBoxGeometry(10, 0.08, 0.28)} material={matCable} />

      <mesh ref={coreRef} position={[0, 1.4, -5.2]} castShadow geometry={getSharedCylinderGeometry(0.55, 0.55, 2.6, 16)} material={matCore} />
      <mesh position={[0, 2.85, -5.2]} geometry={getSharedCylinderGeometry(0.75, 0.75, 0.12, 16)} material={matAccent} />

      <pointLight position={[0, 2.4, -5]} intensity={1.8} color="#00ffaa" distance={14} />
      <pointLight position={[-4, 2.2, 1]} intensity={0.7} color="#4488ff" distance={10} />
      <pointLight position={[4, 2.2, 1]} intensity={0.7} color="#4488ff" distance={10} />
    </group>
  );
}
