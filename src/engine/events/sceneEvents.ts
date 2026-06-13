import type { SceneId } from '@/config/sceneDefinitions';

/** Scene transitions and WebGL canvas lifecycle. */
export interface SceneEvents {
  'scene:transition': { targetScene: SceneId; spawnAt: [number, number, number] };
  /** Fired before store scene write — orchestrators tear down old scene resources. */
  'scene:unload': { sceneId: SceneId; nextSceneId: SceneId };
  'scene:enter': { sceneId: SceneId; fromSceneId: SceneId };
  /** Fired after the first canvas frame following scene:enter; Suspense chunks may still stream. */
  'scene:loaded': { sceneId: SceneId; fromSceneId: SceneId };
  'canvas:first-frame': { generation: number };
  'canvas:invalidate-first-frame': { generation: number };
  'canvas:context-lost': Record<string, never>;
}
