/** Shared flag for legacy HUD visibility checks (prefer PHOTO_EVENTS). */
export const photoModeActive = { current: false };

export function setPhotoModeActive(active: boolean): void {
  photoModeActive.current = active;
}
