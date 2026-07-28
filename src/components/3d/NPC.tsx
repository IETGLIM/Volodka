/* eslint-disable react-refresh/only-export-components */
/* ─── Volodka RPG – Single NPC component with LOD, speech bubbles, quest markers,
     head tracking, interaction system integration,
     AAA+ visual differentiation (color, accessories, glow, name labels),
     and procedural 3D models ─── */

import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import {
  CONTACT_SHADOW_CACHE_KEYS,
  createContactShadowTexture,
} from '@/engine/three/contactShadowTexture';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import * as THREE from 'three';
import type { NPCDefinition, NPCAppearance } from '@/shared/types/game';

import { useGameStore } from '@/store/gameStore';
import { useQuests, useCurrentSceneId } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
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
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';
import { buildNpcAvoidanceObstacles, type NpcObstacleAabb } from '@/engine/npc/npcObstacleAvoidance';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { getSceneFloorY } from '@/config/scenes';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import { getNpcQuestMarkerDisplay } from '@/store/questStore';
import { resolveNpcQuestBark } from '@/engine/npc/npcQuestBark';
import { resolveNpcBarkForRelation } from '@/shared/npcBark';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  DEFAULT_NPC_LOD,
  resolveNpcLod,
  scaleNpcLodThresholds,
  type NpcLodLevel,
} from '@/engine/lod/distanceLod';
import {
  npcTierHasNameLabels,
  npcTierHasProximityBark,
  npcTierHasQuestMarker,
  type NpcRenderTier,
} from '@/engine/npc/npcRenderTier';
import {
  NpcNameSprite,
  NpcSpeechSprite,
  NpcQuestMarkerSprite,
  NpcActivityBarkSprite,
} from '@/engine/npc/npcWorldSprite';
import { NpcEmotionIndicator } from '@/components/3d/NpcEmotionIndicator';

/* ─── NPC models ───
 *  GLB when a shipped asset exists (npcModelRegistry); otherwise ProceduralNPCModel.
 *  Suspense shows a capsule impostor while the model loads. */

/* ─── Speech bubble timing ─── */
const THINKING_DURATION = 1.2; // seconds before bark text appears
const BARK_VISIBLE_DURATION = 5.0; // seconds bark text is shown
const BARK_FADE_DURATION = 0.5; // seconds for fade-out

