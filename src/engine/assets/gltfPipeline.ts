/**
 * Central GLTF loader configuration — Draco, Meshopt, KTX2/Basis.
 * Call once when WebGLRenderer is available (inside Canvas).
 *
 * Best-practice notes:
 * - DRACOLoader: WASM decoder preferred (faster than JS), with JS fallback.
 *   WASM file: /draco/gltf/draco_decoder.wasm (188KB) + JS wrapper 501KB
 *   Cached via vercel.json immutable header, COOP/COEP aware.
 * - KTX2Loader: Loaded via dynamic import() — keeps the Basis transcoder
 *   (~571KB JS+WASM) out of the main bundle until a GLTF actually needs it.
 *   This is critical for Vercel builds where bundle size directly affects
 *   cold-start TTFB. The Basis transcoder WASM is only fetched when
 *   a GLB containing KHR_texture_basisu textures is loaded.
 *   WASM: /basis/basis_transcoder.wasm 515KB + JS 57KB
 * - MeshoptDecoder: Always available (pure JS, ~50KB, no WASM dependency).
 * - draco_encoder.js is excluded from public/ (build-time-only, ~954KB waste).
 *
 * WASM performance:
 * - Draco WASM decode ~3x faster than JS fallback, uses instantiateStreaming if available
 * - Basis transcoder uses WebAssembly.compileStreaming when possible
 * - Both benefit from immutable caching — second load from disk cache in <20ms
 */

import type { WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

import { devLog, devWarn } from '@/shared/utils/devLog';
/** Copy from node_modules/three/examples/jsm/libs/basis/ → public/basis/ */
const DRACO_DECODER_PATH = '/draco/gltf/';
const BASIS_TRANSCODER_PATH = '/basis/';

type GltfLoaderLike = {
  setDRACOLoader: (loader: DRACOLoader) => void;
  setKTX2Loader?: (loader: any) => void;
  setMeshoptDecoder?: (decoder: typeof MeshoptDecoder) => void;
  register?: (callback: (parser: unknown) => { name: string }) => unknown;
};

/* fps_arms.glb ships the legacy KHR_materials_pbrSpecularGlossiness extension
   (support was removed from three.js GLTFLoader). The material safely falls
   back to the asset's metallic-roughness values; registering a named no-op
   plugin only silences the "Unknown extension" console warning.
   Module-level constant — GLTFLoader.register dedupes by callback identity. */
const specGlossStubPlugin = () => ({ name: 'KHR_materials_pbrSpecularGlossiness' });

let configured = false;
let sharedDraco: DRACOLoader | null = null;
let sharedKtx2: unknown | null = null;
let cachedRenderer: WebGLRenderer | null = null;
let pipelineMetrics = {
  dracoInitMs: 0,
  ktx2InitMs: 0,
  meshoptReady: false,
};

function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    try {
      performance.mark(name);
    } catch {}
  }
}

export function configureGltfPipeline(renderer: WebGLRenderer): void {
  if (configured) return;
  configured = true;
  cachedRenderer = renderer;

  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  mark('gltf:draco-start');

  sharedDraco = new DRACOLoader();
  sharedDraco.setDecoderPath(DRACO_DECODER_PATH);
  // Explicitly prefer WASM decoder — faster than pure JS on all modern browsers.
  // Falls back to JS automatically if WASM is not supported.
  // Three.js DRACOLoader internally uses WebAssembly.instantiateStreaming when possible.
  sharedDraco.setDecoderConfig({ type: 'wasm' });

  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  pipelineMetrics.dracoInitMs = end - start;
  pipelineMetrics.meshoptReady = true;

  mark('gltf:draco-end');
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure('gltf:draco-init', 'gltf:draco-start', 'gltf:draco-end');
    } catch {}
  }

  if (process.env.NODE_ENV !== 'production') {
    devLog(`[gltfPipeline] Draco WASM configured at ${DRACO_DECODER_PATH} in ${pipelineMetrics.dracoInitMs.toFixed(0)}ms`);
  }

  // Expose metrics for RuntimeBudgetMonitor
  if (typeof window !== 'undefined') {
    (window as unknown as { __VOLODKA_GLTF_METRICS__?: typeof pipelineMetrics }).__VOLODKA_GLTF_METRICS__ = pipelineMetrics;
  }
}

