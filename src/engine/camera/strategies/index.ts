import type { CameraModeContext, CameraModeStrategy, CameraModeUpdateResult } from '../types';
import { transitionStrategy } from './transitionStrategy';
import { npcCutsceneStrategy, cutsceneStrategy } from './cutsceneStrategy';
import { dialogStrategy } from './dialogStrategy';
import { combatStrategy } from './combatStrategy';
import { explorationStrategy } from './explorationStrategy';

/** Strategies sorted by priority (highest first) */
export const CAMERA_STRATEGIES: CameraModeStrategy[] = [
  transitionStrategy,
  npcCutsceneStrategy,
  cutsceneStrategy,
  dialogStrategy,
  combatStrategy,
  explorationStrategy,
].sort((a, b) => b.priority - a.priority);

export function resolveCameraMode(ctx: CameraModeContext): CameraModeUpdateResult | null {
  for (const strategy of CAMERA_STRATEGIES) {
    if (strategy.isActive(ctx)) {
      return strategy.update(ctx);
    }
  }
  return null;
}

export {
  transitionStrategy,
  npcCutsceneStrategy,
  cutsceneStrategy,
  dialogStrategy,
  combatStrategy,
  explorationStrategy,
};
