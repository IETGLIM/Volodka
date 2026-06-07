/* ─── Library — lazy interior props sub-chunk ─── */

import { Window, Radiator, Plant, Clock } from '../../lazyInteriorModels';
import { EnvironmentDetail } from '../../lod/PropDistanceGate';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';

export interface LibraryDayInteriorChunkProps {
  lod: EnvironmentLodLevel;
  width: number;
  depth: number;
}

export function LibraryDayInteriorChunk({ lod, width: W, depth: D }: LibraryDayInteriorChunkProps) {
  return (
    <EnvironmentDetail currentLod={lod} minLod="standard">
      <Window position={[-W / 2 + 0.01, 2.5, 3.0]} rotation={[0, Math.PI / 2, 0]} color="#2255aa" />
      <Radiator position={[-3.0, 0.3, -D / 2 + 0.06]} color="#a0a0a0" scale={[1.2, 1, 1]} />
      <Radiator position={[4.0, 0.3, D / 2 - 0.06]} rotation={[0, Math.PI, 0]} color="#a0a0a0" scale={[1.2, 1, 1]} />
      <Plant position={[-5.5, 0, 5.5]} color="#2a6a20" scale={[1.5, 1.5, 1.5]} />
      <Plant position={[5.5, 0, 5.5]} color="#308028" scale={[1.3, 1.3, 1.3]} />
      <Clock position={[-2.0, 3.5, D / 2 - 0.05]} rotation={[0, Math.PI, 0]} color="#f0e8d0" />
    </EnvironmentDetail>
  );
}
