
/* ─── Volodka RPG – AAA Cinematic Follow Camera ─── */

import { useRef, useEffect, useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { isEncounterPresentationActive } from '@/engine/combat/encounterPresentation';
import { MathUtils, PerspectiveCamera, Raycaster, Vector3 } from 'three';
import { useCameraFollowState, usePlayerPosition } from '@/store/selectors';
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
import { eventBus } from '@/engine/EventBus';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { SIM_DELTA_MAX } from '@/engine/player/playerOwnership';
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
import {
  isInteractionLocked,
  shouldKeepFirstPersonExplorationCamera,
} from '@/engine/interaction/interactionSession';
import {
  initialCameraState,
  initializeCameraSubsystems,
  resetCameraForSceneChange,
  subscribeCameraEventHub,
  processCinematicFreezeFrame,
  processIntroWakeFrame,
  processPoemReadingFrame,
  syncCutsceneFlagsFromState,
  disposeFollowCamera,
  cleanupInFlightCameraTransitions,
  type CameraRuntimeRefs,
} from '@/engine/camera/cameraStateMachine';

interface FollowCameraProps {
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  livePlayerRotationRef: React.MutableRefObject<number>;
  moveBlendRef?: React.MutableRefObject<number>;
}

/* ── Ease-back helpers ────────────────────────────────────────────
   cubic-bezier (0.4, 0, 0.2, 1) — Material's "standard" ease. Used by the
   cutscene-skip path to lerp the camera from its cutscene-end pose to the
   exploration strategy target over `durationMs` (~600ms). Smooths the hard
   camera snap that ESC-skip would otherwise produce. The approximation below
   (ease-in-out cubic) is visually indistinguishable from the true bezier at
   sub-second durations, and is interruptible (clears on new strategy). */
function easeBackAlpha(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface EaseBackState {
  active: boolean;
  startMs: number;
  durationMs: number;
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
  // Read the store's playerPosition (doorway spawn on scene transitions) so we
  // can pass it into resetCameraForSceneChange without the engine layer importing
  // the store directly. (Task 3-D M1 architecture fix.)
  const playerPosition = usePlayerPosition();

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
  const lookAheadOffsetRef = useRef(new Vector3());
  const prevVelocitySmoothRef = useRef(new Vector3());
  const currentSceneFovRef = useRef(getSceneSpecificFov(sceneId));
  const cameraStateRef = useRef(initialCameraState());

  const _desiredPos = useRef(new Vector3());
  const _lookTarget = useRef(new Vector3());
  const _offset = useRef(new Vector3());
  const _prevPlayerPos = useRef(new Vector3());
  const _tempVec = useRef(new Vector3());
  const _tempVec2 = useRef(new Vector3());
  const _playerVelocity = useRef(new Vector3());
  const _fallbackNpcPos = useRef(new Vector3());

  const raycaster = useRef(new Raycaster());
  const wasDraggingRef = useRef(false);

  // Ease-back state — set by `camera:ease_back` event from
  // setCinematicPresentationMode('third_person', { easeMs }). When active,
  // the frame tick blends the spring + camera toward the exploration strategy
  // target with cubic-bezier (0.4, 0, 0.2, 1) over durationMs.
  const easeBackStateRef = useRef<EaseBackState>({ active: false, startMs: 0, durationMs: 0 });
  // Pre-frame scratch for ease-back blend — saved before applyCameraFrame runs
  // so the eased lerp goes from the pre-update position toward the target.
  const _easePrePos = useRef(new Vector3());
  const _easePreLook = useRef(new Vector3());

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
    const cam = camera as PerspectiveCamera;
    if (cam) {
      for (let i = 0; i <= 4; i++) cam.layers.enable(i);
    }
    configureCameraCollisionRaycaster(raycaster.current);
    initializeCameraSubsystems(runtimeRef.current, sceneId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only init
  }, []);

  useLayoutEffect(() => {
    resetCameraForSceneChange(runtimeRef.current, sceneId, playerPosition);
    // Cancel in-flight transition if scene changes again or unmounts mid-teleport.
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
      cleanupInFlightCameraTransitions(runtimeRef.current, sceneIdRef.current);
    };
  }, [sceneId, playerPosition]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    return () => disposeFollowCamera(runtimeRef.current, sceneIdRef.current);
     
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

  // Subscribe to `camera:ease_back` — emitted by setCinematicPresentationMode
  // when a cutscene skip (or natural completion, per Session 12-B) wants a
  // smooth 0.6s cubic-bezier blend from the cutscene-end camera pose back to
  // the exploration strategy target.
  //
  // Session 12-B fix: capture the pre-pose SYNCHRONOUSLY in this event handler
  // (NOT in useFrameTick). The `camera:recenter` event fires immediately after
  // `camera:ease_back` in setCinematicPresentationMode → completeCinematicTimeline
  // / stopCinematicTimeline / useCutsceneController — and the recenter handler
  // in cameraStateMachine consumes the easeBackPending flag (also set by this
  // listener's emit chain) to call applyExplorationSnap with preserveSpring=true.
  // Even so, capturing the pre-pose HERE (before the recenter even runs) is the
  // robust belt-and-braces approach: the captured _easePrePos is the cinematic
  // handoff pose regardless of whether preserveSpring was wired correctly. The
  // useFrameTick then lerps from this captured pose to the exploration target.
  useEffect(() => {
    const unsub = eventBus.on('camera:ease_back', (payload) => {
      const durationMs = Math.max(0, payload?.durationMs ?? 0);
      if (durationMs <= 0) return;
      const spring = springRef.current;
      if (spring) {
        // Synchronous capture — this runs BEFORE the `camera:recenter` event
        // (which fires next in the same emit chain). If we captured in
        // useFrameTick instead, the spring would already be snapped (or moved
        // by physics) and the ease lerp would interpolate from the wrong pose.
        _easePrePos.current.copy(spring.position);
        _easePreLook.current.copy(spring.lookAt);
      }
      easeBackStateRef.current = {
        active: true,
        startMs: performance.now(),
        durationMs,
      };
    });
    return () => { unsub(); };
  }, []);

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
    const cam = cameraRef.current as PerspectiveCamera;
    const spring = springRef.current;
    if (!spring || !cam) return;

    const playerPos = livePlayerPositionRef.current;
    if (!playerPos) return;

    if (!canFollowCameraDriveFrame()) {
      // Session 12-B: if a new owner grabbed the camera mid-blend (cutscene,
      // timeline, dialogue, etc.), clear the ease state so it doesn't resume
      // from a stale pre-pose next time follow re-acquires the camera. Without
      // this, a cutscene starting mid-blend would leave easeBackState.active
      // set; when the cutscene ends and follow resumes, the ease would lerp
      // from a pre-pose captured before the cutscene — visually wrong.
      if (easeBackStateRef.current.active) {
        easeBackStateRef.current = { active: false, startMs: 0, durationMs: 0 };
      }
      return;
    }

    const owner = getCameraOwner();
    if (owner === 'followCamera' && !acquireCameraOwnership('followCamera')) return;
    if (owner !== 'followCamera' && !canWriteCamera(owner)) return;

    const delta = applyTimeScale(Math.min(rawDelta, SIM_DELTA_MAX));
    timeRef.current += delta;

    const gamepadManualLook = applyPendingGamepadOrbit(
      yawRef,
      pitchRef,
      distanceRef,
      interactionDistanceRef,
      delta,
    );
    sharedCameraYawRef.current = yawRef.current;

    const useFirstPerson =
      shouldUseFirstPersonExploration(gameMode, activeCutsceneId)
      && shouldKeepFirstPersonExplorationCamera();
    if (FIRST_PERSON_ENABLED && useFirstPerson) {
      livePlayerRotationRef.current = yawRef.current;
    }

    if (processCinematicFreezeFrame(runtimeRef.current, sceneId, currentNodeId)) return;

    // Compute player velocity in m/s (not m/frame) — downstream consumers in
    // applyCameraFrame.ts and cinematicCamera.ts compare .length() against
    // m/s thresholds (0.5 walking, 0.3 idle, 0.1 look-ahead). Without dividing
    // by delta, every threshold was effectively unreachable at 60fps.
    _playerVelocity.current.copy(playerPos).sub(_prevPlayerPos.current);
    const invDelta = delta > 1e-4 ? 1 / delta : 60;
    _playerVelocity.current.multiplyScalar(invDelta);
    _prevPlayerPos.current.copy(playerPos);

    processIntroWakeFrame(runtimeRef.current, sceneId);
    processPoemReadingFrame(runtimeRef.current, sceneId);
    syncCutsceneFlagsFromState(runtimeRef.current);

    const isInDialogue = isInDialogueInteraction();
    const isCutscene = gameMode === 'cutscene' && cutsceneActiveRef.current;
    const isCombat = gameMode === 'combat' || isEncounterPresentationActive();
    const interactionLocked = isInteractionLocked();

    const targetInteractionDist = interactionLocked ? NPC_INTERACTION_DISTANCE : distanceRef.current;
    const distLerpSpeed = wasInDialogueRef.current && !interactionLocked
      ? DIALOGUE_EXIT_LERP_SPEED
      : DISTANCE_LERP_SPEED;
    interactionDistanceRef.current = MathUtils.lerp(
      interactionDistanceRef.current,
      targetInteractionDist,
      1 - Math.exp(-distLerpSpeed * delta),
    );

    if (!useFirstPerson) {
      const targetSceneFov = getSceneSpecificFov(sceneId);
      currentSceneFovRef.current = MathUtils.lerp(
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
    postFrame.isDragging = isDraggingRef.current || gamepadManualLook;

    const springOverride = modeResult.kind === 'targets' ? modeResult.springOverride : undefined;

    // Session 12-B: ease-back pre-pose is now captured SYNCHRONOUSLY in the
    // `camera:ease_back` listener (above), NOT here in useFrameTick. The
    // listener runs before `camera:recenter` snaps the spring, so _easePrePos
    // holds the cinematic handoff pose. Re-capturing here each frame would
    // overwrite the cinematic pre-pose with the (already-eased) current spring
    // pose — collapsing the cubic-bezier lerp into a recursive one-step lerp
    // and defeating the smooth ease. Just read the captured value below.
    const easeBack = easeBackStateRef.current;
    const easeBackActive = easeBack.active && modeResult.kind === 'targets';

    applyCameraFrame(ctx, modeResult.targets, postFrame, springOverride);

    // Ease-back override: when active, lerp the spring + camera from the
    // listener-captured cinematic pre-pose toward the exploration strategy
    // target with cubic-bezier (0.4, 0, 0.2, 1). Bypasses the spring's natural
    // damping for durationMs (~600ms). Interruptible: any new strategy that
    // updates the spring (new cutscene / dialogue / etc.) continues from the
    // eased position next frame — the alpha is recomputed each tick from
    // elapsed time, so the override naturally hands back to the spring once
    // t >= 1. As an extra safety, clear the ease if a new cutscene starts
    // mid-blend (the canFollowCameraDriveFrame() early-return above also
    // clears the ease if a non-follow owner grabbed the camera).
    if (easeBackActive && modeResult.kind === 'targets') {
      if (cutsceneActiveRef.current || npcCutsceneActiveRef.current) {
        // New cutscene grabbed the camera mid-blend — hand off immediately.
        easeBack.active = false;
      } else {
        const now = performance.now();
        const elapsedMs = now - easeBack.startMs;
        const t = Math.min(1, Math.max(0, elapsedMs / easeBack.durationMs));
        const alpha = easeBackAlpha(t);
        spring.position.copy(_easePrePos.current).lerp(modeResult.targets.targetPos, alpha);
        spring.lookAt.copy(_easePreLook.current).lerp(modeResult.targets.targetLook, alpha);
        // Commit the eased pose to the actual camera transform (applyCameraFrame
        // already wrote a spring-physics-derived transform; we overwrite it here so
        // the rendered frame exactly follows the ease curve).
        cam.position.copy(spring.position);
        cam.lookAt(spring.lookAt);
        if (t >= 1) {
          easeBack.active = false;
        }
      }
    }

    const transitionActive = transitionRef.current?.active ?? false;
    if (wasTransitionActiveRef.current && !transitionActive) {
      releaseCameraOwnership('transition');
    }
    wasTransitionActiveRef.current = transitionActive;

    yawRef.current = ctx.yaw;
    wasDraggingRef.current = postFrame.wasDragging;
    wasInDialogueRef.current = isInDialogue;

    // Session 12-B: removed the dead `audioListenerFrameRef` block that called
    // `sharedAudioContext?.setListenerPosition?.()` every 3rd frame. The cast
    // made it look like a method on the SharedAudioContext module, but
    // `setListenerPosition` is a NAMED EXPORT (not a method on the module
    // object), so the optional chain always short-circuited to undefined →
    // no-op. The live audio-listener-position tracking is wired correctly in
    // `applyCameraFrame.ts` (calls the named export directly every 3rd frame,
    // per session 11 audio agent 9d). This block was dead + misleading.

    if (!initializedRef.current) initializedRef.current = true;
  }, { label: 'FollowCamera' });

  return null;
}
