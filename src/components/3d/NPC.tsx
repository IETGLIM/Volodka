
/* ─── Volodka RPG – Single NPC component with LOD, speech bubbles, quest markers,
     head tracking, interaction system integration,
     AAA+ visual differentiation (color, accessories, glow, name labels),
     and procedural 3D models ─── */

import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { NPCDefinition, NPCAppearance } from '@/shared/types/game';

import { useGameStore } from '@/store/gameStore';
import { useQuests } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { registerNPCGroup, unregisterNPCGroup } from '@/engine/interaction/npcRegistry';
import { updateHeadTracking, cleanupHeadTracking } from '@/engine/npc/headTracking';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { canStartQuest } from '@/engine/GuidedStoryManager';

/* ─── NPC models ───
 *  All NPCs use ProceduralNPCModel (Three.js primitives) — no GLB files.
 *  The Suspense fallback shows a capsule impostor while the procedural model renders. */

/* ─── LOD thresholds ─── */
const FAR_DISTANCE = 17;
const NEAR_DISTANCE = 11;

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
  const [lodState, setLodState] = useState<'far' | 'near'>('far');
  const prevLodRef = useRef<'far' | 'near'>('far');

  // ── Patrol state ──
  const patrolRef = useRef<PatrolState | null>(null);
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

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // ── Update patrol state ──
    const isPatrolling = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);
    if (isPatrolling && patrolRef.current && patrolWaypoints) {
      const result = updatePatrol(patrolRef.current, patrolWaypoints, delta);
      setPatrolActivity(result.activity);
      // Use patrol position
      groupRef.current.position.copy(patrolRef.current.position);
    } else {
      // Use schedule-driven position (static or schedule-based)
      groupRef.current.position.set(position[0], position[1], position[2]);
      // When not patrolling, the activity is driven by schedule
      if (patrolActivity !== 'idle') {
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

    // LOD check
    const playerPos = livePlayerPositionRef.current;
    const dist = groupRef.current.position.distanceTo(playerPos);

    let newLod: 'far' | 'near' = prevLodRef.current;
    if (dist > FAR_DISTANCE) {
      newLod = 'far';
    } else if (dist < NEAR_DISTANCE) {
      newLod = 'near';
    }

    if (newLod !== prevLodRef.current) {
      prevLodRef.current = newLod;
      setLodState(newLod);
    }

    // ── Head tracking: make NPC look at player when nearby ──
    // During dialogue, head tracking is especially important (NPC faces player)
    if (lodState === 'near' && dist < HEAD_TRACKING_DISTANCE) {
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

  return (
    <group ref={groupRef}>
      {lodState === 'far' ? (
        <CapsuleImpostorNPC appearance={appearance} />
      ) : (
        <Suspense fallback={<CapsuleImpostorNPC appearance={appearance} />}>
          <NPCModelWithErrorBoundary
            definition={definition}
            interactionState={interactionState}
            isInteractionTarget={isInteractionTarget}
            activity={shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length) ? patrolActivity : activity}
          />
        </Suspense>
      )}

      {/* Contact shadow under NPC feet */}
      <NPCContactShadow />

      {/* Quest marker above head */}
      <QuestMarker npcId={definition.id} />

      {/* Speech bubble — hidden during active interaction */}
      {barkPhase !== 'hidden' && interactionState === InteractionState.Idle && (
        <SpeechBubble
          phase={barkPhase}
          text={barkText}
          opacity={barkOpacity}
        />
      )}

      {/* Floating name label with body color tint */}
      {nameLabelOpacity > 0 && (
        <NPCNameLabel
          name={definition.name}
          accentColor={appearance.accentColor}
          bodyColor={appearance.bodyColor}
          opacity={nameLabelOpacity}
        />
      )}
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

/** Compute bark text based on NPC relation level */
function computeBark(definition: NPCDefinition): string | null {
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

/** Get point light color based on NPC relation level */
function getNPCPointLightColor(npcId: string, glowColor: string): string {
  const npcRelations = useGameStore.getState().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const value = relation?.value ?? 50;

  if (value >= 70) return '#ffaa44';  // Warm amber for friendly
  if (value <= 30) return '#ff2222';  // Red for hostile
  return glowColor;                    // Use NPC's unique glow color for neutral
}

/* NPCModel removed — all NPCs now use ProceduralNPCModel exclusively */

/** NPC model renderer — always uses procedural model (GLB support removed) */
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

  // Dynamic point light color based on NPC relation
  const [pointLightColor] = useState(() =>
    getNPCPointLightColor(definition.id, appearance.glowColor)
  );

  return (
    <group>
      <pointLight
        position={[0, 2.0, 0]}
        color={pointLightColor}
        intensity={1.0}
        distance={5}
        decay={2}
      />
      <pointLight
        position={[0, 0.3, 0]}
        color={pointLightColor}
        intensity={0.25}
        distance={2}
        decay={2}
      />
      <ProceduralNPCModel
        definitionId={definition.id}
        appearance={appearance}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity={activity}
      />
    </group>
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
    <Html
      position={[0, 2.15, 0]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          opacity,
          transition: 'opacity 0.2s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            color: accentColor,
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'monospace',
            letterSpacing: '0.06em',
            textShadow: `
              0 0 4px ${accentColor}88,
              0 0 8px ${bodyColor}66,
              0 1px 2px rgba(0,0,0,0.9)
            `,
            padding: '2px 8px',
            borderRadius: '3px',
            background: `linear-gradient(135deg, rgba(0,0,0,0.6), ${bodyColor}22)`,
            border: `1px solid ${bodyColor}66`,
          }}
        >
          {name}
        </div>
      </div>
    </Html>
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
  return (
    <Html
      position={[0, 2.4, 0]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(8, 8, 18, 0.95)',
          color: phase === 'thinking' ? '#00ffee' : '#f0f0f0',
          padding: '7px 14px',
          borderRadius: '7px',
          fontSize: '13px',
          fontWeight: phase === 'thinking' ? 'normal' : '600',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          border: `1.5px solid ${phase === 'thinking' ? 'rgba(0, 255, 238, 0.7)' : 'rgba(255, 180, 40, 0.7)'}`,
          boxShadow: phase === 'thinking'
            ? '0 0 12px rgba(0, 255, 238, 0.4), 0 0 4px rgba(0, 255, 238, 0.2), inset 0 0 6px rgba(0, 255, 238, 0.12)'
            : '0 0 12px rgba(255, 180, 40, 0.35), 0 0 4px rgba(255, 180, 40, 0.15), inset 0 0 6px rgba(255, 180, 40, 0.08)',
          opacity,
          transition: 'opacity 0.1s ease',
          fontFamily: 'monospace',
          letterSpacing: '0.02em',
          position: 'relative',
          maxWidth: '220px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {phase === 'thinking' ? (
          <ThinkingDots />
        ) : (
          text
        )}
        {/* Speech bubble tail */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(10, 10, 20, 0.92)',
          }}
        />
      </div>
    </Html>
  );
}

/** Animated "..." thinking dots — pure CSS animation, no setInterval */
function ThinkingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', minWidth: '24px' }}>
      <span style={{ animation: 'thinkingDot1 1.05s ease-in-out infinite' }}>·</span>
      <span style={{ animation: 'thinkingDot2 1.05s ease-in-out infinite' }}>·</span>
      <span style={{ animation: 'thinkingDot3 1.05s ease-in-out infinite' }}>·</span>
      <style>{`
        @keyframes thinkingDot1 {
          0%, 33%, 100% { opacity: 0.3; }
          16% { opacity: 1; }
        }
        @keyframes thinkingDot2 {
          0%, 33%, 66%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes thinkingDot3 {
          0%, 66%, 100% { opacity: 0.3; }
          83% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

/** Quest marker (!/?) floating above NPC head with pulse/glow
 *  Three indicator types:
 *  - Yellow ! — Quest available from this NPC
 *  - Blue ?  — Quest in progress with this NPC
 *  - Green ✓ — Quest ready to turn in (all objectives complete) */
function QuestMarker({ npcId }: { npcId: string }) {
  const quests = useQuests();
  const [glowIntensity, setGlowIntensity] = useState(1);

  // Compute marker info: type, color, pulse speed, quest name
  const markerInfo = useMemo(() => {
    // 1. Check for quests ready to turn in (green ✓) — highest priority
    for (const q of quests) {
      if (q.status !== 'active') continue;
      // Check if ALL objectives are complete
      if (Object.values(q.objectives).some((v) => !v)) continue;
      // Check if this NPC is involved in this quest
      const questDef = getQuestDefinitions().find((d) => d.id === q.questId);
      if (!questDef) continue;
      const npcInvolved = questDef.objectives.some(
        (o) => o.type === 'npc_talked' && o.target === npcId,
      );
      if (npcInvolved) {
        return {
          icon: '✓',
          color: '#00ff66',
          glowPrefix: 'rgba(0, 255, 102,',
          pulseSpeed: 0.7,
          questName: questDef.title,
          type: 'complete' as const,
        };
      }
    }

    // 2. Check for active quests with this NPC (blue ?)
    for (const q of quests) {
      if (q.status !== 'active') continue;
      // Still has incomplete objectives
      if (!Object.values(q.objectives).some((v) => !v)) continue;
      const questDef = getQuestDefinitions().find((d) => d.id === q.questId);
      if (!questDef) continue;
      // Check if any incomplete npc_talked objective targets this NPC
      const hasNpcObjective = questDef.objectives.some(
        (o) => o.type === 'npc_talked' && o.target === npcId && !q.objectives[o.id],
      );
      if (hasNpcObjective) {
        return {
          icon: '?',
          color: '#66ccff',
          glowPrefix: 'rgba(102, 204, 255,',
          pulseSpeed: 1.0,
          questName: questDef.title,
          type: 'active' as const,
        };
      }
    }

    // 3. Check for available quests from this NPC (yellow !)
    for (const qDef of getQuestDefinitions()) {
      // Check if this quest has an npc_talked objective targeting this NPC
      const hasNpcObj = qDef.objectives.some(
        (o) => o.type === 'npc_talked' && o.target === npcId,
      );
      if (!hasNpcObj) continue;

      // Check if quest is not already started or completed
      const existing = quests.find((q) => q.questId === qDef.id);
      if (existing && existing.status !== 'inactive') continue;

      // Check if player can start this quest
      if (!canStartQuest(qDef.id)) continue;

      // Prefer golden path quests
      const isGoldenPath = GOLDEN_PATH_QUEST_SPINE.includes(qDef.id);
      if (!isGoldenPath && qDef.questType !== 'main' && qDef.questType !== 'side') continue;

      return {
        icon: '!',
        color: '#ffdd00',
        glowPrefix: 'rgba(255, 221, 0,',
        pulseSpeed: 1.5,
        questName: qDef.title,
        type: 'available' as const,
      };
    }

    return null;
  }, [quests, npcId]);

  // Pulse animation — speed depends on marker type
  useEffect(() => {
    if (!markerInfo) return
    let frame: number;
    let t = 0;
    const speed = markerInfo.pulseSpeed;
    const animate = () => {
      t += 0.04 * (1.5 / speed);
      setGlowIntensity(0.7 + Math.sin(t * 3.0) * 0.5);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [markerInfo]);

  if (!markerInfo) return null;

  const isComplete = markerInfo.type === 'complete';

  return (
    <Html
      position={[0, 2.2, 0]}
      center
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: 'absolute',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: `${markerInfo.glowPrefix} ${0.25 * glowIntensity})`,
            boxShadow: isComplete
              ? `0 0 ${18 * glowIntensity}px ${markerInfo.glowPrefix} ${0.6 * glowIntensity}), 0 0 ${6 * glowIntensity}px ${markerInfo.glowPrefix} ${0.3 * glowIntensity}), 0 0 ${30 * glowIntensity}px rgba(255,204,0,${0.2 * glowIntensity})`
              : `0 0 ${18 * glowIntensity}px ${markerInfo.glowPrefix} ${0.6 * glowIntensity}), 0 0 ${6 * glowIntensity}px ${markerInfo.glowPrefix} ${0.3 * glowIntensity})`,
            animation: `questPulse${markerInfo.type} ${markerInfo.pulseSpeed}s ease-in-out infinite`,
          }}
        />
        {/* Marker text */}
        <div
          style={{
            color: markerInfo.color,
            fontSize: isComplete ? '20px' : '26px',
            fontWeight: 'bold',
            textShadow: isComplete
              ? `0 0 ${10 * glowIntensity}px ${markerInfo.glowPrefix} 0.9), 0 0 ${20 * glowIntensity}px ${markerInfo.glowPrefix} 0.5), 0 0 ${30 * glowIntensity}px rgba(255,204,0,${0.25 * glowIntensity})`
              : `0 0 ${10 * glowIntensity}px ${markerInfo.glowPrefix} 0.9), 0 0 ${20 * glowIntensity}px ${markerInfo.glowPrefix} 0.5), 0 0 ${30 * glowIntensity}px ${markerInfo.glowPrefix} 0.25)`,
            userSelect: 'none',
            position: 'relative',
            zIndex: UI_LAYERS.WORLD_LABELS,
            transform: `scale(${0.9 + glowIntensity * 0.15})`,
            transition: 'transform 0.1s ease',
          }}
        >
          {markerInfo.icon}
        </div>
        {/* Quest name below */}
        <div
          style={{
            color: markerInfo.color,
            fontSize: '8px',
            fontFamily: 'monospace',
            letterSpacing: '0.03em',
            marginTop: '2px',
            maxWidth: '80px',
            textAlign: 'center',
            opacity: 0.7,
            textShadow: `0 0 4px ${markerInfo.glowPrefix} 0.5)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {markerInfo.questName}
        </div>
        {/* Inject keyframes for pulse variants */}
        <style>{`
          @keyframes questPulseavailable {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.2); opacity: 1; }
          }
          @keyframes questPulseactive {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 1; }
          }
          @keyframes questPulsecomplete {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.4); opacity: 1; }
          }
        `}</style>
      </div>
    </Html>
  );
}
