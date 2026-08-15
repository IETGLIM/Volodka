/* eslint-disable react-refresh/only-export-components */
/* ─── Volodka RPG – Single NPC component with LOD, speech bubbles, quest markers,
     head tracking, interaction system integration,
     AAA+ visual differentiation (color, accessories, glow, name labels),
     and procedural 3D models ─── */

import { useRef, useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import { Group, Vector3 } from 'three';
import type { NPCDefinition, NPCAppearance } from '@/shared/types/game';

import { useCurrentSceneId } from '@/store/selectors';
import { registerNPCGroup, unregisterNPCGroup } from '@/engine/interaction/npcRegistry';
import {
  cleanupHeadTracking,
  invalidateHeadTracking,
} from '@/engine/npc/headTracking';
import {
  cleanupNpcProceduralLayers,
  invalidateNpcProceduralLayers,
} from '@/engine/npc/npcProceduralLayers';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { GltfNPCModel } from '@/components/3d/GltfNPCModel';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { resolveNpcVisualModelUrl } from '@/config/npcModelRegistry';
import { getSceneVisualProfile } from '@/config/sceneVisualProfiles';
import { shouldPatrol } from '@/engine/npc/npcPatrol';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  DEFAULT_NPC_LOD,
  resolveNpcLod,
  scaleNpcLodThresholds,
  type NpcLodLevel,
} from '@/engine/lod/distanceLod';
import {
  npcTierHasNameLabels,
  npcTierHasQuestMarker,
  type NpcRenderTier,
} from '@/engine/npc/npcRenderTier';
import {
  NpcNameSprite,
  NpcSpeechSprite,
  NpcActivityBarkSprite,
} from '@/engine/npc/npcWorldSprite';
import { NpcEmotionIndicator } from '@/components/3d/NpcEmotionIndicator';

// Extracted modules
import { useNpcPatrol } from '@/hooks/useNpcPatrol';
import { useNpcBark } from '@/hooks/useNpcBark';
import { useNpcNameLabel } from '@/hooks/useNpcNameLabel';
import { NpcEmissiveGlow } from '@/components/3d/NpcEmissiveGlow';
import { CapsuleImpostorNPC } from '@/components/3d/NpcImpostor';
import { QuestMarker } from '@/components/3d/NpcQuestMarker';

// Re-export frame advancers for NPCSystem.tsx
export { advanceBarkRelationFrame } from '@/engine/npc/npcBarkResolver';
export { advanceEmissiveFrame } from '@/engine/npc/npcEmissiveColor';

/* ─── NPC models ───
 *  GLB when a shipped asset exists (npcModelRegistry); otherwise ProceduralNPCModel.
 *  Suspense shows a capsule impostor while the model loads. */

/* ─── Default appearance fallback ─── */
const DEFAULT_APPEARANCE: NPCAppearance = {
  bodyColor: '#6a6a7a',
  accentColor: '#9a9aaa',
  headAccessory: 'none',
  height: 1.0,
  glowColor: '#ffffff',
  silhouette: 'average',
};

interface NPCProps {
  definition: NPCDefinition;
  /** Live player position for LOD and proximity checks */
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  /** Schedule-driven position */
  position: [number, number, number];
  /** Schedule-driven rotation */
  rotation?: number;
  /** Current interaction state from the interaction system */
  interactionState?: InteractionState;
  /** Whether this NPC is the target of the current interaction */
  isInteractionTarget?: boolean;
  /** Schedule-driven activity (walk, work, read, sleep, talk, rest, idle) */
  activity?: string;
  /** Patrol waypoints for wandering behavior */
  patrolWaypoints?: [number, number, number][];
  /** Visual/update fidelity tier (hero, interactive, background). */
  renderTier?: NpcRenderTier;
}

/** Single NPC with LOD, animations, quest markers, bark, speech bubble,
 *  head tracking, interaction state awareness, and visual differentiation */
