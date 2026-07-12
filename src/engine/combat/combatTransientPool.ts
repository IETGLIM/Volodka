import * as THREE from 'three';
import { ObjectPool } from '@/engine/three/objectPool';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';
import { getSharedSphereGeometry } from '@/engine/three/moduleGeometryRegistry';

function getHitSparkGeometry(): THREE.SphereGeometry {
  return getSharedSphereGeometry(0.07, 4, 4);
}

function createHitSpark(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    getHitSparkGeometry(),
    new THREE.MeshBasicMaterial({
      color: '#ff6644',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  return mesh;
}

function resetHitSpark(mesh: THREE.Mesh): void {
  mesh.visible = false;
  mesh.scale.setScalar(1);
  mesh.position.set(0, 0, 0);
}

function disposeHitSpark(mesh: THREE.Mesh): void {
  const sharedGeometry = getHitSparkGeometry();
  disposeObject3DTree(mesh, {
    skip: { geometries: new Set([sharedGeometry]) },
  });
}

/** Prewarm 8, cap total live sparks at 16 — burst acquire returns null when exhausted. */
export const combatHitSparkPool = new ObjectPool(
  createHitSpark,
  resetHitSpark,
  8,
  16,
  disposeHitSpark,
);

export function acquireCombatHitSpark(): THREE.Mesh | null {
  const mesh = combatHitSparkPool.acquire();
  if (!mesh) return null;
  mesh.visible = true;
  return mesh;
}

export function releaseCombatHitSpark(mesh: THREE.Mesh): void {
  combatHitSparkPool.release(mesh);
}

/** Clears pooled meshes; shared geometry is owned by moduleGeometryRegistry. */
export function disposeCombatTransientPools(): void {
  const sharedGeometry = getHitSparkGeometry();
  combatHitSparkPool.clear((mesh) => {
    disposeObject3DTree(mesh, {
      skip: { geometries: new Set([sharedGeometry]) },
    });
  });
}
