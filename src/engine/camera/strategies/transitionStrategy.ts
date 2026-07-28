import {
  updateSceneTransition,
  DEFAULT_FOV,
} from '../cinematicCamera';
import type { CameraModeStrategy } from '../types';

/** Scene transition fly-through — highest priority, bypasses spring */
export const transitionStrategy: CameraModeStrategy = {
  id: 'transition',
  priority: 100,

  isActive(ctx) {
    return ctx.transition?.active ?? false;
  },

  update(ctx) {
    const transition = ctx.transition;
    const spring = ctx.spring;
    const cam = ctx.camera;
    if (!transition) return null;

    const transitionResult = updateSceneTransition(transition, ctx.delta);
    if (!transitionResult) return null;

    const targetPos = transitionResult.position;
    const targetLook = transitionResult.lookAt;
    const targetFov = DEFAULT_FOV;

    spring.position.copy(targetPos);
    spring.lookAt.copy(targetLook);
    spring.fov = targetFov;

    cam.position.copy(targetPos);
    cam.lookAt(targetLook);
    cam.fov = targetFov;
    cam.updateProjectionMatrix();

    return { kind: 'direct_applied', mode: 'transition' };
  },
};
