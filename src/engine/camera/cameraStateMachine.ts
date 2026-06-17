/**
 * Centralized camera state machine — event-driven mode transitions and
 * consolidated eventBus subscriptions for FollowCamera.
 */

import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import { getSceneConfig } from '@/config/scenes';
import {
  createSpringCameraState,
  createDialogueShotController,
  createExplorationCameraState,
  createCombatCameraState,
  createSceneTransitionState,
  createCutsceneController,
  startCutscene,
  stopCutscene,
  startSceneTransition,
  cancelSceneTransition,
  setDialogueSpeaker,
  triggerCombatImpact,
  triggerCombatShake,
  type SpringCameraState,
  type DialogueShotController,
  type ExplorationCameraState,
  type CutsceneController,
  type CombatCameraState,
  type SceneTransitionState,
  type CameraWaypoint,
  type DialogueSpeaker,
} from './cinematicCamera';
import {
  DEFAULT_DISTANCE,
  LOOK_HEIGHT,
  CINEMATIC_FREEZE_TIMEOUT,
  INTRO_WAKE_DURATION,
  INTRO_WAKE_START_DISTANCE,
  INTRO_WAKE_END_DISTANCE,
  POEM_READING_DURATION,
  POEM_READING_START_DISTANCE,
  POEM_READING_END_DISTANCE,
  POEM_READING_START_PITCH,
  POEM_READING_END_PITCH,
  FIRST_PERSON_ENABLED,
  FIRST_PERSON_FOV,
  FIRST_PERSON_EYE_HEIGHT,
  getSceneDefaultDistance,
  getSceneSpecificFov,
} from './cameraConstants';
import {
  resetCinematicPresentation,
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from './cinematicPresentation';
import {
  acquireCameraOwnership,
  releaseCameraOwnership,
} from './cameraOwnerState';
import { sharedCameraYawRef } from '@/engine/PlayerRotationState';
import { eventBus } from '@/engine/EventBus';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import type { CameraWaypointData } from '@/engine/events';
import type { SceneId } from '@/shared/types/game';

export interface ExplorationParams {
  sceneId: SceneId;
  forceThirdPerson?: boolean;
  pitchOverride?: number;
}

export type CameraState =
  | { mode: 'exploration'; params: ExplorationParams }
  | { mode: 'dialogue'; speaker: DialogueSpeaker }
  | { mode: 'cutscene'; controller: CutsceneController; kind: 'story' | 'npc' }
  | { mode: 'transition'; from: THREE.Vector3; to: THREE.Vector3 }
  | { mode: 'cinematic_freeze'; startedAt: number; params: ExplorationParams }
  | { mode: 'intro_wake'; startedAt: number }
  | { mode: 'poem_reading'; startedAt: number };

export const initialCameraState = (): CameraState => ({
  mode: 'exploration',
  params: { sceneId: 'volodka_room' },
});

export interface CameraOrbitRefs {
  yaw: MutableRefObject<number>;
  pitch: MutableRefObject<number>;
  distance: MutableRefObject<number>;
  interactionDistance: MutableRefObject<number>;
  currentSceneFov: MutableRefObject<number>;
  initialized: MutableRefObject<boolean>;
}

export interface CameraSubsystemsRefs {
  spring: MutableRefObject<SpringCameraState | null>;
  dialogue: MutableRefObject<DialogueShotController | null>;
  exploration: MutableRefObject<ExplorationCameraState | null>;
  combat: MutableRefObject<CombatCameraState | null>;
  transition: MutableRefObject<SceneTransitionState | null>;
  cutscene: MutableRefObject<CutsceneController | null>;
  npcCutscene: MutableRefObject<CutsceneController | null>;
  cutsceneActive: MutableRefObject<boolean>;
  npcCutsceneActive: MutableRefObject<boolean>;
}

export interface CameraRuntimeRefs {
  orbit: CameraOrbitRefs;
  subsystems: CameraSubsystemsRefs;
  cameraState: MutableRefObject<CameraState>;
  time: MutableRefObject<number>;
  livePlayerPosition: MutableRefObject<THREE.Vector3>;
  livePlayerRotation: MutableRefObject<number>;
  camera: MutableRefObject<THREE.Camera>;
  prevPlayerPos: MutableRefObject<THREE.Vector3>;
  lookAheadOffset: MutableRefObject<THREE.Vector3>;
  prevVelocitySmooth: MutableRefObject<THREE.Vector3>;
  prevSceneId: MutableRefObject<SceneId>;
}

export type CameraStateAction =
  | { type: 'cinematic_fade_out'; time: number; params: ExplorationParams }
  | { type: 'cinematic_hold'; time: number; params: ExplorationParams }
  | { type: 'cinematic_fade_in' }
  | { type: 'recenter' }
  | { type: 'intro_wake'; time: number }
  | { type: 'intro_wake_complete' }
  | { type: 'poem_reading_start'; time: number }
  | { type: 'poem_reading_complete' }
  | { type: 'cutscene_start'; controller: CutsceneController; kind: 'story' }
  | { type: 'cutscene_end'; kind: 'story' }
  | { type: 'npc_cutscene_start'; controller: CutsceneController }
  | { type: 'npc_cutscene_end' }
  | { type: 'scene_transition_start'; from: THREE.Vector3; to: THREE.Vector3 }
  | { type: 'scene_transition_complete' }
  | { type: 'cinematic_freeze_timeout' }
  | { type: 'exploration'; params: ExplorationParams };

export function reduceCameraState(state: CameraState, action: CameraStateAction): CameraState {
  switch (action.type) {
    case 'cinematic_fade_out':
    case 'cinematic_hold':
      return { mode: 'cinematic_freeze', startedAt: action.time, params: action.params };
    case 'cinematic_fade_in':
    case 'recenter':
    case 'cinematic_freeze_timeout':
    case 'intro_wake_complete':
    case 'poem_reading_complete':
    case 'scene_transition_complete':
      return { mode: 'exploration', params: { sceneId: 'volodka_room' } };
    case 'intro_wake':
      return { mode: 'intro_wake', startedAt: action.time };
    case 'poem_reading_start':
      return { mode: 'poem_reading', startedAt: action.time };
    case 'cutscene_start':
      return { mode: 'cutscene', controller: action.controller, kind: action.kind };
    case 'cutscene_end':
      return state.mode === 'cutscene' && state.kind === action.kind
        ? { mode: 'exploration', params: { sceneId: 'volodka_room' } }
        : state;
    case 'npc_cutscene_start':
      return { mode: 'cutscene', controller: action.controller, kind: 'npc' };
    case 'npc_cutscene_end':
      return state.mode === 'cutscene' && state.kind === 'npc'
        ? { mode: 'exploration', params: { sceneId: 'volodka_room' } }
        : state;
    case 'scene_transition_start':
      return { mode: 'transition', from: action.from, to: action.to };
    case 'exploration':
      return { mode: 'exploration', params: action.params };
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function dispatchCameraState(
  runtime: CameraRuntimeRefs,
  action: CameraStateAction,
  sceneId: SceneId,
): void {
  const reduced = reduceCameraState(runtime.cameraState.current, action);
  if (reduced.mode === 'exploration') {
    runtime.cameraState.current = { mode: 'exploration', params: { ...reduced.params, sceneId } };
    return;
  }
  if (reduced.mode === 'cinematic_freeze') {
    runtime.cameraState.current = {
      mode: 'cinematic_freeze',
      startedAt: reduced.startedAt,
      params: { ...reduced.params, sceneId },
    };
    return;
  }
  runtime.cameraState.current = reduced;
}

export function computeExplorationCameraSnap(
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
    return { cameraYaw: playerYaw, pitch, distance: 0, position, lookAt, fov: FIRST_PERSON_FOV };
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

export function applyExplorationSnap(
  runtime: CameraRuntimeRefs,
  sceneId: SceneId,
  pitchOverride?: number,
  forceThirdPerson = false,
  resetInitialized = false,
): void {
  const snap = computeExplorationCameraSnap(
    runtime.livePlayerPosition.current,
    runtime.livePlayerRotation.current,
    sceneId,
    pitchOverride,
    forceThirdPerson,
  );
  const { orbit, subsystems } = runtime;

  orbit.yaw.current = snap.cameraYaw;
  orbit.pitch.current = snap.pitch;
  orbit.distance.current = snap.distance;
  orbit.interactionDistance.current = snap.distance;
  sharedCameraYawRef.current = snap.cameraYaw;
  orbit.currentSceneFov.current = snap.fov;
  if (resetInitialized) orbit.initialized.current = false;

  if (subsystems.spring.current) {
    subsystems.spring.current.position.copy(snap.position);
    subsystems.spring.current.velocity.set(0, 0, 0);
    subsystems.spring.current.lookAt.copy(snap.lookAt);
    subsystems.spring.current.fov = snap.fov;
  }
}

export function applyExplorationSnapToCamera(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  applyExplorationSnap(runtime, sceneId);
  const spring = runtime.subsystems.spring.current;
  const cam = runtime.camera.current as THREE.PerspectiveCamera;
  if (spring && cam) {
    cam.position.copy(spring.position);
    cam.lookAt(spring.lookAt);
    cam.fov = spring.fov;
    cam.updateProjectionMatrix();
  }
}

export function initializeCameraSubsystems(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
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

  const { orbit, subsystems } = runtime;
  orbit.yaw.current = initYaw;
  orbit.pitch.current = initPitch;
  orbit.distance.current = initDist;
  orbit.interactionDistance.current = initDist;
  runtime.livePlayerRotation.current = playerYaw;
  sharedCameraYawRef.current = initYaw;

  subsystems.spring.current = createSpringCameraState(initPos, initLook);
  subsystems.dialogue.current = createDialogueShotController();
  subsystems.exploration.current = createExplorationCameraState();
  subsystems.combat.current = createCombatCameraState();
  subsystems.transition.current = createSceneTransitionState();
  runtime.prevPlayerPos.current.set(spawn[0], spawn[1], spawn[2]);
  orbit.currentSceneFov.current = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);
  runtime.cameraState.current = { mode: 'exploration', params: { sceneId } };

  const cam = runtime.camera.current as THREE.PerspectiveCamera;
  if (cam) {
    cam.position.copy(initPos);
    cam.lookAt(initLook);
    cam.fov = orbit.currentSceneFov.current;
    cam.updateProjectionMatrix();
  }
}

export function cancelInFlightSceneTransition(
  runtime: CameraRuntimeRefs,
  sceneId: SceneId,
): void {
  const transition = runtime.subsystems.transition.current;
  if (transition) cancelSceneTransition(transition);
  if (runtime.cameraState.current.mode === 'transition') {
    dispatchCameraState(runtime, { type: 'scene_transition_complete' }, sceneId);
  }
  releaseCameraOwnership('transition');
}

export function cleanupInFlightCameraTransitions(
  runtime: CameraRuntimeRefs,
  sceneId?: SceneId,
): void {
  const resolvedSceneId = sceneId ?? runtime.prevSceneId.current;
  cancelInFlightSceneTransition(runtime, resolvedSceneId);
  releaseCameraOwnership('cinematicFreeze');
  releaseCameraOwnership('cutscene');
  releaseCameraOwnership('transition');
  resetCinematicPresentation();

  const { subsystems } = runtime;
  if (subsystems.cutscene.current) {
    stopCutscene(subsystems.cutscene.current);
    subsystems.cutsceneActive.current = false;
  }
  if (subsystems.npcCutscene.current) {
    stopCutscene(subsystems.npcCutscene.current);
    subsystems.npcCutsceneActive.current = false;
  }

  const state = runtime.cameraState.current;
  if (state.mode === 'cinematic_freeze' || state.mode === 'intro_wake' || state.mode === 'poem_reading') {
    dispatchCameraState(runtime, { type: 'exploration', params: { sceneId: resolvedSceneId } }, resolvedSceneId);
  }
}

export function resetCameraForSceneChange(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  cleanupInFlightCameraTransitions(runtime, sceneId);
  const config = getSceneConfig(sceneId);
  const spawn = config.spawnPoint;
  const playerYaw = config.initialRotation ?? 0;
  const cameraYaw = FIRST_PERSON_ENABLED ? playerYaw : playerYaw + Math.PI;
  const initPitch = FIRST_PERSON_ENABLED ? 0 : 0.3;
  const { orbit, subsystems } = runtime;

  orbit.yaw.current = cameraYaw;
  orbit.pitch.current = initPitch;
  const sceneDist = FIRST_PERSON_ENABLED ? 0 : getSceneDefaultDistance(sceneId);
  orbit.distance.current = sceneDist;
  orbit.interactionDistance.current = sceneDist;
  runtime.livePlayerRotation.current = playerYaw;
  sharedCameraYawRef.current = cameraYaw;
  orbit.initialized.current = false;

  if (subsystems.spring.current) {
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
    subsystems.spring.current.position.copy(newCamPos);
    subsystems.spring.current.velocity.set(0, 0, 0);
    subsystems.spring.current.lookAt.copy(newLookAt);
    subsystems.spring.current.fov = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);
    subsystems.spring.current.roll = 0;
  }

  if (subsystems.exploration.current) {
    subsystems.exploration.current.smoothedHeight = spawn[1];
    subsystems.exploration.current.prevYaw = cameraYaw;
    subsystems.exploration.current.turnRate = 0;
    subsystems.exploration.current.smoothedTurnRate = 0;
    subsystems.exploration.current.idleTimer = 0;
    subsystems.exploration.current.breathingIntensity = 0;
  }

  runtime.prevPlayerPos.current.set(spawn[0], spawn[1], spawn[2]);
  runtime.lookAheadOffset.current.set(0, 0, 0);
  runtime.prevVelocitySmooth.current.set(0, 0, 0);
  orbit.currentSceneFov.current = FIRST_PERSON_ENABLED ? FIRST_PERSON_FOV : getSceneSpecificFov(sceneId);
}

export function disposeFollowCamera(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  cleanupInFlightCameraTransitions(runtime, sceneId);
  applyExplorationSnapToCamera(runtime, sceneId);
  runtime.cameraState.current = { mode: 'exploration', params: { sceneId } };
}

export function startSceneFlythrough(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  const { subsystems } = runtime;
  if (!subsystems.transition.current || !subsystems.spring.current) return;

  const config = getSceneConfig(sceneId);
  const spawn = config.spawnPoint;
  const cameraYaw = (config.initialRotation ?? 0) + Math.PI;
  const sceneDist = getSceneDefaultDistance(sceneId);
  const targetPos = new THREE.Vector3(
    spawn[0] + Math.sin(cameraYaw) * Math.cos(0.3) * sceneDist,
    spawn[1] + LOOK_HEIGHT + Math.sin(0.3) * sceneDist,
    spawn[2] + Math.cos(cameraYaw) * Math.cos(0.3) * sceneDist,
  );
  const targetLook = new THREE.Vector3(spawn[0], spawn[1] + LOOK_HEIGHT, spawn[2]);

  startSceneTransition(
    subsystems.transition.current,
    subsystems.spring.current.position,
    subsystems.spring.current.lookAt,
    targetPos,
    targetLook,
  );
  acquireCameraOwnership('transition');

  dispatchCameraState(runtime, {
    type: 'scene_transition_start',
    from: subsystems.spring.current.position.clone(),
    to: targetPos.clone(),
  }, sceneId);
}

export function processCinematicFreezeFrame(runtime: CameraRuntimeRefs, sceneId: SceneId): boolean {
  const state = runtime.cameraState.current;
  if (state.mode !== 'cinematic_freeze') return false;

  if (runtime.time.current - state.startedAt > CINEMATIC_FREEZE_TIMEOUT) {
    dispatchCameraState(runtime, { type: 'cinematic_freeze_timeout' }, sceneId);
    releaseCameraOwnership('cinematicFreeze');
    resetCinematicPresentation();
    eventBus.emit('camera:recenter', {});
    return false;
  }
  return true;
}

export function processIntroWakeFrame(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  const state = runtime.cameraState.current;
  if (state.mode !== 'intro_wake' || FIRST_PERSON_ENABLED) return;

  const { orbit } = runtime;
  const elapsed = runtime.time.current - state.startedAt;
  const progress = Math.min(1, elapsed / INTRO_WAKE_DURATION);
  const ease = 1 - Math.pow(1 - progress, 3);
  const currentDist =
    INTRO_WAKE_START_DISTANCE + (INTRO_WAKE_END_DISTANCE - INTRO_WAKE_START_DISTANCE) * ease;

  orbit.distance.current = currentDist;
  orbit.interactionDistance.current = currentDist;
  orbit.pitch.current = 0.15 + (0.3 - 0.15) * ease;

  if (progress >= 1) {
    dispatchCameraState(runtime, { type: 'intro_wake_complete' }, sceneId);
    orbit.initialized.current = false;
  }
}

export function processPoemReadingFrame(runtime: CameraRuntimeRefs, sceneId: SceneId): void {
  const state = runtime.cameraState.current;
  if (state.mode !== 'poem_reading') return;

  const { orbit } = runtime;
  const elapsed = runtime.time.current - state.startedAt;
  const progress = Math.min(1, elapsed / POEM_READING_DURATION);
  const ease = 1 - Math.pow(1 - progress, 3);
  const currentDist =
    POEM_READING_START_DISTANCE + (POEM_READING_END_DISTANCE - POEM_READING_START_DISTANCE) * ease;

  orbit.distance.current = currentDist;
  orbit.interactionDistance.current = currentDist;
  orbit.pitch.current =
    POEM_READING_START_PITCH + (POEM_READING_END_PITCH - POEM_READING_START_PITCH) * ease;

  if (progress >= 1) {
    dispatchCameraState(runtime, { type: 'poem_reading_complete' }, sceneId);
  }
}

export function syncCutsceneFlagsFromState(runtime: CameraRuntimeRefs): void {
  const state = runtime.cameraState.current;
  const { subsystems } = runtime;
  if (state.mode !== 'cutscene') return;

  if (state.kind === 'story') {
    subsystems.cutscene.current = state.controller;
    subsystems.cutsceneActive.current = true;
    subsystems.npcCutsceneActive.current = false;
  } else {
    subsystems.npcCutscene.current = state.controller;
    subsystems.npcCutsceneActive.current = true;
    subsystems.cutsceneActive.current = false;
  }
}

export function buildCutsceneController(
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

export interface CameraEventHubOptions {
  runtime: CameraRuntimeRefs;
  sceneId: SceneId;
  gameMode: string;
  activeCutsceneId: string | null;
  cutsceneWaypoints: CameraWaypointData[];
  prevGameModeRef: MutableRefObject<string>;
}

export function subscribeCameraEventHub(options: CameraEventHubOptions): () => void {
  const { runtime, sceneId, gameMode, activeCutsceneId, cutsceneWaypoints, prevGameModeRef } = options;
  const { subsystems } = runtime;
  const unsubs: (() => void)[] = [];

  unsubs.push(eventBus.on('camera:cinematic_transition', ({ phase }) => {
    if (phase === 'fadeOut' || phase === 'hold') {
      cancelInFlightSceneTransition(runtime, sceneId);
      acquireCameraOwnership('cinematicFreeze');
      setCinematicHoldActive(true);
      setCinematicPresentationMode('third_person');
      applyExplorationSnap(runtime, sceneId, 0.25, true);
      dispatchCameraState(runtime, {
        type: phase === 'fadeOut' ? 'cinematic_fade_out' : 'cinematic_hold',
        time: runtime.time.current,
        params: { sceneId, forceThirdPerson: true, pitchOverride: 0.25 },
      }, sceneId);
    } else if (phase === 'fadeIn') {
      releaseCameraOwnership('cinematicFreeze');
      setCinematicHoldActive(false);
      setCinematicPresentationMode('first_person');
      dispatchCameraState(runtime, { type: 'cinematic_fade_in' }, sceneId);
      eventBus.emit('camera:recenter', {});
    }
  }));

  unsubs.push(eventBus.on('camera:recenter', () => {
    cancelInFlightSceneTransition(runtime, sceneId);
    applyExplorationSnap(runtime, sceneId, undefined, false, true);
    dispatchCameraState(runtime, { type: 'recenter' }, sceneId);
  }));

  unsubs.push(eventBus.on('camera:intro_wake', () => {
    if (FIRST_PERSON_ENABLED) return;
    cancelInFlightSceneTransition(runtime, sceneId);
    dispatchCameraState(runtime, { type: 'intro_wake', time: runtime.time.current }, sceneId);

    const playerPos = runtime.livePlayerPosition.current;
    const playerRotation = runtime.livePlayerRotation.current;
    const cameraYaw = playerRotation + Math.PI;
    const closePitch = 0.15;
    const closePos = new THREE.Vector3(
      playerPos.x + Math.sin(cameraYaw) * Math.cos(closePitch) * INTRO_WAKE_START_DISTANCE,
      playerPos.y + LOOK_HEIGHT + Math.sin(closePitch) * INTRO_WAKE_START_DISTANCE + 0.3,
      playerPos.z + Math.cos(cameraYaw) * Math.cos(closePitch) * INTRO_WAKE_START_DISTANCE,
    );
    const closeLook = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT, playerPos.z);

    if (subsystems.spring.current) {
      subsystems.spring.current.position.copy(closePos);
      subsystems.spring.current.velocity.set(0, 0, 0);
      subsystems.spring.current.lookAt.copy(closeLook);
    }
    runtime.orbit.yaw.current = cameraYaw;
    runtime.orbit.pitch.current = closePitch;
    runtime.orbit.distance.current = INTRO_WAKE_START_DISTANCE;
    runtime.orbit.interactionDistance.current = INTRO_WAKE_START_DISTANCE;
  }));

  unsubs.push(eventBus.on('camera:poem_reading_start', () => {
    cancelInFlightSceneTransition(runtime, sceneId);
    acquireCameraOwnership('cinematicFreeze');
    setCinematicHoldActive(true);
    setCinematicPresentationMode('third_person');
    dispatchCameraState(runtime, { type: 'poem_reading_start', time: runtime.time.current }, sceneId);

    const playerPos = runtime.livePlayerPosition.current;
    const playerRotation = runtime.livePlayerRotation.current;
    const cameraYaw = playerRotation + Math.PI;
    const closePitch = POEM_READING_START_PITCH;
    const closePos = new THREE.Vector3(
      playerPos.x + Math.sin(cameraYaw) * Math.cos(closePitch) * POEM_READING_START_DISTANCE,
      playerPos.y + LOOK_HEIGHT + Math.sin(closePitch) * POEM_READING_START_DISTANCE + 0.2,
      playerPos.z + Math.cos(cameraYaw) * Math.cos(closePitch) * POEM_READING_START_DISTANCE,
    );
    const closeLook = new THREE.Vector3(playerPos.x, playerPos.y + LOOK_HEIGHT + 0.05, playerPos.z);

    if (subsystems.spring.current) {
      subsystems.spring.current.position.copy(closePos);
      subsystems.spring.current.velocity.set(0, 0, 0);
      subsystems.spring.current.lookAt.copy(closeLook);
    }
    runtime.orbit.yaw.current = cameraYaw;
    runtime.orbit.pitch.current = closePitch;
    runtime.orbit.distance.current = POEM_READING_START_DISTANCE;
    runtime.orbit.interactionDistance.current = POEM_READING_START_DISTANCE;
  }));

  unsubs.push(eventBus.on('camera:poem_reading_end', () => {
    releaseCameraOwnership('cinematicFreeze');
    setCinematicHoldActive(false);
    setCinematicPresentationMode('first_person');
    dispatchCameraState(runtime, { type: 'poem_reading_complete' }, sceneId);
    eventBus.emit('camera:recenter', {});
  }));

  unsubs.push(eventBus.on('camera:cutscene_start', ({ waypoints }) => {
    const controller = buildCutsceneController(waypoints);
    if (controller) {
      subsystems.cutscene.current = controller;
      startCutscene(controller);
      subsystems.cutsceneActive.current = true;
      acquireCameraOwnership('cutscene');
      dispatchCameraState(runtime, { type: 'cutscene_start', controller, kind: 'story' }, sceneId);
    }
  }));

  unsubs.push(eventBus.on('camera:cutscene_end', () => {
    if (subsystems.cutscene.current) {
      stopCutscene(subsystems.cutscene.current);
      subsystems.cutsceneActive.current = false;
    }
    releaseCameraOwnership('cutscene');
    dispatchCameraState(runtime, { type: 'cutscene_end', kind: 'story' }, sceneId);
  }));

  unsubs.push(eventBus.on('camera:combat_impact', ({ intensity }) => {
    if (subsystems.combat.current) triggerCombatImpact(subsystems.combat.current, intensity);
  }));

  unsubs.push(eventBus.on('camera:combat_shake', ({ intensity }) => {
    if (subsystems.combat.current) triggerCombatShake(subsystems.combat.current, intensity);
  }));

  unsubs.push(eventBus.on('camera:npc_cutscene_start', ({ waypoints, npcId }) => {
    const npcGroup = npcId ? getNPCGroup(npcId) : undefined;
    const npcPos = npcGroup ? npcGroup.position : new THREE.Vector3(0, 0, 0);
    const controller = buildCutsceneController(waypoints, npcPos);
    if (controller) {
      subsystems.npcCutscene.current = controller;
      startCutscene(controller);
      subsystems.npcCutsceneActive.current = true;
      acquireCameraOwnership('cutscene');
      dispatchCameraState(runtime, { type: 'npc_cutscene_start', controller }, sceneId);
    }
  }));

  unsubs.push(eventBus.on('camera:npc_cutscene_end', () => {
    if (subsystems.npcCutscene.current) {
      stopCutscene(subsystems.npcCutscene.current);
      subsystems.npcCutsceneActive.current = false;
    }
    releaseCameraOwnership('cutscene');
    dispatchCameraState(runtime, { type: 'npc_cutscene_end' }, sceneId);
  }));

  unsubs.push(eventBus.on('camera:interaction_splash_start', ({
    waypoints,
    anchorPosition,
    anchorIsNpc,
    npcId,
  }) => {
    const anchor = anchorIsNpc
      ? (npcId ? getNPCGroup(npcId)?.position : undefined) ?? new THREE.Vector3(...anchorPosition)
      : new THREE.Vector3(...anchorPosition);
    const controller = buildCutsceneController(waypoints, anchor);
    if (controller) {
      subsystems.npcCutscene.current = controller;
      startCutscene(controller);
      subsystems.npcCutsceneActive.current = true;
      acquireCameraOwnership('cutscene');
      dispatchCameraState(runtime, { type: 'npc_cutscene_start', controller }, sceneId);
    }
  }));

  unsubs.push(eventBus.on('camera:interaction_splash_end', () => {
    if (subsystems.npcCutscene.current) {
      stopCutscene(subsystems.npcCutscene.current);
      subsystems.npcCutsceneActive.current = false;
    }
    releaseCameraOwnership('cutscene');
    dispatchCameraState(runtime, { type: 'npc_cutscene_end' }, sceneId);
  }));

  unsubs.push(eventBus.on('camera:dialogue_speaker', ({ speaker }) => {
    if (subsystems.dialogue.current) setDialogueSpeaker(subsystems.dialogue.current, speaker);
    runtime.cameraState.current = { mode: 'dialogue', speaker };
  }));

  if (activeCutsceneId && cutsceneWaypoints.length > 0 && activeCutsceneId !== 'intro_wakeup') {
    const controller = buildCutsceneController(cutsceneWaypoints);
    if (controller) {
      subsystems.cutscene.current = controller;
      startCutscene(controller);
      subsystems.cutsceneActive.current = true;
      acquireCameraOwnership('cutscene');
      dispatchCameraState(runtime, { type: 'cutscene_start', controller, kind: 'story' }, sceneId);
    }
  }

  if (gameMode === 'exploration' && prevGameModeRef.current !== 'exploration') {
    applyExplorationSnapToCamera(runtime, sceneId);
    dispatchCameraState(runtime, { type: 'exploration', params: { sceneId } }, sceneId);
  }
  prevGameModeRef.current = gameMode;

  if (sceneId !== runtime.prevSceneId.current) {
    startSceneFlythrough(runtime, sceneId);
    runtime.prevSceneId.current = sceneId;
  }

  return () => unsubs.forEach((u) => u());
}
