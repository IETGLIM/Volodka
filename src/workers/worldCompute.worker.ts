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
  | { op: 'reset'; id?: number }
  | {
      op: 'chunkDiff';
      toLoad: string[];
      toUnload: string[];
      active: string[];
      id?: number;
    }
  | { op: 'error'; id?: number; message: string; requestOp: WorldComputeRequest['op'] };

const manager = new WorldChunkManager(DEFAULT_WORLD_CHUNK_OPTIONS);

function postWorkerError(
  id: number | undefined,
  requestOp: WorldComputeRequest['op'],
  err: unknown,
): void {
  const message = err instanceof Error ? err.message : String(err);
  const response: WorldComputeResponse = { op: 'error', id, message, requestOp };
  self.postMessage(response);
}

self.onmessage = (event: MessageEvent<WorldComputeRequest>) => {
  const msg = event.data;
  const id = msg.id;
  const requestOp = msg.op;

  try {
    if (msg.op === 'reset') {
      manager.reset();
      const response: WorldComputeResponse = { op: 'reset', id };
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
        id,
      };
      self.postMessage(response);
      return;
    }

    postWorkerError(id, requestOp, `Unknown worker op: ${String(requestOp)}`);
  } catch (err) {
    postWorkerError(id, requestOp, err);
  }
};
