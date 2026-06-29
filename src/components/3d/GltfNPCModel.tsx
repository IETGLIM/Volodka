/* ─── Volodka RPG – Animated GLB NPC mesh with procedural fallback ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import * as THREE from 'three';
import type { NPCDefinition } from '@/shared/types/game';
import {
  ASSET_MANIFEST,
  getNpcManifestId,
  isAssetEffectiveShipped,
  resolveAssetUrl,
  resolveNpcAssetUrl,
} from '@/config/assetManifest';
import { getNpcModelMeta, resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import { useSkinnedGltfClone } from '@/hooks/useSkinnedGltfClone';
import { useNpcAnimationController } from '@/engine/npc/useNpcAnimationController';
import { resolveNpcClipAction } from '@/engine/npc/npcClipResolution';
import { useGamePhase } from '@/store/selectors';
import { useMixamoAnimationClips } from '@/hooks/useMixamoAnimationClips';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { resolveNpcComposeRigRef } from '@/config/npcComposer';
import { devWarn } from '@/shared/utils/devLog';
import { fitCharacterGltf, measureCharacterGltfBounds } from '@/engine/assets/gltfScale';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useNpcProceduralLayers } from '@/hooks/useNpcProceduralLayers';

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
  visible?: boolean;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

function GltfNPCModelInner({
  definition,
  url,
  modelScale,
  targetHeightFactor,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  visible = true,
  livePlayerPositionRef,
}: GltfNPCModelInnerProps & {
  activity: string;
  patrolActivity?: 'idle' | 'walk';
}) {
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
  const gamePhase = useGamePhase();

  const { clipOverrides: mergedClipOverrides, animState } = useNpcAnimationController({
    npcId: definition.id,
    actions,
    clipOverrides: definition.animations,
    activity,
    patrolActivity,
    interactionState,
    isInteractionTarget,
    gamePhase,
  });

  const idleClipReady = useMemo(
    () => resolveNpcClipAction('idle', actions, mergedClipOverrides) !== null,
    [actions, mergedClipOverrides],
  );

  useEffect(() => {
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      heightFactor: targetHeightFactor,
      scaleMultiplier: modelScale,
    });
    setFit({ scale, rotX, y: footY });
  }, [scene, modelScale, targetHeightFactor]);

  useRegisterNpcFrame(definition.id, 'mixer', ({ delta }) => {
    // Skip animation updates for invisible LOD branches — mixer.update on
    // skinned meshes is one of the most expensive per-frame operations in
    // three.js. With 5 LOD variants per NPC, this saves 4/5 of the work.
    if (mixer && visible) mixer.update(delta);
  });

  useNpcProceduralLayers({
    npcId: definition.id,
    modelRef: fitRef,
    animState,
    playerPositionRef: livePlayerPositionRef,
    enabled: visible && idleClipReady,
  });

  const isTalking =
    interactionState === InteractionState.Dialogue ||
    interactionState === InteractionState.Lock ||
    isInteractionTarget;

  return (
    <group
      ref={fitRef}
      rotation={[fit.rotX, 0, 0]}
      position={[0, fit.y, 0]}
      visible={visible}
      userData={{
        npcComposerRig: resolveNpcComposeRigRef(definition.id) ?? null,
      }}
    >
      <primitive object={scene} visible={idleClipReady} />
      {isTalking && (
        <pointLight position={[0, 1.6, 0.4]} color="#ffb828" intensity={0.4} distance={3} decay={2} />
      )}
    </group>
  );
}

interface GltfNPCModelSceneProps {
  definition: NPCDefinition;
  fallbackUrl: string;
  modelScale: number;
  targetHeightFactor: number;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Preloads manifest LOD/compression urls and swaps visibility by camera distance. */
