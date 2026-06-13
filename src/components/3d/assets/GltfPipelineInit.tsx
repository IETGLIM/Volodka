import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { configureGltfPipeline } from '@/engine/assets/gltfPipeline';
import {
  registerCanvasRenderer,
  unregisterCanvasRenderer,
} from '@/engine/canvas/canvasRendererRegistry';
import { registerQualityGpuCleanupListener } from '@/engine/graphics/graphicsGpuCleanup';
import { useCanvasRendererCleanup } from '@/hooks/useThreeCleanup';

/** Mount once inside Canvas — Draco/Meshopt/KTX2 + renderer dispose on Canvas unmount. */
export function GltfPipelineInit() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    registerCanvasRenderer(gl, scene);
    return () => unregisterCanvasRenderer(gl);
  }, [gl, scene]);

  useEffect(() => {
    configureGltfPipeline(gl);
  }, [gl]);

  useEffect(() => {
    registerQualityGpuCleanupListener();
  }, []);

  useCanvasRendererCleanup();

  return null;
}
