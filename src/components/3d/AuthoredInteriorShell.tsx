import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { isSceneAssetSystemAllowed } from '@/config/assetOwnership';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import type { SceneId } from '@/shared/types/game';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

type InteriorShellScale = number | [number, number, number];

interface AuthoredInteriorShellProps {
  sceneId?: SceneId;
  url: string;
  position?: [number, number, number];
  rotationY?: number;
  scale?: InteriorShellScale;
  castShadow?: boolean;
}

function cloneInteriorShell(source: THREE.Object3D, castShadow: boolean): THREE.Object3D {
  const clone = source.clone(true);
  clone.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((material) => material.clone());
      } else {
        mesh.material = mesh.material.clone();
      }

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (material && 'envMapIntensity' in material) {
          const standard = material as THREE.MeshStandardMaterial;
          standard.envMapIntensity = Math.max(standard.envMapIntensity ?? 0, 0.75);
          if (typeof standard.roughness === 'number') {
            standard.roughness = Math.min(1, Math.max(0.42, standard.roughness));
          }
          // Pull shell geometry slightly back in depth so procedural props,
          // contact shadows, and inset trim planes win without coplanar flicker.
          standard.polygonOffset = true;
          standard.polygonOffsetFactor = -1;
          standard.polygonOffsetUnits = -1;
          standard.needsUpdate = true;
        }
      }
    }
  });
  return clone;
}

function AuthoredInteriorShellModel({
  url,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  castShadow = true,
}: AuthoredInteriorShellProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const scene = useMemo(() => cloneInteriorShell(gltf.scene, castShadow), [gltf.scene, castShadow]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

export function AuthoredInteriorShell(props: AuthoredInteriorShellProps) {
  if (
    props.sceneId &&
    !isSceneAssetSystemAllowed(props.sceneId, 'interior_shell', 'AuthoredInteriorShell')
  ) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AuthoredInteriorShellModel {...props} />
    </Suspense>
  );
}

useGLTF.preload(INTERIOR_SHELL_MODELS.volodkaBedroom, true, true, extendLoader);
useGLTF.preload(INTERIOR_SHELL_MODELS.cafe, true, true, extendLoader);
useGLTF.preload(INTERIOR_SHELL_MODELS.office, true, true, extendLoader);
useGLTF.preload(INTERIOR_SHELL_MODELS.library, true, true, extendLoader);
