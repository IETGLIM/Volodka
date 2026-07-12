import { useSyncExternalStore } from 'react';
import {
  getTransitionDirectorSnapshot,
  subscribeTransitionDirector,
} from '@/engine/scene/TransitionDirector';

export function useTransitionDirector() {
  return useSyncExternalStore(subscribeTransitionDirector, getTransitionDirectorSnapshot);
}
