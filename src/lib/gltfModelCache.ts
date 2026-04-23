import { useGLTF } from '@react-three/drei';

/** Сколько разных URL держим в кэше `useLoader(GLTFLoader)`; при превышении вытесняем LRU с нулевой ссылкой. */
const MAX_CACHED_GLTF_URLS = 14;

const refCount = new Map<string, number>();
/** Порядок от LRU (начало) к MRU (конец); только пути, которые хотя бы раз трогали. */
const accessOrder: string[] = [];

function moveToMRU(url: string) {
  const i = accessOrder.indexOf(url);
  if (i >= 0) accessOrder.splice(i, 1);
  accessOrder.push(url);
}

function evictDownToMax() {
  while (accessOrder.length > MAX_CACHED_GLTF_URLS) {
    let evicted = false;
    for (let i = 0; i < accessOrder.length; i++) {
      const url = accessOrder[i];
      if ((refCount.get(url) ?? 0) === 0) {
        useGLTF.clear(url);
        accessOrder.splice(i, 1);
        evicted = true;
        break;
      }
    }
    if (!evicted) break;
  }
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
}

export function __getGltfModelCacheTestState() {
  return {
    refCount: new Map(refCount),
    accessOrder: [...accessOrder],
    max: MAX_CACHED_GLTF_URLS,
  };
}
