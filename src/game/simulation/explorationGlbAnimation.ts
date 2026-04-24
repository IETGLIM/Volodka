/**
 * Выбор клипа ходьбы/бега/idle для GLB игрока в обходе (без Three.js / без `AnimationAction`).
 * Логика перенесена из `GLBPlayerModel` в `PhysicsPlayer` (шаг 4 архитектуры).
 */

export type ExplorationGlbAnimPlan = {
  targetAnim: string;
  idleAnim: string;
  singleClipMode: boolean;
};

/**
 * По списку имён экшенов и флагам движения возвращает ключ целевого клипа или `null`, если играть нечего.
 */
export function planExplorationGlbLocomotionClip(
  animationNames: string[],
  isMoving: boolean,
  isRunning: boolean,
): ExplorationGlbAnimPlan | null {
  if (animationNames.length === 0) return null;

  const idleAnim =
    animationNames.find((n) => n.toLowerCase().includes('idle')) ?? animationNames[0];

  const runPrefer =
    animationNames.find((n) => {
      const l = n.toLowerCase();
      return l.includes('run') && !l.includes('walk');
    }) ??
    animationNames.find((n) => n.toLowerCase().includes('run')) ??
    null;

  const singleClipMode = animationNames.length === 1;

  const walkPrefer =
    singleClipMode
      ? idleAnim
      : animationNames.find((n) => n.toLowerCase().includes('walk') && !n.toLowerCase().includes('run')) ??
        animationNames.find((n) => n.toLowerCase().includes('walk')) ??
        runPrefer ??
        null;

  let targetAnim = idleAnim;
  if (isMoving) {
    if (!singleClipMode && isRunning && runPrefer && animationNames.includes(runPrefer)) {
      targetAnim = runPrefer;
    } else if (walkPrefer && animationNames.includes(walkPrefer)) {
      targetAnim = walkPrefer;
    }
  }

  if (!targetAnim) return null;
  return { targetAnim, idleAnim, singleClipMode };
}

/** Множитель `effectiveTimeScale` в режиме одного клипа (псевдо-walk). */
export function explorationGlbSingleClipTimeScale(isMoving: boolean): number {
  return isMoving ? 1.22 : 1;
}
