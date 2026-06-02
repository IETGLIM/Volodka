'use client';

/* ─── Volodka RPG – Single NPC component with LOD, speech bubbles, quest markers,
     NPC animation states, head tracking, interaction system integration,
     AAA+ visual differentiation (color, accessories, glow, name labels),
     and unique procedural model fallback ─── */

import { useRef, useState, useEffect, Suspense, useMemo, useCallback, Component, type ReactNode, type ErrorInfo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { NPCDefinition, NPCAppearance } from '@/shared/types/game';
import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/data/constants';
import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { deepCloneWithSkeletons } from '@/utils/deepCloneWithSkeletons';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { registerNPCGroup, unregisterNPCGroup } from '@/engine/interaction/npcRegistry';
import { updateHeadTracking, cleanupHeadTracking } from '@/engine/npc/headTracking';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { ProceduralNPCModel } from '@/components/3d/ProceduralNPCModels';
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';

/* ─── Lazy NPC model preloading ───
 *  REMOVED aggressive module-level preloading of ALL 6 GLB models (~12MB).
 *  Previously, this caused 3+ minute load times because all models were
 *  fetched before the first frame rendered. Now models load on-demand
 *  when NPCs appear in the scene (via useGLTF inside Suspense boundaries).
 *  The Suspense fallback shows a capsule impostor while the model loads. */

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

/** Get silhouette width scale factor */
function getSilhouetteScale(silhouette: NPCAppearance['silhouette']): number {
  switch (silhouette) {
    case 'slim': return 0.85;
    case 'heavy': return 1.2;
    case 'average':
    default: return 1.0;
  }
}

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

/** Near LOD: full GLB model with animations, interaction-aware animation states,
 *  and visual customization (color tint, glow, accessories) */
function NPCModel({
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
  const groupRef = useRef<THREE.Group>(null);
  const modelPath = rewriteLegacyModelPath(definition.modelPath ?? '/models-external/khronos_cc0_CesiumMan.glb');
  const appearance = definition.appearance ?? DEFAULT_APPEARANCE;

  // Dynamic point light color based on NPC relation
  const [pointLightColor, setPointLightColor] = useState(() =>
    getNPCPointLightColor(definition.id, appearance.glowColor)
  );

  // Update point light color when relations change
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      const relation = state.npcRelations.find((r) => r.npcId === definition.id);
      const value = relation?.value ?? 50;
      let newColor: string;
      if (value >= 70) newColor = '#ffaa44';
      else if (value <= 30) newColor = '#ff2222';
      else newColor = appearance.glowColor;
      setPointLightColor(newColor);
    });
    return unsub;
  }, [definition.id, appearance.glowColor]);

  const { scene, animations } = useGLTF(modelPath);

  // Clone using deep clone for proper skinned mesh handling
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    try {
      return deepCloneWithSkeletons(scene);
    } catch {
      try {
        return scene.clone(true) as THREE.Group;
      } catch {
        return scene;
      }
    }
  }, [scene]);

  // ── Unique ID for marking materials belonging to this NPC instance ──
  // Used to prevent double-cloning and to identify which materials are safe to dispose
  const npcMaterialId = useMemo(() => `__npc_mat_${definition.id}`, [definition.id]);

  // ── Apply color tinting and emissive glow to all meshes ──
  // Clone materials ONCE and mark them with npcMaterialId for identification
  useEffect(() => {
    if (!clonedScene) return;

    const bodyColor = new THREE.Color(appearance.bodyColor);
    const glowColor = new THREE.Color(appearance.glowColor);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of materials) {
            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const stdMat = mat as THREE.MeshStandardMaterial;

              // Skip if already processed for this NPC (prevents double-cloning)
              if (stdMat.userData[npcMaterialId]) continue;

              // Clone material to avoid sharing between NPCs
              const clonedMat = stdMat.clone();
              // Mark the CLONED material (not original) as belonging to this NPC
              clonedMat.userData[npcMaterialId] = true;
              // Tint the color
              clonedMat.color = bodyColor.clone();
              // Add subtle emissive glow
              clonedMat.emissive = glowColor.clone();
              clonedMat.emissiveIntensity = 0.08;
              clonedMat.roughness = Math.max(0.5, clonedMat.roughness);
              // Replace in array if needed
              if (Array.isArray(mesh.material)) {
                const idx = (mesh.material as THREE.Material[]).indexOf(mat);
                (mesh.material as THREE.Material[])[idx] = clonedMat;
              } else {
                mesh.material = clonedMat;
              }
            }
          }
        }
      }
    });
  }, [clonedScene, appearance.bodyColor, appearance.glowColor, npcMaterialId]);

  // ── Dispose cloned scene on unmount to prevent GPU memory leaks ──
  // Only dispose materials that belong to THIS NPC (marked with npcMaterialId)
  // Textures are shared with the original model from useGLTF and should not be disposed
  useEffect(() => {
    const scene = clonedScene;
    return () => {
      if (!scene) return;
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Geometry/most textures can be shared across GLTF clones via cache.
          // Dispose only per-instance materials created for this NPC.
          if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of materials) {
              // Only dispose if this material was created for this NPC
              if (mat.userData[npcMaterialId]) {
                mat.dispose();
              }
            }
          }
        }
      });
    };
  }, [clonedScene, npcMaterialId]);

  // Pass the cloned scene to useAnimations, not the wrapper group
  // The scene contains the skeleton and SkinnedMesh that animations target
  // Type: useAnimations expects Object3D, clonedScene is Group | null
  const { actions } = useAnimations(animations, clonedScene as THREE.Object3D);

  // Debug: log available animations for this NPC
  useEffect(() => {
    if (!actions) {
      console.warn(`[NPC:${definition.id}] No actions returned from useAnimations`);
    } else if (Object.keys(actions).length === 0) {
      console.warn(`[NPC:${definition.id}] Empty actions object from useAnimations`);
    } else {
      // Log available animations (useful for debugging, minimal output)
      const actionKeys = Object.keys(actions);
      if (actionKeys.length > 1) {
        console.log(`[NPC:${definition.id}] Animations:`, actionKeys.join(', '));
      }
    }
  }, [actions, definition.id]);

  // Auto-scale the cloned scene with height + silhouette
  useEffect(() => {
    if (!clonedScene) return;
    const baseScale = definition.scale ?? 1.0;
    const heightScale = appearance.height;
    const widthScale = getSilhouetteScale(appearance.silhouette);
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const currentHeight = size.y;
    if (currentHeight > 0) {
      const scaleFactor = (PLAYER_GLB_TARGET_VISUAL_METERS / currentHeight) * baseScale * heightScale;
      // Apply non-uniform scale: Y for height, XZ for silhouette width
      clonedScene.scale.set(scaleFactor * widthScale, scaleFactor, scaleFactor * widthScale);
    }
  }, [clonedScene, definition.scale, appearance.height, appearance.silhouette]);

  // ── Animation state management with crossfade ──
  const currentAnimRef = useRef<string>('idle');
  const crossfadeDuration = 0.3;

  /** Find best matching animation action for a state name */
  const findAction = useCallback((stateName: string): THREE.AnimationAction | null => {
    if (!actions) return null;

    // ── Single-animation fallback ──
    // Most GLB models (CesiumMan, etc.) only have one animation clip.
    // In that case, we use it for ALL states by adjusting playback speed:
    //   idle/work/read/rest/sleep → 0.3x–0.5x (slow, subtle movement)
    //   walk → 1.0x (normal speed)
    //   talk → 0.7x (moderate speed with gesture)
    const actionKeys = Object.keys(actions);
    if (actionKeys.length === 1) {
      const singleAction = actions[actionKeys[0]];
      if (singleAction) {
        let speed = 0.4;
        switch (stateName) {
          case 'walk': speed = 1.0; break;
          case 'talk': speed = 0.7; break;
          case 'run': speed = 1.8; break;
          case 'sleep': speed = 0.2; break;
          case 'work': speed = 0.5; break;
          case 'read': speed = 0.35; break;
          case 'rest': speed = 0.3; break;
          case 'idle': default: speed = 0.4; break;
        }
        singleAction.setEffectiveTimeScale(speed);
        singleAction.setEffectiveWeight(1.0);
        if (!singleAction.isRunning()) {
          singleAction.reset().fadeIn(crossfadeDuration).play();
        }
      }
      return actions[actionKeys[0]] ?? null;
    }

    // Try direct lookup and common variants
    const variants = [
      stateName,
      stateName.charAt(0).toUpperCase() + stateName.slice(1), // capitalize
      stateName.toUpperCase(),
      `Cesium_Man_${stateName}`,
      `Armature|${stateName}`,
    ];

    // Add index-based variants for CesiumMan-style models
    if (stateName === 'idle' || stateName === 'rest' || stateName === 'sleep' || stateName === 'work' || stateName === 'read') {
      variants.push('Cesium_Man_idles', '0', 'animation_0');
    }
    if (stateName === 'walk') {
      variants.push('1', 'animation_1');
    }
    if (stateName === 'run') {
      variants.push('2', 'animation_2');
    }

    for (const name of variants) {
      if (actions[name]) return actions[name];
    }

    // For non-idle states, fall back to idle
    if (stateName !== 'idle') {
      const idleVariants = ['idle', 'Idle', 'IDLE', 'Cesium_Man_idles', '0', 'animation_0'];
      for (const name of idleVariants) {
        if (actions[name]) return actions[name];
      }
    }

    // Last resort: first available animation
    const firstKey = Object.keys(actions)[0];
    return firstKey ? actions[firstKey] ?? null : null;
  }, [actions]);

  /** Crossfade to a new animation */
  const crossfadeTo = useCallback((newState: string) => {
    if (!actions) return;
    if (newState === currentAnimRef.current) return;

    currentAnimRef.current = newState;
    const targetAction = findAction(newState);
    if (!targetAction) return;

    for (const action of Object.values(actions)) {
      if (action === targetAction) {
        action?.reset().fadeIn(crossfadeDuration).play();
      } else {
        action?.fadeOut(crossfadeDuration);
      }
    }
  }, [actions, findAction]);

  // ── Determine animation state based on interaction and schedule activity ──
  // Priority: interaction state > schedule activity > idle
  useEffect(() => {
    if (!actions) return;

    if (isInteractionTarget) {
      switch (interactionState) {
        case InteractionState.Approach:
        case InteractionState.Align:
        case InteractionState.Lock:
          crossfadeTo('idle');
          break;
        case InteractionState.Dialogue:
          crossfadeTo('talk');
          break;
        case InteractionState.Exit:
          crossfadeTo('idle');
          break;
        default:
          crossfadeTo('idle');
      }
    } else {
      // Use schedule-driven activity for animation state
      // Map schedule activities to animation states
      // walk → walk animation, work/read → idle (focused pose),
      // sleep → idle at very slow speed, talk → talk animation
      // rest → idle (relaxed pose)
      crossfadeTo(activity);
    }
  }, [interactionState, isInteractionTarget, actions, crossfadeTo, activity]);

  // ── Listen for npc:animation events for this NPC ──
  useEffect(() => {
    const unsub = eventBus.on('npc:animation', ({ npcId, state }) => {
      if (npcId !== definition.id) return;
      crossfadeTo(state);
    });

    return unsub;
  }, [definition.id, crossfadeTo]);

  // Play idle on mount
  useEffect(() => {
    if (!actions) {
      console.warn(`[NPC:${definition.id}] Cannot play idle - no actions`);
      return;
    }
    const idleAction = findAction(definition.animations?.idle ?? 'idle')
      ?? findAction('idle')
      ?? actions[Object.keys(actions)[0]];
    if (idleAction) {
      // No verbose log — idle playing is expected behavior
      idleAction.reset().fadeIn(0.3).play();
    } else {
      console.warn(`[NPC:${definition.id}] No idle animation found`);
    }

    return () => {
      for (const action of Object.values(actions)) {
        action?.stop();
      }
    };
  }, [actions]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      {/* Glow point light above NPC — color changes with relation level */}
      {/* Body glow point light — brighter for visibility in dark rooms */}
      <pointLight
        position={[0, 2.0, 0]}
        color={pointLightColor}
        intensity={1.0}
        distance={5}
        decay={2}
      />
      {/* Subtle under-body glow for visibility in very dark scenes */}
      <pointLight
        position={[0, 0.3, 0]}
        color={pointLightColor}
        intensity={0.25}
        distance={2}
        decay={2}
      />

      {/* Main model */}
      <primitive object={clonedScene} castShadow />

      {/* Head accessories */}
      <NPCHeadAccessory
        type={appearance.headAccessory}
        accentColor={appearance.accentColor}
        glowColor={appearance.glowColor}
      />
    </group>
  );
}

