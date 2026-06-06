import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { configureGltfPipeline } from '@/engine/assets/gltfPipeline';

/** Mount once inside Canvas to wire Draco / Meshopt / KTX2 decoders. */
export function GltfPipelineInit() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    configureGltfPipeline(gl);
  }, [gl]);

  return null;
}
