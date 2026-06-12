
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
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useCameraFollowState } from '@/store/selectors';
import { getSceneConfig } from '@/config/scenes';
import {
  createSpringCameraState,
  createDialogueShotController,
  setDialogueSpeaker,
  applyTimeScale,
  createExplorationCameraState,
  createCutsceneController,
  startCutscene,
  stopCutscene,
  createCombatCameraState,
  triggerCombatImpact,
  triggerCombatShake,
  createSceneTransitionState,
  startSceneTransition,
  type SpringCameraState,
  type DialogueShotController,
  type ExplorationCameraState,
  type CutsceneController,
  type CombatCameraState,
  type SceneTransitionState,
  type CameraWaypoint,
} from '@/engine/camera/cinematicCamera';
import {
  DEFAULT_DISTANCE,
  LOOK_HEIGHT,
  CINEMATIC_FREEZE_TIMEOUT,
  INTRO_WAKE_DURATION,
  INTRO_WAKE_START_DISTANCE,
  INTRO_WAKE_END_DISTANCE,
  NPC_INTERACTION_DISTANCE,
  DISTANCE_LERP_SPEED,
  DIALOGUE_EXIT_LERP_SPEED,
  FOV_TRANSITION_SPEED,
  getSceneDefaultDistance,
  getSceneSpecificFov,
  ZOOM_SPRING_SNAP,
  FIRST_PERSON_ENABLED,
  FIRST_PERSON_FOV,
  FIRST_PERSON_EYE_HEIGHT,
} from '@/engine/camera/cameraConstants';
import {
  resetCinematicPresentation,
  setCinematicHoldActive,
  setCinematicPresentationMode,
  shouldUseFirstPersonExploration,
} from '@/engine/camera/cinematicPresentation';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { resolveCameraMode } from '@/engine/camera/strategies';
import { useCameraOrbitInput } from '@/engine/camera/useCameraOrbitInput';
import { applyPendingGamepadOrbit } from '@/engine/input/gamepadCamera';
import { configureCameraCollisionRaycaster } from '@/engine/camera/cameraCollisionLayers';
import { applyCameraFrame, isInDialogueInteraction } from '@/engine/camera/applyCameraFrame';
import type { CameraModeContext } from '@/engine/camera/types';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { eventBus } from '@/engine/EventBus';
import type { CameraWaypointData } from '@/engine/events';
import type { SceneId } from '@/shared/types/game';

interface FollowCameraProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
}

/** Snap pose when entering exploration or after scene transition (FP vs third-person). */
function computeExplorationCameraSnap(
  playerPos: THREE.Vector3,
  playerYaw: number,
  sceneId: SceneId,
  pitchOverride?: number,
  forceThirdPerson = false,
): {
  cameraYaw: number;
  pitch: number;
  distance: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
} {
  if (FIRST_PERSON_ENABLED && !forceThirdPerson) {
    const pitch = pitchOverride ?? 0;
    const eyeY = playerPos.y + FIRST_PERSON_EYE_HEIGHT;
    const position = new THREE.Vector3(playerPos.x, eyeY, playerPos.z);
    const lookAt = position.clone().add(
      new THREE.Vector3(
        Math.sin(playerYaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(playerYaw) * Math.cos(pitch),
      ).multiplyScalar(3),
    );
    return {
      cameraYaw: playerYaw,
      pitch,
      distance: 0,
      position,
      lookAt,
      fov: FIRST_PERSON_FOV,
    };
  }

  const pitch = pitchOverride ?? 0.3;
  const cameraYaw = playerYaw + Math.PI;
  const distance = getSceneDefaultDistance(sceneId);
  const position = new THREE.Vector3(
    playerPos.x + Math.sin(cameraYaw) * Math.cos(pitch) * distance,
    playerPos.y + LOOK_HEIGHT + Math.sin(pitch) * distance,
    playerPos.z + Math.cos(cameraYaw) * Math.cos(pitch) * distance,
  );
  const lookAt = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);
  return {
    cameraYaw,
    pitch,
    distance,
    position,
    lookAt,
    fov: getSceneSpecificFov(sceneId),
  };
}

