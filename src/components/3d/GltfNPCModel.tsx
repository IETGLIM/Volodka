/* ─── Volodka RPG – Animated GLB NPC mesh with procedural fallback ─── */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { NPCDefinition } from '@/shared/types/game';
import { getNpcModelMeta, resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useNPCAnimation } from '@/engine/npc/useNPCAnimation';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

const TARGET_HEIGHT = 1.7;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

function measure(obj: THREE.Object3D): { size: THREE.Vector3; min: THREE.Vector3 } {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  if (!box.isEmpty()) box.getSize(size);
  return { size, min: box.min.clone() };
}

interface GltfNPCModelInnerProps {
  definition: NPCDefinition;
  url: string;
  modelScale: number;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
}

function GltfNPCModelInner({
  definition,
  url,
  modelScale,
  interactionState,
  isInteractionTarget,
}: GltfNPCModelInnerProps) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const fitRef = useRef<THREE.Group>(null);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const [fit, setFit] = useState<Fit>({ scale: modelScale, rotX: 0, y: 0 });

  const actions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip);
    }
    return record;
  }, [mixer, gltf.animations]);

  useNPCAnimation(definition.id, actions, definition.animations?.idle);

  useEffect(() => {
    const inner = fitRef.current;
    if (!inner) return;
    inner.rotation.set(0, 0, 0);
    inner.scale.set(1, 1, 1);
    inner.position.set(0, 0, 0);

    const { size } = measure(scene);
    let rotX = 0;
    let heightDim = size.y;
    if (size.z > size.y * 1.15) {
      rotX = -Math.PI / 2;
      heightDim = size.z;
    }
    if (!isFinite(heightDim) || heightDim < 0.2) heightDim = 1.5;
    const autoScale = (TARGET_HEIGHT / heightDim) * modelScale;

    inner.rotation.x = rotX;
    inner.scale.setScalar(autoScale);
    const { min } = measure(scene);
    const y = isFinite(min.y) ? -min.y : 0;
    setFit({ scale: autoScale, rotX, y });
  }, [scene, modelScale]);

  useFrame((_, delta) => {
    if (mixer) mixer.update(delta);
  });

  const isTalking =
    interactionState === InteractionState.Dialogue ||
    interactionState === InteractionState.Lock ||
    isInteractionTarget;

  return (
    <group ref={fitRef} rotation={[fit.rotX, 0, 0]} position={[0, fit.y, 0]}>
      <primitive object={scene} />
      {isTalking && (
        <pointLight position={[0, 1.6, 0.4]} color="#ffb828" intensity={0.4} distance={3} decay={2} />
      )}
    </group>
  );
}

interface GltfNPCModelProps {
  definition: NPCDefinition;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
}

/** Loads a rigged GLB when `modelPath` or registry entry exists; otherwise procedural. */
export function GltfNPCModel({
  definition,
  interactionState,
  isInteractionTarget,
}: GltfNPCModelProps) {
  const url = resolveNpcModelUrl(definition.id, definition.modelPath);
  const meta = getNpcModelMeta(definition.id);
  const appearance = definition.appearance;

  if (!url) {
    return (
      <ProceduralNPCModel
        definitionId={definition.id}
        appearance={appearance!}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity="idle"
      />
    );
  }

  const scale = definition.scale ?? meta?.scale ?? 1;

  return (
    <GltfNPCModelInner
      definition={definition}
      url={url}
      modelScale={scale}
      interactionState={interactionState}
      isInteractionTarget={isInteractionTarget}
    />
  );
}

export function preloadNpcModel(url: string): void {
  useGLTF.preload(url, true, true, extendLoader);
}
