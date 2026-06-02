/**
 * Выбор клипа ходьбы/бега/idle для GLB игрока в обходе (без Three.js / без `AnimationAction`).
 * Логика перенесена из `GLBPlayerModel` в `PhysicsPlayer` (шаг 4 архитектуры).
 */

export type ExplorationGlbAnimPlan = {
  targetAnim: string;
  idleAnim: string;
  singleClipMode: boolean;
};

export type ExplorationMoveDirection =
  | 'forward'
  | 'backward'
  | 'strafe_left'
  | 'strafe_right';

/**
 * По списку имён экшенов и флагам движения возвращает ключ целевого клипа или `null`, если играть нечего.
 */
export function planExplorationGlbLocomotionClip(
  animationNames: string[],
  isMoving: boolean,
  isRunning: boolean,
  moveDirection: ExplorationMoveDirection = 'forward',
): ExplorationGlbAnimPlan | null {
  if (animationNames.length === 0) return null;

  const idleAnim =
    animationNames.find((n) => n.toLowerCase().includes('idle')) ??
    animationNames.find((n) => n.toLowerCase().includes('survey')) ??
    animationNames[0];

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

  const backwardWalkPrefer =
    animationNames.find((n) => {
      const l = n.toLowerCase();
      return (
        (l.includes('back') || l.includes('backward') || l.includes('reverse')) &&
        !l.includes('run')
      );
    }) ?? null;

  const strafeLeftWalkPrefer =
    animationNames.find((n) => {
      const l = n.toLowerCase();
      return (
        (l.includes('strafe') && l.includes('left')) ||
        (l.includes('left') && l.includes('walk'))
      );
    }) ?? null;

  const strafeRightWalkPrefer =
    animationNames.find((n) => {
      const l = n.toLowerCase();
      return (
        (l.includes('strafe') && l.includes('right')) ||
        (l.includes('right') && l.includes('walk'))
      );
    }) ?? null;

  let targetAnim = idleAnim;
  if (isMoving) {
    if (moveDirection === 'backward' && backwardWalkPrefer && animationNames.includes(backwardWalkPrefer)) {
      targetAnim = backwardWalkPrefer;
    } else if (
      moveDirection === 'strafe_left' &&
      strafeLeftWalkPrefer &&
      animationNames.includes(strafeLeftWalkPrefer)
    ) {
      targetAnim = strafeLeftWalkPrefer;
    } else if (
      moveDirection === 'strafe_right' &&
      strafeRightWalkPrefer &&
      animationNames.includes(strafeRightWalkPrefer)
    ) {
      targetAnim = strafeRightWalkPrefer;
    } else if (!singleClipMode && isRunning && runPrefer && animationNames.includes(runPrefer)) {
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
