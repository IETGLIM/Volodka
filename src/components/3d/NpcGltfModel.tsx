import { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { resolveModelUrl } from '@/config/modelUrls';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { findLocomotionClip } from '@/engine/assets/gltfLocomotionClips';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import { InteractionState } from '@/engine/interaction/interactionMachine';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

const CROSSFADE = 0.25;

interface NpcGltfModelProps {
  npcId: string;
  modelUrl: string;
  activity: string;
  interactionState: InteractionState;
}

/** CC0 / manifest GLB for story NPCs — falls back to procedural via ErrorBoundary. */
export function NpcGltfModel({ npcId, modelUrl, activity, interactionState }: NpcGltfModelProps) {
  const url = resolveModelUrl(modelUrl);
  const gltf = useGLTF(url, true, true, extendLoader);
  const { scene } = useSkinnedGltfClone(gltf.scene, gltf.animations, {
    castShadow: true,
    receiveShadow: true,
  });
  const { actions } = useAnimations(gltf.animations, scene);
  useNPCAnimation(npcId, actions as Record<string, THREE.AnimationAction> | null | undefined);

  useEffect(() => {
    if (!actions || interactionState !== InteractionState.Idle) return;

    const locomotionState = activity === 'walk' || activity === 'run' ? 'walk' : 'idle';
    const clip = findLocomotionClip(gltf.animations, locomotionState);
    if (!clip) return;

    const target = actions[clip.name];
    if (!target) return;

    for (const action of Object.values(actions)) {
      if (!action) continue;
      if (action === target) {
        action.reset().fadeIn(CROSSFADE).play();
      } else {
        action.fadeOut(CROSSFADE);
      }
    }
  }, [actions, activity, gltf.animations, interactionState]);

  return <primitive object={scene} />;
}
