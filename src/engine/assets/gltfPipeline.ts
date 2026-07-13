/**
 * Central GLTF loader configuration — Draco, Meshopt, KTX2/Basis.
 * Call once when WebGLRenderer is available (inside Canvas).
 *
 * Best-practice notes:
 * - DRACOLoader: WASM decoder preferred (faster than JS), with JS fallback.
 * - KTX2Loader: Created lazily on first use to avoid shipping the Basis
 *   transcoder (~571KB JS+WASM) until a GLTF actually needs it.
 * - MeshoptDecoder: Always available (pure JS, ~50KB, no WASM dependency).
 * - draco_encoder.js is excluded from public/ (build-time-only, ~954KB waste).
 */

import type { WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/** Copy from node_modules/three/examples/jsm/libs/basis/ → public/basis/ */
const DRACO_DECODER_PATH = '/draco/gltf/';
const BASIS_TRANSCODER_PATH = '/basis/';

type GltfLoaderLike = {
  setDRACOLoader: (loader: DRACOLoader) => void;
  setKTX2Loader?: (loader: KTX2Loader) => void;
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
let sharedKtx2: KTX2Loader | null = null;
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

/** Lazily create KTX2Loader on first demand — avoids ~571KB Basis transcoder
 *  download until a GLTF with KTX2/Basis textures is actually loaded. */
function ensureKtx2Loader(): KTX2Loader | null {
  if (sharedKtx2) return sharedKtx2;
  if (!cachedRenderer) return null;
  sharedKtx2 = new KTX2Loader();
  sharedKtx2.setTranscoderPath(BASIS_TRANSCODER_PATH);
  sharedKtx2.detectSupport(cachedRenderer);
  return sharedKtx2;
}

/** Pass to useGLTF(url, true, true, extendLoader) */
export function extendGltfLoader(loader: GltfLoaderLike): void {
  if (sharedDraco) loader.setDRACOLoader(sharedDraco);
  // KTX2 is wired lazily — GLTFLoader will request the KTX2Loader only when
  // it encounters a KHR_texture_basisu extension inside the GLB.
  const ktx2 = ensureKtx2Loader();
  if (ktx2 && loader.setKTX2Loader) loader.setKTX2Loader(ktx2);
  if (loader.setMeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder);
  loader.register?.(specGlossStubPlugin);
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
  sharedKtx2?.dispose();
  sharedKtx2 = null;
}
