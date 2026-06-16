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
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

interface Fit {
  scale: number;
  rotX: number;
  y: number;
}

interface GltfNPCModelInnerProps {
  definition: NPCDefinition;
  url: string;
  modelScale: number;
  /** Matches procedural NPC `appearance.height` scaling (default 1.0 ≈ 1.75 m). */
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
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      heightFactor: targetHeightFactor,
      scaleMultiplier: modelScale,
    });
    setFit({ scale, rotX, y: footY });
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