function GltfNPCModelScene({
  definition,
  fallbackUrl,
  modelScale,
  targetHeightFactor,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  livePlayerPositionRef,
}: GltfNPCModelSceneProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const activeUrlRef = useRef(fallbackUrl);
  const _branchRefs = useRef<Map<string, THREE.Group>>(new Map());
  const lastLodDistRef = useRef(-1);
  const camera = useThree((s) => s.camera);
  const { preset } = useGraphicsQuality();
  // State to trigger re-render when LOD distance changes the active URL.
  const [, setActiveUrlTick] = useState(0);

  const manifestId = getNpcManifestId(definition.id);
  const asset = manifestId ? ASSET_MANIFEST[manifestId] : undefined;
  const useManifestLod =
    !!asset && asset.lods.length > 1 && isAssetEffectiveShipped(manifestId!);

  const urls = useMemo(() => {
    if (!useManifestLod || !asset) return [fallbackUrl];
    // Only preload the URLs we might actually use: lod0 + lod1 + lod2
    // for the CURRENT compression variant, not all 5 variants.
    // The frame tick below switches between LODs by distance — we only
    // need the URLs that resolveNpcAssetUrl can return for this preset.
    const set = new Set<string>();
    for (const lod of asset.lods) {
      if (lod.url) set.add(lod.url);
    }
    return [...set];
  }, [asset, fallbackUrl, useManifestLod]);

  useEffect(() => {
    for (const url of urls) {
      useGLTF.preload(url, true, true, extendLoader);
    }
    activeUrlRef.current = urls[0] ?? fallbackUrl;
  }, [urls, fallbackUrl]);

  useFrameTick(
    'misc',
    () => {
      if (!useManifestLod || !asset || !anchorRef.current) return;
      const dist = camera.position.distanceTo(
        anchorRef.current.getWorldPosition(worldPosRef.current),
      );
      // Throttle LOD checks — only re-evaluate when distance changes by
      // more than 2m. Avoids re-rendering on every frame when the player
      // is standing still or moving slowly.
      if (Math.abs(dist - lastLodDistRef.current) < 2.0) return;
      lastLodDistRef.current = dist;
      const next =
        resolveNpcAssetUrl(definition.id, preset.compression, dist, preset.lodBias) ??
        resolveAssetUrl(asset, preset.compression, dist, preset.lodBias);
      if (next && next !== activeUrlRef.current) {
        activeUrlRef.current = next;
        // Trigger re-render so the active LOD branch mounts/unmounts.
        setActiveUrlTick((t) => t + 1);
      }
    },
    { label: `GltfNPCModel:${definition.id}` },
  );

  if (!useManifestLod) {
    return (
      <GltfNPCModelInner
        definition={definition}
        url={fallbackUrl}
        modelScale={modelScale}
        targetHeightFactor={targetHeightFactor}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity={activity}
        patrolActivity={patrolActivity}
        livePlayerPositionRef={livePlayerPositionRef}
      />
    );
  }

  return (
    <group ref={anchorRef}>
      {/* Only mount the active LOD URL — not all 3 simultaneously.
          Previously this rendered all LOD branches via Suspense, each with
          its own useGLTF + AnimationMixer + mixer.update per frame.
          Now only the active one is mounted; when distance changes, the
          frame tick updates activeUrlRef and React re-renders with key. */}
      {(() => {
        const activeUrl = activeUrlRef.current;
        return (
          <Suspense key={activeUrl} fallback={null}>
            <GltfNPCModelInner
              definition={definition}
              url={activeUrl}
              modelScale={modelScale}
              targetHeightFactor={targetHeightFactor}
              interactionState={interactionState}
              isInteractionTarget={isInteractionTarget}
              activity={activity}
              patrolActivity={patrolActivity}
              livePlayerPositionRef={livePlayerPositionRef}
            />
          </Suspense>
        );
      })()}
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
  patrolActivity?: 'idle' | 'walk';
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Loads a rigged GLB when `modelPath` or registry entry exists; otherwise procedural. */
export function GltfNPCModel({
  definition,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  livePlayerPositionRef,
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
      patrolActivity={patrolActivity}
      livePlayerPositionRef={livePlayerPositionRef}
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
      <GltfNPCModelScene
        definition={definition}
        fallbackUrl={url}
        modelScale={scale}
        targetHeightFactor={targetHeightFactor}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity={activity}
        patrolActivity={patrolActivity}
        livePlayerPositionRef={livePlayerPositionRef}
      />
    </GltfLoadErrorBoundary>
  );
}

export function preloadNpcModel(url: string): void {
  useGLTF.preload(url, true, true, extendLoader);
}
