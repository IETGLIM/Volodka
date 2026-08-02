import type { SceneId } from '@/config/sceneDefinitions';

import type { CameraWaypointData } from '@/shared/types/camera';

/** @deprecated Import from @/shared/types/camera */
export type { CameraWaypointData };

/** Camera rig control — FollowCamera, SceneTransitionOverlay. */
export interface CameraEvents {
  'camera:cutscene_start': { cutsceneId: string; waypoints: CameraWaypointData[] };
  'camera:cutscene_end': Record<string, never>;
  'camera:npc_cutscene_start': { npcId: string; waypoints: CameraWaypointData[] };
  'camera:npc_cutscene_end': { npcId: string };
  'camera:combat_impact': { intensity: number };
  'camera:combat_shake': { intensity: number };
  'camera:dialogue_speaker': { speaker: 'npc' | 'player' | 'narrator' | 'unknown' };
  'camera:scene_flythrough': { targetPos: [number, number, number]; targetLookAt: [number, number, number] };
  'camera:cinematic_transition': { phase: 'fadeOut' | 'hold' | 'fadeIn'; sceneId: SceneId };
  'camera:recenter': Record<string, never>;
  /** Soft orbit yaw nudge toward a world point (stuck recovery / guidance). */
  'camera:look_toward': { x: number; y: number; z: number };
  'camera:intro_wake': Record<string, never>;
  'camera:poem_reading_start': Record<string, never>;
  'camera:poem_reading_end': Record<string, never>;
  /**
   * Emitted by `setCinematicPresentationMode('third_person', { easeMs })` when a
   * cutscene skip wants a smooth cubic-bezier (0.4, 0, 0.2, 1) blend from the
   * cutscene-end camera pose back to the exploration strategy target over
   * `durationMs` (~600ms). Consumed by FollowCamera's frame tick.
   */
  'camera:ease_back': { durationMs: number };
}
