
/* ─── Volodka RPG – Procedural NPC entry (Npc Composer pipeline) ─── */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import type { NPCAppearance } from '@/shared/types/game';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { useNpcVisualBehavior } from '@/engine/npc/useNpcVisualBehavior';
import { useNpcProceduralLayers } from '@/hooks/useNpcProceduralLayers';
import { resolveNpcComposeRecipeForNpc } from '@/config/npcComposer';
import { NpcComposerModel } from '@/components/3d/proceduralNpc/composer/NpcComposerModel';
import { useGamePhase } from '@/store/selectors';
import { useThreeCleanup } from '@/hooks/useThreeCleanup';
import { getProceduralNpcSharedResourceSets } from '../proceduralNpcShared';

const DEFAULT_APPEARANCE: NPCAppearance = {
  bodyColor: '#6a6a7a',
  accentColor: '#9a9aaa',
  headAccessory: 'none',
  height: 1.0,
  glowColor: '#ffffff',
  silhouette: 'average',
};

export interface ProceduralNPCModelProps {
  definitionId: string;
  appearance: NPCAppearance;
  interactionState?: InteractionState;
  isInteractionTarget?: boolean;
  /** Schedule-driven activity for FSM resolution */
  activity?: string;
  patrolActivity?: 'idle' | 'walk';
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Renders a composed procedural NPC from slot recipes + appearance palette. */
export function ProceduralNPCModel(props: ProceduralNPCModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const sharedResources = useMemo(() => getProceduralNpcSharedResourceSets(), []);
  useThreeCleanup(rootRef, { skip: sharedResources });

  return (
    <group ref={rootRef}>
      <ProceduralNPCModelInner {...props} modelRootRef={rootRef} />
    </group>
  );
}

function ProceduralNPCModelInner({
  definitionId,
  appearance,
  interactionState = InteractionState.Idle,
  isInteractionTarget = false,
  activity = 'idle',
  patrolActivity,
  livePlayerPositionRef,
  modelRootRef,
}: ProceduralNPCModelProps & { modelRootRef: React.RefObject<THREE.Group | null> }) {
  const app = appearance ?? DEFAULT_APPEARANCE;
  const gamePhase = useGamePhase();
  const recipe = resolveNpcComposeRecipeForNpc(definitionId);

  const { animState, clipOverrides } = useNpcVisualBehavior({
    npcId: definitionId,
    activity,
    patrolActivity,
    interactionState,
    isInteractionTarget,
    gamePhase,
  });

  useNpcProceduralLayers({
    npcId: definitionId,
    modelRef: modelRootRef,
    animState,
    playerPositionRef: livePlayerPositionRef,
  });

  return <NpcComposerModel npcId={definitionId} recipe={recipe} appearance={app} animState={animState} clipOverrides={clipOverrides} />;
}
