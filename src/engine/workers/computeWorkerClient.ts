import type { WorldComputeRequest, WorldComputeResponse } from '@/workers/worldCompute.worker';

let worker: Worker | null = null;
let requestId = 0;

/** FIX (v4.17.1): трекинг pending-запросов — terminate() без reject
 *  оставлял WorldStreamManager.updateStreamAsync в вечном await
 *  (синхронный фолбэк не срабатывал, стриминг чанков зависал). */
interface PendingRequest {
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}
const pendingRequests = new Map<number, PendingRequest>();

/** FIX (v4.17.1): таймаут ответа воркера — молча умерший воркер больше не
 *  оставляет вечный await. 3с с запасом над типичным chunkDiff (<10мс). */
const REQUEST_TIMEOUT_MS = 3_000;

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

function settlePending(id: number): PendingRequest | undefined {
  const pending = pendingRequests.get(id);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingRequests.delete(id);
  }
  return pending;
}

function failAllPending(message: string): void {
  for (const [id, pending] of pendingRequests) {
    clearTimeout(pending.timeout);
    pendingRequests.delete(id);
    pending.reject(new Error(message));
  }
}

function postWorldComputeRequest(request: WorldComputeRequest): Promise<WorldComputeResponse> {
  const w = getWorldComputeWorker();
  if (!w) {
    return Promise.reject(new Error('[computeWorker] Workers unavailable in this environment'));
  }

  const id = nextRequestId();

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorldComputeResponse>) => {
      const data = event.data;
      // FIX (v4.17.1): строгое сравнение id. Раньше фильтр
      // `data.id !== undefined && data.id !== id` пропускал ответ 'reset'
      // (id отсутствует) в ЛЮБОЙ pending-запрос — чужой reset «выполнял»
      // чужое обещание, подменяя результат chunkDiff.
      if (data.id !== id) return;

      cleanup();
      if (data.op === 'error') {
        reject(new Error(`[computeWorker] ${data.requestOp} failed: ${data.message}`));
        return;
      }

      resolve(data);
    };

    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(event.error ?? new Error(event.message));
    };

    const onMessageError = () => {
      cleanup();
      reject(new Error('[computeWorker] messageerror — не удалось десериализовать ответ'));
    };

    const cleanup = () => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      w.removeEventListener('messageerror', onMessageError);
      settlePending(id);
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.addEventListener('messageerror', onMessageError);
    pendingRequests.set(id, {
      reject,
      timeout: setTimeout(() => {
        pendingRequests.delete(id);
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
        w.removeEventListener('messageerror', onMessageError);
        reject(new Error(`[computeWorker] таймаут ответа (${REQUEST_TIMEOUT_MS}мс), op=${request.op}`));
      }, REQUEST_TIMEOUT_MS),
    });
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
  /* FIX (v4.17.1): отклоняем все зависшие запросы — раньше terminate()
   * не сеттил pending-промисы вообще. */
  failAllPending('[computeWorker] воркер терминирован во время запроса');
}

/** Re-arm after orchestrator remount (React StrictMode).
 *  FIX (v4.17.1): раньше revive мгновенно аллоцировал Worker впрок —
 *  лишний поток/память после ремаунта. Воркер создаётся лениво в
 *  getWorldComputeWorker() при первом реальном запросе. */
export function reviveWorldComputeWorker(): void {
  /* Лениво: ничего не делаем. */
}
