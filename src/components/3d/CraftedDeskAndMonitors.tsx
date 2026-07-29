/* Non-box desk / thin monitor slabs for Volodka room — kills cube kitbash interactables. */

import { Suspense, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';

const MONITOR_EMISSIVE = new THREE.Color('#33ddaa');

/** Extruded-feel desk: thick top slab + tapered cylinder legs (not four box posts). */
export function CraftedDeskShell({
  matFallback,
}: {
  matFallback: THREE.Material;
}) {
  return (
    <>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.06, 0.82]} />
        <Suspense fallback={<primitive object={matFallback} attach="material" />}>
          <PolyHavenStandardMaterial materialId="wood_floor" repeatScale={1.5} color="#b89870" metalness={0.04} roughness={0.78} />
        </Suspense>
      </mesh>
      {/* Soft underside apron */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[1.78, 0.08, 0.76]} />
        <meshStandardMaterial color="#3a2e22" roughness={0.88} metalness={0.05} />
      </mesh>
      {/* Tapered cylinder legs */}
      {([[-0.78, -0.32], [0.78, -0.32], [-0.78, 0.32], [0.78, 0.32]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.34, z]} castShadow geometry={getSharedCylinderGeometry(0.045, 0.06, 0.68, 8)}>
          <meshStandardMaterial color="#2a241c" roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
    </>
  );
}

interface ThinMonitorProps {
  id: string;
  tex: THREE.Texture;
  x: number;
  rotY: number;
  groupRef?: MutableRefObject<THREE.Group | null>;
  alertLed?: THREE.Material;
}

/** Thin bezel + plane screen (not a cube monitor). */
export function ThinMonitor({ id, tex, x, rotY, groupRef, alertLed }: ThinMonitorProps) {
  return (
    <group ref={groupRef} position={[x, 1.12, -0.18]} rotation={[0, rotY, 0]}>
      {/* Thin bezel slab */}
      <mesh castShadow geometry={getSharedBoxGeometry(0.48, 0.32, 0.028)}>
        <meshStandardMaterial color="#12141a" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Emissive screen plane */}
      <mesh position={[0, 0, 0.016]} geometry={getSharedPlaneGeometry(0.44, 0.28)} renderOrder={2}>
        <meshStandardMaterial
          map={tex}
          emissive={MONITOR_EMISSIVE}
          emissiveMap={tex}
          emissiveIntensity={1.45}
          toneMapped
          depthWrite={false}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
      {alertLed ? (
        <mesh position={[0.2, 0.13, 0.02]} geometry={new THREE.CircleGeometry(0.012, 8)} material={alertLed} />
      ) : null}
      {/* Neck + disc foot */}
      <mesh position={[0, -0.22, -0.01]} geometry={getSharedCylinderGeometry(0.02, 0.025, 0.18, 6)}>
        <meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={getSharedCylinderGeometry(0.12, 0.12, 0.02, 12)}>
        <meshStandardMaterial color="#1a1c22" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh visible={false} userData={{ monitorId: id }} />
    </group>
  );
}
