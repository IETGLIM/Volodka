import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { isSceneAssetSystemAllowed } from '@/config/assetOwnership';
import {
  isExteriorBuildingShell,
  type InteriorShellModelId,
} from '@/config/interiorShellScale';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { scheduleGltfPreload, GltfPreloadPriority } from '@/engine/assets/gltfPreloadScheduler';
import {
  applyPhotoPbrMapSetToRoot,
  polyHavenIdsForMood,
  type PhotoPbrMapSet,
} from '@/engine/graphics/materials/applyPhotoPbrMaps';
import {
  weatherEnvironmentMaterials,
  type EnvironmentMaterialMood,
} from '@/engine/graphics/materials/weatherEnvironmentMaterials';
import { usePolyHavenPbr } from '@/hooks/usePolyHavenPbr';
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
  /** When set, exterior Kenney building impostors are refused even if ownership allows. */
  shellModelId?: InteriorShellModelId;
  /** Outdoor backdrops should use street/plaza wear, not plaster interiors. */
  materialMood?: EnvironmentMaterialMood;
}

function resolveShellModelId(
  url: string,
  shellModelId?: InteriorShellModelId,
): InteriorShellModelId | null {
  if (shellModelId) return shellModelId;
  const entry = Object.entries(INTERIOR_SHELL_MODELS).find(([, path]) => path === url);
  if (!entry) return null;
  return entry[0] as InteriorShellModelId;
}

function cloneInteriorShell(
  source: THREE.Object3D,
  castShadow: boolean,
  materialMood: EnvironmentMaterialMood,
  photoMapSet: PhotoPbrMapSet | null,
): THREE.Object3D {
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
        if (material && 'polygonOffset' in material) {
          const standard = material as THREE.MeshStandardMaterial;
          // Pull shell geometry slightly back so props/contact shadows win z-order.
          standard.polygonOffset = true;
          standard.polygonOffsetFactor = -1;
          standard.polygonOffsetUnits = -1;
          standard.needsUpdate = true;
        }
      }
    }
  });
  // Clamp plastic IBL first; multi-role photo PBR replaces procedural noise on large surfaces.
  weatherEnvironmentMaterials(clone, materialMood, { applyMaps: photoMapSet ? false : true });
  if (photoMapSet) {
    applyPhotoPbrMapSetToRoot(clone, photoMapSet, 1);
  }
  return clone;
}

function AuthoredInteriorShellModel({
  url,
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  castShadow = true,
  materialMood = 'interior',
}: AuthoredInteriorShellProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const ids = polyHavenIdsForMood(materialMood);
  const floorMaps = usePolyHavenPbr(ids.floor, materialMood === 'street' ? 1.2 : 1.05);
  const wallMaps = usePolyHavenPbr(ids.wall, 1);
  const ceilingMaps = usePolyHavenPbr(ids.ceiling, 0.9);
  // usePolyHavenPbr returns a fresh object each render — depend on texture
  // identities so we do not clone/dispose the shell every frame (black flash).
  const photoMapSet = useMemo<PhotoPbrMapSet>(
    () => ({ floor: floorMaps, wall: wallMaps, ceiling: ceilingMaps }),
    [
      floorMaps.map,
      floorMaps.normalMap,
      floorMaps.roughnessMap,
      floorMaps.aoMap,
      floorMaps.repeat,
      wallMaps.map,
      wallMaps.normalMap,
      wallMaps.roughnessMap,
      wallMaps.aoMap,
      wallMaps.repeat,
      ceilingMaps.map,
      ceilingMaps.normalMap,
      ceilingMaps.roughnessMap,
      ceilingMaps.aoMap,
      ceilingMaps.repeat,
    ],
  );
  const scene = useMemo(
    () => cloneInteriorShell(gltf.scene, castShadow, materialMood, photoMapSet),
    [gltf.scene, castShadow, materialMood, photoMapSet],
  );

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

  const shellId = resolveShellModelId(props.url, props.shellModelId);
  // Block Kenney facade impostors from walkable mounts; allow backdrop_dressing
  // (factory/basement/pier/forest via SceneBackdropShell) and walkable_envelope
  // (corridor) through. Never use backdrop shells as wall replacements.
  if (shellId && isExteriorBuildingShell(shellId)) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <AuthoredInteriorShellModel {...props} />
    </Suspense>
  );
}

// Exterior Kenney building impostors (cafe/office/library) are blocked from
// walkable mounts — do not preload them here. Backdrop shells below remain valid.
// Session 9 perf: routed through gltfPreloadScheduler to avoid sync parse-storm.
const SHELL_PRELOAD_URLS = [
  INTERIOR_SHELL_MODELS.volodkaBedroom, INTERIOR_SHELL_MODELS.factory,
  INTERIOR_SHELL_MODELS.basement, INTERIOR_SHELL_MODELS.pier,
  INTERIOR_SHELL_MODELS.forestClearing,
];
for (const url of SHELL_PRELOAD_URLS) {
  scheduleGltfPreload(
    url,
    () => useGLTF.preload(url, true, true, extendLoader),
    GltfPreloadPriority.Normal,
  );
}
