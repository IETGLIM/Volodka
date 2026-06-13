
/* ─── Volodka RPG – Single NPC component with LOD, speech bubbles, quest markers,
     head tracking, interaction system integration,
     AAA+ visual differentiation (color, accessories, glow, name labels),
     and procedural 3D models ─── */

import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { NPCDefinition, NPCAppearance } from '@/shared/types/game';

import { useGameStore } from '@/store/gameStore';
import { useQuests } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { registerNPCGroup, unregisterNPCGroup } from '@/engine/interaction/npcRegistry';
import {
  updateHeadTracking,
  cleanupHeadTracking,
  invalidateHeadTracking,
} from '@/engine/npc/headTracking';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { GltfNPCModel } from '@/components/3d/GltfNPCModel';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';
import { getNpcQuestMarkerDisplay } from '@/store/questStore';
import { resolveNpcQuestBark } from '@/engine/npc/npcQuestBark';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  DEFAULT_NPC_LOD,
  resolveNpcLod,
  scaleNpcLodThresholds,
  type NpcLodLevel,
} from '@/engine/lod/distanceLod';
import {
  NpcNameSprite,
  NpcSpeechSprite,
  NpcQuestMarkerSprite,
} from '@/engine/npc/npcWorldSprite';

/* ─── NPC models ───
 *  GLB when a shipped asset exists (npcModelRegistry); otherwise ProceduralNPCModel.
 *  Suspense shows a capsule impostor while the model loads. */

/* ─── Speech bubble timing ─── */
const THINKING_DURATION = 1.2; // seconds before bark text appears
const BARK_VISIBLE_DURATION = 5.0; // seconds bark text is shown
const BARK_FADE_DURATION = 0.5; // seconds for fade-out

/* ─── Head tracking distance ─── */
const HEAD_TRACKING_DISTANCE = 8.0;

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
}: NPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const impostorRef = useRef<THREE.Group>(null);
  const fullDetailRef = useRef<THREE.Group>(null);
  const questMarkerRef = useRef<THREE.Group>(null);
  const lodLevelRef = useRef<NpcLodLevel>('impostor');
  const { preset } = useGraphicsQuality();
  const npcLodThresholds = useMemo(
    () => scaleNpcLodThresholds(DEFAULT_NPC_LOD, preset.lodBias),
    [preset.lodBias],
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
  }, [patrolWaypoints]);

  // Proximity bark
  const barkCooldownRef = useRef(0);
  const hasBarkedRef = useRef(false);

  // Speech bubble state
  const [barkPhase, setBarkPhase] = useState<'hidden' | 'thinking' | 'speaking' | 'fading'>('hidden');
  const [barkText, setBarkText] = useState('');
  const [barkOpacity, setBarkOpacity] = useState(1);
  const barkTimerRef = useRef(0);

  // Name label distance tracking — ref-based with throttled React state updates
  const [nameLabelOpacity, setNameLabelOpacity] = useState(0);
  const nameLabelOpacityRef = useRef(0);
  const nameLabelUpdateTimerRef = useRef(0);

  // Bark opacity ref for throttled updates during fading
  const barkOpacityRef = useRef(1);
  const barkOpacityUpdateTimerRef = useRef(0);

  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;

  // ── Register/unregister NPC group ref for interaction system ──
  useEffect(() => {
    if (groupRef.current) {
      registerNPCGroup(definition.id, groupRef.current);
    }
    return () => {
      unregisterNPCGroup(definition.id);
      cleanupHeadTracking(definition.id);
    };
  }, [definition.id]);

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

  useFrameTick('npc', ({ delta }) => {
    if (!groupRef.current) return;

    // ── Update patrol state ──
    const isPatrolling = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);
    if (isPatrolling && patrolRef.current && patrolWaypoints) {
      const result = updatePatrol(patrolRef.current, patrolWaypoints, delta);
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
      invalidateHeadTracking(definition.id);
    }
    applyNpcLodVisibility(newLod, isInteractionTarget);

    if (newLod === 'culled') {
      return;
    }

    // ── Head tracking: make NPC look at player when nearby ──
    if (newLod === 'full' && dist < HEAD_TRACKING_DISTANCE) {
      updateHeadTracking(definition.id, groupRef.current, playerPos, delta);
    }

    // ── Name label: fade based on distance (ref-based, throttled React state updates) ──
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

    // Proximity bark — skip during active interaction
    if (interactionState === InteractionState.Idle) {
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
  const modelActivity = isPatrolDriven ? patrolActivity : activity;

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
            activity={modelActivity}
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

        {nameLabelOpacity > 0 && (
          <NPCNameLabel
            name={definition.name}
            accentColor={appearance.accentColor}
            bodyColor={appearance.bodyColor}
            opacity={nameLabelOpacity}
          />
        )}
      </group>

      <group ref={questMarkerRef} visible={false}>
        <QuestMarker npcId={definition.id} />
      </group>
    </group>
  );
}