export function NPC({
  definition,
  livePlayerPositionRef,
  position,
  rotation,
  interactionState = InteractionState.Idle,
  isInteractionTarget = false,
  activity = 'idle',
  patrolWaypoints,
  renderTier = 'interactive',
}: NPCProps) {
  const groupRef = useRef<Group>(null);
  const impostorRef = useRef<Group>(null);
  const fullDetailRef = useRef<Group>(null);
  const questMarkerRef = useRef<Group>(null);
  const lodLevelRef = useRef<NpcLodLevel>('impostor');
  /** Keep impostor mounted briefly when promoting to full — soft mobile LOD handoff. */
  const impostorHoldUntilMsRef = useRef(0);
  // State mirror of lodLevelRef — triggers re-render so GltfNPCModel receives
  // the updated lodVisible prop. Updated only when LOD actually changes
  // (throttled by distance hysteresis, not every frame).
  const [lodLevel, setLodLevel] = useState<NpcLodLevel>('impostor');
  const { preset } = useGraphicsQuality();
  const preferLodCrossfade = preset.visualLite || preset.id === 'medium' || preset.id === 'low';
  const sceneId = useCurrentSceneId();
  const npcLodDistanceScale = getSceneVisualProfile(sceneId).npcLodDistanceScale ?? 1;
  const npcLodThresholds = useMemo(
    () => scaleNpcLodThresholds(DEFAULT_NPC_LOD, preset.lodBias * npcLodDistanceScale),
    [preset.lodBias, npcLodDistanceScale],
  );

  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;

  // ── Extracted hooks ──
  const { patrolActivity, updatePatrolFrame } = useNpcPatrol({
    activity,
    isInteractionTarget,
    patrolWaypoints,
    position,
    sceneId,
    rotation,
    interactionState,
    groupRef,
  });

  const {
    barkPhase,
    barkText,
    barkOpacity,
    activityBarkText,
    activityBarkOpacity,
    updateBarkFrame,
  } = useNpcBark({
    npcId: definition.id,
    definition,
    renderTier,
    interactionState,
    activity,
  });

  const { nameLabelOpacity, updateNameLabelFrame } = useNpcNameLabel({ renderTier });

  // ── Register/unregister NPC group ref for interaction system ──
  useEffect(() => {
    if (groupRef.current) {
      registerNPCGroup(definition.id, groupRef.current, sceneId);
    }
    return () => {
      unregisterNPCGroup(definition.id);
      cleanupHeadTracking(definition.id);
      cleanupNpcProceduralLayers(definition.id);
    };
  }, [definition.id, sceneId]);

  const applyNpcLodVisibility = (
    lod: NpcLodLevel,
    interactionTarget: boolean,
  ) => {
    const root = groupRef.current;
    if (!root) return;
    if (lod === 'culled') {
      root.visible = false;
      return;
    }
    root.visible = true;
    const holdImpostor =
      preferLodCrossfade
      && lod === 'full'
      && performance.now() < impostorHoldUntilMsRef.current;
    if (impostorRef.current) {
      impostorRef.current.visible = lod === 'impostor' || holdImpostor;
    }
    if (fullDetailRef.current) {
      fullDetailRef.current.visible = lod === 'full';
    }
    if (questMarkerRef.current) {
      questMarkerRef.current.visible = lod === 'full' || interactionTarget;
    }
  };

  useRegisterNpcFrame(definition.id, 'main', ({ delta }) => {
    if (!groupRef.current) return;

    // ── Update patrol position & rotation ──
    updatePatrolFrame(delta);

    // LOD check (culled → impostor → full, with hysteresis)
    const playerPos = livePlayerPositionRef.current;
    const dist = groupRef.current.position.distanceTo(playerPos);

    const newLod = resolveNpcLod(
      dist,
      lodLevelRef.current,
      npcLodThresholds,
      isInteractionTarget,
    );

    if (newLod !== lodLevelRef.current) {
      if (preferLodCrossfade && newLod === 'full' && lodLevelRef.current === 'impostor') {
        impostorHoldUntilMsRef.current = performance.now() + 200;
      }
      lodLevelRef.current = newLod;
      setLodLevel(newLod);
      invalidateHeadTracking(definition.id);
      invalidateNpcProceduralLayers(definition.id);
    }
    applyNpcLodVisibility(newLod, isInteractionTarget);

    if (newLod === 'culled') {
      return;
    }

    // Procedural layers (breathing, blink, sway, head/eye track, talk gesture)
    // run in overlay phase on the model mesh via GltfNPCModel / ProceduralNPCModel.

    // ── Name label: fade based on distance ──
    updateNameLabelFrame(delta, dist);

    // ── Bark: proximity, ambient, activity hints, speech bubble timer ──
    updateBarkFrame(delta, dist);
  });

  const isPatrolDriven = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);

  return (
    <group ref={groupRef}>
      <group ref={impostorRef} visible={false}>
        <CapsuleImpostorNPC appearance={appearance} />
      </group>

      {/* Contact shadow stays visible at impostor LOD for grounding. */}
      <NPCContactShadow />

      <group ref={fullDetailRef} visible={false}>
        <Suspense fallback={<CapsuleImpostorNPC appearance={appearance} />}>
          <NPCModelWithErrorBoundary
            definition={definition}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={activity}
            patrolActivity={isPatrolDriven ? patrolActivity : undefined}
            lodVisible={lodLevel === 'full'}
            livePlayerPositionRef={livePlayerPositionRef}
          />
        </Suspense>

        {barkPhase !== 'hidden' && interactionState === InteractionState.Idle && (
          <SpeechBubble
            phase={barkPhase}
            text={barkText}
            opacity={barkOpacity}
          />
        )}

        {/* Schedule-aware activity bark — shows above NPC head when near */}
        {activityBarkText && activityBarkOpacity > 0 && npcTierHasNameLabels(renderTier) && (
          <NpcActivityBarkSprite
            text={activityBarkText}
            accentColor={appearance.accentColor}
            opacity={activityBarkOpacity}
          />
        )}

        {nameLabelOpacity > 0 && npcTierHasNameLabels(renderTier) && (
          <NPCNameLabel
            name={definition.name}
            accentColor={appearance.accentColor}
            bodyColor={appearance.bodyColor}
            opacity={nameLabelOpacity}
          />
        )}

        {npcTierHasNameLabels(renderTier) && (
          <NpcEmotionIndicator npcId={definition.id} />
        )}
      </group>

      <group ref={questMarkerRef} visible={false}>
        {npcTierHasQuestMarker(renderTier) && <QuestMarker npcId={definition.id} />}
      </group>
    </group>
  );
}

