import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { configureGltfPipeline } from '@/engine/assets/gltfPipeline';
import { installOpfsCache } from '@/engine/assets/opfsCache';
import {
  registerCanvasRenderer,
  unregisterCanvasRenderer,
} from '@/engine/canvas/canvasRendererRegistry';
import { registerQualityGpuCleanupListener } from '@/engine/graphics/graphicsGpuCleanup';
import { useCanvasRendererCleanup } from '@/hooks/useThreeCleanup';

/** Mount once inside Canvas — Draco/Meshopt/KTX2 + OPFS cache + renderer dispose. */
export function GltfPipelineInit() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    registerCanvasRenderer(gl, scene);
    return () => unregisterCanvasRenderer(gl);
  }, [gl, scene]);

  useEffect(() => {
    configureGltfPipeline(gl);
    // [OPFS] Install Origin Private File System cache for GLB/WASM assets.
    // Intercepts THREE.FileLoader to cache responses in OPFS.
    // On subsequent loads, reads from OPFS instead of fetching from network.
    installOpfsCache();
  }, [gl]);

  useEffect(() => {
    registerQualityGpuCleanupListener();
  }, []);

  useCanvasRendererCleanup();

  return null;
}
