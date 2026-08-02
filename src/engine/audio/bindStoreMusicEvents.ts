/**
 * Engine listeners for store-emitted UI events (music volume / enable toggle).
 * Keeps MusicEngine out of store slices.
 */

import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let bound = false;
let unsubs: Array<() => void> = [];

export function bindStoreMusicEvents(): void {
  if (bound) return;
  bound = true;

  unsubs.push(
    eventBus.on('ui:music_volume', ({ volume }) => {
      musicEngine.setVolume(volume);
    }),
  );

  unsubs.push(
    eventBus.on('ui:music_enabled', ({ enabled, sceneId }) => {
      if (!enabled) {
        musicEngine.stopMusic(1);
        return;
      }
      musicEngine.playSceneMusic(sceneId);
    }),
  );
}

/** Test helper — allow re-bind after reset. */
export function resetStoreMusicEventsForTests(): void {
  for (const u of unsubs) u();
  unsubs = [];
  bound = false;
}

// HMR: dispose old listeners so the new module instance can re-bind cleanly.
// Without this, editing this file in dev silently breaks music volume/enable
// toggles (old listeners cleared by eventBus.resetForHmr, new module never re-binds).
registerHmrDispose(() => {
  for (const u of unsubs) u();
  unsubs = [];
  bound = false;
});
