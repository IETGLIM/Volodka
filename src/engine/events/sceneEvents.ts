import type { SceneId } from '@/config/sceneDefinitions';

/** Scene transitions and WebGL canvas lifecycle. */
export interface SceneEvents {
  'scene:transition': { targetScene: SceneId; spawnAt: [number, number, number] };
  /** Fired at the start of performSceneTransition — before unload and store write. */
  'scene:transition_start': {
    fromSceneId: SceneId;
    targetScene: SceneId;
    spawnAt: [number, number, number];
  };
  /** Fired before store scene write — orchestrators tear down old scene resources. */
  'scene:unload': { sceneId: SceneId; nextSceneId: SceneId };
  'scene:enter': { sceneId: SceneId; fromSceneId: SceneId };
  /** Fired after the first canvas frame following scene:enter; Suspense chunks may still stream. */
  'scene:loaded': { sceneId: SceneId; fromSceneId: SceneId };
  /** Transition aborted — load error, user cancel, or unrecoverable canvas failure. */
  'scene:transition_failed': {
    reason: string;
    targetScene?: SceneId;
    fromScene?: SceneId;
    errorCode?: string;
    cancelled?: boolean;
  };
  'canvas:first-frame': { generation: number };
  'canvas:invalidate-first-frame': { generation: number };
  'canvas:context-lost': Record<string, never>;
  /** WebGL context was restored after a loss — GPU resource caches should rebuild. */
  'canvas:context-restored': Record<string, never>;
}
