/**
 * Этап 133: standalone KTX2/Basis-загрузчик для ВНЕШНИХ текстур.
 *
 * GLB-встроенные KTX2 идут через gltfPipeline (extendGltfLoader → GLTFLoader).
 * Для useTexture-заменителя (usePolyHavenPbr) нужен отдельный shared-инстанс:
 * TextureLoader не читает KTX2, а drei useTexture построен на TextureLoader.
 *
 * Роутинг по расширению URL:
 *  - .ktx2 → KTX2Loader (транскодер /basis/, detectSupport(renderer));
 *  - прочее (.webp) → TextureLoader.
 *
 * Отказоустойчивость: набор PBR-карт загружается «всё или ничего» — при любом
 * сбое KTX2-пути (инициализация транскодера, воркеры, 404) весь набор
 * перестраивается по WebP-фолбэку, событие уходит в diagnostics
 * (recordAssetFailure), игрок не остаётся без текстур. Полностью провалившийся
 * набор (обе ветки) пробрасывает ошибку в ErrorBoundary — как раньше вёл себя
 * useTexture при 404.
 *
 * Бандл: KTX2Loader импортируется динамически (~571KB JS+WASM транскодера вне
 * основного чанка) — та же дисциплина, что в gltfPipeline.
 */

import { TextureLoader } from 'three';
import type { Texture, WebGLRenderer } from 'three';

import { devLog, devWarn } from '@/shared/utils/devLog';
import { recordAssetFailure } from '@/engine/diagnostics/runtimeDiagnostics';
import { getBasisTranscoderPath } from '@/engine/assets/gltfPipeline';
import type { PolyHavenPbrUrls } from '@/config/polyhavenAssets';

/** Структурный тип (как GltfLoaderLike в gltfPipeline) — без жёсткой связи
 *  с типами examples/jsm, чтобы динамический импорт остался вне бандла. */
interface Ktx2TextureLoaderLike {
  setTranscoderPath(path: string): unknown;
  detectSupport(renderer: WebGLRenderer): Ktx2TextureLoaderLike;
  loadAsync(url: string): Promise<Texture>;
  dispose?(): void;
}

let sharedKtx2: Ktx2TextureLoaderLike | null = null;
let sharedKtx2Init: Promise<Ktx2TextureLoaderLike | null> | null = null;
let lastRenderer: WebGLRenderer | null = null;

/** Кэш промисов по URL — React 19 use() требует стабильную ссылку между
 *  рендерами; также дедуплицирует параллельные запросы (как кэш drei). */
const texturePromises = new Map<string, Promise<Texture>>();

export async function ensureKtx2TextureLoader(
  renderer: WebGLRenderer,
): Promise<Ktx2TextureLoaderLike | null> {
  if (sharedKtx2) {
    if (lastRenderer !== renderer) {
      // Новый Canvas после пересоздания (HMR/восстановление) — перепроверить капы.
      sharedKtx2.detectSupport(renderer);
      lastRenderer = renderer;
    }
    return sharedKtx2;
  }
  if (!sharedKtx2Init) {
    sharedKtx2Init = (async () => {
      try {
        const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js');
        const loader = new KTX2Loader() as unknown as Ktx2TextureLoaderLike;
        loader.setTranscoderPath(getBasisTranscoderPath());
        loader.detectSupport(renderer);
        sharedKtx2 = loader;
        lastRenderer = renderer;
        if (process.env.NODE_ENV !== 'production') {
          devLog('[ktx2Textures] standalone KTX2Loader готов (транскодер /basis/)');
        }
        return loader;
      } catch (err) {
        devWarn('⚠ KTX2 standalone-загрузчик не инициализирован — WebP-фолбэк:', err);
        recordAssetFailure('other', 'ktx2:texture-loader-init');
        return null;
      }
    })();
  }
  return sharedKtx2Init;
}

function isKtx2Url(url: string): boolean {
  return url.toLowerCase().endsWith('.ktx2');
}

export function loadTextureAuto(url: string, renderer: WebGLRenderer): Promise<Texture> {
  const cached = texturePromises.get(url);
  if (cached) return cached;

  const promise: Promise<Texture> = isKtx2Url(url)
    ? ensureKtx2TextureLoader(renderer).then((loader) => {
        if (!loader) throw new Error(`ktx2-loader-unavailable: ${url}`);
        return loader.loadAsync(url);
      })
    : new TextureLoader().loadAsync(url);

  texturePromises.set(url, promise);
  // Пустой catch: rejection НЕ должен помечать кэш как unhandled-rejection —
  // обработка происходит на уровне набора (все-or-ничего фолбэк).
  promise.catch(() => {});
  return promise;
}

export interface PolyHavenTextureSet {
  map: Texture;
  normalMap: Texture;
  roughnessMap: Texture;
  aoMap: Texture;
}

/**
 * Загружает PBR-набор PolyHaven: KTX2 где одобрено, WebP для нормалей.
 * При любом сбое KTX2-ветки — полный набор по WebP-фолбэку (нормали
 * дедуплицируются кэшем — та же ссылка промиса).
 */
export async function loadPolyHavenPbrTextureSet(
  primary: PolyHavenPbrUrls,
  fallback: PolyHavenPbrUrls,
  renderer: WebGLRenderer,
): Promise<PolyHavenTextureSet> {
  const loadSet = (urls: PolyHavenPbrUrls) =>
    Promise.all([
      loadTextureAuto(urls.map, renderer),
      loadTextureAuto(urls.normalMap, renderer),
      loadTextureAuto(urls.roughnessMap, renderer),
      loadTextureAuto(urls.aoMap, renderer),
    ]);

  try {
    const [map, normalMap, roughnessMap, aoMap] = await loadSet(primary);
    return { map, normalMap, roughnessMap, aoMap };
  } catch (err) {
    devWarn(`⚠ KTX2-набор не загрузился (${primary.map}) — переход на WebP:`, err);
    recordAssetFailure('texture', primary.map);
    const [map, normalMap, roughnessMap, aoMap] = await loadSet(fallback);
    return { map, normalMap, roughnessMap, aoMap };
  }
}

export function isKtx2TextureLoaderActive(): boolean {
  return sharedKtx2 !== null;
}

/** Тест-only: очистить кэш промисов (сами текстуры не диспозим — их держат материалы). */
export function resetKtx2TextureCache(): void {
  texturePromises.clear();
}

/** Сброс на teardown/HMR (gpuResourceLifecycle): убить воркеры и пересоздать
 *  лоадер на новом renderer'е. Кэш промисов чистим — лоадер уже убит. */
export function resetKtx2TextureLoader(): void {
  sharedKtx2?.dispose?.();
  sharedKtx2 = null;
  sharedKtx2Init = null;
  lastRenderer = null;
  texturePromises.clear();
}