/** AAA cinematic follow camera with five camera modes */
export function FollowCamera({
  livePlayerPositionRef,
  livePlayerRotationRef,
}: FollowCameraProps) {
  const camera = useThree((s) => s.camera);
  const threeScene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const { sceneId, gameMode, activeCutsceneId, cutsceneWaypoints, currentNodeId } = useCameraFollowState();

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
  const zoomSnapRef = useRef(0);
  const firstPersonRef = useRef(FIRST_PERSON_ENABLED);
  firstPersonRef.current = FIRST_PERSON_ENABLED;
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
  const cinematicFreezeStartRef = useRef(0);

  // ── Intro wake-up camera ──
  const introWakeRef = useRef(false);
  const introWakeStartTimeRef = useRef(0);

  // ── Pre-allocated temp vectors ──
  const _desiredPos = useRef(new THREE.Vector3());
  const _lookTarget = useRef(new THREE.Vector3());
  const _offset = useRef(new THREE.Vector3());
  const _prevPlayerPos = useRef(new THREE.Vector3());
  const _tempVec = useRef(new THREE.Vector3());
  const _tempVec2 = useRef(new THREE.Vector3());
  const _playerVelocity = useRef(new THREE.Vector3());

  // ── Raycaster for wall collision (layer 5 — see cameraCollisionLayers.ts) ──
  const raycaster = useRef(new THREE.Raycaster());
  useEffect(() => {
    configureCameraCollisionRaycaster(raycaster.current);
  }, []);

  // ── Initialize all camera subsystems ──
  useEffect(() => {
    const config = getSceneConfig(sceneId);
    const spawn = config.spawnPoint;
    const playerYaw = config.initialRotation ?? 0;
    const initPitch = FIRST_PERSON_ENABLED ? 0 : 0.3;
    const initYaw = FIRST_PERSON_ENABLED ? playerYaw : (config.initialRotation ?? 0) + Math.PI;
    const initDist = FIRST_PERSON_ENABLED ? 0 : DEFAULT_DISTANCE;
    const initPos = FIRST_PERSON_ENABLED
      ? new THREE.Vector3(spawn[0], spawn[1] + FIRST_PERSON_EYE_HEIGHT, spawn[2])
      : new THREE.Vector3(
          spawn[0] + Math.sin(initYaw) * Math.cos(initPitch) * initDist,
          spawn[1] + LOOK_HEIGHT + Math.sin(initPitch) * initDist,
          spawn[2] + Math.cos(initYaw) * Math.cos(initPitch) * initDist,
        );
    const initLook = FIRST_PERSON_ENABLED
      ? initPos.clone().add(new THREE.Vector3(Math.sin(initYaw), Math.sin(initPitch), Math.cos(initYaw)))
      : new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

    yawRef.current = initYaw;
    pitchRef.current = initPitch;
    distanceRef.current = initDist;
    interactionDistanceRef.current = initDist;
    livePlayerRotationRef.current = playerYaw;
    sharedCameraYawRef.current = initYaw;

    springRef.current = createSpringCameraState(initPos, initLook);
    dialogueControllerRef.current = createDialogueShotController();
    explorationRef.current = createExplorationCameraState();
    combatRef.current = createCombatCameraState();
    transitionRef.current = createSceneTransitionState();
    _prevPlayerPos.current.set(spawn[0], spawn[1], spawn[2]);

    currentSceneFovRef.current = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);

    // CRITICAL: Immediately apply the spring camera to the actual Three.js camera
    const cam = cameraRef.current as THREE.PerspectiveCamera;
    if (cam) {
      cam.position.copy(initPos);
      cam.lookAt(initLook);
      cam.fov = currentSceneFovRef.current;
      cam.updateProjectionMatrix();
    }
    // Mount-only init; scene transitions handled by useLayoutEffect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sceneId intentionally omitted
  }, []);

  // ── Reset camera on scene change ──
  // Teleport spring camera to new spawn point immediately to avoid "sliding"
  // from old position. Also reset all orbit parameters.
  // Use useLayoutEffect so the camera teleports synchronously before the next paint,
  // preventing a frame where the camera is at the old position.
  useLayoutEffect(() => {
    const config = getSceneConfig(sceneId);
    const spawn = config.spawnPoint;
    const playerYaw = config.initialRotation ?? 0;
    const cameraYaw = FIRST_PERSON_ENABLED ? playerYaw : playerYaw + Math.PI;
    const initPitch = FIRST_PERSON_ENABLED ? 0 : 0.3;
    yawRef.current = cameraYaw;
    pitchRef.current = initPitch;
    const sceneDist = FIRST_PERSON_ENABLED ? 0 : getSceneDefaultDistance(sceneId);
    distanceRef.current = sceneDist;
    interactionDistanceRef.current = sceneDist;
    livePlayerRotationRef.current = playerYaw;
    sharedCameraYawRef.current = cameraYaw;
    initializedRef.current = false;

    if (springRef.current) {
      const newCamPos = FIRST_PERSON_ENABLED
        ? new THREE.Vector3(spawn[0], spawn[1] + FIRST_PERSON_EYE_HEIGHT, spawn[2])
        : new THREE.Vector3(
            spawn[0] + Math.sin(cameraYaw) * Math.cos(initPitch) * sceneDist,
            spawn[1] + LOOK_HEIGHT + Math.sin(initPitch) * sceneDist,
            spawn[2] + Math.cos(cameraYaw) * Math.cos(initPitch) * sceneDist,
          );
      const newLookAt = FIRST_PERSON_ENABLED
        ? newCamPos.clone().add(new THREE.Vector3(Math.sin(cameraYaw), Math.sin(initPitch), Math.cos(cameraYaw)))
        : new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

      springRef.current.position.copy(newCamPos);
      springRef.current.velocity.set(0, 0, 0);
      springRef.current.lookAt.copy(newLookAt);
      springRef.current.fov = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);
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
    currentSceneFovRef.current = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);
  }, [sceneId]);

  // ── Listen for cinematic transition phases to freeze camera during fade ──
  useEffect(() => {
    const unsub = eventBus.on('camera:cinematic_transition', ({ phase }) => {
      if (phase === 'fadeOut' || phase === 'hold') {
        cinematicFreezeRef.current = true;
        cinematicFreezeStartRef.current = timeRef.current;
        setCinematicHoldActive(true);
        setCinematicPresentationMode('third_person');

        const playerPos = livePlayerPositionRef.current;
        const playerRotation = livePlayerRotationRef.current;
        const snap = computeExplorationCameraSnap(playerPos, playerRotation, sceneId, 0.25, true);

        yawRef.current = snap.cameraYaw;
        pitchRef.current = snap.pitch;
        distanceRef.current = snap.distance;
        interactionDistanceRef.current = snap.distance;
        sharedCameraYawRef.current = snap.cameraYaw;
        currentSceneFovRef.current = snap.fov;

        if (springRef.current) {
          springRef.current.position.copy(snap.position);
          springRef.current.velocity.set(0, 0, 0);
          springRef.current.lookAt.copy(snap.lookAt);
          springRef.current.fov = snap.fov;
        }
      } else if (phase === 'fadeIn') {
        cinematicFreezeRef.current = false;
        setCinematicHoldActive(false);
        setCinematicPresentationMode('first_person');
        eventBus.emit('camera:recenter', {});
      }
    });
    return unsub;
  }, [livePlayerPositionRef, livePlayerRotationRef, sceneId]);

  // ── Listen for camera:recenter to snap camera behind player ──
  useEffect(() => {
    const unsub = eventBus.on('camera:recenter', () => {
      const playerPos = livePlayerPositionRef.current;
      const playerRotation = livePlayerRotationRef.current;
      const snap = computeExplorationCameraSnap(playerPos, playerRotation, sceneId);

      yawRef.current = snap.cameraYaw;
      pitchRef.current = snap.pitch;
      distanceRef.current = snap.distance;
      interactionDistanceRef.current = snap.distance;
      sharedCameraYawRef.current = snap.cameraYaw;
      currentSceneFovRef.current = snap.fov;
      initializedRef.current = false;

      if (springRef.current) {
        springRef.current.position.copy(snap.position);
        springRef.current.velocity.set(0, 0, 0);
        springRef.current.lookAt.copy(snap.lookAt);
        springRef.current.fov = snap.fov;
      }
    });
    return unsub;
  }, [livePlayerRotationRef, livePlayerPositionRef, sceneId]);

  // ── Intro wake-up camera ──
  useEffect(() => {
    const unsub = eventBus.on('camera:intro_wake', () => {
      if (FIRST_PERSON_ENABLED) return;

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
      const playerPos = livePlayerPositionRef.current;
      const playerRotation = livePlayerRotationRef.current;
      const snap = computeExplorationCameraSnap(playerPos, playerRotation, sceneId);

      if (springRef.current) {
        springRef.current.position.copy(snap.position);
        springRef.current.velocity.set(0, 0, 0);
        springRef.current.lookAt.copy(snap.lookAt);
        springRef.current.fov = snap.fov;
      }

      const cam = cameraRef.current as THREE.PerspectiveCamera;
      if (cam) {
        cam.position.copy(snap.position);
        cam.lookAt(snap.lookAt);
        cam.fov = snap.fov;
        cam.updateProjectionMatrix();
      }

      yawRef.current = snap.cameraYaw;
      pitchRef.current = snap.pitch;
      distanceRef.current = snap.distance;
      interactionDistanceRef.current = snap.distance;
      sharedCameraYawRef.current = snap.cameraYaw;
      currentSceneFovRef.current = snap.fov;
      initializedRef.current = false;
    }
    prevGameModeRef.current = gameMode;
  }, [gameMode, livePlayerPositionRef, livePlayerRotationRef]);

  // ── Cutscene: listen for start/end events and store changes ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('camera:cutscene_start', ({ waypoints }) => {
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
        const sceneDist = getSceneDefaultDistance(sceneId);
        const targetPos = new THREE.Vector3(
          spawn[0] + Math.sin(cameraYaw) * Math.cos(0.3) * sceneDist,
          spawn[1] + LOOK_HEIGHT + Math.sin(0.3) * sceneDist,
          spawn[2] + Math.cos(cameraYaw) * Math.cos(0.3) * sceneDist,
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

  const wasDraggingRef = useRef(false);

  // P3-FIX: Pre-allocated fallback NPC position for dialogue mode.
  // Previously, playerPos.clone().add(...) created a new Vector3 every frame
  // when no NPC group was found. This caused GC pressure during dialogue.
  const _fallbackNpcPos = useRef(new THREE.Vector3());

  useCameraOrbitInput(gl, {
    yawRef,
    pitchRef,
    distanceRef,
    interactionDistanceRef,
    isDraggingRef,
    lastMouseRef,
    zoomSnapRef,
    firstPersonRef,
    fovRef: currentSceneFovRef,
  });

  // ── Post-mode frame state (auto-follow timer, drag tracking) ──
  const postFrameStateRef = useRef({
    isInDialogue: false,
    isCutscene: false,
    isCombat: false,
    isDragging: false,
    wasDragging: false,
    playerMovingTimer: 0,
  });

  // ── Main camera update loop (thin orchestrator) ──
  useFrameTick('camera', ({ delta: rawDelta }) => {
    const cam = cameraRef.current as THREE.PerspectiveCamera;
    const spring = springRef.current;
    if (!spring || !cam) return;

    const playerPos = livePlayerPositionRef.current;
    if (!playerPos) return;

    // During the opening wake-up cutscene, WakeUpSequence fully owns the camera.
    // Yield so the two systems don't fight over camera.position each frame.
    if (gameMode === 'cutscene' && activeCutsceneId === 'intro_wakeup') return;

    const delta = applyTimeScale(Math.min(rawDelta, 0.05));
    timeRef.current += delta;

    applyPendingGamepadOrbit(yawRef, pitchRef, distanceRef, interactionDistanceRef, delta);

    sharedCameraYawRef.current = yawRef.current;
    const useFirstPerson =
      shouldUseFirstPersonExploration(gameMode, activeCutsceneId) && !isInteractionLocked();
    if (FIRST_PERSON_ENABLED && useFirstPerson) {
      livePlayerRotationRef.current = yawRef.current;
    }

    if (cinematicFreezeRef.current) {
      const frozenDuration = timeRef.current - cinematicFreezeStartRef.current;
      if (frozenDuration > CINEMATIC_FREEZE_TIMEOUT) {
        cinematicFreezeRef.current = false;
        resetCinematicPresentation();
        eventBus.emit('camera:recenter', {});
      } else {
        return;
      }
    }

    _playerVelocity.current.copy(playerPos).sub(_prevPlayerPos.current);
    _prevPlayerPos.current.copy(playerPos);

    if (introWakeRef.current && !FIRST_PERSON_ENABLED) {
      const elapsed = timeRef.current - introWakeStartTimeRef.current;
      const progress = Math.min(1, elapsed / INTRO_WAKE_DURATION);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentDist = INTRO_WAKE_START_DISTANCE + (INTRO_WAKE_END_DISTANCE - INTRO_WAKE_START_DISTANCE) * ease;
      distanceRef.current = currentDist;
      interactionDistanceRef.current = currentDist;
      pitchRef.current = 0.15 + (0.3 - 0.15) * ease;
      if (progress >= 1) {
        introWakeRef.current = false;
        initializedRef.current = false;
      }
    }

    const isInDialogue = isInDialogueInteraction();
    const isCutscene = gameMode === 'cutscene' && cutsceneActiveRef.current;
    const isCombat = sceneId === 'battle' && gameMode === 'exploration';
    const interactionLocked = isInteractionLocked();

    const targetInteractionDist = interactionLocked ? NPC_INTERACTION_DISTANCE : distanceRef.current;
    const distLerpSpeed = wasInDialogueRef.current && !interactionLocked
      ? DIALOGUE_EXIT_LERP_SPEED
      : DISTANCE_LERP_SPEED;
    interactionDistanceRef.current = THREE.MathUtils.lerp(
      interactionDistanceRef.current,
      targetInteractionDist,
      1 - Math.exp(-distLerpSpeed * delta),
    );

    // In first-person mode the wheel adjusts currentSceneFovRef directly — do not
    // pull it back to FIRST_PERSON_FOV every frame (that blocked mouse-wheel zoom).
    if (!useFirstPerson) {
      const targetSceneFov = getSceneSpecificFov(sceneId);
      currentSceneFovRef.current = THREE.MathUtils.lerp(
        currentSceneFovRef.current,
        targetSceneFov,
        1 - Math.exp(-FOV_TRANSITION_SPEED * delta),
      );
    }

    const ctx: CameraModeContext = {
      delta,
      time: timeRef.current,
      sceneId,
      gameMode,
      currentNodeId,
      camera: cam,
      sceneChildren: threeScene.children,
      playerPos,
      playerRotation: livePlayerRotationRef.current,
      playerVelocity: _playerVelocity.current,
      spring,
      raycaster: raycaster.current,
      yaw: yawRef.current,
      pitch: pitchRef.current,
      distance: distanceRef.current,
      interactionDistance: interactionDistanceRef.current,
      currentSceneFov: currentSceneFovRef.current,
      dialogueController: dialogueControllerRef.current,
      exploration: explorationRef.current,
      combat: combatRef.current,
      transition: transitionRef.current,
      cutscene: cutsceneRef.current,
      npcCutscene: npcCutsceneRef.current,
      cutsceneActive: cutsceneActiveRef.current,
      npcCutsceneActive: npcCutsceneActiveRef.current,
      wasInDialogue: wasInDialogueRef.current,
      interactionLocked,
      lookAheadOffset: lookAheadOffsetRef.current,
      prevVelocitySmooth: prevVelocitySmoothRef.current,
      desiredPos: _desiredPos.current,
      lookTarget: _lookTarget.current,
      offset: _offset.current,
      tempVec: _tempVec.current,
      tempVec2: _tempVec2.current,
      fallbackNpcPos: _fallbackNpcPos.current,
    };

    const modeResult = resolveCameraMode(ctx);

    yawRef.current = ctx.yaw;
    cutsceneActiveRef.current = ctx.cutsceneActive;
    npcCutsceneActiveRef.current = ctx.npcCutsceneActive;

    if (!modeResult) return;

    if (modeResult.kind === 'direct_applied') {
      wasInDialogueRef.current = isInDialogue;
      if (!initializedRef.current) initializedRef.current = true;
      return;
    }

    // Wheel zoom: pull the spring camera toward the new orbit distance immediately
    // so zoom feels responsive instead of lagging behind the spring.
    if (zoomSnapRef.current > 0.01 && modeResult.kind === 'targets') {
      const { targetPos, targetLook } = modeResult.targets;
      const snap = zoomSnapRef.current * ZOOM_SPRING_SNAP;
      spring.position.lerp(targetPos, snap);
      spring.lookAt.lerp(targetLook, snap * 0.6);
      spring.velocity.multiplyScalar(1 - snap * 0.85);
      zoomSnapRef.current *= 0.45;
      if (zoomSnapRef.current < 0.04) zoomSnapRef.current = 0;
    }

    const postFrame = postFrameStateRef.current;
    postFrame.isInDialogue = isInDialogue;
    postFrame.isCutscene = isCutscene;
    postFrame.isCombat = isCombat;
    postFrame.isDragging = isDraggingRef.current;

    applyCameraFrame(ctx, modeResult.targets, postFrame);

    yawRef.current = ctx.yaw;
    wasDraggingRef.current = postFrame.wasDragging;
    wasInDialogueRef.current = isInDialogue;

    if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, { label: 'FollowCamera' });

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
