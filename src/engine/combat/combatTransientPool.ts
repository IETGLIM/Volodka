import * as THREE from 'three';
import { ObjectPool } from '@/engine/three/objectPool';
import { disposeObject3DTree } from '@/engine/three/disposeThreeResources';

/** Shared hit-spark mesh pool for combat camera impacts (3D feedback). */
let hitSparkGeometry: THREE.SphereGeometry | null = null;

function getHitSparkGeometry(): THREE.SphereGeometry {
  if (!hitSparkGeometry) {
    hitSparkGeometry = new THREE.SphereGeometry(0.07, 4, 4);
  }
  return hitSparkGeometry;
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
  const sharedGeometry = hitSparkGeometry;
  disposeObject3DTree(mesh, {
    skip: sharedGeometry ? { geometries: new Set([sharedGeometry]) } : undefined,
  });
}

/** Prewarm 8, cap idle pool at 16 — excess sparks are disposed on release. */
export const combatHitSparkPool = new ObjectPool(
  createHitSpark,
  resetHitSpark,
  8,
  16,
  disposeHitSpark,
);

export function acquireCombatHitSpark(): THREE.Mesh {
  const mesh = combatHitSparkPool.acquire();
  mesh.visible = true;
  return mesh;
}

export function releaseCombatHitSpark(mesh: THREE.Mesh): void {
  combatHitSparkPool.release(mesh);
}

export function disposeCombatTransientPools(): void {
  const sharedGeometry = hitSparkGeometry;
  combatHitSparkPool.clear((mesh) => {
    disposeObject3DTree(mesh, {
      skip: sharedGeometry ? { geometries: new Set([sharedGeometry]) } : undefined,
    });
  });
  if (sharedGeometry) {
    sharedGeometry.dispose();
    hitSparkGeometry = null;
  }
}
