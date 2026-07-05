/** Waypoint data for cutscene camera (serializable). */
export interface CameraWaypointData {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  duration: number;
  controlPoint?: [number, number, number];
}
