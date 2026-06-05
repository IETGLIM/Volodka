/** Open-world exploration feedback (footsteps, mobile interact). */
export interface ExplorationEvents {
  'exploration:footstep': { position: [number, number, number]; yaw: number };
  'interact:press': { source?: string };
}
