import { useEffect, type RefObject } from 'react';
import * as THREE from 'three';

/** Dispose all Three.js objects in a group on unmount.
 *  Traverses the group and disposes geometries, materials (and their maps),
 *  preventing GPU memory leaks when 3D components unmount. */
export function useThreeCleanup(groupRef: RefObject<THREE.Group | null>) {
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    return () => {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => {
                if ('map' in m && (m as THREE.MeshStandardMaterial).map) {
                  (m as THREE.MeshStandardMaterial).map!.dispose();
                }
                m.dispose();
              });
            } else {
              if ('map' in mesh.material && (mesh.material as THREE.MeshStandardMaterial).map) {
                (mesh.material as THREE.MeshStandardMaterial).map!.dispose();
              }
              mesh.material.dispose();
            }
          }
        }
      });
    };
  }, [groupRef]);
}
