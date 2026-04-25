import type { Object3D } from 'three';
import { useGLTF } from '@react-three/drei';
import { PROP_DEFINITIONS } from '@/data/propsManifest';
import { estimateObject3DGpuBytes } from '@/lib/gltfByteEstimate';

export { estimateObject3DGpuBytes, logGltfLoadedFootprintDev } from '@/lib/gltfByteEstimate';

/** Максимальное количество URL в кэше (LRU). При превышении вытесняем по размеру (bytes-based) + refCount. */
const MAX_CACHED_GLTF_URLS = 14;

/** Примерный лимит VRAM для текстур/геометрии (bytes). Используется для bytes-based eviction. */
const MAX_CACHE_BYTES = 80_000_000; // ~80 MB — tunable under Vercel edge constraints

/**
 * После последнего `release` не зовём `useGLTF.clear` сразу: короткая задержка снижает повторную
 * загрузку с диска/сети при быстром remount (Strict Mode, смена чанка, prefetch ↔ сцена).
 * Повторный `retain` отменяет таймер; принудительное eviction — `clear` сразу + отмена таймера.
 */
export const GLTF_CLEAR_GRACE_MS = 2_000;

const graceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function cancelScheduledDreiClear(url: string) {
  const t = graceTimers.get(url);
  if (t !== undefined) {
    clearTimeout(t);
    graceTimers.delete(url);
  }
}

/**
 * Идемпотентная очистка drei: не трогаем кэш, если снова есть `retain` (ref > 0).
 * Отменяет отложенный таймер — вызывать из eviction, по таймауту grace и при необходимости извне.
 */
function invokeDreiClearIfUnreferenced(url: string) {
  cancelScheduledDreiClear(url);
  if ((refCount.get(url) ?? 0) > 0) return;
  useGLTF.clear(url);
}

function scheduleDreiClear(url: string) {
  cancelScheduledDreiClear(url);
  const t = setTimeout(() => {
    graceTimers.delete(url);
    invokeDreiClearIfUnreferenced(url);
  }, GLTF_CLEAR_GRACE_MS);
  graceTimers.set(url, t);
}

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
 * Синхронизирует `estimatedBytes` с `accessOrder` и возвращает сумму байт по **текущему** списку.
 * - Удаляет ключи карты без URL в очереди (осиротевшие оценки после ручных правок / гонок).
 * - Для каждого URL в очереди гарантирует валидную запись (как при `moveToMRU`).
 * Используется в `evictDownToMax` после каждого вытеснения вместо инкрементального `totalBytes -= …`,
 * чтобы не расходились сумма, карта и порядок (разные fallback `?? 500_000` vs `?? 0` и т.п.).
 */
function syncEstimatedBytesWithAccessOrderAndSum(): number {
  const alive = new Set(accessOrder);
  for (const k of [...estimatedBytes.keys()]) {
    if (!alive.has(k)) estimatedBytes.delete(k);
  }
  let total = 0;
  for (const u of accessOrder) {
    let b = estimatedBytes.get(u);
    if (b == null || !Number.isFinite(b) || b < 0) {
      b = getEstimatedBytes(u);
      estimatedBytes.set(u, b);
    }
    total += b;
  }
  return total;
}

