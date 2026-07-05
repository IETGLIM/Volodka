import { useSyncExternalStore } from 'react';
import {
  isCinematicTimelineActive,
  subscribeCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';

/** True while CinematicTimelineRunner owns the actor avatar (splashes, intro wake). */
export function useCinematicTimelineActive(): boolean {
  return useSyncExternalStore(
    subscribeCinematicTimeline,
    isCinematicTimelineActive,
    () => false,
  );
}
