import { useGLTF } from '@react-three/drei';
import { PROP_DEFINITIONS } from '@/data/propsManifest';

/** Максимальное количество URL в кэше (LRU). При превышении вытесняем по размеру (bytes-based) + refCount. */
const MAX_CACHED_GLTF_URLS = 14;

/** Примерный лимит VRAM для текстур/геометрии (bytes). Используется для bytes-based eviction. */
const MAX_CACHE_BYTES = 80_000_000; // ~80 MB — tunable under Vercel edge constraints

const refCount = new Map<string, number>();
/** Порядок от LRU (начало) к MRU (конец). */
const accessOrder: string[] = [];

/** Примерный размер в байтах для каждого URL (из propsManifest.estimatedGeometryBytes или fallback). */
const estimatedBytes = new Map<string, number>();

function getEstimatedBytes(url: string): number {
  // Normalize path
  const normalized = url.startsWith('/') ? url : `/${url}`;
  for (const def of Object.values(PROP_DEFINITIONS)) {
    if (def.glbPath === normalized && def.estimatedGeometryBytes) {
      return def.estimatedGeometryBytes;
    }
  }
  // Fallback for non-props or unknown
  return 500_000; // conservative default ~0.5MB
}

function moveToMRU(url: string) {
  const i = accessOrder.indexOf(url);
  if (i >= 0) accessOrder.splice(i, 1);
  accessOrder.push(url);
  // Ensure we have size estimate (bytes-based LRU)
  if (!estimatedBytes.has(url)) {
    estimatedBytes.set(url, getEstimatedBytes(url));
  }
}

/**
 * Bytes / URL-cap eviction: среди кандидатов с `refCount === 0` вытесняем в порядке **LRU → MRU**
 * (индекс 0 — давно не трогали, конец массива — недавний `retain` / `touchGltfModelUrl`).
 * Обратный проход с конца выбирал «свежее» нулевое ref и ломал LRU-интуицию.
 */
function evictDownToMax() {
  let totalBytes = 0;
  for (const u of accessOrder) {
    totalBytes += estimatedBytes.get(u) ?? 500_000;
  }

  // First enforce URL count limit (classic LRU for small number of assets)
  while (accessOrder.length > MAX_CACHED_GLTF_URLS) {
    let evicted = false;
    for (let i = 0; i < accessOrder.length; i++) {
      const url = accessOrder[i];
      if ((refCount.get(url) ?? 0) === 0) {
        const bytes = estimatedBytes.get(url) ?? 0;
        useGLTF.clear(url);
        estimatedBytes.delete(url);
        accessOrder.splice(i, 1);
        totalBytes -= bytes;
        evicted = true;
        break;
      }
    }
    if (!evicted) break;
  }

  // Additional bytes-based eviction if over soft VRAM budget (same LRU order as above)
  while (totalBytes > MAX_CACHE_BYTES) {
    let evicted = false;
    for (let i = 0; i < accessOrder.length; i++) {
      const url = accessOrder[i];
      if ((refCount.get(url) ?? 0) === 0) {
        const bytes = estimatedBytes.get(url) ?? 0;
        useGLTF.clear(url);
        estimatedBytes.delete(url);
        accessOrder.splice(i, 1);
        totalBytes -= bytes;
        evicted = true;
        break;
      }
    }
    if (!evicted) break; // all remaining are referenced
  }
}

/**
 * Пометить URL как недавно использованный **без** изменения ref (например повторный кадр с тем же GLB).
 * Без этого порядок в `accessOrder` обновлялся только на `retain`, а не на фактическое обращение к кэшу.
 */
export function touchGltfModelUrl(url: string) {
  if (!url) return;
  if ((refCount.get(url) ?? 0) <= 0) return;
  moveToMRU(url);
}

/** Вызвать при монтировании компонента, который использует `useGLTF(url)`. */
export function retainGltfModelUrl(url: string) {
  if (!url) return;
  refCount.set(url, (refCount.get(url) ?? 0) + 1);
  moveToMRU(url);
  evictDownToMax();
}

/** Вызвать в cleanup после `retainGltfModelUrl` для того же `url`. */
export function releaseGltfModelUrl(url: string) {
  if (!url) return;
  const prev = refCount.get(url);
  if (prev === undefined) return;
  const next = prev - 1;
  if (next <= 0) {
    refCount.delete(url);
    const i = accessOrder.indexOf(url);
    if (i >= 0) accessOrder.splice(i, 1);
    estimatedBytes.delete(url);
    /** Последний потребитель отпустил URL — сразу чистим drei-кэш (иначе «зомби» в `accessOrder` до переполнения LRU). */
    useGLTF.clear(url);
  } else {
    refCount.set(url, next);
  }
  evictDownToMax();
}

/** Для тестов и отладки. */
export function __resetGltfModelCacheTestState() {
  refCount.clear();
  accessOrder.length = 0;
  estimatedBytes.clear();
}

export function __getGltfModelCacheTestState() {
  let totalBytes = 0;
  for (const bytes of estimatedBytes.values()) {
    totalBytes += bytes;
  }

  return {
    refCount: new Map(refCount),
    accessOrder: [...accessOrder],
    estimatedBytes: Object.fromEntries(estimatedBytes),
    totalBytes,
    maxUrls: MAX_CACHED_GLTF_URLS,
    maxBytes: MAX_CACHE_BYTES,
    pressure: totalBytes > MAX_CACHE_BYTES * 0.8 ? 'HIGH' : totalBytes > MAX_CACHE_BYTES * 0.5 ? 'medium' : 'low',
  };
}
