/* Non-box desk / thin monitor slabs for Volodka room — kills cube kitbash interactables. */

import { Suspense, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';

const MONITOR_EMISSIVE = new THREE.Color('#5a9a88');

/** Extruded-feel desk fallback (Low): thick top + tapered cylinder legs — not four box posts.
 *  Medium+ wake room mounts Poly Haven paintedWoodenTable instead (VolodkaRoomVisual). */
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

/** Thin bezel + plane screen with photo-PBR metal housing (not a cube monitor). */
export function ThinMonitor({ id, tex, x, rotY, groupRef, alertLed }: ThinMonitorProps) {
  return (
    <group ref={groupRef} position={[x, 1.08, -0.12]} rotation={[0, rotY, 0]}>
      {/* Housing: shallow slab + slightly larger rear plate (reads as thin display, not PC tower) */}
      <mesh castShadow geometry={getSharedBoxGeometry(0.5, 0.3, 0.016)}>
        <Suspense fallback={<meshStandardMaterial color="#12141a" roughness={0.55} metalness={0.35} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.4} color="#1a1e28" metalness={0.42} roughness={0.48} />
        </Suspense>
      </mesh>
      <mesh position={[0, 0, -0.014]} castShadow geometry={getSharedBoxGeometry(0.46, 0.26, 0.012)}>
        <meshStandardMaterial color="#0a0c10" roughness={0.7} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.01]} geometry={getSharedPlaneGeometry(0.46, 0.26)} renderOrder={2}>
        <meshStandardMaterial
          map={tex}
          emissive={MONITOR_EMISSIVE}
          emissiveMap={tex}
          emissiveIntensity={0.85}
          toneMapped
          depthWrite={false}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
      {alertLed ? (
        <mesh position={[0.21, 0.12, 0.014]} geometry={new THREE.CircleGeometry(0.01, 8)} material={alertLed} />
      ) : null}
      {/* Neck + disc foot — cylinder language, not box stand */}
      <mesh position={[0, -0.2, -0.01]} geometry={getSharedCylinderGeometry(0.016, 0.022, 0.16, 10)}>
        <Suspense fallback={<meshStandardMaterial color="#1a1c22" roughness={0.5} metalness={0.4} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={3.2} color="#2a3038" metalness={0.5} roughness={0.42} />
        </Suspense>
      </mesh>
      <mesh position={[0, -0.29, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={getSharedCylinderGeometry(0.11, 0.11, 0.016, 20)}>
        <Suspense fallback={<meshStandardMaterial color="#1a1c22" roughness={0.55} metalness={0.35} />}>
          <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.8} color="#222830" metalness={0.48} roughness={0.45} />
        </Suspense>
      </mesh>
      <mesh visible={false} userData={{ monitorId: id }} />
    </group>
  );
}
