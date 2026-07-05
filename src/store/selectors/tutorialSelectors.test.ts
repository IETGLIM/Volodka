import { describe, expect, it } from 'vitest';
import { ACT1_TUTORIAL_READY_NODES, selectAct1TutorialReady } from './tutorialSelectors';
import type { GameStoreState } from '../types';

function makeState(visitedNodes: string[], flags: Record<string, boolean> = {}): GameStoreState {
  return {
    playerState: { visitedNodes, flags },
    exploration: { currentSceneId: 'volodka_corridor' },
    mainMenuOpen: false,
    introActive: false,
    combatActive: false,
    activeCutsceneId: null,
  } as unknown as GameStoreState;
}

describe('selectAct1TutorialReady', () => {
  it('returns false before any ready node is visited', () => {
    expect(selectAct1TutorialReady(makeState(['wake_up']))).toBe(false);
  });

  it('returns true after intro wake flag is set', () => {
    expect(selectAct1TutorialReady(makeState([], { woke_up: true }))).toBe(true);
  });

  it('returns true when exploring volodka room', () => {
    expect(
      selectAct1TutorialReady({
        playerState: { visitedNodes: [], flags: {} },
        exploration: { currentSceneId: 'volodka_room' },
        mainMenuOpen: false,
        introActive: false,
        combatActive: false,
        activeCutsceneId: null,
      } as unknown as GameStoreState),
    ).toBe(true);
  });

  it('returns true when any act-1 ready node is visited', () => {
    for (const nodeId of ACT1_TUTORIAL_READY_NODES) {
      expect(selectAct1TutorialReady(makeState([nodeId]))).toBe(true);
    }
  });
});
