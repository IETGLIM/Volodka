import type { SceneId } from '@/config/sceneDefinitions';

/** Scene transitions and WebGL canvas lifecycle. */
export interface SceneEvents {
  'scene:transition': { targetScene: SceneId; spawnAt: [number, number, number] };
  'scene:enter': { sceneId: SceneId; fromSceneId: SceneId };
  'canvas:first-frame': Record<string, never>;
  'canvas:invalidate-first-frame': Record<string, never>;
  'canvas:context-lost': Record<string, never>;
}
