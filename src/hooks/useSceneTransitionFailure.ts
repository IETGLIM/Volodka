import { useCallback, useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import type { SceneEvents } from '@/engine/events/sceneEvents';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import type { SceneId } from '@/shared/types/game';

type TransitionFailure = SceneEvents['scene:transition_failed'];

export function useSceneTransitionFailure() {
  const [failure, setFailure] = useState<TransitionFailure | null>(null);

  useEffect(() => {
    return eventBus.on('scene:transition_failed', (payload) => {
      setFailure(payload);
    });
  }, []);

  const dismiss = useCallback(() => setFailure(null), []);

  const retry = useCallback(() => {
    if (!failure?.targetScene) return;
    const target = failure.targetScene as SceneId;
    dismiss();
    requestSceneTransition(target);
  }, [failure, dismiss]);

  return { failure, dismiss, retry };
}
