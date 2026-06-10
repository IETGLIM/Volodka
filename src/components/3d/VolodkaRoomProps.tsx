/**
 * Small CC0 GLB props for volodka_room — decorative only, no colliders.
 */

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { MODEL_URLS } from '@/config/modelUrls';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

interface RoomGlbPropProps {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

function RoomGlbProp({ url, position, rotation = [0, 0, 0], scale = 1 }: RoomGlbPropProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const clone = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((child) => {
      if ('castShadow' in child) {
        (child as { castShadow: boolean }).castShadow = false;
      }
    });
    return scene;
  }, [gltf.scene]);

  return (
    <primitive
      object={clone}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

useGLTF.preload(MODEL_URLS.cc0KhronosBoomBox);
useGLTF.preload(MODEL_URLS.cc0KhronosFox);
useGLTF.preload(MODEL_URLS.cc0KhronosBoxVertexColors);

export function VolodkaRoomProps() {
  return (
    <Suspense fallback={null}>
      {/* BoomBox — desk speaker / retro monitor accent */}
      <RoomGlbProp
        url={MODEL_URLS.cc0KhronosBoomBox}
        position={[0.72, 0.84, -2.58]}
        rotation={[0, -0.35, 0]}
        scale={0.14}
      />
      {/* Fox — bookshelf mascot */}
      <RoomGlbProp
        url={MODEL_URLS.cc0KhronosFox}
        position={[-2.05, 1.55, -0.15]}
        rotation={[0, 0.6, 0]}
        scale={0.22}
      />
      {/* Color box — nightstand clutter */}
      <RoomGlbProp
        url={MODEL_URLS.cc0KhronosBoxVertexColors}
        position={[2.05, 0.56, 2.05]}
        rotation={[0, 0.8, 0]}
        scale={0.08}
      />
    </Suspense>
  );
}
