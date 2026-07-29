/**
 * Unified cinematic timeline — one animation clip per phase.
 * Supports root-motion clips or in-place animation with synchronized transforms.
 */

import type { CameraWaypointData } from '@/shared/types/camera';

/** GLTF / Mixamo clip id played during a phase (idle, walk, …). */
export type CinematicClipId = string;

export type CinematicActorMotion =
  | { mode: 'none' }
  | { mode: 'root_motion'; clip: CinematicClipId }
  | {
      mode: 'in_place';
      clip: CinematicClipId;
      /** Normalized keyframes within the phase (t in 0–1). */
      keyframes: CinematicActorKeyframe[];
    };

export interface CinematicActorKeyframe {
  t: number;
  position: [number, number, number];
  /** Euler rotation applied to the actor group (radians). */
  rotation?: [number, number, number];
  /** Y-axis facing for humanoid models (overrides rotation.y when set). */
  facingY?: number;
}

export type CinematicCameraMotion =
  | {
      mode: 'waypoint';
      /** Segment target; interpolates from previous phase end or `from`. */
      to: CameraWaypointData;
      from?: CameraWaypointData;
    }
  | {
      mode: 'hold';
      at: CameraWaypointData;
    }
  | {
      mode: 'handoff';
      /** Blend from current camera into third-person exploration framing. */
      target: CameraWaypointData;
    };

export interface CinematicOverlayConfig {
  text?: string;
  subtitle?: string;
  accentColor?: string;
  letterboxStyle?: 'full' | 'thin' | 'none';
  showEmbers?: boolean;
  glitchIntensity?: number;
  /** Fade-in duration in ms (default 300). */
  fadeInMs?: number;
  /** Fade-out duration in ms (default 500). */
  fadeOutMs?: number;
}

export interface CinematicTimelinePhase {
  id: string;
  duration: number;
  actor: CinematicActorMotion;
  camera: CinematicCameraMotion;
  overlay?: CinematicOverlayConfig;
  /** Optional sfx/stinger key — resolved by runner. */
  audioCue?: 'footstep' | 'notify' | 'ui_open' | 'mystery';
  /** Trigger camera shake at the start of this phase. */
  cameraShake?: { intensity: number; frequency?: number };
  /**
   * Staging light cue — multiplies outdoor neon/practical intensity for a beat.
   * Handled by SceneEnvironment / street neon listeners via cinematic:timeline_phase.
   */
  lightCue?: 'neon_surge' | 'dim_hold' | 'warm_practical';
}

export interface CinematicTimelineAnchor {
  position: [number, number, number];
  /** When set, anchor follows live NPC world position each frame. */
  npcId?: string;
}

export interface CinematicTimelineDef {
  id: string;
  phases: CinematicTimelinePhase[];
  anchor?: CinematicTimelineAnchor;
  /** Safety timeout — auto-complete if runner stalls (ms). */
  fallbackMs?: number;
}

export interface CinematicTimelineRuntimeOptions {
  anchor?: [number, number, number];
  npcId?: string;
  skipMotion?: boolean;
}

export interface CinematicTimelineCameraFrame {
  position: import('three').Vector3;
  lookAt: import('three').Vector3;
  fov: number;
}

export interface CinematicTimelineActorFrame {
  clip: CinematicClipId;
  position: import('three').Vector3;
  rotation: import('three').Euler;
  facingY: number;
}

export interface CinematicTimelineUpdateResult {
  phaseId: string;
  phaseIndex: number;
  phaseLocalT: number;
  camera: CinematicTimelineCameraFrame;
  actor: CinematicTimelineActorFrame | null;
  overlay: CinematicOverlayConfig | null;
  isComplete: boolean;
  isHandoff: boolean;
}
