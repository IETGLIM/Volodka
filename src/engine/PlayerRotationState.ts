/**
 * Shared player rotation state — lightweight module-level ref
 * that both the 3D player (RPGGameCanvas) and UI (CompassHUD)
 * can read/write without triggering React re-renders.
 *
 * The 3D player writes to `sharedPlayerRotationRef.current` every frame
 * inside its useFrame loop. The CompassHUD reads it via its own
 * requestAnimationFrame loop.
 */

export const sharedPlayerRotationRef: { current: number } = { current: Math.PI };
