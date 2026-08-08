/**
 * Engine listeners for store-emitted UI events (music volume / enable toggle).
 * Keeps MusicEngine out of store slices.
 */

import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';
import { applyAudioSettings } from './AudioSettings';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let bound = false;
let unsubs: Array<() => void> = [];

export function bindStoreMusicEvents(): void {
  if (bound) return;
  bound = true;

  unsubs.push(
    eventBus.on('ui:music_volume', () => {
      // applyAudioSettings re-reads all settings (including musicEnabled) and
      // applies the correct volume to all engines. Simpler than computing the
      // multiplier here.
      applyAudioSettings();
    }),
  );

  unsubs.push(
    eventBus.on('ui:music_enabled', ({ enabled }) => {
      // FIX S13-22: delegate to applyAudioSettings — it respects musicEnabled
      // (volume=0 when disabled, normal volume when enabled). Previously this
      // called stopMusic/playSceneMusic(sceneId) which broke menu music: when
      // toggling music ON in the menu, it played volodka_room music instead of
      // menu music (sceneId was volodka_room, not __menu__).
      if (!enabled) {
        musicEngine.stopMusic(1);
      }
      applyAudioSettings();
      // If enabled + music was stopped, the SceneAudioController.onModeChange
      // will re-trigger playMenuMusic/playSceneMusic on the next phase sync.
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
