
/* ─── Volodka RPG – AAA Cinematic Follow Camera ─── */

import { useRef, useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useCameraFollowState } from '@/store/selectors';
import {
  applyTimeScale,
  type SpringCameraState,
  type DialogueShotController,
  type ExplorationCameraState,
  type CutsceneController,
  type CombatCameraState,
  type SceneTransitionState,
} from '@/engine/camera/cinematicCamera';
import {
  DEFAULT_DISTANCE,
  NPC_INTERACTION_DISTANCE,
  DISTANCE_LERP_SPEED,
  DIALOGUE_EXIT_LERP_SPEED,
  FOV_TRANSITION_SPEED,
  getSceneSpecificFov,
  ZOOM_SPRING_SNAP,
  FIRST_PERSON_ENABLED,
} from '@/engine/camera/cameraConstants';
import { shouldUseFirstPersonExploration } from '@/engine/camera/cinematicPresentation';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { resolveCameraMode } from '@/engine/camera/strategies';
import { useCameraOrbitInput } from '@/engine/camera/useCameraOrbitInput';
import { applyPendingGamepadOrbit } from '@/engine/input/gamepadCamera';
import { configureCameraCollisionRaycaster } from '@/engine/camera/cameraCollisionLayers';
import { applyCameraFrame, isInDialogueInteraction } from '@/engine/camera/applyCameraFrame';
import {
  acquireCameraOwnership,
  canFollowCameraDriveFrame,
  canWriteCamera,
  getCameraOwner,
  releaseCameraOwnership,
} from '@/engine/camera/cameraOwnerState';
import type { CameraModeContext } from '@/engine/camera/types';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import {
  initialCameraState,
  initializeCameraSubsystems,
  resetCameraForSceneChange,
  subscribeCameraEventHub,
  processCinematicFreezeFrame,
  processIntroWakeFrame,
  syncCutsceneFlagsFromState,
  disposeFollowCamera,
  cleanupInFlightCameraTransitions,
  type CameraRuntimeRefs,
} from '@/engine/camera/cameraStateMachine';

interface FollowCameraProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  moveBlendRef?: React.MutableRefObject<number>;
}

