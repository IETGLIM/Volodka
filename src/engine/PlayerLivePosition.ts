/* ─── Volodka RPG – live player transform (runtime → save bridge) ─── */
/**
 * PhysicsPlayer and SimplePlayer update position every frame via refs.
 * The Zustand store only receives position on scene transitions, so saves
 * must read this module to persist the actual world position.
 */

let livePosition: [number, number, number] | null = null;
let liveRotation: number | null = null;

export function setLivePlayerTransform(
  x: number,
  y: number,
  z: number,
  rotationY?: number,
): void {
  livePosition = [x, y, z];
  if (rotationY !== undefined) {
    liveRotation = rotationY;
  }
}

export function getLivePlayerPosition(): [number, number, number] | null {
  return livePosition;
}

export function getLivePlayerRotation(): number | null {
  return liveRotation;
}

export function clearLivePlayerTransform(): void {
  livePosition = null;
  liveRotation = null;
}
