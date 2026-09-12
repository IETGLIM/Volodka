/**
 * FIX (v4.17.1): общий 5Hz-тикер синхронизации активного LOD-URL.
 *
 * Раньше каждый LOD-ассет (GltfLodBranches) создавал собственный
 * setInterval(200мс) для опроса activeUrlRef — N ассетов = N интервалов,
 * размножение таймеров и лишняя работа браузера (INP). Теперь один
 * интервал на всё приложение: подписчики опрашивают свой ref в общем
 * тике, интервал живёт, пока есть хотя бы один подписчик.
 */

export const LOD_URL_TICK_MS = 200;

type LodUrlTickListener = () => void;

const listeners = new Set<LodUrlTickListener>();
let intervalHandle: ReturnType<typeof setInterval> | null = null;

function ensureRunning(): void {
  if (intervalHandle !== null) return;
  if (typeof setInterval === 'undefined') return; // SSR guard
  intervalHandle = setInterval(() => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        // Один сломанный подписчик не должен останавливать остальных.
      }
    }
  }, LOD_URL_TICK_MS);
}

function maybeStop(): void {
  if (listeners.size === 0 && intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/** Подписаться на общий тик. Возвращает функцию отписки. */
export function subscribeLodUrlTick(listener: LodUrlTickListener): () => void {
  listeners.add(listener);
  ensureRunning();
  return () => {
    listeners.delete(listener);
    maybeStop();
  };
}
