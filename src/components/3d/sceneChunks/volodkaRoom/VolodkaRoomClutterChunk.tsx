/* ─── Volodka room — environmental clutter (lazy sub-chunk) ─── */

import * as THREE from 'three';
import { EnvironmentDetail } from '../../lod/PropDistanceGate';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';

export interface VolodkaRoomClutterChunkProps {
  lod: EnvironmentLodLevel;
}

export function VolodkaRoomClutterChunk({ lod }: VolodkaRoomClutterChunkProps) {
  return (
    <EnvironmentDetail currentLod={lod} minLod="standard">
      <group position={[1.2, 0, -2.8]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.1, 0.08, 0.3, 8]} />
          <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.1, 0.008, 4, 8]} />
          <meshStandardMaterial color="#3a3a3e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.22, 0.03]} rotation={[0.3, 0.5, 0.2]}>
          <sphereGeometry args={[0.04, 4, 3]} />
          <meshStandardMaterial color="#c8c0a0" roughness={0.95} />
        </mesh>
      </group>

      <group position={[1.5, 0, 3.2]}>
        <mesh position={[0, 1.9, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.06, 4]} />
          <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.4, 0.05]} rotation={[0.05, 0, 0.03]}>
          <boxGeometry args={[0.45, 0.6, 0.06]} />
          <meshStandardMaterial color="#2a2030" roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.72, 0.06]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.06]} />
          <meshStandardMaterial color="#352540" roughness={0.85} />
        </mesh>
        <mesh position={[-0.2, 1.35, 0.05]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.1, 0.4, 0.05]} />
          <meshStandardMaterial color="#2a2030" roughness={0.85} />
        </mesh>
        <mesh position={[0.2, 1.35, 0.05]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.1, 0.38, 0.05]} />
          <meshStandardMaterial color="#2a2030" roughness={0.85} />
        </mesh>
      </group>

      <group position={[2.0, 0, -3.0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.06, 0.2, 8]} />
          <meshStandardMaterial color="#8a5a3a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.08, 0.008, 4, 8]} />
          <meshStandardMaterial color="#7a4a2a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.01, 8]} />
          <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.1, 6, 5]} />
          <meshStandardMaterial color="#2a6a20" roughness={0.85} />
        </mesh>
        <mesh position={[0.06, 0.4, 0.04]}>
          <sphereGeometry args={[0.07, 5, 4]} />
          <meshStandardMaterial color="#308028" roughness={0.85} />
        </mesh>
        <mesh position={[-0.05, 0.42, -0.03]}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshStandardMaterial color="#257020" roughness={0.85} />
        </mesh>
      </group>

      <mesh position={[0.55, 0.78, -2.3]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.22, 0.02, 0.22]} />
        <meshStandardMaterial color="#c4a050" roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.795, -2.3]} rotation={[0, 0.3, 0]}>
        <circleGeometry args={[0.06, 8]} />
        <meshStandardMaterial
          color="#a08030"
          roughness={0.95}
          transparent
          opacity={0.6}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      <mesh position={[0.8, 0.06, -1.2]} rotation={[0, 0.5, 0.08]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
        <meshStandardMaterial color="#00aa44" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0.06, -0.8]} rotation={[0.15, 0.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
        <meshStandardMaterial color="#2244aa" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.025, -0.5]} rotation={[0, 1.2, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 6]} />
        <meshStandardMaterial color="#cc2222" metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[-0.22, 1.28, -2.45]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshStandardMaterial color="#ffdd44" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.18, 1.22, -2.45]} rotation={[0, 0, -0.05]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshStandardMaterial color="#ff8888" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.25, 1.18, -2.45]} rotation={[0, 0, 0.15]}>
        <planeGeometry args={[0.05, 0.06]} />
        <meshStandardMaterial color="#88ddff" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0.1, 0.05, -2.2]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.6, 4]} />
        <meshStandardMaterial color="#222" roughness={0.95} />
      </mesh>
      <mesh position={[-0.2, 0.04, -2.0]} rotation={[0.5, 0.8, 0.3]}>
        <cylinderGeometry args={[0.006, 0.006, 0.5, 4]} />
        <meshStandardMaterial color="#882222" roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 0.06, -2.4]} rotation={[-0.3, 0.5, 0.2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.4, 4]} />
        <meshStandardMaterial color="#228822" roughness={0.95} />
      </mesh>

      <mesh position={[1.5, 0.55, 2.5]} rotation={[0, 0.4, 0.05]}>
        <boxGeometry args={[0.2, 0.015, 0.15]} />
        <meshStandardMaterial color="#c8b898" roughness={0.95} />
      </mesh>
      <mesh position={[1.5, 0.56, 2.5]} rotation={[0, 0.4, 0.05]}>
        <boxGeometry args={[0.22, 0.008, 0.16]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.95} />
      </mesh>
    </EnvironmentDetail>
  );
}
