import { useEffect } from 'react';
import { useRapier } from '@react-three/rapier';
import {
  clearPlayerExternalVelocity,
  clearPlayerRigidBody,
  getPlayerRigidBody,
  isPlayerRigidBodyValid,
} from '@/engine/PlayerRigidBodyState';
import { useSceneEnterEffect } from '@/hooks/useSceneEnterEffect';
import type { SceneId } from '@/shared/types/game';

/**
 * App-level Rapier cleanup inside `<Physics>`.
 *
 * `world.free()` is owned by `@react-three/rapier` `<Physics>` on unmount —
 * do not call it here (double-free). This hook clears module-level player
 * refs and external velocity intent, and validates handles after scene changes.
 */
export function useRapierWorldCleanup(): void {
  const { world } = useRapier();

  useEffect(() => {
    return () => {
      clearPlayerExternalVelocity();
      clearPlayerRigidBody();
    };
  }, [world]);

  useSceneEnterEffect((_sceneId: SceneId) => {
    clearPlayerExternalVelocity();
    const rb = getPlayerRigidBody();
    if (rb && !isPlayerRigidBodyValid(rb)) {
      clearPlayerRigidBody();
    }
  });
}