/* ─── Name label distance ─── */
const NAME_LABEL_MAX_DISTANCE = 5.0;

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
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
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
  const groupRef = useRef<THREE.Group>(null);
  const impostorRef = useRef<THREE.Group>(null);
  const fullDetailRef = useRef<THREE.Group>(null);
  const questMarkerRef = useRef<THREE.Group>(null);
  const lodLevelRef = useRef<NpcLodLevel>('impostor');
  // State mirror of lodLevelRef — triggers re-render so GltfNPCModel receives
  // the updated lodVisible prop. Updated only when LOD actually changes
  // (throttled by distance hysteresis, not every frame).
  const [lodLevel, setLodLevel] = useState<NpcLodLevel>('impostor');
  const { preset } = useGraphicsQuality();
  const sceneId = useCurrentSceneId();
  const npcLodDistanceScale = getSceneVisualProfile(sceneId).npcLodDistanceScale ?? 1;
  const npcLodThresholds = useMemo(
    () => scaleNpcLodThresholds(DEFAULT_NPC_LOD, preset.lodBias * npcLodDistanceScale),
    [preset.lodBias, npcLodDistanceScale],
  );

  // ── NPC avoidance obstacles for the current scene ──
  // Walls + tall props as AABBs, so patrol NPCs steer around them instead of
  // walking through walls. Recomputed only when the scene changes.
  const avoidanceObstacles = useMemo<NpcObstacleAabb[]>(
    () => {
      const def = (SCENE_DEFINITIONS as Record<string, { walls?: ColliderDef[]; obstacles?: ColliderDef[] }>)[sceneId];
      if (!def) return [];
      return buildNpcAvoidanceObstacles(def);
    },
    [sceneId],
  );

  // ── Patrol state ──
  const patrolRef = useRef<PatrolState | null>(null);
  const patrolActivityRef = useRef<'idle' | 'walk'>('idle');
  const [patrolActivity, setPatrolActivity] = useState<'idle' | 'walk'>('idle');

  // Initialize patrol state when waypoints are available
  useEffect(() => {
    if (patrolWaypoints && patrolWaypoints.length > 0) {
      patrolRef.current = createPatrolState(patrolWaypoints, position);
    } else {
      patrolRef.current = null;
    }
  // Only re-create if the waypoints array reference changes, not every position change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [patrolWaypoints]);

  // Proximity bark
  const barkCooldownRef = useRef(0);
  const hasBarkedRef = useRef(false);

  // Speech bubble state
  const [barkPhase, setBarkPhase] = useState<'hidden' | 'thinking' | 'speaking' | 'fading'>('hidden');
  const [barkText, setBarkText] = useState('');
  const [barkOpacity, setBarkOpacity] = useState(1);
  const barkTimerRef = useRef(0);
  // Ref mirror of barkPhase so ambient-bark subscription can read the current
  // phase without re-subscribing on every phase transition.
  const barkPhaseRef = useRef<'hidden' | 'thinking' | 'speaking' | 'fading'>('hidden');
  useEffect(() => { barkPhaseRef.current = barkPhase; }, [barkPhase]);

  // Name label distance tracking — ref-based with throttled React state updates
  const [nameLabelOpacity, setNameLabelOpacity] = useState(0);
  const nameLabelOpacityRef = useRef(0);
  const nameLabelUpdateTimerRef = useRef(0);

  // Bark opacity ref for throttled updates during fading
  const barkOpacityRef = useRef(1);
  const barkOpacityUpdateTimerRef = useRef(0);

  // Schedule-aware activity bark state — shows activity text when in proximity
  const [activityBarkText, setActivityBarkText] = useState<string | null>(null);
  const [activityBarkOpacity, setActivityBarkOpacity] = useState(0);
  const activityBarkOpacityRef = useRef(0);
  const activityBarkUpdateTimerRef = useRef(0);

  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;

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

  // ── Ambient bark subscription ──
  // The npcAmbientBarkSystem emits `npc:ambient_bark` when the player is
  // within 4 m and not interacting with this NPC. We surface the text via
  // the existing speech-bubble machinery (same path as proximity bark) so
  // the visual treatment is consistent. Skipped when an interaction is
  // already in progress or a bark is already showing.
  useEffect(() => {
    const unsub = eventBus.on('npc:ambient_bark', (payload) => {
      if (payload.npcId !== definition.id) return;
      // Don't interrupt an existing bark (proximity or ambient).
      if (barkPhaseRef.current !== 'hidden') return;
      // Don't fire during active interaction — the dialogue UI owns the
      // player's attention.
      if (interactionState !== InteractionState.Idle) return;
      setBarkText(payload.text);
      setBarkPhase('thinking');
      setBarkOpacity(1);
      barkOpacityRef.current = 1;
      barkTimerRef.current = 0;
    });
    return unsub;
  }, [definition.id, interactionState]);

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
    if (impostorRef.current) {
      impostorRef.current.visible = lod === 'impostor';
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

    // ── Update patrol state ──
    const isPatrolling = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);
    if (isPatrolling && patrolRef.current && patrolWaypoints) {
      const result = updatePatrol(
        patrolRef.current,
        patrolWaypoints,
        delta,
        undefined,
        avoidanceObstacles,
        sceneId,
        getSceneFloorY(sceneId),
      );
      if (result.activity !== patrolActivityRef.current) {
        patrolActivityRef.current = result.activity;
        setPatrolActivity(result.activity);
      }
      groupRef.current.position.copy(patrolRef.current.position);
    } else {
      groupRef.current.position.set(position[0], position[1], position[2]);
      if (patrolActivityRef.current !== 'idle') {
        patrolActivityRef.current = 'idle';
        setPatrolActivity('idle');
      }
    }

    // During Align phase, the interaction system sets rotation directly on the group.
    // We should NOT override it with the default rotation during active interaction.
    if (!isInteractionTarget || interactionState === InteractionState.Idle) {
      if (isPatrolling && patrolRef.current) {
        // Use patrol-derived rotation (facing walk direction)
        groupRef.current.rotation.y = patrolRef.current.rotationY;
      } else if (rotation !== undefined) {
        groupRef.current.rotation.y = rotation;
      }
    }

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

    // ── Name label: fade based on distance (ref-based, throttled React state updates) ──
    if (npcTierHasNameLabels(renderTier)) {
      if (dist < NAME_LABEL_MAX_DISTANCE) {
        const fadeFactor = 1.0 - (dist / NAME_LABEL_MAX_DISTANCE);
        nameLabelOpacityRef.current = Math.min(1, fadeFactor * 1.5);
      } else {
        nameLabelOpacityRef.current = 0;
      }

      // Throttle React state updates to ~10fps for name labels
      nameLabelUpdateTimerRef.current += delta;
      if (nameLabelUpdateTimerRef.current > 0.1) {
        nameLabelUpdateTimerRef.current = 0;
        const newOpacity = nameLabelOpacityRef.current;
        setNameLabelOpacity((prev) => Math.abs(prev - newOpacity) > 0.05 ? newOpacity : prev);
      }
    }

    // ── Schedule-aware activity bark ──
    // Shows activity text above NPC head when player is within proximity
    // and not in active dialogue. Uses formatNpcActivityHint for localized labels.
    if (interactionState === InteractionState.Idle && npcTierHasNameLabels(renderTier)) {
      const hint = formatNpcActivityHint(activity) ?? null;
      const inRange = dist < 4.0;
      const shouldShow = inRange && hint !== null;

      // Update text when activity changes
      if (hint !== activityBarkText) {
        setActivityBarkText(hint);
      }

      // Fade in/out based on proximity
      const targetOpacity = shouldShow ? Math.min(1, (4.0 - dist) / 2.5) * 0.75 : 0;
      activityBarkOpacityRef.current += (targetOpacity - activityBarkOpacityRef.current) * Math.min(1, delta * 4);

      // Throttle React state updates
      activityBarkUpdateTimerRef.current += delta;
      if (activityBarkUpdateTimerRef.current > 0.1) {
        activityBarkUpdateTimerRef.current = 0;
        const newOp = activityBarkOpacityRef.current;
        setActivityBarkOpacity((prev) => Math.abs(prev - newOp) > 0.04 ? newOp : prev);
      }
    } else {
      // Hide during active dialogue
      if (activityBarkOpacityRef.current > 0) {
        activityBarkOpacityRef.current = 0;
        setActivityBarkOpacity(0);
      }
    }

    // Proximity bark — skip during active interaction
    if (npcTierHasProximityBark(renderTier) && interactionState === InteractionState.Idle) {
      barkCooldownRef.current -= delta;
      if (dist < 3.0 && !hasBarkedRef.current && barkCooldownRef.current <= 0 && barkPhase === 'hidden') {
        hasBarkedRef.current = true;
        barkCooldownRef.current = 15;
        const bark = computeBark(definition);
        if (bark) {
          setBarkText(bark);
          setBarkPhase('thinking');
          barkTimerRef.current = 0;
        }
      }
      if (dist > 5.0) {
        hasBarkedRef.current = false;
      }
    }

    // Speech bubble phase timer
    if (barkPhase !== 'hidden') {
      barkTimerRef.current += delta;
      if (barkPhase === 'thinking' && barkTimerRef.current >= THINKING_DURATION) {
        setBarkPhase('speaking');
        barkTimerRef.current = 0;
        eventBus.emit('ui:exploration_message', { text: barkText });
      } else if (barkPhase === 'speaking' && barkTimerRef.current >= BARK_VISIBLE_DURATION) {
        setBarkPhase('fading');
        barkTimerRef.current = 0;
      } else if (barkPhase === 'fading' && barkTimerRef.current >= BARK_FADE_DURATION) {
        setBarkPhase('hidden');
        barkTimerRef.current = 0;
        setBarkText('');
        barkOpacityRef.current = 1;
        setBarkOpacity(1);
      }

      if (barkPhase === 'fading') {
        barkOpacityRef.current = Math.max(0, 1 - barkTimerRef.current / BARK_FADE_DURATION);
        // Throttle bark opacity React state updates to ~10fps
        barkOpacityUpdateTimerRef.current += delta;
        if (barkOpacityUpdateTimerRef.current > 0.1) {
          barkOpacityUpdateTimerRef.current = 0;
          const newBarkOpacity = barkOpacityRef.current;
          setBarkOpacity((prev) => Math.abs(prev - newBarkOpacity) > 0.05 ? newBarkOpacity : prev);
        }
      }
    }
  });

  const isPatrolDriven = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);

  return (
    <group ref={groupRef}>
      <group ref={impostorRef} visible={false}>
        <CapsuleImpostorNPC appearance={appearance} />
      </group>

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
        <NPCContactShadow />

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
      <circleGeometry args={[0.35, 16]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Cached relation value per NPC — updated once per interaction session, not per-frame */
const _barkRelationCache = new Map<string, { value: number; frame: number }>();
let _barkRelationFrame = 0;

/** Compute bark text based on active side quests, then NPC relation level */
function computeBark(definition: NPCDefinition): string | null {
  const questBark = resolveNpcQuestBark(definition.id);
  if (questBark) return questBark;

  if (!definition.barkTexts) return null;

  // Cache relation lookups per-frame to avoid per-NPC getState() calls
  const cached = _barkRelationCache.get(definition.id);
  if (cached && cached.frame === _barkRelationFrame) {
    return resolveNpcBarkForRelation(definition.barkTexts, cached.value);
  }

  const npcRelations = useGameStore.getState().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === definition.id);
  const value = relation?.value ?? 50;
  _barkRelationCache.set(definition.id, { value, frame: _barkRelationFrame });

  return resolveNpcBarkForRelation(definition.barkTexts, value);
}

/** Call once per frame from any NPC to advance the bark cache frame counter */
export function advanceBarkRelationFrame(): void {
  _barkRelationFrame++;
  if (_barkRelationCache.size > 50) {
    _barkRelationCache.clear();
  }
}

/** Far LOD: simple capsule impostor tinted with NPC body color — brighter emissive for dark scenes */
function CapsuleImpostorNPC({ appearance }: { appearance: NPCAppearance }) {
  return (
    <mesh position={[0, 0.9, 0]}>
      <capsuleGeometry args={[0.25, 1.0, 4, 8]} />
      <meshStandardMaterial
        color={appearance.bodyColor}
        emissive={appearance.glowColor}
        emissiveIntensity={0.3}
        roughness={0.8}
      />
    </mesh>
  );
}

/** Cached emissive color per NPC — reads store once per frame, not per-NPC */
const _emissiveCache = new Map<string, { color: string; frame: number }>();
let _emissiveFrame = 0;

/** Emissive tint based on NPC relation level — replaces per-NPC point lights */
function getNpcEmissiveColor(npcId: string, glowColor: string): string {
  const cached = _emissiveCache.get(npcId);
  if (cached && cached.frame === _emissiveFrame) {
    return cached.color;
  }

  const npcRelations = useGameStore.getState().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const value = relation?.value ?? 50;

  let color: string;
  if (value >= 70) color = '#ffaa44';
  else if (value <= 30) color = '#ff4444';
  else color = glowColor;

  _emissiveCache.set(npcId, { color, frame: _emissiveFrame });
  return color;
}

/** Call once per frame to advance the emissive cache frame counter */
export function advanceEmissiveFrame(): void {
  _emissiveFrame++;
  if (_emissiveCache.size > 50) {
    _emissiveCache.clear();
  }
}

/**
 * Boost emissive on child meshes for readable silhouettes without point lights.
 *
 * CRITICAL: Only apply to GLB NPCs (which use uniquely-cloned materials via
 * useSkinnedGltfClone). Procedural NPCs share material instances across all
 * instances (sharedMat.skinMedium, hairGray, metalGray, etc.) — mutating
 * their emissive here would cross-contaminate EVERY procedural NPC in the
 * scene with the last-mounted NPC's glow color. Procedural NPCs already
 * receive per-NPC glow via `palette.glow` threaded through npcMat()/accentMat().
 */
function NpcEmissiveGlow({
  npcId,
  glowColor,
  children,
  enabled = true,
}: {
  npcId: string;
  glowColor: string;
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const emissiveColor = useMemo(
    () => getNpcEmissiveColor(npcId, glowColor),
    [npcId, glowColor],
  );

  useEffect(() => {
    if (!enabled) return;
    const root = groupRef.current;
    if (!root) return;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
        mat.emissive.set(emissiveColor);
        mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.45);
      }
    });
  }, [emissiveColor, enabled]);

  if (!enabled) return <>{children}</>;
  return <group ref={groupRef}>{children}</group>;
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
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
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
        <Suspense fallback={
          <ProceduralNPCModel
            definitionId={definition.id}
            appearance={appearance}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={activity}
            patrolActivity={patrolActivity}
            livePlayerPositionRef={livePlayerPositionRef}
          />
        }>
          <GltfNPCModel
            definition={definition}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={activity}
            patrolActivity={patrolActivity}
            lodVisible={lodVisible}
            livePlayerPositionRef={livePlayerPositionRef}
          />
        </Suspense>
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

/* NPCHeadAccessory removed — accessories are now handled by each ProceduralNPCModel variant */

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

/** Quest marker (!/?) floating above NPC head with pulse/glow
 *  Three indicator types:
 *  - Yellow ! — Quest available from this NPC
 *  - Blue ?  — Quest in progress with this NPC
 *  - Green ✓ — Quest ready to turn in (all objectives complete) */
function QuestMarker({ npcId }: { npcId: string }) {
  const quests = useQuests();

  const markerInfo = useMemo(
    () => getNpcQuestMarkerDisplay(npcId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [quests, npcId],
  );

  if (!markerInfo) return null;

  return (
    <NpcQuestMarkerSprite
      icon={markerInfo.icon}
      color={markerInfo.color}
      questName={markerInfo.questName}
      pulseSpeed={markerInfo.pulseSpeed}
    />
  );
}