/** Байтовое вытеснение: среди `refCount === 0` — самый «тяжёлый» по оценке (при равенстве — более LRU). */
function pickUnreferencedEvictionTargetPreferLargestBytes(): { i: number; url: string } | null {
  const candidates: { i: number; url: string; bytes: number }[] = [];
  for (let i = 0; i < accessOrder.length; i++) {
    const url = accessOrder[i];
    if ((refCount.get(url) ?? 0) === 0) {
      const bytes = estimatedBytes.get(url) ?? getEstimatedBytes(url);
      candidates.push({ i, url, bytes });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.bytes - a.bytes || a.i - b.i);
  const c = candidates[0]!;
  return { i: c.i, url: c.url };
}

/**
 * После `useGLTF` обновить оценку байт по фактической сцене (геометрия + текстуры) и при необходимости
 * запустить eviction. Вызывать только пока URL удерживается `retain` (`refCount > 0`).
 */
export function recordGltfGpuByteEstimateFromScene(url: string, root: Object3D) {
  if (!url.trim() || !root) return;
  if ((refCount.get(url) ?? 0) <= 0) return;
  estimatedBytes.set(url, estimateObject3DGpuBytes(root));
  evictDownToMax();
}

/**
 * Bytes / URL-cap eviction: лимит URL — LRU среди `refCount === 0`; лимит байт — **крупнейший** нулевой ref.
 */
function evictDownToMax() {
  let totalBytes = syncEstimatedBytesWithAccessOrderAndSum();

  // First enforce URL count limit (classic LRU for small number of assets)
  while (accessOrder.length > MAX_CACHED_GLTF_URLS) {
    let evicted = false;
    for (let i = 0; i < accessOrder.length; i++) {
      const url = accessOrder[i];
      if ((refCount.get(url) ?? 0) === 0) {
        invokeDreiClearIfUnreferenced(url);
        estimatedBytes.delete(url);
        accessOrder.splice(i, 1);
        evicted = true;
        break;
      }
    }
    if (!evicted) break;
    totalBytes = syncEstimatedBytesWithAccessOrderAndSum();
  }

  // Bytes over budget: вытесняем самый большой незареференный ассет (оценка байт), затем полный пересчёт суммы.
  while (totalBytes > MAX_CACHE_BYTES) {
    const pick = pickUnreferencedEvictionTargetPreferLargestBytes();
    if (!pick) break;
    const { i, url } = pick;
    invokeDreiClearIfUnreferenced(url);
    estimatedBytes.delete(url);
    accessOrder.splice(i, 1);
    totalBytes = syncEstimatedBytesWithAccessOrderAndSum();
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
  cancelScheduledDreiClear(url);
  refCount.set(url, (refCount.get(url) ?? 0) + 1);
  moveToMRU(url);
  evictDownToMax();
}

const MAX_RELEASE_CAS_ATTEMPTS = 32;

/**
 * Декремент ref с повтором при гонке (два `release` подряд / эффекты стриминга): значение в Map
 * сравнивается с моментом чтения; при расхождении — повтор. Финальный `useGLTF.clear` только через
 * `invokeDreiClearIfUnreferenced` / grace, чтобы не дергать drei при уже отменённом состоянии.
 */
export function releaseGltfModelUrl(url: string) {
  if (!url) return;
  for (let attempt = 0; attempt < MAX_RELEASE_CAS_ATTEMPTS; attempt++) {
    const prev = refCount.get(url);
    if (prev === undefined) return;
    if (prev < 1) return;

    if (refCount.get(url) !== prev) continue;

    const next = prev - 1;
    if (next <= 0) {
      refCount.delete(url);
      const i = accessOrder.indexOf(url);
      if (i >= 0) accessOrder.splice(i, 1);
      estimatedBytes.delete(url);
      /** Отложенный `useGLTF.clear` — см. `GLTF_CLEAR_GRACE_MS`; повторный `retain` отменяет таймер. */
      scheduleDreiClear(url);
    } else {
      refCount.set(url, next);
    }
    evictDownToMax();
    return;
  }
}

/** Для тестов и отладки. */
export function __resetGltfModelCacheTestState() {
  for (const t of graceTimers.values()) clearTimeout(t);
  graceTimers.clear();
  refCount.clear();
  accessOrder.length = 0;
  estimatedBytes.clear();
}

export function __getGltfModelCacheTestState() {
  /** Только URL из `accessOrder` + те же правила оценки, что и в eviction (без суммы «хвостов» карты). */
  let totalBytes = 0;
  for (const u of accessOrder) {
    const b = estimatedBytes.get(u);
    totalBytes += b != null && Number.isFinite(b) && b >= 0 ? b : getEstimatedBytes(u);
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
