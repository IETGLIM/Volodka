import { describe, expect, it } from 'vitest';
import { ACT1_TUTORIAL_READY_NODES, selectAct1TutorialReady } from './tutorialSelectors';
import type { GameStoreState } from '../types';

function makeState(visitedNodes: string[]): GameStoreState {
  return {
    playerState: { visitedNodes },
  } as GameStoreState;
}

describe('selectAct1TutorialReady', () => {
  it('returns false before any ready node is visited', () => {
    expect(selectAct1TutorialReady(makeState(['wake_up']))).toBe(false);
  });

  it('returns true when any act-1 ready node is visited', () => {
    for (const nodeId of ACT1_TUTORIAL_READY_NODES) {
      expect(selectAct1TutorialReady(makeState([nodeId]))).toBe(true);
    }
  });
});
