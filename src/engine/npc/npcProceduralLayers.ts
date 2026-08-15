/* ─── Volodka RPG – procedural animation layers on top of Mixamo / limb poses ─── */

import { Bone, Group, MathUtils, Object3D, Vector3 } from 'three';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import {
  applyLayeredHeadTracking,
  applyLayeredEyeTracking,
  cleanupHeadTracking,
  invalidateHeadTracking,
} from '@/engine/npc/headTracking';

const BREATHING_STATES: ReadonlySet<NPCAnimationState> = new Set(['idle', 'sit', 'listen']);
const SWAY_STATES: ReadonlySet<NPCAnimationState> = new Set(['idle', 'sit', 'listen', 'talk', 'gesture']);
const TALK_GESTURE_STATES: ReadonlySet<NPCAnimationState> = new Set(['talk', 'gesture']);

const CHEST_PATTERNS = ['Spine2', 'Spine1', 'Chest', 'spine2', 'mixamorigSpine2', 'mixamorigSpine1'];
const LEFT_ARM_PATTERNS = ['LeftArm', 'leftArm', 'mixamorigLeftArm', 'UpperArm_L'];
const RIGHT_ARM_PATTERNS = ['RightArm', 'rightArm', 'mixamorigRightArm', 'UpperArm_R'];
const LEFT_EYE_NAMES = ['leftEye', 'LeftEye', 'Eye_L', 'eye_l'];
const RIGHT_EYE_NAMES = ['rightEye', 'RightEye', 'Eye_R', 'eye_r'];

export interface NpcProceduralLayerInput {
  npcId: string;
  root: Group;
  animState: NPCAnimationState;
  playerPosition: Vector3 | null;
  delta: number;
  headTrackingEnabled?: boolean;
  headTrackingDistance?: number;
}

export interface NpcLayerParts {
  chest: Bone | Group | null;
  head: Bone | Group | null;
  leftEye: Object3D | null;
  rightEye: Object3D | null;
  leftArm: Bone | Group | null;
  rightArm: Bone | Group | null;
}

interface NpcLayerState {
  animTime: number;
  partsRootUuid: string | null;
  parts: NpcLayerParts;
  blinkPhase: 'open' | 'closing' | 'closed' | 'opening';
  blinkTimer: number;
  nextBlinkIn: number;
  leftEyeBaseScaleY: number;
  rightEyeBaseScaleY: number;
  swayPhase: number;
  talkGesturePhase: number;
}

const layerStates = new Map<string, NpcLayerState>();

