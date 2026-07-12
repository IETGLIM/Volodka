/* ─── Volodka RPG – invisible meshes for camera collision raycasts ─── */
/* Mirrors Rapier cuboid colliders on CAMERA_COLLISION_LAYER (layer 5). */

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getSceneConfig } from '@/config/scenes';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import {
  generateColliders,
  generateBoundaryWallSegments,
  STRUCTURAL_FLOOR_HALF_HEIGHT,
} from '@/config/sceneDefinitionGenerator';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import type { SceneId } from '@/shared/types/game';
import { enableCameraCollisionLayer } from '@/engine/camera/cameraCollisionLayers';

interface CameraCollisionProxiesProps {
  sceneId: SceneId;
}

function buildStructuralCollisionDefs(sceneId: SceneId): ColliderDef[] {
  const config = getSceneConfig(sceneId);
  const [w, d] = config.size;
  const hasCeiling = config.hasCeiling;
  const wallHeight = 4;

  // Mirror the doorway-aware Rapier boundary (SceneStructuralColliders).
  const defs: ColliderDef[] = [...generateBoundaryWallSegments(SCENE_DEFINITIONS[sceneId])];

  if (hasCeiling) {
    defs.push({
      type: 'cuboidObstacle',
      size: [w / 2, 0.1, d / 2],
      position: [0, wallHeight + 0.1, 0],
      name: 'structural_ceiling',
    });
  }

  // Floor slab — helps reverse raycast when camera dips inside geometry.
  const floorY = config.floorY;
  const floorCenterY = floorY - STRUCTURAL_FLOOR_HALF_HEIGHT;
  defs.push({
    type: 'cuboid',
    size: [w / 2, STRUCTURAL_FLOOR_HALF_HEIGHT, d / 2],
    position: [0, floorCenterY, 0],
    name: 'structural_floor',
  });

  return defs;
}

function CameraCollisionBox({ def }: { def: ColliderDef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationY = def.rotation ?? 0;
  const [hx, hy, hz] = def.size;

  useLayoutEffect(() => {
    if (meshRef.current) {
      enableCameraCollisionLayer(meshRef.current);
    }
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={def.position}
      rotation={[0, rotationY, 0]}
      visible={false}
      matrixAutoUpdate
    >
      <boxGeometry args={[hx * 2, hy * 2, hz * 2]} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );
}

/** Invisible proxy boxes tagged for camera collision layer filtering. */
export function CameraCollisionProxies({ sceneId }: CameraCollisionProxiesProps) {
  const defs = useMemo(() => {
    const generated = generateColliders(SCENE_DEFINITIONS[sceneId]);
    return [
      ...generated.walls,
      ...generated.obstacles,
      ...generated.ceilings,
      ...buildStructuralCollisionDefs(sceneId),
    ];
  }, [sceneId]);

  return (
    <group key={`camera-collision:${sceneId}`}>
      {defs.map((def, i) => (
        <CameraCollisionBox key={`${sceneId}-${def.name ?? 'cam-col'}-${i}`} def={def} />
      ))}
    </group>
  );
}
