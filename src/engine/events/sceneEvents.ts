import type { SceneId } from '@/config/sceneDefinitions';

/** Scene transitions and WebGL canvas lifecycle. */
export interface SceneEvents {
  /**
   * Command → engine request. Binder calls requestSceneTransition (dedupe + scene:transition).
   * Prefer this from store/UI/engine commanders instead of importing sceneTransition.
   */
  'scene:request_transition': {
    targetScene: SceneId;
    spawnAt?: [number, number, number];
  };
  'scene:transition': { targetScene: SceneId; spawnAt: [number, number, number] };
  /** Fired before store scene write — orchestrators tear down old scene resources. */
  'scene:unload': { sceneId: SceneId; nextSceneId: SceneId };
  'scene:enter': { sceneId: SceneId; fromSceneId: SceneId };
  /** Fired after store + scene:enter; visual assets may still stream via Suspense. */
  'scene:loaded': { sceneId: SceneId; fromSceneId: SceneId };
  'canvas:first-frame': { generation: number };
  'canvas:invalidate-first-frame': { generation: number };
  'canvas:context-lost': Record<string, never>;
}
