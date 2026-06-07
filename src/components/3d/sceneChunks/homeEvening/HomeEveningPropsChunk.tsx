/* ─── Home evening — kitchen clutter (lazy sub-chunk) ─── */

import { EnvironmentDetail } from '../../lod/PropDistanceGate';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';

export interface HomeEveningPropsChunkProps {
  lod: EnvironmentLodLevel;
}

export function HomeEveningPropsChunk({ lod }: HomeEveningPropsChunkProps) {
  return (
    <EnvironmentDetail currentLod={lod} minLod="standard">
      <mesh position={[3.5, 0.98, -5.2]}>
        <cylinderGeometry args={[0.12, 0.1, 0.12, 8]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[3.38, 1.02, -5.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.12, 4]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[4.8, 0.93, -5.3]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.2]} />
        <meshStandardMaterial color="#b89868" roughness={0.8} />
      </mesh>
      <mesh position={[4.85, 0.95, -5.25]}>
        <boxGeometry args={[0.04, 0.03, 0.04]} />
        <meshStandardMaterial color="#dd4422" roughness={0.9} />
      </mesh>
      <mesh position={[4.75, 0.95, -5.35]}>
        <boxGeometry args={[0.05, 0.03, 0.04]} />
        <meshStandardMaterial color="#22aa44" roughness={0.9} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[4.2, 0.93, -5.6]}>
        <circleGeometry args={[0.15, 12]} />
        <meshStandardMaterial
          color="#7090a0"
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.2}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      <mesh position={[4.0, 1.0, -5.4]} rotation={[0.1, 0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.03, 8]} />
        <meshStandardMaterial color="#e8e0d8" roughness={0.6} />
      </mesh>
      <mesh position={[4.1, 1.02, -5.5]} rotation={[0.15, -0.2, 0.05]}>
        <cylinderGeometry args={[0.08, 0.06, 0.03, 8]} />
        <meshStandardMaterial color="#d0c8c0" roughness={0.6} />
      </mesh>
    </EnvironmentDetail>
  );
}