function hashNpcSeed(npcId: string): number {
  let hash = 0;
  for (let i = 0; i < npcId.length; i += 1) {
    hash = (hash * 31 + npcId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function createLayerState(npcId: string): NpcLayerState {
  const seed = hashNpcSeed(npcId);
  return {
    animTime: seed * 0.001,
    partsRootUuid: null,
    parts: {
      chest: null,
      head: null,
      leftEye: null,
      rightEye: null,
      leftArm: null,
      rightArm: null,
    },
    blinkPhase: 'open',
    blinkTimer: 0,
    nextBlinkIn: 3 + (seed % 2001) / 1000,
    leftEyeBaseScaleY: 1,
    rightEyeBaseScaleY: 1,
    swayPhase: seed * 0.002,
    talkGesturePhase: 0,
  };
}

function getOrCreateLayerState(npcId: string): NpcLayerState {
  let state = layerStates.get(npcId);
  if (!state) {
    state = createLayerState(npcId);
    layerStates.set(npcId, state);
  }
  return state;
}

function matchesPattern(name: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => name === pattern || name.includes(pattern));
}

function findBoneOrNamedGroup(
  root: Object3D,
  patterns: readonly string[],
  exactGroupNames: readonly string[] = [],
): Bone | Group | null {
  let found: Bone | Group | null = null;
  root.traverse((child) => {
    if (found) return;
    if (child instanceof Bone) {
      if (matchesPattern(child.name, patterns)) {
        found = child;
      }
      return;
    }
    if (child instanceof Group && exactGroupNames.includes(child.name)) {
      found = child;
    }
  });
  return found;
}

function findEye(root: Object3D, names: readonly string[]): Object3D | null {
  let found: Object3D | null = null;
  root.traverse((child) => {
    if (found) return;
    if (names.includes(child.name)) {
      found = child;
      return;
    }
    if (child instanceof Bone && matchesPattern(child.name, names)) {
      found = child;
    }
  });
  return found;
}

function resolveLayerParts(root: Group, state: NpcLayerState): NpcLayerParts {
  if (state.partsRootUuid === root.uuid && state.parts.head) {
    return state.parts;
  }

  state.partsRootUuid = root.uuid;
  state.parts = {
    chest:
      findBoneOrNamedGroup(root, CHEST_PATTERNS, ['torso']) ??
      findBoneOrNamedGroup(root, ['Spine', 'mixamorigSpine'], ['torso']),
    head: findBoneOrNamedGroup(root, ['Head', 'head', 'Neck', 'neck', 'Bip001 Head', 'head_01'], ['head']),
    leftEye: findEye(root, LEFT_EYE_NAMES),
    rightEye: findEye(root, RIGHT_EYE_NAMES),
    leftArm: findBoneOrNamedGroup(root, LEFT_ARM_PATTERNS, ['leftArm']),
    rightArm: findBoneOrNamedGroup(root, RIGHT_ARM_PATTERNS, ['rightArm']),
  };

  if (state.parts.leftEye) {
    state.leftEyeBaseScaleY = state.parts.leftEye.scale.y || 1;
  }
  if (state.parts.rightEye) {
    state.rightEyeBaseScaleY = state.parts.rightEye.scale.y || 1;
  }

  return state.parts;
}

function applyBreathing(
  chest: Bone | Group,
  t: number,
  isProceduralTorso: boolean,
): void {
  const breath = Math.sin(t * 1.25) * 0.5 + 0.5;
  const chestLift = (breath - 0.5) * 0.04;
  const chestExpand = (breath - 0.5) * 0.015;

  if (isProceduralTorso) {
    chest.position.y += chestLift * 0.15;
    chest.rotation.x += chestExpand;
    return;
  }

  if (chest instanceof Bone) {
    chest.rotation.x += chestExpand;
    chest.scale.y = 1 + chestLift * 0.35;
  }
}

function applyBlink(state: NpcLayerState, parts: NpcLayerParts, delta: number): void {
  const closeDuration = 0.05;
  const holdDuration = 0.03;
  const openDuration = 0.05;

  state.blinkTimer += delta;

  if (state.blinkPhase === 'open') {
    if (state.blinkTimer >= state.nextBlinkIn) {
      state.blinkPhase = 'closing';
      state.blinkTimer = 0;
    }
    setEyeScale(parts.leftEye, state.leftEyeBaseScaleY);
    setEyeScale(parts.rightEye, state.rightEyeBaseScaleY);
    return;
  }

  if (state.blinkPhase === 'closing') {
    const progress = Math.min(1, state.blinkTimer / closeDuration);
    const scale = MathUtils.lerp(state.leftEyeBaseScaleY, 0.06, progress);
    setEyeScale(parts.leftEye, scale);
    setEyeScale(parts.rightEye, scale);
    if (progress >= 1) {
      state.blinkPhase = 'closed';
      state.blinkTimer = 0;
    }
    return;
  }

  if (state.blinkPhase === 'closed') {
    setEyeScale(parts.leftEye, 0.06);
    setEyeScale(parts.rightEye, 0.06);
    if (state.blinkTimer >= holdDuration) {
      state.blinkPhase = 'opening';
      state.blinkTimer = 0;
    }
    return;
  }

  const progress = Math.min(1, state.blinkTimer / openDuration);
  const scale = MathUtils.lerp(0.06, state.leftEyeBaseScaleY, progress);
  setEyeScale(parts.leftEye, scale);
  setEyeScale(parts.rightEye, scale);
  if (progress >= 1) {
    state.blinkPhase = 'open';
    state.blinkTimer = 0;
    const seed = hashNpcSeed(`${parts.leftEye?.uuid ?? 'eye'}`);
    state.nextBlinkIn = 3 + (seed % 2001) / 1000;
  }
}

function setEyeScale(eye: Object3D | null, scaleY: number): void {
  if (!eye) return;
  eye.scale.y = scaleY;
}

function applySway(root: Group, t: number): void {
  root.rotation.z = Math.sin(t * 0.65) * 0.008;
  root.rotation.x = Math.sin(t * 0.45 + 0.6) * 0.004;
  root.position.x = Math.sin(t * 0.5) * 0.003;
}

function applyTalkGesture(
  rightArm: Bone | Group,
  t: number,
  boost: number,
): void {
  const wave = Math.sin(t * 2.8) * 0.22 * boost;
  const lift = -0.35 + Math.sin(t * 2.2) * 0.12 * boost;
  rightArm.rotation.x += lift;
  rightArm.rotation.z += wave;
  if (rightArm instanceof Group) {
    rightArm.rotation.y += Math.sin(t * 1.6) * 0.05 * boost;
  }
}

/**
 * Apply procedural layers after Mixamo mixer or procedural limb animation.
 * Order: breathing → blink → sway → head/eye tracking → talk gesture.
 */
export function updateNpcProceduralLayers(input: NpcProceduralLayerInput): void {
  const {
    npcId,
    root,
    animState,
    playerPosition,
    delta,
    headTrackingEnabled = true,
    headTrackingDistance = 8,
  } = input;

  const dt = Math.min(delta, 0.05);
  const state = getOrCreateLayerState(npcId);
  state.animTime += dt;
  const t = state.animTime;
  const parts = resolveLayerParts(root, state);

  if (BREATHING_STATES.has(animState) && parts.chest) {
    const isProceduralTorso = parts.chest instanceof Group && parts.chest.name === 'torso';
    applyBreathing(parts.chest, t, isProceduralTorso);
  }

  applyBlink(state, parts, dt);

  if (SWAY_STATES.has(animState) && animState !== 'walk') {
    applySway(root, t + state.swayPhase);
  }

  if (headTrackingEnabled && playerPosition && parts.head) {
    const distSq = root.getWorldPosition(_worldPos).distanceToSquared(playerPosition);
    if (distSq < headTrackingDistance * headTrackingDistance) {
      const track = applyLayeredHeadTracking(npcId, parts.head, root, playerPosition, dt);
      applyLayeredEyeTracking(parts.leftEye, parts.rightEye, track.yaw, track.pitch, dt);
    } else {
      applyLayeredHeadTracking(npcId, parts.head, root, null, dt);
      applyLayeredEyeTracking(parts.leftEye, parts.rightEye, 0, 0, dt);
    }
  }

  if (TALK_GESTURE_STATES.has(animState) && parts.rightArm) {
    const isProcedural = parts.chest instanceof Group && parts.chest.name === 'torso';
    const boost = (animState === 'gesture' ? 1.35 : 1) * (isProcedural ? 0.45 : 1);
    state.talkGesturePhase += dt;
    applyTalkGesture(parts.rightArm, state.talkGesturePhase, boost);
  }
}

const _worldPos = new Vector3();

export function invalidateNpcProceduralLayers(npcId: string): void {
  const state = layerStates.get(npcId);
  if (!state) return;
  state.partsRootUuid = null;
  state.parts = {
    chest: null,
    head: null,
    leftEye: null,
    rightEye: null,
    leftArm: null,
    rightArm: null,
  };
  invalidateHeadTracking(npcId);
}

export function cleanupNpcProceduralLayers(npcId: string): void {
  layerStates.delete(npcId);
  cleanupHeadTracking(npcId);
}

export function disposeAllNpcProceduralLayers(): void {
  layerStates.clear();
}
