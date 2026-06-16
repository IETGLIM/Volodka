/* ─── Volodka RPG – Animated GLB NPC mesh with procedural fallback ─── */

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { NPCDefinition } from '@/shared/types/game';
import { getNpcModelMeta, resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useNpcAnimationController } from '@/engine/npc/useNpcAnimationController';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { devWarn } from '@/shared/utils/devLog';

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
  /** Matches procedural NPC `appearance.height` scaling (default 1.0 ≈ TARGET_HEIGHT). */
  targetHeightFactor: number;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
}

function GltfNPCModelInner({
  definition,
  url,
  modelScale,
  targetHeightFactor,
  interactionState,
  isInteractionTarget,
  activity,
}: GltfNPCModelInnerProps & { activity: string }) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const fitRef = useRef<THREE.Group>(null);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const [fit, setFit] = useState<Fit>({ scale: modelScale, rotX: 0, y: 0 });

  const embeddedActions = useMemo(() => {
    if (!mixer) return null;
    const record: Record<string, THREE.AnimationAction> = {};
    for (const clip of gltf.animations) {
      record[clip.name] = mixer.clipAction(clip);
    }
    if (definition.animations?.walk && record[definition.animations.walk] === undefined) {
      const walkClip = gltf.animations.find((c) => c.name === definition.animations?.walk);
      if (walkClip) record[definition.animations.walk] = mixer.clipAction(walkClip);
    }
    if (definition.animations?.talk && record[definition.animations.talk] === undefined) {
      const talkClip = gltf.animations.find((c) => c.name === definition.animations?.talk);
      if (talkClip) record[definition.animations.talk] = mixer.clipAction(talkClip);
    }
    return record;
  }, [mixer, gltf.animations, definition.animations]);

  const actions = useMixamoAnimationClips(mixer, scene, embeddedActions);

  useNpcAnimationController({
    npcId: definition.id,
    actions,
    clipOverrides: definition.animations,
    activity,
    interactionState,
    isInteractionTarget,
  });

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
    const targetHeight = TARGET_HEIGHT * targetHeightFactor;
    const autoScale = (targetHeight / heightDim) * modelScale;

    inner.rotation.x = rotX;
    inner.scale.setScalar(autoScale);
    const { min } = measure(scene);
    const y = isFinite(min.y) ? -min.y : 0;
    setFit({ scale: autoScale, rotX, y });
  }, [scene, modelScale, targetHeightFactor]);

  useFrameTick('npc', ({ delta }) => {
    if (mixer) mixer.update(delta);
  }, { label: 'GltfNPCMixer' });

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

interface GltfLoadErrorBoundaryProps {
  npcId: string;
  modelUrl: string;
  fallback: ReactNode;
  children: ReactNode;
}

interface GltfLoadErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/** Catches useGLTF / skinned-clone failures and renders procedural fallback. */
class GltfLoadErrorBoundary extends Component<GltfLoadErrorBoundaryProps, GltfLoadErrorBoundaryState> {
  constructor(props: GltfLoadErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): GltfLoadErrorBoundaryState {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error): void {
    devWarn(
      `[GltfNPCModel:${this.props.npcId}] GLB load failed (${this.props.modelUrl}), using procedural fallback:`,
      error.message,
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <>
          {this.props.fallback}
          {import.meta.env.DEV && (
            <Html position={[0, 2.1, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
              <div className="pointer-events-none rounded bg-amber-950/90 px-1.5 py-0.5 text-[9px] text-amber-200 whitespace-nowrap">
                GLB fallback: {this.props.npcId}
              </div>
            </Html>
          )}
        </>
      );
    }
    return this.props.children;
  }
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
  activity,
}: GltfNPCModelProps) {
  const url = resolveNpcModelUrl(definition.id, definition.modelPath);
  const meta = getNpcModelMeta(definition.id);
  const appearance = definition.appearance;

  const proceduralFallback = (
    <ProceduralNPCModel
      definitionId={definition.id}
      appearance={appearance!}
      interactionState={interactionState}
      isInteractionTarget={isInteractionTarget}
      activity={activity}
    />
  );

  if (!url) {
    return proceduralFallback;
  }

  const scale = definition.scale ?? meta?.scale ?? 1;
  const targetHeightFactor = appearance?.height ?? 1;

  return (
    <GltfLoadErrorBoundary
      npcId={definition.id}
      modelUrl={url}
      fallback={proceduralFallback}
    >
      <GltfNPCModelInner
        definition={definition}
        url={url}
        modelScale={scale}
        targetHeightFactor={targetHeightFactor}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity={activity}
      />
    </GltfLoadErrorBoundary>
  );
}

export function preloadNpcModel(url: string): void {
  useGLTF.preload(url, true, true, extendLoader);
}
