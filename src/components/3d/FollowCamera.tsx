
/* ─── Volodka RPG – AAA Cinematic Follow Camera ───
 *  Five camera modes + cinematic enhancements:
 *  1. EXPLORATION — spring-based with turn tilt, height smoothing, breathing idle, wall collision
 *     + Breathing camera bob (subtle 0.005m, 2s cycle)
 *     + Look-ahead offset (camera shifts in movement direction)
 *     + Scene-specific FOV (indoor 55°, outdoor 70°)
 *     + NPC interaction zoom (distance lerps to 2.0 when locked)
 *  2. DIALOGUE — speaker-aware cinematic shots (over-shoulder, close-up, two-shot)
 *  3. CUTSCENE — waypoint-based bezier interpolation
 *  4. COMBAT — wide FOV, impact zoom, screen shake
 *  5. SCENE TRANSITION — brief fly-through on scene change
 */

import { useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { getSceneConfig } from '@/config/scenes';
import {
  createSpringCameraState,
  updateSpringCamera,
  resolveCameraCollision,
  getDialogueShot,
  createDialogueShotController,
  updateDialogueShotController,
  resetDialogueShotController,
  setDialogueSpeaker,
  applyEnhancedBreathingIdle,
  setGlobalTimeScale,
  applyTimeScale,
  createExplorationCameraState,
  updateExplorationState,
  createCutsceneController,
  startCutscene,
  stopCutscene,
  updateCutsceneController,
  createCombatCameraState,
  triggerCombatImpact,
  triggerCombatShake,
  updateCombatCamera,
  createSceneTransitionState,
  startSceneTransition,
  updateSceneTransition,
  COMBAT_FOV,
  type SpringCameraState,
  type DialogueShotController,
  type ExplorationCameraState,
  type CutsceneController,
  type CombatCameraState,
  type SceneTransitionState,
  type CameraWaypoint,
  type DialogueSpeaker,
  DEFAULT_FOV,
} from '@/engine/camera/cinematicCamera';
import { getInteractionState, getInteractionTargetNPCId, isInteractionLocked } from './InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { eventBus } from '@/engine/EventBus';
import { getCameraShakeOffset } from '@/engine/camera/cameraShake';
import { getCameraPOI, POI_LERP_SPEED } from '@/engine/camera/cameraPOI';
import type { CameraWaypointData, SceneId } from '@/shared/types/game';

interface FollowCameraProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

/* ── Camera parameters ── */
const DEFAULT_DISTANCE = 3.5;
const MIN_DISTANCE = 0.8;
const MAX_DISTANCE = 12.0;
const ZOOM_SPEED = 0.4;
const PITCH_MIN = -0.5;
const PITCH_MAX = 1.3;
const LOOK_HEIGHT = 1.3;
const ORBIT_SENSITIVITY = 0.004;
const ZOOM_SENSITIVITY = 0.002;     // per-pixel deltaY — tuned for responsive feel
const ZOOM_LINE_MULTIPLIER = 40;    // normalize line-mode deltaY (Firefox) to pixel equivalent
const ZOOM_PAGE_MULTIPLIER = 800;   // normalize page-mode deltaY to pixel equivalent
const ZOOM_PIXEL_STEP = 0.15;      // minimum zoom step per scroll notch (prevents micro-steps)
const WALL_MARGIN = 0.25;

/** Scene-specific camera distance — scales with scene size
 *  Larger outdoor scenes get a further default camera distance
 *  so the player can see more of the environment. */
function getSceneDefaultDistance(sceneId: SceneId): number {
  const config = getSceneConfig(sceneId);
  const [width, depth] = config.size;
  const area = width * depth;
  // Scale: tiny rooms (≤16m²) → 2.5m, medium (16–36m²) → 3.5m, large (36–64m²) → 5.0m, huge (>64m²) → 6.5m
  if (area <= 16) return 2.5;
  if (area <= 36) return 3.5;
  if (area <= 64) return 5.0;
  return 6.5;
}

/* ── Auto-follow parameters ── */
const AUTO_FOLLOW_SPEED = 3.0;       // how fast yaw lerps behind player when moving
const AUTO_FOLLOW_IDLE_THRESHOLD = 0.3; // min movement speed to trigger auto-follow
const AUTO_FOLLOW_MIN_YAW_DELTA = 0.05; // only auto-rotate if yaw difference exceeds this
const AUTO_FOLLOW_RETURN_SPEED = 1.5; // how fast camera returns to behind player when idle

/* ── Cinematic enhancement parameters ── */
const NPC_INTERACTION_DISTANCE = 2.0;       // zoom target when interacting with NPC
const DISTANCE_LERP_SPEED = 2.0;            // how fast distance lerps (0.5s transition)
const DIALOGUE_EXIT_LERP_SPEED = 4.0;       // faster return to normal distance after dialogue
const BREATHING_BOB_AMPLITUDE = 0.005;      // subtle 5mm bob
const BREATHING_BOB_SPEED = Math.PI;        // 2s cycle (π rad/s → period = 2s)
const LOOK_AHEAD_STRENGTH = 0.15;           // how far ahead camera shifts
const LOOK_AHEAD_LERP_SPEED = 3.0;          // how fast look-ahead tracks movement
const INDOOR_FOV = 55;                      // narrower FOV for indoor scenes
const OUTDOOR_FOV = 70;                      // wider FOV for outdoor scenes
const FOV_TRANSITION_SPEED = 2.5;           // how fast FOV transitions between indoor/outdoor

/** Set of scene IDs that are considered indoor (has ceiling) */
const INDOOR_SCENES: Set<SceneId> = new Set([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'cafe_evening',
  'office_day',
  'library_day',
  'abandoned_factory',
  'zarema_albert_room',
]);

/** Get scene-specific FOV based on whether the scene is indoor or outdoor */
function getSceneSpecificFov(sceneId: SceneId): number {
  return INDOOR_SCENES.has(sceneId) ? INDOOR_FOV : OUTDOOR_FOV;
}

/** AAA cinematic follow camera with five camera modes */
export function FollowCamera({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: FollowCameraProps) {
  const camera = useThree((s) => s.camera);
  const threeScene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  // P3-FIX: useShallow for object/array selectors to prevent unnecessary re-renders.
  // Without useShallow, cutsceneWaypoints (array) returns a new reference on
  // every store update, causing FollowCamera to re-render even when waypoints
  // haven't changed. sceneId, gameMode, and currentNodeId are primitives and
  // don't need useShallow.
  const { sceneId, gameMode, activeCutsceneId, cutsceneWaypoints, currentNodeId } = useGameStore(
    useShallow((s) => ({
      sceneId: s.exploration.currentSceneId,
      gameMode: s.mode,
      activeCutsceneId: s.activeCutsceneId,
      cutsceneWaypoints: s.cutsceneWaypoints,
      currentNodeId: s.currentNodeId,
    })),
  );

  // Camera ref for imperative updates (standard R3F pattern)
  const cameraRef = useRef(camera);
  useEffect(() => { cameraRef.current = camera; }, [camera]);

  // P3-FIX: Enable all visualization layers on the camera ONCE via useEffect,
  // not every frame in useFrame. The layer mask doesn't change at runtime,
  // so there's no need to check and enable layers 60 times per second.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam) {
      for (let i = 0; i <= 4; i++) {
        cam.layers.enable(i);
      }
    }
  }, [camera]);

  // ── Orbit controls state ──
  const yawRef = useRef(0);
  const pitchRef = useRef(0.3);
  const distanceRef = useRef(DEFAULT_DISTANCE);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  // ── Spring camera ──
  const springRef = useRef<SpringCameraState | null>(null);

  // ── Dialogue controller ──
  const dialogueControllerRef = useRef<DialogueShotController | null>(null);

  // ── Exploration enhancement state ──
  const explorationRef = useRef<ExplorationCameraState | null>(null);

  // ── Cutscene controller ──
  const cutsceneRef = useRef<CutsceneController | null>(null);
  const cutsceneActiveRef = useRef(false);

  // ── NPC cutscene controller (separate from story cutscenes) ──
  const npcCutsceneRef = useRef<CutsceneController | null>(null);
  const npcCutsceneActiveRef = useRef(false);

  // ── Combat camera state ──
  const combatRef = useRef<CombatCameraState | null>(null);

  // ── Scene transition state ──
  const transitionRef = useRef<SceneTransitionState | null>(null);

  // ── Time tracking ──
  const timeRef = useRef(0);

  // ── Was in dialogue last frame? ──
  const wasInDialogueRef = useRef(false);

  // ── Previous scene for transition detection ──
  const prevSceneIdRef = useRef(sceneId);

  // ── NPC interaction distance lerping ──
  const interactionDistanceRef = useRef(DEFAULT_DISTANCE);

  // ── Look-ahead offset (smoothed) ──
  const lookAheadOffsetRef = useRef(new THREE.Vector3());
  const prevVelocitySmoothRef = useRef(new THREE.Vector3());

  // ── Scene-specific FOV (smoothly transitions) ──
  const currentSceneFovRef = useRef(getSceneSpecificFov(sceneId));

  // ── Cinematic transition freeze state ──
  const cinematicFreezeRef = useRef(false);
  const cinematicFreezeStartRef = useRef(0); // timestamp when freeze started
  const CINEMATIC_FREEZE_TIMEOUT = 2.0; // safety: unfreeze after 2s max

  // ── Intro wake-up camera ──
  const introWakeRef = useRef(false);
  const introWakeStartTimeRef = useRef(0);
  const INTRO_WAKE_DURATION = 3.0; // seconds for pull-back
  const INTRO_WAKE_START_DISTANCE = 1.2;
  const INTRO_WAKE_END_DISTANCE = DEFAULT_DISTANCE;

  // ── Pre-allocated temp vectors ──
  const _desiredPos = useRef(new THREE.Vector3());
  const _lookTarget = useRef(new THREE.Vector3());
  const _offset = useRef(new THREE.Vector3());
  const _prevPlayerPos = useRef(new THREE.Vector3());
  const _tempVec = useRef(new THREE.Vector3());
  const _tempVec2 = useRef(new THREE.Vector3());
  const _playerVelocity = useRef(new THREE.Vector3());

  // ── Raycaster for wall collision ──
  const raycaster = useRef(new THREE.Raycaster());

  // ── Initialize all camera subsystems ──
  useEffect(() => {
    const config = getSceneConfig(sceneId);
    const spawn = config.spawnPoint;
    // Camera yaw must be BEHIND the player (opposite of player facing direction)
    const cameraYaw = (config.initialRotation ?? 0) + Math.PI;
    const initPitch = 0.3;
    const initPos = new THREE.Vector3(
      spawn[0] + Math.sin(cameraYaw) * Math.cos(initPitch) * DEFAULT_DISTANCE,
      spawn[1] + LOOK_HEIGHT + Math.sin(initPitch) * DEFAULT_DISTANCE,
      spawn[2] + Math.cos(cameraYaw) * Math.cos(initPitch) * DEFAULT_DISTANCE,
    );
    const initLook = new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

    // Set yaw ref so auto-follow works correctly from the start
    yawRef.current = cameraYaw;
    pitchRef.current = initPitch;

    springRef.current = createSpringCameraState(initPos, initLook);
    dialogueControllerRef.current = createDialogueShotController();
    explorationRef.current = createExplorationCameraState();
    combatRef.current = createCombatCameraState();
    transitionRef.current = createSceneTransitionState();
    _prevPlayerPos.current.set(spawn[0], spawn[1], spawn[2]);

    // Initialize scene FOV
    currentSceneFovRef.current = getSceneSpecificFov(sceneId);

    // CRITICAL: Immediately apply the spring camera to the actual Three.js camera
    // so the first rendered frame already shows the correct view (not the default
    // camera position from Canvas props which looks at origin/chair area).
    const cam = cameraRef.current as THREE.PerspectiveCamera;
    if (cam) {
      cam.position.copy(initPos);
      cam.lookAt(initLook);
      cam.fov = getSceneSpecificFov(sceneId);
      cam.updateProjectionMatrix();
    }
  }, []);

  // ── Reset camera on scene change ──
  // Teleport spring camera to new spawn point immediately to avoid "sliding"
  // from old position. Also reset all orbit parameters.
  // Use useLayoutEffect so the camera teleports synchronously before the next paint,
  // preventing a frame where the camera is at the old position.
  useLayoutEffect(() => {
    const config = getSceneConfig(sceneId);
    const spawn = config.spawnPoint;
    // Camera yaw must be BEHIND the player (opposite of player facing direction)
    const cameraYaw = (config.initialRotation ?? 0) + Math.PI;
    yawRef.current = cameraYaw;
    pitchRef.current = 0.3;
    const sceneDist = getSceneDefaultDistance(sceneId);
    distanceRef.current = sceneDist;
    interactionDistanceRef.current = sceneDist;
    initializedRef.current = false;

    // Immediately teleport spring camera to the new spawn point
    if (springRef.current) {
      const sceneDist = getSceneDefaultDistance(sceneId);
      const newCamPos = new THREE.Vector3(
        spawn[0] + Math.sin(cameraYaw) * Math.cos(0.3) * sceneDist,
        spawn[1] + LOOK_HEIGHT + Math.sin(0.3) * sceneDist,
        spawn[2] + Math.cos(cameraYaw) * Math.cos(0.3) * sceneDist,
      );
      const newLookAt = new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

      springRef.current.position.copy(newCamPos);
      springRef.current.velocity.set(0, 0, 0);
      springRef.current.lookAt.copy(newLookAt);
      springRef.current.fov = getSceneSpecificFov(sceneId);
      springRef.current.roll = 0;
    }

    // Reset exploration state for the new scene
    if (explorationRef.current) {
      explorationRef.current.smoothedHeight = spawn[1];
      explorationRef.current.prevYaw = cameraYaw;
      explorationRef.current.turnRate = 0;
      explorationRef.current.smoothedTurnRate = 0;
      explorationRef.current.idleTimer = 0;
      explorationRef.current.breathingIntensity = 0;
    }

    // Update prev player position to avoid huge velocity spike
    _prevPlayerPos.current.set(spawn[0], spawn[1], spawn[2]);

    // Reset look-ahead
    lookAheadOffsetRef.current.set(0, 0, 0);
    prevVelocitySmoothRef.current.set(0, 0, 0);

    // Update scene FOV immediately
    currentSceneFovRef.current = getSceneSpecificFov(sceneId);
  }, [sceneId]);

  // ── Listen for cinematic transition phases to freeze camera during fade ──
  useEffect(() => {
    const unsub = eventBus.on('camera:cinematic_transition', ({ phase }) => {
      if (phase === 'fadeOut' || phase === 'hold') {
        cinematicFreezeRef.current = true;
        cinematicFreezeStartRef.current = timeRef.current; // track when freeze started
      } else if (phase === 'fadeIn') {
        cinematicFreezeRef.current = false;
      }
    });
    return unsub;
  }, []);

  // ── Listen for camera:recenter to snap camera behind player ──
  useEffect(() => {
    const unsub = eventBus.on('camera:recenter', () => {
      // Reset camera to be behind the player based on current rotation
      const playerRotation = livePlayerRotationRef.current;
      yawRef.current = playerRotation + Math.PI; // Camera looks at player from behind
      pitchRef.current = 0.3;
      distanceRef.current = DEFAULT_DISTANCE;
      interactionDistanceRef.current = DEFAULT_DISTANCE;
      initializedRef.current = false; // Force re-initialization

      // Immediately teleport spring camera to player position
      if (springRef.current) {
        const playerPos = livePlayerPositionRef.current;
        const cameraYaw = playerRotation + Math.PI;
        const newCamPos = new THREE.Vector3(
          playerPos.x + Math.sin(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
          playerPos.y + LOOK_HEIGHT + Math.sin(0.3) * DEFAULT_DISTANCE,
          playerPos.z + Math.cos(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
        );
        const newLookAt = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);
        springRef.current.position.copy(newCamPos);
        springRef.current.velocity.set(0, 0, 0);
        springRef.current.lookAt.copy(newLookAt);
      }
    });
    return unsub;
  }, [livePlayerRotationRef, livePlayerPositionRef]);

  // ── Intro wake-up camera ──
  useEffect(() => {
    const unsub = eventBus.on('camera:intro_wake', () => {
      introWakeRef.current = true;
      introWakeStartTimeRef.current = timeRef.current;

      // Snap camera to close position
      const playerPos = livePlayerPositionRef.current;
      const playerRotation = livePlayerRotationRef.current;
      const cameraYaw = playerRotation + Math.PI;

      // Close-up position: slightly above and behind at short distance
      const closePitch = 0.15; // looking slightly down
      const closePos = new THREE.Vector3(
        playerPos.x + Math.sin(cameraYaw) * Math.cos(closePitch) * INTRO_WAKE_START_DISTANCE,
        playerPos.y + LOOK_HEIGHT + Math.sin(closePitch) * INTRO_WAKE_START_DISTANCE + 0.3,
        playerPos.z + Math.cos(cameraYaw) * Math.cos(closePitch) * INTRO_WAKE_START_DISTANCE,
      );
      const closeLook = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

      if (springRef.current) {
        springRef.current.position.copy(closePos);
        springRef.current.velocity.set(0, 0, 0);
        springRef.current.lookAt.copy(closeLook);
      }

      // Set orbit refs
      yawRef.current = cameraYaw;
      pitchRef.current = closePitch;
      distanceRef.current = INTRO_WAKE_START_DISTANCE;
      interactionDistanceRef.current = INTRO_WAKE_START_DISTANCE;
    });
    return unsub;
  }, [livePlayerPositionRef, livePlayerRotationRef]);

  // ── Auto-recenter camera when entering exploration mode ──
  // When the game transitions from menu/intro/visual-novel to exploration,
  // the camera may be at a stale position. Force it to snap behind the player.
  // CRITICAL: Use useLayoutEffect + immediate camera position apply to prevent
  // even a single frame where the camera is looking at the wrong position.
  const prevGameModeRef = useRef(gameMode);
  useEffect(() => {
    if (gameMode === 'exploration' && prevGameModeRef.current !== 'exploration') {
      // Mode just changed TO exploration — recenter camera on player IMMEDIATELY
      const playerPos = livePlayerPositionRef.current;
      const playerRotation = livePlayerRotationRef.current;
      const cameraYaw = playerRotation + Math.PI;
      const newCamPos = new THREE.Vector3(
        playerPos.x + Math.sin(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
        playerPos.y + LOOK_HEIGHT + Math.sin(0.3) * DEFAULT_DISTANCE,
        playerPos.z + Math.cos(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
      );
      const newLookAt = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

      // Snap spring camera immediately
      if (springRef.current) {
        springRef.current.position.copy(newCamPos);
        springRef.current.velocity.set(0, 0, 0);
        springRef.current.lookAt.copy(newLookAt);
      }

      // Snap Three.js camera immediately to prevent stale frame
      const cam = cameraRef.current as THREE.PerspectiveCamera;
      if (cam) {
        cam.position.copy(newCamPos);
        cam.lookAt(newLookAt);
        cam.updateProjectionMatrix();
      }

      // Reset orbit parameters
      yawRef.current = cameraYaw;
      pitchRef.current = 0.3;
      distanceRef.current = DEFAULT_DISTANCE;
      interactionDistanceRef.current = DEFAULT_DISTANCE;
      initializedRef.current = false;
    }
    prevGameModeRef.current = gameMode;
  }, [gameMode, livePlayerPositionRef, livePlayerRotationRef]);

  // ── Cutscene: listen for start/end events and store changes ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('camera:cutscene_start', ({ cutsceneId: id, waypoints }) => {
      const controller = buildCutsceneController(waypoints);
      if (controller) {
        cutsceneRef.current = controller;
        startCutscene(controller);
        cutsceneActiveRef.current = true;
      }
    }));

    unsubs.push(eventBus.on('camera:cutscene_end', () => {
      if (cutsceneRef.current) {
        stopCutscene(cutsceneRef.current);
        cutsceneActiveRef.current = false;
      }
    }));

    // Also start cutscene when activeCutsceneId is set in store
    if (activeCutsceneId && cutsceneWaypoints.length > 0) {
      const controller = buildCutsceneController(cutsceneWaypoints);
      if (controller) {
        cutsceneRef.current = controller;
        startCutscene(controller);
        cutsceneActiveRef.current = true;
      }
    }

    return () => unsubs.forEach((u) => u());
  }, [activeCutsceneId, cutsceneWaypoints]);

  // ── Combat: listen for impact/shake events ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('camera:combat_impact', ({ intensity }) => {
      if (combatRef.current) triggerCombatImpact(combatRef.current, intensity);
    }));

    unsubs.push(eventBus.on('camera:combat_shake', ({ intensity }) => {
      if (combatRef.current) triggerCombatShake(combatRef.current, intensity);
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  // ── NPC Cutscene: listen for interaction cutscene events ──
  // The waypoints are defined relative to the NPC's position, so we need to
  // offset them by the NPC's world position when building the controller.
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('camera:npc_cutscene_start', ({ waypoints, npcId }) => {
      // Get the NPC's world position to offset the waypoints
      const npcGroup = npcId ? getNPCGroup(npcId) : undefined;
      const npcPos = npcGroup ? npcGroup.position : new THREE.Vector3(0, 0, 0);

      // Build the cutscene controller with NPC-relative waypoints
      const controller = buildCutsceneController(waypoints, npcPos);
      if (controller) {
        npcCutsceneRef.current = controller;
        startCutscene(controller);
        npcCutsceneActiveRef.current = true;
      }
    }));

    unsubs.push(eventBus.on('camera:npc_cutscene_end', () => {
      if (npcCutsceneRef.current) {
        stopCutscene(npcCutsceneRef.current);
        npcCutsceneActiveRef.current = false;
      }
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  // ── Dialogue: listen for speaker changes ──
  useEffect(() => {
    const unsub = eventBus.on('camera:dialogue_speaker', ({ speaker }) => {
      if (dialogueControllerRef.current) {
        setDialogueSpeaker(dialogueControllerRef.current, speaker);
      }
    });
    return unsub;
  }, []);

  // ── Scene transition: detect scene change and trigger fly-through ──
  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      const _fromScene = prevSceneIdRef.current;
      prevSceneIdRef.current = sceneId;

      // Start a scene transition fly-through
      if (transitionRef.current && springRef.current) {
        const config = getSceneConfig(sceneId);
        const spawn = config.spawnPoint;
        // Camera yaw must be BEHIND the player
        const cameraYaw = (config.initialRotation ?? 0) + Math.PI;
        const targetPos = new THREE.Vector3(
          spawn[0] + Math.sin(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
          spawn[1] + LOOK_HEIGHT + Math.sin(0.3) * DEFAULT_DISTANCE,
          spawn[2] + Math.cos(cameraYaw) * Math.cos(0.3) * DEFAULT_DISTANCE,
        );
        const targetLook = new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

        startSceneTransition(
          transitionRef.current,
          springRef.current.position,
          springRef.current.lookAt,
          targetPos,
          targetLook,
        );
      }
    }
  }, [sceneId]);

    // ── Auto-follow: track when player was last moving for camera auto-rotate ──
  const playerMovingTimerRef = useRef(0); // time since player stopped moving
  const wasDraggingRef = useRef(false);   // was the player orbiting the camera last frame?

  // P3-FIX: Pre-allocated fallback NPC position for dialogue mode.
  // Previously, playerPos.clone().add(...) created a new Vector3 every frame
  // when no NPC group was found. This caused GC pressure during dialogue.
  const _fallbackNpcPos = useRef(new THREE.Vector3());

  // ── Mouse drag for orbit + scroll for zoom + touch support ──
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      // Don't orbit camera during active narrative overlay / cutscene — disorienting for the player
      const currentMode = useGameStore.getState().mode;
      const showStoryOverlay = useGameStore.getState().showStoryOverlay;
      if (showStoryOverlay || currentMode === 'cutscene') return;
      const interactionState = getInteractionState();
      if (interactionState === InteractionState.Dialogue) return;

      // Orbit on right-click (button 2), middle-click (button 1),
      // or left-click (button 0) ONLY when clicking on the 3D canvas (not UI)
      if (e.button === 2 || e.button === 1) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      } else if (e.button === 0) {
        // Left-click: allow orbit when clicking on the 3D canvas.
        // CRITICAL FIX: Removed [tabindex] from the exclusion selector because
        // the canvas container div has tabIndex={0} for keyboard focus.
        // Previously, closest('[tabindex]') matched the container → left-click
        // orbit NEVER worked. Now we check for actual UI elements only.
        // Also: if the target is a <canvas> element, always allow orbit.
        const target = e.target as HTMLElement;
        const isCanvasElement = target.tagName === 'CANVAS';
        const isCanvasArea = isCanvasElement || !target.closest('[data-exploration-ui], [data-panel], dialog, [role="dialog"], button, a, input, textarea');
        if (isCanvasArea) {
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      yawRef.current -= dx * ORBIT_SENSITIVITY;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * ORBIT_SENSITIVITY),
      );
    };

    const onWheel = (e: WheelEvent) => {
      // Only allow zoom during exploration mode without narrative overlay
      const currentMode = useGameStore.getState().mode;
      const showStoryOverlay = useGameStore.getState().showStoryOverlay;
      if (currentMode !== 'exploration' || showStoryOverlay) return;

      // Only block zoom during active Dialogue — allow zoom during Approach/Align/Lock
      // so players can adjust camera while walking toward NPC
      const interactionState = getInteractionState();
      if (interactionState === InteractionState.Dialogue) return;

      e.preventDefault();
      e.stopPropagation();

      // Normalize deltaY across different deltaMode values:
      //   DOM_DELTA_PIXEL (0): deltaY is already in pixels — use as-is
      //   DOM_DELTA_LINE  (1): deltaY is in lines — multiply by ~40px per line
      //   DOM_DELTA_PAGE  (2): deltaY is in pages — multiply by ~800px per page
      let normalizedDelta = e.deltaY;
      if (e.deltaMode === 1) {
        normalizedDelta *= ZOOM_LINE_MULTIPLIER;
      } else if (e.deltaMode === 2) {
        normalizedDelta *= ZOOM_PAGE_MULTIPLIER;
      }

      // Calculate raw distance change
      let rawChange = normalizedDelta * ZOOM_SENSITIVITY;

      // Ensure minimum step per scroll notch for responsive feel.
      // Many mice report very small deltaY (e.g., ±3 pixels), which results
      // in tiny zoom changes (0.006) that feel like "zoom doesn't work".
      // Enforce a minimum absolute step of ZOOM_PIXEL_STEP.
      if (Math.abs(rawChange) < ZOOM_PIXEL_STEP && Math.abs(rawChange) > 0.001) {
        rawChange = rawChange > 0 ? ZOOM_PIXEL_STEP : -ZOOM_PIXEL_STEP;
      }

      const newDist = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, distanceRef.current + rawChange),
      );
      distanceRef.current = newDist;
      // Also immediately update interactionDistanceRef for responsive zoom
      // (otherwise the lerp makes zoom feel sluggish or unresponsive)
      interactionDistanceRef.current = newDist;
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    // Touch support for mobile camera orbit
    const onTouchStart = (e: TouchEvent) => {
      // Don't orbit camera during active narrative overlay / cutscene
      const currentMode = useGameStore.getState().mode;
      const showStoryOverlay = useGameStore.getState().showStoryOverlay;
      if (showStoryOverlay || currentMode === 'cutscene') return;
      const interactionState = getInteractionState();
      if (interactionState === InteractionState.Dialogue) return;

      // Only single-finger touch on canvas area (not UI)
      if (e.touches.length === 1) {
        const target = e.target as HTMLElement;
        // FIX: Removed [tabindex] from exclusion — same bug as mouse handler
        const isCanvasElement = target.tagName === 'CANVAS';
        const isCanvasArea = isCanvasElement || !target.closest('[data-exploration-ui], [data-panel], dialog, [role="dialog"], button, a, input, textarea');
        if (isCanvasArea) {
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      yawRef.current -= dx * ORBIT_SENSITIVITY * 1.5; // slightly more sensitive for touch
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * ORBIT_SENSITIVITY * 1.5),
      );
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && e.shiftKey) {
        e.preventDefault();
        const config = getSceneConfig(useGameStore.getState().exploration.currentSceneId);
        // Camera yaw must be BEHIND the player
        yawRef.current = (config.initialRotation ?? 0) + Math.PI;
        pitchRef.current = 0.3;
        distanceRef.current = DEFAULT_DISTANCE;
        interactionDistanceRef.current = DEFAULT_DISTANCE;
      }
    };

    const canvasEl = gl.domElement;

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    // Register wheel on canvas (primary) with capture phase for reliability,
    // and on window (fallback) also with capture phase.
    // capture:true ensures our handler fires before R3F's event system
    // can call stopPropagation on wheel events.
    if (canvasEl) {
      canvasEl.addEventListener('wheel', onWheel, { passive: false, capture: true });
    }
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      if (canvasEl) {
        canvasEl.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      }
      window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // ── Main camera update loop ──
  useFrame((_, rawDelta) => {
    // P3-FIX: Camera layer enabling moved to useEffect (runs once, not every frame).
    const cam = cameraRef.current as THREE.PerspectiveCamera;

    const spring = springRef.current;
    if (!spring) return;

    const playerPos = livePlayerPositionRef.current;
    if (!playerPos) return;

    // Apply global time scale (slight slow during dialogue)
    const delta = applyTimeScale(Math.min(rawDelta, 0.05));
    timeRef.current += delta;

    // ── Freeze camera during cinematic transition fade-out/hold ──
    // Safety: unfreeze after timeout to prevent permanent freeze if fadeIn event is missed
    if (cinematicFreezeRef.current) {
      const frozenDuration = timeRef.current - cinematicFreezeStartRef.current;
      if (frozenDuration > CINEMATIC_FREEZE_TIMEOUT) {
        cinematicFreezeRef.current = false;
      } else {
        // Keep camera at current position, only update time for smooth resume
        return;
      }
    }

    // Compute player velocity for exploration enhancements
    _playerVelocity.current.copy(playerPos).sub(_prevPlayerPos.current);
    _prevPlayerPos.current.copy(playerPos);

    // ── Intro wake-up camera pull-back ──
    if (introWakeRef.current) {
      const elapsed = timeRef.current - introWakeStartTimeRef.current;
      const progress = Math.min(1, elapsed / INTRO_WAKE_DURATION);
      // Ease-out curve for natural deceleration
      const ease = 1 - Math.pow(1 - progress, 3);

      // Interpolate distance from close to normal
      const currentDist = INTRO_WAKE_START_DISTANCE + (INTRO_WAKE_END_DISTANCE - INTRO_WAKE_START_DISTANCE) * ease;
      distanceRef.current = currentDist;
      interactionDistanceRef.current = currentDist;

      // Also slowly raise pitch
      pitchRef.current = 0.15 + (0.3 - 0.15) * ease;

      if (progress >= 1) {
        introWakeRef.current = false;
        initializedRef.current = false; // Let normal exploration take over
      }
    }

    // ── Determine camera mode ──
    const interactionState = getInteractionState();
    const isInDialogue = interactionState === InteractionState.Dialogue ||
                         interactionState === InteractionState.Lock ||
                         interactionState === InteractionState.Align;
    const isCutscene = gameMode === 'cutscene' && cutsceneActiveRef.current;
    const isNPCutscene = npcCutsceneActiveRef.current;
    const isCombat = sceneId === 'battle' && gameMode === 'exploration';

    // ══════════════════════════════════════════
    // NPC INTERACTION DISTANCE LERP
    // Smoothly adjust camera distance based on interaction state
    // Use faster lerp speed when returning from dialogue for snappier feel
    // ══════════════════════════════════════════
    const interactionLocked = isInteractionLocked();
    const targetInteractionDist = interactionLocked ? NPC_INTERACTION_DISTANCE : distanceRef.current;
    const distLerpSpeed = wasInDialogueRef.current && !interactionLocked
      ? DIALOGUE_EXIT_LERP_SPEED  // faster return after dialogue ends
      : DISTANCE_LERP_SPEED;
    interactionDistanceRef.current = THREE.MathUtils.lerp(
      interactionDistanceRef.current,
      targetInteractionDist,
      1 - Math.exp(-distLerpSpeed * delta),
    );

    // ══════════════════════════════════════════
    // SCENE-SPECIFIC FOV
    // Smoothly transition between indoor (55°) and outdoor (70°)
    // ══════════════════════════════════════════
    const targetSceneFov = getSceneSpecificFov(sceneId);
    currentSceneFovRef.current = THREE.MathUtils.lerp(
      currentSceneFovRef.current,
      targetSceneFov,
      1 - Math.exp(-FOV_TRANSITION_SPEED * delta),
    );

    let targetPos: THREE.Vector3;
    let targetLook: THREE.Vector3;
    let targetFov: number;
    let targetRoll: number = 0;

    // ══════════════════════════════════════════
    // MODE 1: SCENE TRANSITION (highest priority)
    // ══════════════════════════════════════════
    if (transitionRef.current?.active) {
      const transitionResult = updateSceneTransition(transitionRef.current, delta);
      if (transitionResult) {
        targetPos = transitionResult.position;
        targetLook = transitionResult.lookAt;
        targetFov = DEFAULT_FOV;
        // Skip spring for transitions — use direct position for smoother arc
        spring.position.copy(targetPos);
        spring.lookAt.copy(targetLook);
        spring.fov = targetFov;

        if (cam) {
          cam.position.copy(targetPos);
          cam.lookAt(targetLook);
          cam.fov = targetFov;
          cam.updateProjectionMatrix();
        }
        return;
      }
    }

    // ══════════════════════════════════════════
    // MODE 2: NPC CUTSCENE (interaction intro, high priority)
    // ══════════════════════════════════════════
    if (isNPCutscene && npcCutsceneRef.current) {
      const cutsceneResult = updateCutsceneController(npcCutsceneRef.current, delta);
      if (cutsceneResult) {
        targetPos = cutsceneResult.position;
        targetLook = cutsceneResult.lookAt;
        targetFov = cutsceneResult.fov;
        targetRoll = 0;
      } else {
        // NPC cutscene just ended — fall through to next mode
        npcCutsceneActiveRef.current = false;
        // Reset to exploration defaults
        targetFov = currentSceneFovRef.current;
        const offset = _offset.current;
        offset.set(
          Math.sin(yawRef.current) * Math.cos(pitchRef.current),
          Math.sin(pitchRef.current),
          Math.cos(yawRef.current) * Math.cos(pitchRef.current),
        ).multiplyScalar(interactionDistanceRef.current);

        targetPos = _desiredPos.current.set(
          playerPos.x + offset.x,
          playerPos.y + LOOK_HEIGHT + offset.y,
          playerPos.z + offset.z,
        );
        targetLook = _lookTarget.current.set(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);
      }
    }
    // ══════════════════════════════════════════
    // MODE 3: STORY CUTSCENE (waypoint bezier)
    // ══════════════════════════════════════════
    else if (isCutscene && cutsceneRef.current) {
      const cutsceneResult = updateCutsceneController(cutsceneRef.current, delta);
      if (cutsceneResult) {
        targetPos = cutsceneResult.position;
        targetLook = cutsceneResult.lookAt;
        targetFov = cutsceneResult.fov;
        targetRoll = 0;
      } else {
        // Cutscene just ended — fall through to exploration
        cutsceneActiveRef.current = false;
        // Reset to exploration defaults
        targetFov = currentSceneFovRef.current;
        const offset = _offset.current;
        offset.set(
          Math.sin(yawRef.current) * Math.cos(pitchRef.current),
          Math.sin(pitchRef.current),
          Math.cos(yawRef.current) * Math.cos(pitchRef.current),
        ).multiplyScalar(interactionDistanceRef.current);

        targetPos = _desiredPos.current.set(
          playerPos.x + offset.x,
          playerPos.y + LOOK_HEIGHT + offset.y,
          playerPos.z + offset.z,
        );
        targetLook = _lookTarget.current.set(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);
      }
    }
    // ══════════════════════════════════════════
    // MODE 3: DIALOGUE (speaker-aware shots)
    // ══════════════════════════════════════════
    else if (isInDialogue) {
      const npcId = getInteractionTargetNPCId();
      const npcGroup = npcId ? getNPCGroup(npcId) : undefined;
      // P3-FIX: Use pre-allocated temp vector instead of clone() + add().
      // playerPos.clone() creates a new Vector3 every frame (GC pressure).
      const npcPos = npcGroup ? npcGroup.position : _fallbackNpcPos.current.copy(playerPos).add(_tempVec.current.set(0, 0, 2));

      const controller = dialogueControllerRef.current;
      if (!controller) return;

      // Determine speaker based on current state
      // During Align/Lock, use overShoulder; during Dialogue, use speaker-aware
      let speaker: DialogueSpeaker = 'unknown';
      if (interactionState === InteractionState.Dialogue) {
        // If we have the current dialogue node, determine speaker from it
        // For now, alternate: use the controller's current speaker tracking
        speaker = controller.currentSpeaker;
      }

      // Update shot controller with speaker awareness
      const currentShot = updateDialogueShotController(
        controller,
        delta,
        speaker !== 'unknown' ? speaker : undefined,
        currentNodeId,
      );

      // Compute cinematic shot position
      const shot = getDialogueShot(
        currentShot,
        playerPos,
        npcPos,
        npcGroup?.rotation.y,
      );

      targetPos = shot.position;
      targetLook = shot.lookAt;
      targetFov = shot.fov;
      targetRoll = 0;

      // Apply collision avoidance for dialogue camera
      const lookAtTarget = _lookTarget.current.copy(targetLook);
      const resolvedPos = resolveCameraCollision(
        raycaster.current,
        threeScene.children,
        lookAtTarget,
        targetPos,
        WALL_MARGIN,
        MIN_DISTANCE,
      );
      targetPos = resolvedPos;
    }
    // ══════════════════════════════════════════
    // MODE 4: COMBAT (wide FOV, impact zoom, shake)
    // ══════════════════════════════════════════
    else if (isCombat) {
      const combat = combatRef.current;
      if (!combat) return;

      // Compute exploration-style position but with wider FOV
      const offset = _offset.current;
      offset.set(
        Math.sin(yawRef.current) * Math.cos(pitchRef.current),
        Math.sin(pitchRef.current),
        Math.cos(yawRef.current) * Math.cos(pitchRef.current),
      ).multiplyScalar(interactionDistanceRef.current * 1.15); // slightly further back in combat

      targetPos = _desiredPos.current.set(
        playerPos.x + offset.x,
        playerPos.y + LOOK_HEIGHT + offset.y,
        playerPos.z + offset.z,
      );

      targetLook = _lookTarget.current.set(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

      // Wall collision
      targetPos = resolveCameraCollision(
        raycaster.current,
        threeScene.children,
        targetLook,
        targetPos,
        WALL_MARGIN,
        MIN_DISTANCE,
      );

      // Update combat camera (zoom recovery, screen shake)
      const combatResult = updateCombatCamera(combat, delta, spring.position);
      targetFov = combatResult.effectiveFov;

      // Apply shake offset to target position
      targetPos = targetPos.add(combatResult.shakeOffset);

      // Turn tilt still applies in combat (subtle)
      const exploration = explorationRef.current;
      if (exploration) {
        const expResult = updateExplorationState(
          exploration,
          playerPos,
          yawRef.current,
          _playerVelocity.current,
          delta,
        );
        targetRoll = expResult.targetRoll * 0.5; // reduced tilt in combat
      }
    }
    // ══════════════════════════════════════════
    // MODE 5: EXPLORATION (spring + enhancements)
    // ══════════════════════════════════════════
    else {
      // Use distanceRef directly for responsive zoom when not in interaction lock.
      // When interaction is locked, use the lerped distance for smooth NPC zoom-in transition.
      const effectiveDistance = interactionLocked ? interactionDistanceRef.current : distanceRef.current;

      // Compute desired position using spherical coords
      const offset = _offset.current;
      offset.set(
        Math.sin(yawRef.current) * Math.cos(pitchRef.current),
        Math.sin(pitchRef.current),
        Math.cos(yawRef.current) * Math.cos(pitchRef.current),
      );
      offset.multiplyScalar(effectiveDistance);

      const exploration = explorationRef.current;
      let heightOffset = 0;

      // Update exploration enhancements (turn tilt, height smoothing, breathing)
      if (exploration) {
        const expResult = updateExplorationState(
          exploration,
          playerPos,
          yawRef.current,
          _playerVelocity.current,
          delta,
        );
        targetRoll = expResult.targetRoll;
        // Smooth height adjustment for stairs/slopes
        heightOffset = expResult.targetHeight - playerPos.y;
      }

      // ── Look-ahead: shift camera in movement direction ──
      const velocity = _playerVelocity.current;
      // Smooth the velocity to avoid jitter
      prevVelocitySmoothRef.current.lerp(velocity, 1 - Math.exp(-LOOK_AHEAD_LERP_SPEED * delta));
      const speed = prevVelocitySmoothRef.current.length();
      const lookAheadAmount = Math.min(speed * LOOK_AHEAD_STRENGTH, 0.3); // cap at 0.3m
      const lookAheadDir = speed > 0.01
        ? prevVelocitySmoothRef.current.clone().normalize()
        : _tempVec2.current.set(0, 0, 0);
      lookAheadOffsetRef.current.copy(lookAheadDir).multiplyScalar(lookAheadAmount);

      targetPos = _desiredPos.current.set(
        playerPos.x + offset.x,
        playerPos.y + LOOK_HEIGHT + offset.y + heightOffset,
        playerPos.z + offset.z,
      );

      // Look target: player position + look-ahead offset
      targetLook = _lookTarget.current.set(
        playerPos.x + lookAheadOffsetRef.current.x,
        playerPos.y + LOOK_HEIGHT + heightOffset + lookAheadOffsetRef.current.y * 0.3, // reduced Y look-ahead
        playerPos.z + lookAheadOffsetRef.current.z,
      );

      // ── Breathing camera bob (subtle, continuous) ──
      // Apply a very subtle vertical bob synced to a 2s breathing cycle
      const breathBob = Math.sin(timeRef.current * BREATHING_BOB_SPEED) * BREATHING_BOB_AMPLITUDE;
      // Only apply when not interacting (don't interfere with interaction zoom)
      if (!interactionLocked) {
        targetPos.y += breathBob;
      }

      // Wall collision avoidance
      targetPos = resolveCameraCollision(
        raycaster.current,
        threeScene.children,
        targetLook,
        targetPos,
        WALL_MARGIN,
        MIN_DISTANCE,
      );

      // ── Scene-specific FOV (indoor vs outdoor) ──
      targetFov = currentSceneFovRef.current;
    }

    // ── Handle dialogue start/end transitions ──
    if (isInDialogue && !wasInDialogueRef.current) {
      if (dialogueControllerRef.current) {
        resetDialogueShotController(dialogueControllerRef.current);
      }
      setGlobalTimeScale(0.92);
    }
    if (!isInDialogue && wasInDialogueRef.current) {
      setGlobalTimeScale(1.0);
    }
    wasInDialogueRef.current = isInDialogue;

    // ── Apply breathing idle animation (only during exploration, not combat/cutscene) ──
    if (!isInDialogue && !isCutscene && !isCombat) {
      const exploration = explorationRef.current;
      if (exploration && exploration.breathingIntensity > 0.001) {
        targetPos = applyEnhancedBreathingIdle(
          targetPos,
          timeRef.current,
          exploration.breathingIntensity,
        );
      }
    }

    // ── Update spring camera ──
    updateSpringCamera(spring, targetPos, targetLook, targetFov, delta, targetRoll);

    // ── Apply to Three.js camera via ref (standard R3F pattern) ──
    // cam is already declared at top of useFrame for layer enabling
    if (!cam) return;

    // ── Apply camera shake offset ──
    const shakeOffset = getCameraShakeOffset(delta);
    cam.position.set(
      spring.position.x + shakeOffset.x,
      spring.position.y + shakeOffset.y,
      spring.position.z,
    );

    // ═══════════════════════════════════════════════════
    // AUTO-FOLLOW: smoothly rotate camera behind player when moving
    // This makes WASD movement intuitive — camera tracks behind
    // the player's movement direction automatically.
    // ═══════════════════════════════════════════════════
    if (!isInDialogue && !isCutscene && !isDraggingRef.current) {
      const playerSpeed = _playerVelocity.current.length();
      const playerRotation = livePlayerRotationRef.current;

      // The camera should be behind the player — opposite of player facing direction
      // Player faces playerRotation, so camera yaw should be playerRotation + PI
      // (camera looks at player from behind)
      const targetYaw = playerRotation + Math.PI;

      // Normalize angle difference to [-PI, PI]
      let yawDiff = targetYaw - yawRef.current;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;

      if (playerSpeed > AUTO_FOLLOW_IDLE_THRESHOLD) {
        // Player is moving — smoothly rotate camera behind player
        if (Math.abs(yawDiff) > AUTO_FOLLOW_MIN_YAW_DELTA) {
          // Scale follow speed by how different the yaw is (faster for bigger differences)
          const followStrength = Math.min(1, Math.abs(yawDiff) / Math.PI);
          yawRef.current += yawDiff * (1 - Math.exp(-AUTO_FOLLOW_SPEED * followStrength * delta));
        }
        playerMovingTimerRef.current = 0;
      } else if (!isDraggingRef.current && !wasDraggingRef.current) {
        // Player is idle — slowly return camera to behind player (gentle auto-center)
        playerMovingTimerRef.current += delta;
        // After 2 seconds of idle, gently center the camera behind player
        if (playerMovingTimerRef.current > 2.0 && Math.abs(yawDiff) > 0.3) {
          yawRef.current += yawDiff * (1 - Math.exp(-AUTO_FOLLOW_RETURN_SPEED * delta));
        }
      }
    }
    wasDraggingRef.current = isDraggingRef.current;

    // ── Apply POI yaw influence (only when player is NOT moving and NOT dragging) ──
    // POI is now much weaker — only activates when player is standing still
    const playerSpeedForPOI = _playerVelocity.current.length();
    const poi = getCameraPOI(delta);
    if (poi && !isInDialogue && !isCutscene && !isDraggingRef.current && playerSpeedForPOI < 0.1) {
      const dirToPOI = Math.atan2(
        poi.x - playerPos.x,
        poi.z - playerPos.z,
      );
      // Lerp yaw toward POI (reduced speed — 1.0 instead of 3.0)
      let yawDiff = dirToPOI - yawRef.current;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      yawRef.current += yawDiff * (1 - Math.exp(-1.0 * delta));
    }

    cam.lookAt(spring.lookAt);
    cam.fov = spring.fov;

    // Apply roll (tilt) via rotating the up vector
    if (Math.abs(spring.roll) > 0.0001) {
      const up = new THREE.Vector3(0, 1, 0);
      const forward = new THREE.Vector3().subVectors(spring.lookAt, cam.position).normalize();
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();
      const rolledUp = new THREE.Vector3()
        .copy(up)
        .applyAxisAngle(right, spring.roll);
      cam.up.copy(rolledUp);
    } else {
      cam.up.set(0, 1, 0);
    }

    cam.updateProjectionMatrix();

    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  });

  return null;
}

/** Convert serializable CameraWaypointData to CameraWaypoint for the cutscene controller.
 *  Optionally offset all positions by a base position (e.g., NPC position for NPC cutscenes). */
function buildCutsceneController(
  waypoints: CameraWaypointData[],
  offset?: THREE.Vector3,
): CutsceneController | null {
  if (waypoints.length === 0) return null;

  const cameraWaypoints: CameraWaypoint[] = waypoints.map((wp) => ({
    position: offset
      ? new THREE.Vector3(...wp.position).add(offset)
      : new THREE.Vector3(...wp.position),
    lookAt: offset
      ? new THREE.Vector3(...wp.lookAt).add(offset)
      : new THREE.Vector3(...wp.lookAt),
    fov: wp.fov,
    duration: wp.duration,
    controlPoint: wp.controlPoint
      ? offset
        ? new THREE.Vector3(...wp.controlPoint).add(offset)
        : new THREE.Vector3(...wp.controlPoint)
      : undefined,
  }));

  return createCutsceneController(cameraWaypoints);
}
