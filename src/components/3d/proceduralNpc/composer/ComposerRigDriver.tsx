import { useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { QuaterniusRigRef } from '@/config/npcComposer/types';
import { resolveQuaterniusRigFallbackUrl } from '@/config/quaterniusRigCatalog';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import type { NpcAnimationClipOverrides } from '@/engine/npc/npcClipResolution';
import { applyQuaterniusRigToComposer, invalidateQuaterniusRigRetarget } from '@/engine/npc/quaterniusRigRetarget';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

export interface ComposerRigDriverProps {
  npcId: string;
  rigRef: QuaterniusRigRef;
  composerRef: React.RefObject<THREE.Group | null>;
  animState: NPCAnimationState;
  /** Per-state clip name overrides (e.g. {idle:'sleeping'} for sleep activity). */
  clipOverrides?: NpcAnimationClipOverrides;
  torsoBaseY: number;
  onRigActiveChange: (active: boolean) => void;
}

/**
 * Invisible Quaternius rig — plays Mixamo/embedded clips and retargets bones
 * onto procedural composer groups (head, torso, arms, legs).
 */
export function ComposerRigDriver({
  npcId,
  rigRef,
  composerRef,
  animState,
  clipOverrides,
  torsoBaseY,
  onRigActiveChange,
}: ComposerRigDriverProps) {
  const url = resolveQuaterniusRigFallbackUrl(rigRef);
  const gltf = useGLTF(url, true, true, extendLoader);
  const { scene, mixer, ready } = useSkinnedGltfClone(gltf.scene, gltf.animations, {
    castShadow: false,
    receiveShadow: false,
  });
  const animStateRef = useRef(animState);
  animStateRef.current = animState;
  const cacheKey = `${npcId}:${rigRef}`;

  useEffect(() => {
    scene.traverse((node) => {
      node.visible = false;
      if (node instanceof THREE.Mesh || node instanceof THREE.SkinnedMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
  }, [scene]);

  const embeddedActions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip, scene);
    }
    return record;
  }, [mixer, gltf.animations, scene]);

  const actions = useMixamoAnimationClips(mixer, scene, embeddedActions);
  const { crossfadeTo } = useNPCAnimation(`${npcId}:rig`, actions, clipOverrides);

  useEffect(() => {
    crossfadeTo(animState);
  }, [animState, crossfadeTo]);

  useEffect(() => {
    onRigActiveChange(ready && actions !== null);
  }, [ready, actions, onRigActiveChange]);

  useEffect(() => {
    return () => {
      invalidateQuaterniusRigRetarget(cacheKey);
      onRigActiveChange(false);
    };
  }, [cacheKey, onRigActiveChange]);

  useRegisterNpcFrame(`${npcId}:rig`, 'mixer', ({ delta }) => {
    if (mixer) {
      // Clamp delta to prevent animation jumps on frame stalls (GC pauses,
      // tab backgrounding, etc). 0.05s = ~3 frames at 60fps.
      const dt = Math.min(delta, 0.05);
      mixer.update(dt);
    }
  }, { enabled: ready });

  useRegisterNpcFrame(`${npcId}:rig`, 'procedural', () => {
    const composer = composerRef.current;
    if (!composer || !ready) return;
    applyQuaterniusRigToComposer(cacheKey, scene, composer, torsoBaseY);
  }, { enabled: ready });

  return (
    <primitive object={scene} scale={0.0001} visible={false} />
  );
}
