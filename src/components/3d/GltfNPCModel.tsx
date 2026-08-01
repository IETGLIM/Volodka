/* ─── Volodka RPG – Animated GLB NPC mesh with procedural fallback ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { resolveNpcModelScale, resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { NPC_GLTF_TARGET_HEIGHT_M } from '@/config/metricScaleCoherence';
import { NPC_MESH_FILE_SHARE } from '@/config/npcMeshShare';
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
  /** Fired once the GLTF scene is fitted — used by dual-LOD keep-alive swap. */
  onReady?: () => void;
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
  onReady,
  livePlayerPositionRef,
}: GltfNPCModelInnerProps & {
  activity: string;
  patrolActivity?: 'idle' | 'walk';
}) {
  const gltf = useGLTF(url, true, true, extendLoader);
  const fitRef = useRef<THREE.Group>(null);
  const { scene, mixer } = useSkinnedGltfClone(gltf.scene, gltf.animations, { castShadow: true });
  const [fit, setFit] = useState<Fit>({ scale: modelScale, rotX: 0, y: 0 });
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

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

  // Layout effect before paint — same order as CesiumPlayerModel, avoids first-frame
  // wrong-scale / foot sink while the mixer already runs.
  useLayoutEffect(() => {
    const bounds = measureCharacterGltfBounds(scene);
    const { scale, rotX, footY } = fitCharacterGltf(bounds, {
      targetHeightM: NPC_GLTF_TARGET_HEIGHT_M,
      heightFactor: targetHeightFactor,
      scaleMultiplier: modelScale,
    });
    setFit({ scale, rotX, y: footY });
    onReadyRef.current?.();
  }, [scene, modelScale, targetHeightFactor]);

  // De-plastic Quaternius/GLB characters — raise roughness, tame metal, accept IBL.
  // Shared-mesh aliases also get appearance tint so identical rigs read as distinct NPCs.
  useLayoutEffect(() => {
    const appearance = definition.appearance;
    const body = appearance?.bodyColor ? new THREE.Color(appearance.bodyColor) : null;
    const accent = appearance?.accentColor ? new THREE.Color(appearance.accentColor) : null;
    const glow = appearance?.glowColor ? new THREE.Color(appearance.glowColor) : null;
    const shareTint = NPC_MESH_FILE_SHARE[definition.id] != null;
    let matIndex = 0;

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (!m || !(m as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
        const std = m as THREE.MeshStandardMaterial;
        std.envMapIntensity = 0.8;
        std.roughness = Math.min(1, Math.max(0.48, (std.roughness ?? 0.55) * 1.18));
        std.metalness = Math.min(0.28, std.metalness ?? 0);
        if (std.emissiveIntensity > 0.6) {
          std.emissiveIntensity = Math.min(std.emissiveIntensity, 0.55);
        }

        if (shareTint || body || accent) {
          const tint = matIndex % 2 === 0 ? body ?? accent : accent ?? body;
          if (tint) std.color.lerp(tint, shareTint ? 0.62 : 0.35);
          if (glow) {
            std.emissive.copy(glow);
            std.emissiveIntensity = Math.max(std.emissiveIntensity, 0.12);
          }
        }
        matIndex += 1;
      }
    });
  }, [scene, definition.appearance, definition.id]);

  useRegisterNpcFrame(definition.id, 'mixer', ({ delta }) => {
    // Skip animation updates when the NPC is not at 'full' LOD level.
    // mixer.update on skinned meshes is one of the most expensive per-frame
    // operations in three.js. When the NPC is culled or at impostor LOD,
    // there is no visible mesh to animate — skip the update entirely.
    if (mixer && visible) {
      // Clamp delta to prevent animation jumps on frame stalls (GC pauses,
      // tab backgrounding, etc). 0.05s = ~3 frames at 60fps.
      const dt = Math.min(delta, 0.05);
      mixer.update(dt);
    }
  }, { enabled: visible });

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
      scale={fit.scale}
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
  /** Whether the parent NPC group is at 'full' LOD (visible). When false,
   *  mixer.update is skipped to save per-frame CPU. */
  lodVisible: boolean;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Preloads manifest LOD/compression urls and swaps visibility by camera distance.
 *  Dual-LOD keep-alive: previous mesh stays visible until the next LOD is fitted,
 *  so distance swaps never blank the NPC (no remount jank / Suspense hole). */