export function FollowCamera({
  livePlayerPositionRef,
  livePlayerRotationRef,
  moveBlendRef,
}: FollowCameraProps) {
  const camera = useThree((s) => s.camera);
  const threeScene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const { sceneId, gameMode, activeCutsceneId, cutsceneWaypoints, currentNodeId } = useCameraFollowState();

  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const yawRef = useRef(0);
  const pitchRef = useRef(0.3);
  const distanceRef = useRef(DEFAULT_DISTANCE);
  const isDraggingRef = useRef(false);
  const zoomSnapRef = useRef(0);
  const firstPersonRef = useRef(FIRST_PERSON_ENABLED);
  firstPersonRef.current = FIRST_PERSON_ENABLED;
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  const springRef = useRef<SpringCameraState | null>(null);
  const dialogueControllerRef = useRef<DialogueShotController | null>(null);
  const explorationRef = useRef<ExplorationCameraState | null>(null);
  const cutsceneRef = useRef<CutsceneController | null>(null);
  const npcCutsceneRef = useRef<CutsceneController | null>(null);
  const cutsceneActiveRef = useRef(false);
  const npcCutsceneActiveRef = useRef(false);
  const combatRef = useRef<CombatCameraState | null>(null);
  const transitionRef = useRef<SceneTransitionState | null>(null);

  const timeRef = useRef(0);
  const wasInDialogueRef = useRef(false);
  const prevSceneIdRef = useRef(sceneId);
  const sceneIdRef = useRef(sceneId);
  sceneIdRef.current = sceneId;
  const prevGameModeRef = useRef(gameMode);
  const interactionDistanceRef = useRef(DEFAULT_DISTANCE);
  const lookAheadOffsetRef = useRef(new THREE.Vector3());
  const prevVelocitySmoothRef = useRef(new THREE.Vector3());
  const currentSceneFovRef = useRef(getSceneSpecificFov(sceneId));
  const cameraStateRef = useRef(initialCameraState());

  const _desiredPos = useRef(new THREE.Vector3());
  const _lookTarget = useRef(new THREE.Vector3());
  const _offset = useRef(new THREE.Vector3());
  const _prevPlayerPos = useRef(new THREE.Vector3());
  const _tempVec = useRef(new THREE.Vector3());
  const _tempVec2 = useRef(new THREE.Vector3());
  const _playerVelocity = useRef(new THREE.Vector3());
  const _fallbackNpcPos = useRef(new THREE.Vector3());

  const raycaster = useRef(new THREE.Raycaster());
  const wasDraggingRef = useRef(false);

  const runtimeRef = useRef<CameraRuntimeRefs>({
    orbit: {
      yaw: yawRef,
      pitch: pitchRef,
      distance: distanceRef,
      interactionDistance: interactionDistanceRef,
      currentSceneFov: currentSceneFovRef,
      initialized: initializedRef,
    },
    subsystems: {
      spring: springRef,
      dialogue: dialogueControllerRef,
      exploration: explorationRef,
      combat: combatRef,
      transition: transitionRef,
      cutscene: cutsceneRef,
      npcCutscene: npcCutsceneRef,
      cutsceneActive: cutsceneActiveRef,
      npcCutsceneActive: npcCutsceneActiveRef,
    },
    cameraState: cameraStateRef,
    time: timeRef,
    livePlayerPosition: livePlayerPositionRef,
    livePlayerRotation: livePlayerRotationRef,
    camera: cameraRef,
    prevPlayerPos: _prevPlayerPos,
    lookAheadOffset: lookAheadOffsetRef,
    prevVelocitySmooth: prevVelocitySmoothRef,
    prevSceneId: prevSceneIdRef,
  });

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (cam) {
      for (let i = 0; i <= 4; i++) cam.layers.enable(i);
    }
    configureCameraCollisionRaycaster(raycaster.current);
    initializeCameraSubsystems(runtimeRef.current, sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only init
  }, []);

  useLayoutEffect(() => {
    resetCameraForSceneChange(runtimeRef.current, sceneId);
    // Cancel in-flight transition if scene changes again or unmounts mid-teleport.
    return () => {
      cleanupInFlightCameraTransitions(runtimeRef.current, sceneIdRef.current);
    };
  }, [sceneId]);

  useEffect(() => {
    return () => disposeFollowCamera(runtimeRef.current, sceneIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  useEffect(() => {
    return subscribeCameraEventHub({
      runtime: runtimeRef.current,
      sceneId,
      gameMode,
      activeCutsceneId,
      cutsceneWaypoints,
      prevGameModeRef,
    });
  }, [sceneId, gameMode, activeCutsceneId, cutsceneWaypoints]);

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

  const postFrameStateRef = useRef({
    isInDialogue: false,
    isCutscene: false,
    isCombat: false,
    isDragging: false,
    wasDragging: false,
    playerMovingTimer: 0,
  });

  const wasTransitionActiveRef = useRef(false);

  useFrameTick('camera', ({ delta: rawDelta }) => {
    const cam = cameraRef.current as THREE.PerspectiveCamera;
    const spring = springRef.current;
    if (!spring || !cam) return;

    const playerPos = livePlayerPositionRef.current;
    if (!playerPos) return;

    if (!canFollowCameraDriveFrame()) return;

    const owner = getCameraOwner();
    if (owner === 'followCamera' && !acquireCameraOwnership('followCamera')) return;
    if (owner !== 'followCamera' && !canWriteCamera(owner)) return;

    const delta = applyTimeScale(Math.min(rawDelta, 0.05));
    timeRef.current += delta;

    applyPendingGamepadOrbit(yawRef, pitchRef, distanceRef, interactionDistanceRef, delta);
    sharedCameraYawRef.current = yawRef.current;

    const useFirstPerson =
      shouldUseFirstPersonExploration(gameMode, activeCutsceneId) && !isInteractionLocked();
    if (FIRST_PERSON_ENABLED && useFirstPerson) {
      livePlayerRotationRef.current = yawRef.current;
    }

    if (processCinematicFreezeFrame(runtimeRef.current, sceneId)) return;

    _playerVelocity.current.copy(playerPos).sub(_prevPlayerPos.current);
    _prevPlayerPos.current.copy(playerPos);

    processIntroWakeFrame(runtimeRef.current, sceneId);
    syncCutsceneFlagsFromState(runtimeRef.current);

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
      moveBlend: moveBlendRef?.current ?? 0,
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

    const transitionActive = transitionRef.current?.active ?? false;
    if (wasTransitionActiveRef.current && !transitionActive) {
      releaseCameraOwnership('transition');
    }
    wasTransitionActiveRef.current = transitionActive;

    yawRef.current = ctx.yaw;
    wasDraggingRef.current = postFrame.wasDragging;
    wasInDialogueRef.current = isInDialogue;

    if (!initializedRef.current) initializedRef.current = true;
  }, { label: 'FollowCamera' });

  return null;
}
