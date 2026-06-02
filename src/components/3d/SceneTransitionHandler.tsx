
/* ─── Volodka RPG – Scene transition handler (wired via EventBus) ───
 *  Handles scene transitions with:
 *  - Door open/close sounds
 *  - Camera shake effect
 *  - Scene:enter event emission
 *  - Cinematic transition overlay trigger (fade to black / fade in)
 *  - Brief camera position freeze during transition
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
import type { SceneId } from '@/shared/types/game';
import { SCENE_TRANSITION, CAMERA_SHAKE } from '@/shared/constants/transitionTimings';

/**
 * Listens for `scene:transition` events on the EventBus and applies
 * the scene change + player repositioning through the game store.
 *
 * Also:
 * - Plays door open/close sounds on transition
 * - Applies a brief camera shake effect
 * - Emits a `scene:enter` event so other systems can react
 * - Triggers cinematic transition overlay (via camera:cinematic_transition)
 * - Freezes camera briefly during the fade-out/hold phase
 */
export function SceneTransitionHandler() {
  const transitioningRef = useRef(false);
  const camera = useThree((s) => s.camera);
  const shakeRef = useRef({ active: false, elapsed: 0, intensity: 0 });
  const prevCamPos = useRef({ x: 0, y: 0, z: 0 });
  // Freeze camera position during cinematic fade
  const freezeRef = useRef(false);
  const frozenPosRef = useRef({ x: 0, y: 0, z: 0 });
  // Track timers for cleanup on unmount
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Camera shake + freeze in requestAnimationFrame loop
  useEffect(() => {
    let animFrame: number;

    const tick = () => {
      if (freezeRef.current) {
        // Keep camera at frozen position during cinematic transition
        camera.position.x = frozenPosRef.current.x;
        camera.position.y = frozenPosRef.current.y;
        camera.position.z = frozenPosRef.current.z;
      } else if (shakeRef.current.active) {
        shakeRef.current.elapsed += 16; // ~60fps
        const progress = shakeRef.current.elapsed / CAMERA_SHAKE.DURATION_MS; // shake duration
        if (progress >= 1) {
          shakeRef.current.active = false;
          // Restore camera position
          camera.position.x = prevCamPos.current.x;
          camera.position.y = prevCamPos.current.y;
          camera.position.z = prevCamPos.current.z;
        } else {
          // Decaying shake
          const decay = 1 - progress;
          const offset = shakeRef.current.intensity * decay;
          camera.position.x = prevCamPos.current.x + (Math.random() - 0.5) * offset;
          camera.position.y = prevCamPos.current.y + (Math.random() - 0.5) * offset * 0.5;
          camera.position.z = prevCamPos.current.z + (Math.random() - 0.5) * offset * 0.3;
        }
      }
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [camera]);

  // ── Listen for cinematic transition phases to control camera freeze ──
  useEffect(() => {
    const unsub = eventBus.on('camera:cinematic_transition', ({ phase }) => {
      if (phase === 'fadeOut') {
        // Freeze camera at current position during fade-out
        freezeRef.current = true;
        frozenPosRef.current = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        };
      } else if (phase === 'hold') {
        // Still frozen during hold
        freezeRef.current = true;
      } else if (phase === 'fadeIn') {
        // Unfreeze — let the spring camera settle into new position
        freezeRef.current = false;
      }
    });
    return unsub;
  }, [camera]);

  useEffect(() => {
    const unsub = eventBus.on('scene:transition', (payload) => {
      // Guard against rapid double-fires
      if (transitioningRef.current) return;
      transitioningRef.current = true;

      const { targetScene, spawnAt } = payload;
      const store = useGameStore.getState();
      const fromScene = store.exploration.currentSceneId;

      // Play door sounds
      audioEngine.playDoorOpen();

      // Start camera shake (reduced intensity — cinematic overlay handles the drama now)
      prevCamPos.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
      shakeRef.current = { active: true, elapsed: 0, intensity: CAMERA_SHAKE.TRANSITION_INTENSITY };

      // Apply scene + position in the store
      store.setExplorationScene(targetScene);
      store.setPlayerPosition(spawnAt);

      // Emit exploration message for the HUD
      const config = getSceneConfigName(targetScene);
      eventBus.emit('ui:exploration_message', {
        text: `Переход: ${config}`,
      });

      // Play ambient for the new scene
      audioEngine.playAmbient(targetScene);

      // Play procedural ambient music for the new scene
      musicEngine.playSceneMusic(targetScene);

      // Emit scene:enter event so other systems can react
      // This also triggers CinematicTransition's fade overlay
      eventBus.emit('scene:enter', {
        sceneId: targetScene,
        fromSceneId: fromScene,
      });

      // Play door close after a brief delay
      const doorCloseTimer = setTimeout(() => {
        audioEngine.playDoorClose();
      }, SCENE_TRANSITION.DOOR_CLOSE_DELAY_MS);
      timersRef.current.push(doorCloseTimer);

      // Reset guard after the cinematic transition completes
      // (0.3s fade-out + 0.2s hold + 0.5s fade-in + small buffer = ~1.1s)
      const guardTimer = setTimeout(() => {
        transitioningRef.current = false;
      }, SCENE_TRANSITION.GUARD_RESET_MS);
      timersRef.current.push(guardTimer);
    });

    return () => {
      unsub();
      // Clear any pending timers on unmount or effect re-run
      for (const t of timersRef.current) {
        clearTimeout(t);
      }
      timersRef.current = [];
    };
  }, [camera]);

  return null; // No visual output
}

/** Quick lookup for scene display name without importing full config */
function getSceneConfigName(sceneId: SceneId): string {
  const names: Record<SceneId, string> = {
    volodka_room: 'Комната Володьки',
    volodka_corridor: 'Коридор коммуналки',
    home_evening: 'Кухня — вечер',
    street_night: 'Улица — ночь',
    street_winter: 'Улица — зима',
    cafe_evening: 'Кафе «Синяя яма»',
    office_day: 'Офис IT-гильдии',
    park_day: 'Парк — день',
    library_day: 'Библиотека',
    battle: 'Бой',
    sleep_dream: 'Сон',
    rooftop_edge: 'Край крыши',
    abandoned_factory: 'Заброшенный завод',
    zarema_albert_room: 'Комната Заремы и Альберта',
  };
  return names[sceneId] ?? sceneId;
}