/* ─── Error Boundary for GLB model loading failures ─── */
class NPCGLBModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; npcId: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[NPCModel] GLB rendering error for NPC "${this.props.npcId}", using procedural fallback:`, error.message);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/** Wrapper that tries GLB model first, falls back to unique procedural model on error */
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

  // Dynamic point light color based on NPC relation (needed for both paths)
  const [pointLightColor] = useState(() =>
    getNPCPointLightColor(definition.id, appearance.glowColor)
  );

  const proceduralFallback = (
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

  return (
    <NPCGLBModelErrorBoundary fallback={proceduralFallback} npcId={definition.id}>
      <NPCModel
        definition={definition}
        interactionState={interactionState}
        isInteractionTarget={isInteractionTarget}
        activity={activity}
      />
    </NPCGLBModelErrorBoundary>
  );
}

/** Head accessory geometry rendered above the NPC model */
function NPCHeadAccessory({
  type,
  accentColor,
  glowColor,
}: {
  type: NPCAppearance['headAccessory'];
  accentColor: string;
  glowColor: string;
}) {
  const emissiveColor = new THREE.Color(glowColor);

  switch (type) {
    case 'glasses':
      return (
        <group position={[0, 1.55, 0.1]}>
          {/* Left lens frame */}
          <mesh position={[-0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.06, 0.02]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Right lens frame */}
          <mesh position={[0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.06, 0.02]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              transparent
              opacity={0.7}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.015, 0.02]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.2}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
          {/* Left arm */}
          <mesh position={[-0.15, 0, -0.04]} rotation={[0, Math.PI * 0.15, 0]}>
            <boxGeometry args={[0.08, 0.01, 0.01]} />
            <meshStandardMaterial
              color={accentColor}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
          {/* Right arm */}
          <mesh position={[0.15, 0, -0.04]} rotation={[0, -Math.PI * 0.15, 0]}>
            <boxGeometry args={[0.08, 0.01, 0.01]} />
            <meshStandardMaterial
              color={accentColor}
              roughness={0.3}
              metalness={0.9}
            />
          </mesh>
        </group>
      );

    case 'hat':
      return (
        <group position={[0, 1.72, 0]}>
          {/* Fedora crown */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.12, 12]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.1}
              roughness={0.7}
            />
          </mesh>
          {/* Fedora brim */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.02, 16]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.1}
              roughness={0.7}
            />
          </mesh>
          {/* Hat band */}
          <mesh position={[0, 0.03, 0.11]}>
            <boxGeometry args={[0.22, 0.02, 0.02]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={emissiveColor}
              emissiveIntensity={0.4}
              roughness={0.4}
            />
          </mesh>
        </group>
      );

    case 'scarf':
      return (
        <group position={[0, 1.38, 0]}>
          {/* Scarf wrapped around neck — torus */}
          <mesh rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[0.14, 0.04, 8, 16]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.15}
              roughness={0.8}
            />
          </mesh>
          {/* Scarf tail hanging down */}
          <mesh position={[0.1, -0.12, 0.1]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.06, 0.2, 0.03]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.1}
              roughness={0.85}
            />
          </mesh>
        </group>
      );

    case 'earring':
      return (
        <group position={[0.14, 1.48, 0.05]}>
          {/* Earring stud */}
          <mesh>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.5}
              roughness={0.1}
              metalness={0.95}
            />
          </mesh>
          {/* Earring drop */}
          <mesh position={[0, -0.04, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.6}
              roughness={0.1}
              metalness={0.95}
            />
          </mesh>
          {/* Connecting wire */}
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.04, 4]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={emissiveColor}
              emissiveIntensity={0.3}
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>
        </group>
      );

    case 'none':
    default:
      return null;
  }
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

/** Quest marker (!/?) floating above NPC head with pulse/glow */
function QuestMarker({ npcId }: { npcId: string }) {
  const quests = useGameStore((s) => s.quests);
  const timeRef = useRef(0);

  // Compute marker directly from state — only show for quests associated with THIS NPC
  // Match by checking if any objective targets this NPC (e.g. npc_talked target = npcId)
  // or if the quest's linkedStoryNodeId contains the npcId
  const marker = useMemo(() => {
    // Get quest definitions for richer matching
    let hasActive = false;
    for (const q of quests) {
      if (q.status !== 'active') continue;
      if (!Object.values(q.objectives).some((v) => !v)) continue;
      // Check if this NPC is involved: objective keys matching npcId pattern
      // QuestState.objectives keys often follow pattern like "meet_maria", "talk_albert"
      // We check if any incomplete objective key contains the npcId
      for (const [objKey, completed] of Object.entries(q.objectives)) {
        if (!completed && objKey.toLowerCase().includes(npcId.toLowerCase())) {
          hasActive = true;
          break;
        }
      }
      if (hasActive) break;
    }
    return hasActive ? '!' : null;
  }, [quests, npcId]);

  const [glowIntensity, setGlowIntensity] = useState(1);

  // Pulse animation — faster and brighter for visibility
  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.04;
      setGlowIntensity(0.7 + Math.sin(t * 3.0) * 0.5);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!marker) return null;

  const markerColor = marker === '!' ? '#ffdd00' : '#66ccff';
  const glowColor = marker === '!' ? 'rgba(255, 221, 0,' : 'rgba(102, 204, 255,';

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
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer glow ring — much brighter */}
        <div
          style={{
            position: 'absolute',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: `${glowColor} ${0.25 * glowIntensity})`,
            boxShadow: `0 0 ${18 * glowIntensity}px ${glowColor} ${0.6 * glowIntensity}), 0 0 ${6 * glowIntensity}px ${glowColor} ${0.3 * glowIntensity})`,
            animation: 'questPulse 1.5s ease-in-out infinite',
          }}
        />
        {/* Marker text — larger and brighter */}
        <div
          style={{
            color: markerColor,
            fontSize: '26px',
            fontWeight: 'bold',
            textShadow: `0 0 ${10 * glowIntensity}px ${glowColor} 0.9), 0 0 ${20 * glowIntensity}px ${glowColor} 0.5), 0 0 ${30 * glowIntensity}px ${glowColor} 0.25)`,
            userSelect: 'none',
            position: 'relative',
            zIndex: UI_LAYERS.WORLD_LABELS,
            transform: `scale(${0.9 + glowIntensity * 0.15})`,
            transition: 'transform 0.1s ease',
          }}
        >
          {marker}
        </div>
        {/* Inject keyframes for pulse */}
        <style>{`
          @keyframes questPulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 1; }
          }
        `}</style>
      </div>
    </Html>
  );
}
