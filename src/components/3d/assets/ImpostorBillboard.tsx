import { Suspense, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { DoubleSide, MeshBasicMaterial } from 'three';

export interface ImpostorBillboardProps {
  /** KTX2 or PNG impostor atlas */
  url: string;
  position?: [number, number, number];
  scale?: number;
}

function ImpostorInner({ url, position = [0, 0, 0], scale = 4 }: ImpostorBillboardProps) {
  const map = useTexture(url);
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map,
        transparent: true,
        alphaTest: 0.4,
        depthWrite: false,
        side: DoubleSide,
      }),
    [map],
  );

  return (
    <mesh position={position} scale={scale} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

/** Distant LOD impostor — billboard facing camera (use with Billboard from drei in scenes). */
export function ImpostorBillboard(props: ImpostorBillboardProps) {
  return (
    <Suspense fallback={null}>
      <ImpostorInner {...props} />
    </Suspense>
  );
}
