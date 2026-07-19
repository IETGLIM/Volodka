import { Suspense, useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import type { NPCAppearance } from '@/shared/types/game';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import type { NpcComposeRecipe } from '@/config/npcComposer/types';
import { resolveComposePalette } from '@/config/npcComposer';
import { useProceduralNpcLimbAnimation } from '@/components/3d/proceduralNpc/useProceduralNpcLimbAnimation';
import { ComposerFigure } from '@/components/3d/proceduralNpc/composer/ComposerFigure';
import { ComposerRigDriver } from '@/components/3d/proceduralNpc/composer/ComposerRigDriver';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';

export interface NpcComposerModelProps {
  npcId: string;
  recipe: NpcComposeRecipe;
  appearance: NPCAppearance;
  animState: NPCAnimationState;
  /** Per-state clip name overrides (e.g. {idle:'sleeping'} for sleep activity). */
  clipOverrides?: NpcAnimationClipOverrides;
}

/**
 * Modular CC0-part NPC composer — slots + palette + Quaternius/Mixamo rig retarget.
 */
export function NpcComposerModel({ npcId, recipe, appearance, animState, clipOverrides }: NpcComposerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [rigActive, setRigActive] = useState(false);
  const palette = resolveComposePalette(appearance, recipe);
  const torsoBaseY = recipe.slots.body === 'elder_female_stooped' ? 0.98 : 1.05;

  const handleRigActiveChange = useCallback((active: boolean) => {
    setRigActive(active);
  }, []);

  useProceduralNpcLimbAnimation(
    groupRef,
    animState,
    recipe.bodyLean ?? 0.04,
    torsoBaseY,
    !rigActive,
  );

  return (
    <group
      ref={groupRef}
      scale={[palette.widthScale, palette.heightScale, palette.widthScale]}
      userData={{ npcComposerRig: recipe.rigRef }}
    >
      <Suspense fallback={null}>
        <ComposerRigDriver
          npcId={npcId}
          rigRef={recipe.rigRef}
          composerRef={groupRef}
          animState={animState}
          clipOverrides={clipOverrides}
          torsoBaseY={torsoBaseY}
          onRigActiveChange={handleRigActiveChange}
        />
      </Suspense>
      <ComposerFigure recipe={recipe} palette={palette} />
    </group>
  );
}
