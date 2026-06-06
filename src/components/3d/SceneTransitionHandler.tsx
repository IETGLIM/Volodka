
/* ─── Volodka RPG – Scene transition handler (wired via EventBus) ───
 *  Handles scene transitions with:
 *  - Door open/close sounds
 *  - Camera shake effect
 *  - Scene:enter event emission
 *  - Cinematic transition overlay trigger (fade to black / fade in)
 *  - Brief camera position freeze during transition
 *
 *  SINGLE WRITER for exploration.currentSceneId + playerPosition on transition.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
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

      // Coalesce exact duplicate while the same transition is in flight
      if (
        transitioningRef.current &&
        activeTransitionRef.current?.target === targetScene &&
        activeTransitionRef.current?.spawnKey === spawnKey
      ) {
        return;
      }

      // Chained transition to a different scene — cancel prior timers, proceed
      clearTimers();

      transitioningRef.current = true;
      activeTransitionRef.current = { target: targetScene, spawnKey };

      const store = useGameStore.getState();
      const fromScene = store.exploration.currentSceneId;

      audioEngine.playDoorOpen();

      const shakeDecay = -Math.log(0.001) / (CAMERA_SHAKE.DURATION_MS / 1000);
      triggerCameraShake(CAMERA_SHAKE.TRANSITION_INTENSITY, shakeDecay);

      store.setExplorationScene(targetScene);
      store.setPlayerPosition(spawnAt);
      store.discoverScene(targetScene);

      const config = getSceneConfigName(targetScene);
      eventBus.emit('ui:exploration_message', {
        text: `Переход: ${config}`,
      });

      audioEngine.playAmbient(targetScene);
      musicEngine.playSceneMusic(targetScene);

      eventBus.emit('scene:enter', {
        sceneId: targetScene,
        fromSceneId: fromScene,
      });

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
    });

    return () => {
      unsub();
      clearTimers();
      transitioningRef.current = false;
      activeTransitionRef.current = null;
    };
  }, []);

  return null;
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
    chk_forest_zorge: 'ЧК · Лес · Зорге',
  };
  return names[sceneId] ?? sceneId;
}
