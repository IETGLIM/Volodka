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

/** FIX P0 #7: Max wall-clock time we wait for a single worker response before
 *  giving up. Chunk diff is a few-millisecond computation; 5s is ~1000× the
 *  expected duration and covers slow devices under heavy main-thread pressure.
 *  Without this timeout a hung worker (not crashed, just unresponsive) would
 *  leave `WorldStreamManager.updateStreamAsync` pending forever — chunk
 *  streaming would silently die with no error or recovery. */
const WORKER_REQUEST_TIMEOUT_MS = 5_000;

function postWorldComputeRequest(request: WorldComputeRequest): Promise<WorldComputeResponse> {
  const w = getWorldComputeWorker();
  if (!w) {
    return Promise.reject(new Error('[computeWorker] Workers unavailable in this environment'));
  }

  const id = nextRequestId();

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
    };

    const onMessage = (event: MessageEvent<WorldComputeResponse>) => {
      const data = event.data;
      if (data.id !== undefined && data.id !== id) return;
      if (settled) return;
      settled = true;
      cleanup();

      if (data.op === 'error') {
        reject(new Error(`[computeWorker] ${data.requestOp} failed: ${data.message}`));
        return;
      }

      resolve(data);
    };

    const onError = (event: ErrorEvent) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(event.error ?? new Error(event.message));
    };

    // FIX P0 #7: timeout — if the worker hangs (not crashes), reject so the
    // caller (WorldStreamManager) can fall back to main-thread computation
    // instead of waiting forever for a response that will never arrive.
    timeoutHandle = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`[computeWorker] request ${request.op} timed out after ${WORKER_REQUEST_TIMEOUT_MS}ms`));
    }, WORKER_REQUEST_TIMEOUT_MS);

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

/** Re-arm after orchestrator remount (React StrictMode). Lazily recreates worker on next use. */
export function reviveWorldComputeWorker(): void {
  getWorldComputeWorker();
}
