'use client';

import { memo, useEffect, useState } from 'react';
import type { SceneId } from '@/data/types';
import { eventBus } from '@/engine/EventBus';

type Print = { id: number; x: number; z: number; ry: number };

const MAX_PRINTS = 52;

function sceneAllowsFootprints(sceneId: SceneId): boolean {
  return sceneId === 'street_night' || sceneId === 'street_winter' || sceneId === 'memorial_park';
}

export const ExplorationFootprints = memo(function ExplorationFootprints({
  sceneId,
}: {
  sceneId: SceneId;
}) {
  const [printState, setPrintState] = useState<{ sceneId: SceneId; prints: Print[] }>(() => ({
    sceneId,
    prints: [],
  }));
  const prints = printState.sceneId === sceneId ? printState.prints : [];

  useEffect(() => {
    if (!sceneAllowsFootprints(sceneId)) return;
    const off = eventBus.on('exploration:footstep', (p) => {
      setPrintState((prev) => ({
        sceneId,
        prints: [
          ...(prev.sceneId === sceneId ? prev.prints : []).slice(-(MAX_PRINTS - 1)),
          { id: p.timestamp, x: p.x, z: p.z, ry: p.yaw },
        ],
      }));
    });
    return off;
  }, [sceneId]);

  if (!sceneAllowsFootprints(sceneId)) return null;

  return (
    <group>
      {prints.map((pr) => (
        <mesh key={pr.id} rotation={[-Math.PI / 2, 0, pr.ry]} position={[pr.x, 0.034, pr.z]} renderOrder={1}>
          <circleGeometry args={[0.12, 10]} />
          <meshBasicMaterial color="#050808" transparent opacity={0.32} depthWrite={false} depthTest />
        </mesh>
      ))}
    </group>
  );
});
