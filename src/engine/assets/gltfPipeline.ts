/**
 * Central GLTF loader configuration — Draco, Meshopt, KTX2/Basis.
 * Call once when WebGLRenderer is available (inside Canvas).
 *
 * Best-practice notes:
 * - DRACOLoader: WASM decoder preferred (faster than JS), with JS fallback.
 * - KTX2Loader: Loaded via dynamic import() — keeps the Basis transcoder
 *   (~571KB JS+WASM) out of the main bundle until a GLTF actually needs it.
 *   This is critical for Vercel builds where bundle size directly affects
 *   cold-start TTFB. The Basis transcoder WASM is only fetched when
 *   a GLB containing KHR_texture_basisu textures is loaded.
 * - MeshoptDecoder: Always available (pure JS, ~50KB, no WASM dependency).
 * - draco_encoder.js is excluded from public/ (build-time-only, ~954KB waste).
 */

import type { WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

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

export function configureGltfPipeline(renderer: WebGLRenderer): void {
  if (configured) return;
  configured = true;
  cachedRenderer = renderer;

  sharedDraco = new DRACOLoader();
  sharedDraco.setDecoderPath(DRACO_DECODER_PATH);
  // Explicitly prefer WASM decoder — faster than pure JS on all modern browsers.
  // Falls back to JS automatically if WASM is not supported.
  sharedDraco.setDecoderConfig({ type: 'wasm' });
}

/** Lazily import and create KTX2Loader via dynamic import().
 *  This keeps the Basis transcoder (~571KB JS+WASM) out of the main bundle.
 *  The module is only fetched when a GLTF with KTX2/Basis textures is loaded. */
async function ensureKtx2Loader(): Promise<unknown | null> {
  if (sharedKtx2) return sharedKtx2;
  if (!cachedRenderer) return null;
  try {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js');
    const loader = new KTX2Loader();
    loader.setTranscoderPath(BASIS_TRANSCODER_PATH);
    loader.detectSupport(cachedRenderer);
    sharedKtx2 = loader;
    return loader;
  } catch (err) {
    console.warn('⚠ KTX2Loader dynamic import failed — KTX2 textures will not load:', err);
    return null;
  }
}

/** Pass to useGLTF(url, true, true, extendLoader)
 *  Synchronous — wires Draco + Meshopt immediately, defers KTX2 to first use.
 *  KTX2Loader is attached asynchronously after dynamic import completes;
 *  GLTFLoader checks for KTX2Loader per-parse, so any GLB loaded after the
 *  import resolves will get KTX2 support. For preloaded GLBs that arrive
 *  before the import resolves, textures fall back to PNG/JPEG. */
export function extendGltfLoader(loader: GltfLoaderLike): void {
  if (sharedDraco) loader.setDRACOLoader(sharedDraco);
  if (loader.setMeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
  loader.register?.(specGlossStubPlugin);

  // Fire-and-forget KTX2Loader dynamic import — attached to shared state
  // so subsequent GLTF parses will pick it up via ensureKtx2Loader().
  // This is safe because GLTFLoader.setKTX2Loader only needs to be set
  // before the GLB is parsed, not before the loader is created.
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
}
