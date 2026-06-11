/**
 * Central GLTF loader configuration — Draco, Meshopt, KTX2/Basis.
 * Call once when WebGLRenderer is available (inside Canvas).
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

export function configureGltfPipeline(renderer: WebGLRenderer): void {
  if (configured) return;
  configured = true;

  sharedDraco = new DRACOLoader();
  sharedDraco.setDecoderPath(DRACO_DECODER_PATH);

  sharedKtx2 = new KTX2Loader();
  sharedKtx2.setTranscoderPath(BASIS_TRANSCODER_PATH);
  sharedKtx2.detectSupport(renderer);
}

/** Pass to useGLTF(url, true, true, extendLoader) */
export function extendGltfLoader(loader: GltfLoaderLike): void {
  if (sharedDraco) loader.setDRACOLoader(sharedDraco);
  if (sharedKtx2 && loader.setKTX2Loader) loader.setKTX2Loader(sharedKtx2);
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
