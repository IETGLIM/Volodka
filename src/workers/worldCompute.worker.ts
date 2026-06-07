/**
 * Off-main-thread world chunk diff (WorldChunkManager).
 * Rapier physics stays on the main thread — @react-three/rapier requires it.
 */

import {
  WorldChunkManager,
  DEFAULT_WORLD_CHUNK_OPTIONS,
} from '@/engine/world/WorldChunkManager';
import { chunkKey } from '@/engine/world/types';

export type WorldComputeRequest =
  | { op: 'reset'; id?: number }
  | { op: 'chunkDiff'; worldX: number; worldZ: number; id?: number };

export type WorldComputeResponse =
  | { op: 'reset' }
  | {
      op: 'chunkDiff';
      toLoad: string[];
      toUnload: string[];
      active: string[];
    };

const manager = new WorldChunkManager(DEFAULT_WORLD_CHUNK_OPTIONS);

self.onmessage = (event: MessageEvent<WorldComputeRequest>) => {
  const msg = event.data;

  if (msg.op === 'reset') {
    manager.reset();
    const response: WorldComputeResponse = { op: 'reset' };
    self.postMessage(response);
    return;
  }

  if (msg.op === 'chunkDiff') {
    const diff = manager.updateActiveChunks(msg.worldX, msg.worldZ);
    const response: WorldComputeResponse = {
      op: 'chunkDiff',
      toLoad: diff.toLoad.map(chunkKey),
      toUnload: diff.toUnload.map(chunkKey),
      active: diff.active.map(chunkKey),
    };
    self.postMessage(response);
  }
};
