import { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getAssetDefinition, resolveVariantUrl } from '@/config/assetManifest';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useGltfLocomotionMixer } from '@/hooks/useGltfLocomotionMixer';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import type { ProceduralPlayerModelProps } from './useProceduralPlayerAnimation';
import { ProceduralPlayerModelAdaptive } from './ProceduralPlayerModel';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

interface PlayerGltfSceneProps extends ProceduralPlayerModelProps {
  url: string;
}

function PlayerGltfScene({ url, modelScale, currentAnimRef, rotationRef }: PlayerGltfSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url, true, true, extendLoader);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, {
    castShadow: true,
    receiveShadow: true,
  });

  useGltfLocomotionMixer(mixer, gltf.animations, currentAnimRef);

  useFrameTick('player', () => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotationRef.current;
    }
  });

  return (
    <group ref={groupRef} scale={modelScale}>
      <primitive object={scene} />
    </group>
  );
}

function PlayerGltfModelInner(props: ProceduralPlayerModelProps) {
  const { preset } = useGraphicsQuality();
  const asset = getAssetDefinition('player_volodka');
  if (!asset) return <ProceduralPlayerModelAdaptive {...props} />;

  const url = resolveVariantUrl(asset, preset.compression, 0, preset.lodBias);

  return <PlayerGltfScene url={url} {...props} />;
}

/** Skinned hero GLB — assetManifest `player_volodka` with locomotion mixer fallback. */
export function PlayerGltfModel(props: ProceduralPlayerModelProps) {
  return (
    <Suspense fallback={<ProceduralPlayerModelAdaptive {...props} />}>
      <PlayerGltfModelInner {...props} />
    </Suspense>
  );
}
