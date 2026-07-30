
/* ─── Volodka RPG – Scene transition handler (wired via EventBus) ───
 *  Handles scene transitions with:
 *  - Door open/close sounds
 *  - Camera shake effect
 *  - SceneTransitionManager protocol (unload → store → enter → loaded on first frame)
 *  - Brief camera position freeze during transition
 *
 *  SINGLE WRITER for exploration.currentSceneId + playerPosition on transition.
 */

import { useEffect, useRef } from 'react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { performSceneTransition } from '@/engine/core/SceneTransitionManager';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import type { SceneId } from '@/shared/types/game';
import { SCENE_TRANSITION, CAMERA_SHAKE } from '@/shared/constants/transitionTimings';

interface ActiveTransition {
  target: SceneId;
  spawnKey: string;
}

/**
 * Listens for `scene:transition` events on the EventBus and applies
 * the scene change + player repositioning through the game store.
 */
export function SceneTransitionHandler() {
  const transitioningRef = useRef(false);
  const activeTransitionRef = useRef<ActiveTransition | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  // Cooldown to prevent duplicate transitions (e.g., cutscene playing twice)
  const lastTransitionTimeRef = useRef(0);
  const TRANSITION_COOLDOWN_MS = 500;

  useEffect(() => {
    const clearTimers = () => {
      for (const t of timersRef.current) {
        clearTimeout(t);
      }
      timersRef.current = [];
    };

    const unsub = eventBus.on('scene:transition', (payload) => {
      const { targetScene, spawnAt } = payload;
      const spawnKey = spawnAt.map((v) => v.toFixed(3)).join(',');

      // Cooldown: only debounce identical target+spawn (cutscene double-fire).
      // A different targetScene within 500ms must still apply — otherwise
      // stacked exit zones soft-lock the player on the first destination.
      const now = Date.now();
      const sameTarget =
        activeTransitionRef.current?.target === targetScene &&
        activeTransitionRef.current?.spawnKey === spawnKey;
      if (
        now - lastTransitionTimeRef.current < TRANSITION_COOLDOWN_MS &&
        sameTarget
      ) {
        return;
      }

      if (
        transitioningRef.current &&
        sameTarget
      ) {
        return;
      }

      // Update transition timestamp
      lastTransitionTimeRef.current = now;

      clearTimers();

      transitioningRef.current = true;
      activeTransitionRef.current = { target: targetScene, spawnKey };

      audioEngine.playDoorOpen();

      const shakeDecay = -Math.log(0.001) / (CAMERA_SHAKE.DURATION_MS / 1000);
      triggerCameraShake(CAMERA_SHAKE.TRANSITION_INTENSITY, shakeDecay);

      performSceneTransition({ targetScene, spawnAt });

      eventBus.emit('camera:recenter', {});

      const doorCloseTimer = setTimeout(() => {
        audioEngine.playDoorClose();
      }, SCENE_TRANSITION.DOOR_CLOSE_DELAY_MS);
      timersRef.current.push(doorCloseTimer);

      const guardTimer = setTimeout(() => {
        transitioningRef.current = false;
        activeTransitionRef.current = null;
      }, SCENE_TRANSITION.GUARD_RESET_MS);
      timersRef.current.push(guardTimer);
    }, EventBusPriority.Orchestrator);

    return () => {
      unsub();
      clearTimers();
      transitioningRef.current = false;
      activeTransitionRef.current = null;
    };
  }, []);

  return null;
}
