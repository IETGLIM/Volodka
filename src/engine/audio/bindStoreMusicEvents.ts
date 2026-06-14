/**
 * Engine listeners for store-emitted UI events (music volume / enable toggle).
 * Keeps MusicEngine out of store slices.
 */

import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';

let bound = false;

export function bindStoreMusicEvents(): void {
  if (bound) return;
  bound = true;

  eventBus.on('ui:music_volume', ({ volume }) => {
    musicEngine.setVolume(volume);
  });

  eventBus.on('ui:music_enabled', ({ enabled, sceneId }) => {
    if (!enabled) {
      musicEngine.stopMusic(1);
      return;
    }
    musicEngine.playSceneMusic(sceneId);
  });
}

/** Test helper — allow re-bind after reset. */
export function resetStoreMusicEventsForTests(): void {
  bound = false;
}
