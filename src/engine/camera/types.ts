/* ─── Camera mode strategy types ─── */

import type * as THREE from 'three';
import type {
  SpringCameraState,
  DialogueShotController,
  ExplorationCameraState,
  CutsceneController,
  CombatCameraState,
  SceneTransitionState,
} from './cinematicCamera';

export type CameraModeId =
  | 'transition'
  | 'npc_cutscene'
  | 'cutscene'
  | 'dialog'
  | 'combat'
  | 'exploration';

/** Result of a per-frame mode update before spring smoothing */
export interface CameraModeTarget {
  targetPos: THREE.Vector3;
  targetLook: THREE.Vector3;
  targetFov: number;
  targetRoll: number;
}

/** Optional spring parameters override (e.g. softer spring for dialogue) */
export interface SpringOverride {
  stiffness: number;
  damping: number;
}

/** Transition mode applies camera directly and ends the frame early */
export type CameraModeUpdateResult =
  | { kind: 'targets'; mode: CameraModeId; targets: CameraModeTarget; springOverride?: SpringOverride }
  | { kind: 'direct_applied'; mode: 'transition' };

/** Mutable per-frame context shared across strategies */
export interface CameraModeContext {
  delta: number;
  time: number;
  sceneId: string;
  gameMode: string;
  currentNodeId: string | undefined;

  camera: THREE.PerspectiveCamera;
  sceneChildren: THREE.Object3D[];

  playerPos: THREE.Vector3;
  playerRotation: number;
  playerVelocity: THREE.Vector3;

  spring: SpringCameraState;
  raycaster: THREE.Raycaster;

  yaw: number;
  pitch: number;
  distance: number;
  interactionDistance: number;
  currentSceneFov: number;

  dialogueController: DialogueShotController | null;
  exploration: ExplorationCameraState | null;
  combat: CombatCameraState | null;
  transition: SceneTransitionState | null;
  cutscene: CutsceneController | null;
  npcCutscene: CutsceneController | null;

  cutsceneActive: boolean;
  npcCutsceneActive: boolean;

  wasInDialogue: boolean;
  interactionLocked: boolean;

  lookAheadOffset: THREE.Vector3;
  prevVelocitySmooth: THREE.Vector3;
  /** Damped 0–1 movement blend from PhysicsPlayer (reduces idle camera bob while walking). */
  moveBlend: number;

  // Pre-allocated temp vectors (GC avoidance)
  desiredPos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  offset: THREE.Vector3;
  tempVec: THREE.Vector3;
  tempVec2: THREE.Vector3;
  fallbackNpcPos: THREE.Vector3;
}

export interface CameraModeStrategy {
  readonly id: CameraModeId;
  readonly priority: number;
  isActive(ctx: CameraModeContext): boolean;
  update(ctx: CameraModeContext): CameraModeUpdateResult | null;
}
