import { useEffect } from 'react';
import { useRapier } from '@react-three/rapier';
import {
  registerInteractionQueryContext,
  unregisterInteractionQueryContext,
  type InteractionQueryContext,
} from '@/engine/interaction/interactionQueryContext';
import { clearInteractionLineOfSightCache } from '@/engine/interaction/interactionTargetQuery';

/** Registers Rapier world for interaction LOS raycasts (inside Physics). */
export function InteractionQueryBridge() {
  const { world, rapier } = useRapier();

  useEffect(() => {
    const ctx = { world, rapier } as InteractionQueryContext;
    registerInteractionQueryContext(ctx);
    return () => {
      unregisterInteractionQueryContext(ctx);
      clearInteractionLineOfSightCache();
    };
  }, [world, rapier]);

  return null;
}
