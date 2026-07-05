import { useEffect, useState } from 'react';
import type { SceneId } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';

/** True after `scene:loaded` fires for the active scene (first playable frame).
 *  Also falls back to `true` on `scene:transition_failed` to avoid getting
 *  stuck with `loaded=false` forever (which would hide SceneInteriorAssets,
 *  TriggerZoneProps, and WorldItemPickupGlow — the scene would be playable
 *  but without interactive props). */
export function useSceneLoadedGate(sceneId: SceneId): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const unsubLoaded = eventBus.on('scene:loaded', ({ sceneId: loadedId }) => {
      if (loadedId === sceneId) setLoaded(true);
    });
    // Fallback: if the watchdog fires scene:transition_failed (e.g. canvas
    // context lost, tab in background during transition), mark as loaded so
    // interactive props mount. The 3D visual may be a fallback/greybox, but
    // the scene is still explorable.
    const unsubFailed = eventBus.on('scene:transition_failed', () => {
      setLoaded(true);
    });
    return () => {
      unsubLoaded();
      unsubFailed();
    };
  }, [sceneId]);

  return loaded;
}
