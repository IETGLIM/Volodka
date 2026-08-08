/* ─── NPC LOD impostor — billboard for far-distance NPCs ─── */

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { NPCAppearance } from '@/shared/types/game';
import { getAmbientCrowdImpostorTexture } from '@/engine/graphics/ambientCrowdImpostorTexture';

/** Far LOD: humanoid silhouette billboard (not capsule kitbash). */
export function CapsuleImpostorNPC({ appearance }: { appearance: NPCAppearance }) {
  const map = useMemo(() => getAmbientCrowdImpostorTexture(), []);
  return (
    <group>
      <mesh position={[0, 0.86, 0]}>
        <planeGeometry args={[0.72, 1.72]} />
        <meshStandardMaterial
          map={map}
          alphaMap={map}
          color={appearance.bodyColor}
          emissive={appearance.glowColor}
          emissiveIntensity={0.22}
          transparent
          opacity={0.92}
          roughness={0.9}
          metalness={0.05}
          alphaTest={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 10]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}