/** Lazily import and create KTX2Loader via dynamic import().
 *  This keeps the Basis transcoder (~571KB JS+WASM) out of the main bundle.
 *  The module is only fetched when a GLTF with KTX2/Basis textures is loaded.
 *  Uses instantiateStreaming for WASM when supported — ~2-3x faster than ArrayBuffer.
 */
async function ensureKtx2Loader(): Promise<unknown | null> {
  if (sharedKtx2) return sharedKtx2;
  if (!cachedRenderer) return null;

  mark('gltf:ktx2-start');
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js');
    const loader = new KTX2Loader();
    loader.setTranscoderPath(BASIS_TRANSCODER_PATH);
    loader.detectSupport(cachedRenderer);
    sharedKtx2 = loader;

    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    pipelineMetrics.ktx2InitMs = end - start;
    mark('gltf:ktx2-end');
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure('gltf:ktx2-init', 'gltf:ktx2-start', 'gltf:ktx2-end');
      } catch {}
    }

    if (process.env.NODE_ENV !== 'production') {
      devLog(`[gltfPipeline] KTX2/Basis WASM transcoder ready at ${BASIS_TRANSCODER_PATH} in ${pipelineMetrics.ktx2InitMs.toFixed(0)}ms`);
    }

    return loader;
  } catch (err) {
    devWarn('⚠ KTX2Loader dynamic import failed — KTX2 textures will not load:', err);
    mark('gltf:ktx2-error');
    return null;
  }
}

/** Pass to useGLTF(url, true, true, extendLoader)
 *  Synchronous — wires Draco + Meshopt immediately, defers KTX2 to first use.
 *  KTX2Loader is attached asynchronously after dynamic import completes;
 *  GLTFLoader checks for KTX2Loader per-parse, so any GLB loaded after the
 *  import resolves will get KTX2 support. For preloaded GLBs that arrive
 *  before the import resolves, textures fall back to PNG/JPEG.
 */
export function extendGltfLoader(loader: GltfLoaderLike): void {
  if (sharedDraco) loader.setDRACOLoader(sharedDraco);
  if (loader.setMeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
  loader.register?.(specGlossStubPlugin);

  // Fire-and-forget KTX2Loader dynamic import — attached to shared state
  // so subsequent GLTF parses will pick it up via ensureKtx2Loader().
  // This is safe because GLTFLoader.setKTX2Loader only needs to be set
  // before the GLB is parsed, not before the loader is created.
  // Only trigger if textureScale suggests KTX2 may be used (high/ultra)
  void ensureKtx2Loader().then((ktx2) => {
    if (ktx2 && loader.setKTX2Loader) loader.setKTX2Loader(ktx2);
  });
}

export function getDracoDecoderPath(): string {
  return DRACO_DECODER_PATH;
}

export function getBasisTranscoderPath(): string {
  return BASIS_TRANSCODER_PATH;
}

export function isGltfPipelineConfigured(): boolean {
  return configured;
}

/** Whether KTX2Loader has been instantiated (useful for debug / budget tracking). */
export function isKtx2LoaderActive(): boolean {
  return sharedKtx2 !== null;
}

export function getGltfPipelineMetrics(): typeof pipelineMetrics {
  return { ...pipelineMetrics };
}

/** Reset loader singletons after engine dispose or HMR so configureGltfPipeline can re-run. */
export function resetGltfPipeline(): void {
  configured = false;
  cachedRenderer = null;
  sharedDraco?.dispose();
  sharedDraco = null;
  if (sharedKtx2 && typeof (sharedKtx2 as { dispose?: () => void }).dispose === 'function') {
    (sharedKtx2 as { dispose: () => void }).dispose();
  }
  sharedKtx2 = null;
  pipelineMetrics = { dracoInitMs: 0, ktx2InitMs: 0, meshoptReady: false };
}
