'use client';

import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { footstepColliderName } from '@/lib/footstepMaterials';

export const PANEL_BUILDING_SPECS = [
  { pos: [-19, 3, -10] as const, size: [5, 7, 5] as const },
  { pos: [20, 3.5, -8] as const, size: [6, 8, 5] as const },
  { pos: [-16, 4, 16] as const, size: [5, 10, 5] as const },
  { pos: [17, 2.5, 14] as const, size: [5, 6, 5] as const },
  { pos: [0, 2, -22] as const, size: [14, 5, 4] as const },
] as const;

const PanelFacadesInstanced = memo(function PanelFacadesInstanced() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a1210',
        roughness: 0.92,
        metalness: 0.08,
        emissive: '#001a12',
        emissiveIntensity: 0.12,
      }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    PANEL_BUILDING_SPECS.forEach((b, i) => {
      p.set(b.pos[0], b.pos[1], b.pos[2]);
      q.identity();
      s.set(b.size[0], b.size[1], b.size[2]);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh
      ref={ref}
      args={[geo, mat, PANEL_BUILDING_SPECS.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
});

/** Коллайдеры по одному + один instanced mesh на все фасады (меньше draw calls). */
export const PanelDistrictBuildings = memo(function PanelDistrictBuildings() {
  return (
    <group userData={{ noCameraCollision: true }}>
      {PANEL_BUILDING_SPECS.map((b, i) => (
        <RigidBody key={`panel-rb-${i}`} type="fixed" colliders={false} position={[b.pos[0], b.pos[1], b.pos[2]]}>
          <CuboidCollider args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]} name={footstepColliderName('metal')} />
        </RigidBody>
      ))}
      <PanelFacadesInstanced />
    </group>
  );
});
