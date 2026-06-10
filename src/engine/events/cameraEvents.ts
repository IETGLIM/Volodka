import type { SceneId } from '@/config/sceneDefinitions';

/** Waypoint data for cutscene camera (serializable). */
export interface CameraWaypointData {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  duration: number;
  controlPoint?: [number, number, number];
}

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
  'camera:intro_wake': Record<string, never>;
}
