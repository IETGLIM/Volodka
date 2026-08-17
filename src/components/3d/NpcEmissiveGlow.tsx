/* ─── NPC emissive glow wrapper ─── */

'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { getNpcEmissiveColor } from '@/engine/npc/npcEmissiveColor';

/**
 * Boost emissive on child meshes for readable silhouettes without point lights.
 *
 * CRITICAL: Only apply to GLB NPCs (which use uniquely-cloned materials via
 * useSkinnedGltfClone). Procedural NPCs share material instances across all
 * instances (sharedMat.skinMedium, hairGray, metalGray, etc.) — mutating
 * their emissive here would cross-contaminate EVERY procedural NPC in the
 * scene with the last-mounted NPC's glow color. Procedural NPCs already
 * receive per-NPC glow via `palette.glow` threaded through npcMat()/accentMat().
 */
export function NpcEmissiveGlow({
  npcId,
  glowColor,
  children,
  enabled = true,
}: {
  npcId: string;
  glowColor: string;
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const emissiveColor = useMemo(
    () => getNpcEmissiveColor(npcId, glowColor),
    [npcId, glowColor],
  );

  useEffect(() => {
    if (!enabled) return;
    const root = groupRef.current;
    if (!root) return;
    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!(mat instanceof MeshStandardMaterial)) continue;
        mat.emissive.set(emissiveColor);
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.45);
      }
    });
  }, [emissiveColor, enabled]);

  if (!enabled) return <>{children}</>;
  return <group ref={groupRef}>{children}</group>;
}
