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
  classifyShellSurfaceRole,
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

/**
 * WS18-C: Upgrade a MeshStandardMaterial to MeshPhysicalMaterial with clearcoat
 * for wet/rainy surface effect. Preserves all standard PBR props (color, map,
 * normalMap, roughnessMap, aoMap, roughness, metalness, emissive, etc.) and
 * adds clearcoat + clearcoatRoughness. Used on floor-role shell meshes so
 * interior floors read as damp/rain-spilled without altering wall/ceiling reads.
 */
function upgradeShellFloorToPhysicalWet(
  std: THREE.MeshStandardMaterial,
  clearcoat: number,
  clearcoatRoughness: number,
): THREE.MeshPhysicalMaterial {
  const phys = new THREE.MeshPhysicalMaterial();
  // Preserve common Material props
  phys.name = std.name;
  phys.transparent = std.transparent;
  phys.opacity = std.opacity;
  phys.depthWrite = std.depthWrite;
  phys.depthTest = std.depthTest;
  phys.side = std.side;
  phys.blending = std.blending;
  phys.toneMapped = std.toneMapped;
  phys.visible = std.visible;
  phys.alphaTest = std.alphaTest;
  // Preserve MeshStandardMaterial props
  phys.color.copy(std.color);
  phys.map = std.map;
  phys.normalMap = std.normalMap;
  if (std.normalScale) phys.normalScale.copy(std.normalScale);
  phys.roughnessMap = std.roughnessMap;
  phys.aoMap = std.aoMap;
  phys.aoMapIntensity = std.aoMapIntensity;
  phys.roughness = std.roughness;
  phys.metalness = std.metalness;
  phys.emissive.copy(std.emissive);
  phys.emissiveMap = std.emissiveMap;
  phys.emissiveIntensity = std.emissiveIntensity;
  phys.envMapIntensity = std.envMapIntensity;
  phys.lightMap = std.lightMap;
  phys.lightMapIntensity = std.lightMapIntensity;
  // Preserve polygonOffset (set earlier in cloneInteriorShell)
  phys.polygonOffset = std.polygonOffset;
  phys.polygonOffsetFactor = std.polygonOffsetFactor;
  phys.polygonOffsetUnits = std.polygonOffsetUnits;
  // WS18-C: add clearcoat for wet/rainy surface effect
  phys.clearcoat = clearcoat;
  phys.clearcoatRoughness = clearcoatRoughness;
  phys.needsUpdate = true;
  return phys;
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
  // WS18-C: upgrade floor-role shell materials to MeshPhysicalMaterial with
  // clearcoat for wet/rainy surface effect. Only floor meshes (not walls/ceiling)
  // get the wet sheen — keeps the read cohesive (damp floor near doorways/windows,
  // dry walls/ceiling). AuthoredInteriorShell has no JSX material definitions
  // (materials come from the GLB), so the upgrade is done imperatively in the
  // clone traverse. Floor-role classification reuses classifyShellSurfaceRole
  // (name heuristic + thin-horizontal-slab geometry heuristic).
  clone.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const mesh = node as THREE.Mesh;
    if (classifyShellSurfaceRole(mesh) !== 'floor') return;
    const sourceMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let mutated = false;
    const nextMats = sourceMats.map((material) => {
      if (!material) return material;
      // Skip if already MeshPhysicalMaterial (e.g. shell GLB authored with physical).
      if ((material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) return material;
      if (!('envMapIntensity' in material)) return material;
      mutated = true;
      return upgradeShellFloorToPhysicalWet(
        material as THREE.MeshStandardMaterial,
        0.4,
        0.35,
      );
    });
    if (mutated) {
      mesh.material = nextMats.length === 1 ? nextMats[0]! : nextMats;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
