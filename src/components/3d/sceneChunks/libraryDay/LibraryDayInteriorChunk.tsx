/* ─── Library — lazy interior props sub-chunk ─── */

import { Window, Radiator, Plant, Clock } from '../../lazyInteriorModels';
import { EnvironmentDetail } from '../../lod/PropDistanceGate';

export interface LibraryDayInteriorChunkProps {
  width: number;
  depth: number;
}

export function LibraryDayInteriorChunk({ width: W, depth: D }: LibraryDayInteriorChunkProps) {
  return (
    <>
      <EnvironmentDetail minLod="standard" position={[-W / 2 + 0.01, 1.7, 3.0]}>
        <Window position={[-W / 2 + 0.01, 1.7, 3.0]} rotation={[0, Math.PI / 2, 0]} color="#2255aa" />
      </EnvironmentDetail>
      <EnvironmentDetail minLod="standard" position={[-3.0, 0.3, -D / 2 + 0.06]}>
        <Radiator position={[-3.0, 0.3, -D / 2 + 0.06]} color="#a0a0a0" scale={[1.2, 1, 1]} />
      </EnvironmentDetail>
      <EnvironmentDetail minLod="standard" position={[4.0, 0.3, D / 2 - 0.06]}>
        <Radiator position={[4.0, 0.3, D / 2 - 0.06]} rotation={[0, Math.PI, 0]} color="#a0a0a0" scale={[1.2, 1, 1]} />
      </EnvironmentDetail>
      <EnvironmentDetail minLod="standard" position={[-5.5, 0, 5.5]}>
        <Plant position={[-5.5, 0, 5.5]} color="#2a6a20" scale={[1.5, 1.5, 1.5]} />
      </EnvironmentDetail>
      <EnvironmentDetail minLod="standard" position={[5.5, 0, 5.5]}>
        <Plant position={[5.5, 0, 5.5]} color="#308028" scale={[1.3, 1.3, 1.3]} />
      </EnvironmentDetail>
      <EnvironmentDetail minLod="standard" position={[-2.0, 2.7, D / 2 - 0.05]}>
        <Clock position={[-2.0, 2.7, D / 2 - 0.05]} rotation={[0, Math.PI, 0]} color="#f0e8d0" />
      </EnvironmentDetail>
    </>
  );
}
