import { useEffect, useState } from 'react';
import type { SceneId } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';
import { getActiveCutsceneId } from '@/store/stores/cutsceneStore';

/** True after `scene:loaded` fires for the active scene (first playable frame).
 *  Also falls back to `true` on `scene:transition_failed` to avoid getting
 *  stuck with `loaded=false` forever (which would hide SceneInteriorAssets,
 *  TriggerZoneProps, and WorldItemPickupGlow — the scene would be playable
 *  but without interactive props).
 *
 *  Additional safety net: a 3-second timer forces loaded=true even if
 *  neither event fires. This prevents a deadlock where scene:loaded never
 *  emits (e.g. canvas:first-frame race during New Game wake-up) and the
 *  player sees an empty room with no interior, props, or triggers.
 *
 *  Same-scene New Game / loadGame re-arm via `game:playthrough_reset` /
 *  `game:loaded` so a menu-preloaded `loaded=true` cannot leak into the wake. */
const SCENE_LOADED_FALLBACK_MS = 3000;

export function useSceneLoadedGate(sceneId: SceneId): boolean {
  const [loaded, setLoaded] = useState(false);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const bump = () => setEpoch((n) => n + 1);
    const unsubs = [
      eventBus.on('game:playthrough_reset', bump),
      eventBus.on('game:loaded', bump),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  useEffect(() => {
    setLoaded(false);
    let settled = false;
    const tryMarkLoaded = () => {
      if (settled) return;
      // Wake owns the room until finishIntroWake emits scene:loaded.
      // Do not settle early from the 3s fallback or a stale menu scene:loaded.
      if (getActiveCutsceneId() === 'intro_wakeup') return;
      settled = true;
      setLoaded(true);
    };

    const unsubLoaded = eventBus.on('scene:loaded', ({ sceneId: loadedId }) => {
      if (loadedId === sceneId) tryMarkLoaded();
    });
    // Fallback 1: if the watchdog fires scene:transition_failed (e.g. canvas
    // context lost, tab in background during transition), mark as loaded so
    // interactive props mount. The 3D visual may be a fallback/greybox, but
    // the scene is still explorable.
    const unsubFailed = eventBus.on('scene:transition_failed', tryMarkLoaded);
    // Fallback 2: if neither event fires within 3s, force loaded=true.
    // This is the last line of defence against the scene:loaded deadlock
    // where canvas:first-frame never emits. Skipped while intro_wakeup is
    // active — finishIntroWake is responsible for the post-wake emit.
    const fallbackTimer = setTimeout(tryMarkLoaded, SCENE_LOADED_FALLBACK_MS);

    return () => {
      unsubLoaded();
      unsubFailed();
      clearTimeout(fallbackTimer);
    };
  }, [sceneId, epoch]);

  return loaded;
}
