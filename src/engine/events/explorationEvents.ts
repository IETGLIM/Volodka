/** Open-world exploration feedback (footsteps, mobile interact, discovery). */
export interface ExplorationEvents {
  'exploration:footstep': { position: [number, number, number]; yaw: number };
  'exploration:scene_discovered': { sceneName: string; sceneId: string };
  'interact:press': { source?: string };
  'trigger:auto_execute': { triggerZoneId: string };
}
