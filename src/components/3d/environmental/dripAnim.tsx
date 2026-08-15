import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, RingGeometry, SphereGeometry } from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';

interface DripDrop {
  y: number;
  falling: boolean;
  splashTime: number;
}

export function DripAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const dripTimerRef = useRef(0);
  const dropRef = useRef<DripDrop | null>(null);
  const interval = anim.config.interval ?? 3.0;
  const splashDuration = anim.config.splashDuration ?? 0.5;
  const startY = anim.position[1];
  const endY = 0; // ground level

  // Pre-create drop mesh (reused, toggled via visibility)
  const { dropMesh, dropMat, splashRings, splashMats, splashGroup } = useMemo(() => {
    const dropGeo = new SphereGeometry(0.02, 6, 6);
    const dropMat = new MeshBasicMaterial({
      color: '#88aacc',
      transparent: true,
      opacity: 0.7,
    });
    const dropMesh = new Mesh(dropGeo, dropMat);
    dropMesh.visible = false;

    const splashGeo = new RingGeometry(0, 0.1, 8);
    const splashGroup = new Group();
    splashGroup.visible = false;
    const splashRings: Mesh[] = [];
    const splashMats: MeshBasicMaterial[] = [];
    for (let i = 0; i < 4; i++) {
      const mat = new MeshBasicMaterial({
        color: '#88aacc',
        transparent: true,
        opacity: 0.5,
        side: DoubleSide,
      });
      const ring = new Mesh(splashGeo, mat);
      const angle = (i / 4) * Math.PI * 2;
      ring.position.set(
        Math.cos(angle) * 0.05,
        0.01,
        Math.sin(angle) * 0.05,
      );
      ring.rotation.x = -Math.PI / 2;
      splashGroup.add(ring);
      splashRings.push(ring);
      splashMats.push(mat);
    }
    splashGroup.position.set(anim.position[0], endY, anim.position[2]);

    return { dropMesh, dropMat, splashRings, splashMats, splashGroup, dropGeo, splashGeo };
  }, [anim.position, endY]);

  // Add pre-created meshes to the group once
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.add(dropMesh);
    groupRef.current.add(splashGroup);
  }, [dropMesh, splashGroup]);

  // Dispose all geometries/materials on unmount
  useEffect(() => {
    const dMesh = dropMesh;
    const dMat = dropMat;
    const sRings = splashRings;
    const sMats = splashMats;
    const sGroup = splashGroup;
    return () => {
      dMesh.geometry.dispose();
      dMat.dispose();
      // All splash rings share the same geometry, dispose once
      if (sRings.length > 0) sRings[0].geometry.dispose();
      sMats.forEach((m) => m.dispose());
      // Remove from parent if still attached
      if (dMesh.parent) dMesh.parent.remove(dMesh);
      if (sGroup.parent) sGroup.parent.remove(sGroup);
    };
  }, [dropMesh, dropMat, splashRings, splashMats, splashGroup]);

   
  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    dripTimerRef.current += delta;

    // Spawn a new drip at intervals
    if (!dropRef.current && dripTimerRef.current >= interval) {
      dripTimerRef.current = 0;
      dropRef.current = {
        y: startY,
        falling: true,
        splashTime: 0,
      };

      // Show drop mesh at start position
      dropMesh.position.set(anim.position[0], startY, anim.position[2]);
      dropMesh.visible = true;
      dropMat.opacity = 0.7;

      // Hide splash
      splashGroup.visible = false;
    }

    // Update falling drop
    if (dropRef.current && dropRef.current.falling) {
      dropRef.current.y -= delta * 5; // Fall speed
      dropMesh.position.y = dropRef.current.y;

      // Hit ground
      if (dropRef.current.y <= endY) {
        dropRef.current.falling = false;
        dropRef.current.splashTime = 0;

        // Hide drop, show splash
        dropMesh.visible = false;
        splashGroup.visible = true;
        // Reset splash ring scales and opacity
        for (let i = 0; i < splashRings.length; i++) {
          splashRings[i].scale.setScalar(1);
          splashMats[i].opacity = 0.5;
        }
      }
    }

    // Animate splash fade
    if (dropRef.current && !dropRef.current.falling) {
      dropRef.current.splashTime += delta;
      const progress = dropRef.current.splashTime / splashDuration;

      for (let i = 0; i < splashRings.length; i++) {
        splashMats[i].opacity = 0.5 * (1 - progress);
        const scale = 1 + progress * 3;
        splashRings[i].scale.setScalar(scale);
      }

      if (progress >= 1) {
        splashGroup.visible = false;
        dropRef.current = null;
      }
    }
  });
   

  // Cleanup
  useEffect(() => {
    return () => {
      dropRef.current = null;
    };
  }, []);

  return <group ref={groupRef} />;
}