/** Shared contact shadow texture — created once and reused across all NPCs */
let _sharedContactShadowTexture: THREE.CanvasTexture | null = null;

function getSharedContactShadowTexture(): THREE.CanvasTexture {
  if (_sharedContactShadowTexture) return _sharedContactShadowTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.06)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  _sharedContactShadowTexture = new THREE.CanvasTexture(canvas);
  return _sharedContactShadowTexture;
}

/** Contact shadow for NPCs — flat circle mesh at feet with radial gradient (shared texture) */
function NPCContactShadow() {
  const shadowTexture = useMemo(() => getSharedContactShadowTexture(), []);

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

/** Compute bark text based on active side quests, then NPC relation level */
function computeBark(definition: NPCDefinition): string | null {
  const questBark = resolveNpcQuestBark(definition.id);
  if (questBark) return questBark;

  if (!definition.barkTexts) return null;

  const npcRelations = useGameStore.getState().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === definition.id);
  const value = relation?.value ?? 50;

  if (value <= 30) {
    return definition.barkTexts.hostile;
  } else if (value >= 70) {
    return definition.barkTexts.friendly;
  } else {
    return definition.barkTexts.neutral;
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

/** Emissive tint based on NPC relation level — replaces per-NPC point lights */
function getNpcEmissiveColor(npcId: string, glowColor: string): string {
  const npcRelations = useGameStore.getState().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const value = relation?.value ?? 50;

  if (value >= 70) return '#ffaa44';
  if (value <= 30) return '#ff4444';
  return glowColor;
}

/** Boost emissive on child meshes for readable silhouettes without point lights */
function NpcEmissiveGlow({
  npcId,
  glowColor,
  children,
}: {
  npcId: string;
  glowColor: string;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const emissiveColor = useMemo(
    () => getNpcEmissiveColor(npcId, glowColor),
    [npcId, glowColor],
  );

  useEffect(() => {
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
  }, [emissiveColor]);

  return <group ref={groupRef}>{children}</group>;
}

/** NPC model renderer — GLB when a shipped modelPath/registry entry exists, else procedural.
 *  Quality preset npcRenderMode='procedural' (low tier) skips GLB entirely. */
function NPCModelWithErrorBoundary({
  definition,
  interactionState,
  isInteractionTarget,
  activity,
}: {
  definition: NPCDefinition;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
}) {
  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;
  const { preset } = useGraphicsQuality();
  const allowGlbNpc = preset.npcRenderMode !== 'procedural';

  return (
    <NpcEmissiveGlow npcId={definition.id} glowColor={appearance.glowColor}>
      {allowGlbNpc && resolveNpcModelUrl(definition.id, definition.modelPath) ? (
        <GltfNPCModel
          definition={definition}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
        />
      ) : (
        <ProceduralNPCModel
          definitionId={definition.id}
          appearance={appearance}
          interactionState={interactionState}
          isInteractionTarget={isInteractionTarget}
          activity={activity}
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
