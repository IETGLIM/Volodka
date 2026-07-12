import type { SceneId } from '@/shared/types/game';
import { setSceneGpuRegistrationContext } from '@/engine/three/sceneGpuOwnership';

/** Run a dynamic import while tagging module-level GPU registrations for a scene. */
export function importWithSceneGpuRegistration<T>(
  sceneId: SceneId,
  importFn: () => Promise<T>,
): Promise<T> {
  setSceneGpuRegistrationContext(sceneId);
  return importFn().finally(() => {
    setSceneGpuRegistrationContext(null);
  });
}