/** Contact shadow for NPCs — flat circle mesh at feet with radial gradient (shared texture) */
function NPCContactShadow() {
  const shadowTexture = useCachedCanvasTexture(
    CONTACT_SHADOW_CACHE_KEYS.npc,
    () => createContactShadowTexture({ variant: 'npc' }),
  );

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.005, 0]}
    >
      <circleGeometry args={[0.35, 24]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.55}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

/** NPC model renderer — procedural archetype (primary); GLB only when unique mesh on disk.
 *  Quaternius CC0 rigs on disk are not shown — same mannequin breaks narrative identity. */
function NPCModelWithErrorBoundary({
  definition,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  lodVisible,
  livePlayerPositionRef,
}: {
  definition: NPCDefinition;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  lodVisible: boolean;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
}) {
  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;
  const { preset } = useGraphicsQuality();
  const gltfUrl = resolveNpcVisualModelUrl(
    definition.id,
    definition.modelPath,
    preset.npcRenderMode,
  );

  return (
    <NpcEmissiveGlow npcId={definition.id} glowColor={appearance.glowColor} enabled={Boolean(gltfUrl)}>
      {gltfUrl ? (
        <NpcGlbProceduralCrossfade
          definition={definition}
          appearance={appearance}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
          patrolActivity={patrolActivity}
          lodVisible={lodVisible}
          livePlayerPositionRef={livePlayerPositionRef}
          gltfUrl={gltfUrl}
          enableCrossfade={preset.visualLite || preset.npcRenderMode === 'hybrid'}
        />
      ) : (
        <ProceduralNPCModel
          definitionId={definition.id}
          appearance={appearance}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
          patrolActivity={patrolActivity}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      )}
    </NpcEmissiveGlow>
  );
}

/** Keep procedural avatar visible until GLB mounts — soft handoff on hybrid/mobile. */
function NpcGlbProceduralCrossfade({
  definition,
  appearance,
  interactionState,
  isInteractionTarget,
  activity,
  patrolActivity,
  lodVisible,
  livePlayerPositionRef,
  gltfUrl: _gltfUrl,
  enableCrossfade,
}: {
  definition: NPCDefinition;
  appearance: NPCAppearance;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
  patrolActivity?: 'idle' | 'walk';
  lodVisible: boolean;
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  gltfUrl: string;
  enableCrossfade: boolean;
}) {
  const [glbReady, setGlbReady] = useState(!enableCrossfade);
  const markReady = useCallback(() => setGlbReady(true), []);

  useEffect(() => {
    if (!enableCrossfade) {
      setGlbReady(true);
      return;
    }
    setGlbReady(false);
  }, [definition.id, enableCrossfade]);

  return (
    <group>
      {enableCrossfade && !glbReady && (
        <ProceduralNPCModel
          definitionId={definition.id}
          appearance={appearance}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
          patrolActivity={patrolActivity}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      )}
      <Suspense
        fallback={
          enableCrossfade ? null : (
            <ProceduralNPCModel
              definitionId={definition.id}
              appearance={appearance}
              interactionState={interactionState}
              isInteractionTarget={isInteractionTarget}
              activity={activity}
              patrolActivity={patrolActivity}
              livePlayerPositionRef={livePlayerPositionRef}
            />
          )
        }
      >
        <GltfReadyGate onReady={markReady}>
          <GltfNPCModel
            definition={definition}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={activity}
            patrolActivity={patrolActivity}
            lodVisible={lodVisible}
            livePlayerPositionRef={livePlayerPositionRef}
          />
        </GltfReadyGate>
      </Suspense>
    </group>
  );
}

/** Fires onReady once children have committed (GLB Suspense resolved). */
function GltfReadyGate({
  onReady,
  children,
}: {
  onReady: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return <>{children}</>;
}

/** Floating name label with distance-based opacity and body color tint */
function NPCNameLabel({
  name,
  accentColor,
  bodyColor,
  opacity,
}: {
  name: string;
  accentColor: string;
  bodyColor: string;
  opacity: number;
}) {
  return (
    <NpcNameSprite
      name={name}
      accentColor={accentColor}
      bodyColor={bodyColor}
      opacity={opacity}
    />
  );
}

/** Speech bubble component with cyberpunk styling and thinking animation */
function SpeechBubble({
  phase,
  text,
  opacity,
}: {
  phase: 'thinking' | 'speaking' | 'fading';
  text: string;
  opacity: number;
}) {
  return <NpcSpeechSprite phase={phase} text={text} opacity={opacity} />;
}
