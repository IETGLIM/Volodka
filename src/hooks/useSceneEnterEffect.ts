import { useEffect, useRef } from 'react';
import { eventBus, type EventBusUnsubscribe } from '@/engine/EventBus';
import type { SceneId } from '@/shared/types/game';

type SceneEnterHandler = (sceneId: SceneId) => void;

const handlers = new Set<SceneEnterHandler>();
let busUnsub: EventBusUnsubscribe | null = null;

function attachSceneEnterBus(): void {
  if (busUnsub) return;
  busUnsub = eventBus.on('scene:enter', ({ sceneId }) => {
    for (const handler of handlers) handler(sceneId);
  });
}

function detachSceneEnterBus(): void {
  busUnsub?.();
  busUnsub = null;
}

/** Run cleanup when the player enters any scene (including dev teleports). */
export function useSceneEnterEffect(onEnter: (sceneId: SceneId) => void): void {
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    const handler: SceneEnterHandler = (sceneId) => {
      onEnterRef.current(sceneId);
    };
    handlers.add(handler);
    attachSceneEnterBus();
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) detachSceneEnterBus();
    };
  }, []);
}
