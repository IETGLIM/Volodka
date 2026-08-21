/** Module-level motion blur strength — called from cinematic camera / transition systems.
 *  0 = no blur (default), 1 = maximum radial blur.
 *  Читается каждый кадр из MotionBlurEffect.tsx через getMotionBlurStrength(). */

let _motionBlurStrength = 0;

/** Установить силу размытия в движении (0–1). Вызывать из cutscene camera / transitions. */
export function setMotionBlurStrength(v: number): void {
  _motionBlurStrength = Math.max(0, Math.min(1, v));
}

/** Текущая сила размытия — опрашивается каждый кадр в useFrame. */
export function getMotionBlurStrength(): number {
  return _motionBlurStrength;
}
