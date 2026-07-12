/* ─── Volodka RPG – tutorial store actions ─── */

import { getGameStore, useGameStore } from '../gameStore';

/** Mark the first-play tutorial and all contextual tips as seen. */
export function completeTutorial(): void {
  const { tutorialFlags } = getGameStore();
  useGameStore.setState({
    tutorialFlags: {
      ...tutorialFlags,
      tutorialsCompleted: true,
      tutorial_seen_movement: true,
      tutorial_seen_interact: true,
      tutorial_seen_controls: true,
    },
  });
}