function GltfNPCModelScene({
  definition,
  fallbackUrl,
  modelScale,
  targetHeightFactor,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  lodVisible,
  livePlayerPositionRef,
}: GltfNPCModelSceneProps) {
  const anchorRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const lastLodDistRef = useRef(-1);
  const camera = useThree((s) => s.camera);
  const { preset } = useGraphicsQuality();
  const [displayedUrl, setDisplayedUrl] = useState(fallbackUrl);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const manifestId = getNpcManifestId(definition.id);
  const asset = manifestId ? ASSET_MANIFEST[manifestId] : undefined;
  const useManifestLod =
    !!asset && asset.lods.length > 1 && isAssetEffectiveShipped(manifestId!);

  const urls = useMemo(() => {
    if (!useManifestLod || !asset) return [fallbackUrl];
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
    setDisplayedUrl((prev) => (urls.includes(prev) ? prev : (urls[0] ?? fallbackUrl)));
    setPendingUrl(null);
  }, [urls, fallbackUrl]);

  useFrameTick(
    'misc',
    () => {
      if (!useManifestLod || !asset || !anchorRef.current || pendingUrl) return;
      const dist = camera.position.distanceTo(
        anchorRef.current.getWorldPosition(worldPosRef.current),
      );
      if (Math.abs(dist - lastLodDistRef.current) < 2.0) return;
      lastLodDistRef.current = dist;
      const next =
        resolveNpcAssetUrl(definition.id, preset.compression, dist, preset.lodBias) ??
        resolveAssetUrl(asset, preset.compression, dist, preset.lodBias);
      if (next && next !== displayedUrl) {
        setPendingUrl(next);
      }
    },
    { label: `GltfNPCModel:${definition.id}` },
  );

  const handlePendingReady = () => {
    if (!pendingUrl) return;
    setDisplayedUrl(pendingUrl);
    setPendingUrl(null);
  };

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
      {/* Displayed LOD stays mounted until pending is fitted — max 2 GLTFs. */}
      <Suspense fallback={null}>
        <GltfNPCModelInner
          definition={definition}
          url={displayedUrl}
          modelScale={modelScale}
          targetHeightFactor={targetHeightFactor}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
          patrolActivity={patrolActivity}
          visible={lodVisible}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      </Suspense>
      {pendingUrl ? (
        <Suspense fallback={null}>
          <GltfNPCModelInner
            definition={definition}
            url={pendingUrl}
            modelScale={modelScale}
            targetHeightFactor={targetHeightFactor}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={activity}
            patrolActivity={patrolActivity}
            visible={false}
            onReady={handlePendingReady}
            livePlayerPositionRef={livePlayerPositionRef}
          />
        </Suspense>
      ) : null}
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
  /** Whether the parent NPC group is at 'full' LOD (visible). When false,
   *  mixer.update is skipped to save per-frame CPU on culled/impostor NPCs. */
  lodVisible?: boolean;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Loads a rigged GLB when `modelPath` or registry entry exists; otherwise procedural. */
export function GltfNPCModel({
  definition,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  lodVisible = true,
  livePlayerPositionRef,
}: GltfNPCModelProps) {
  const url = resolveNpcModelUrl(definition.id, definition.modelPath);
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

  const scale = resolveNpcModelScale(definition.id, definition.scale);
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
        lodVisible={lodVisible}
        livePlayerPositionRef={livePlayerPositionRef}
      />
    </GltfLoadErrorBoundary>
  );
}

export function preloadNpcModel(url: string): void {
  useGLTF.preload(url, true, true, extendLoader);
}
