import type { WorldComputeRequest, WorldComputeResponse } from '@/workers/worldCompute.worker';

let worker: Worker | null = null;
let requestId = 0;

function nextRequestId(): number {
  requestId += 1;
  return requestId;
}

export function isWorldComputeWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}

export function getWorldComputeWorker(): Worker | null {
  if (!isWorldComputeWorkerAvailable()) return null;
  if (!worker) {
    worker = new Worker(new URL('../../workers/worldCompute.worker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return worker;
}

function postWorldComputeRequest(request: WorldComputeRequest): Promise<WorldComputeResponse> {
  const w = getWorldComputeWorker();
  if (!w) {
    return Promise.reject(new Error('[computeWorker] Workers unavailable in this environment'));
  }

  const id = nextRequestId();

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorldComputeResponse>) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      resolve(event.data);
    };

    const onError = (event: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      reject(event.error ?? new Error(event.message));
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage({ ...request, id } satisfies WorldComputeRequest);
  });
}

/** Compute chunk load/unload diff off the main thread. */
export function requestWorldChunkDiff(
  worldX: number,
  worldZ: number,
): Promise<Extract<WorldComputeResponse, { op: 'chunkDiff' }>> {
  return postWorldComputeRequest({ op: 'chunkDiff', worldX, worldZ }).then((response) => {
    if (response.op !== 'chunkDiff') {
      throw new Error('[computeWorker] Unexpected worker response');
    }
    return response;
  });
}

export function resetWorldComputeWorkerState(): void {
  if (!worker) return;
  worker.postMessage({ op: 'reset' } satisfies WorldComputeRequest);
}

export function disposeWorldComputeWorker(): void {
  if (!worker) return;
  worker.terminate();
  worker = null;
}
