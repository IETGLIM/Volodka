import { useEffect, useState } from 'react';
import type { SceneId } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';

/** True after `scene:loaded` fires for the active scene (first playable frame). */
export function useSceneLoadedGate(sceneId: SceneId): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const unsub = eventBus.on('scene:loaded', ({ sceneId: loadedId }) => {
      if (loadedId === sceneId) setLoaded(true);
    });
    return unsub;
  }, [sceneId]);

  return loaded;
}
