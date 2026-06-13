import { useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import type { SceneId } from '@/shared/types/game';

/** Run cleanup when the player enters any scene (including dev teleports). */
export function useSceneEnterEffect(onEnter: (sceneId: SceneId) => void): void {
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    return eventBus.on('scene:enter', ({ sceneId }) => {
      onEnterRef.current(sceneId);
    });
  }, []);
}
