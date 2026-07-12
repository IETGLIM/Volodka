/* ─── Regression: composite selector snapshots must be shallow-stable ───
 *  React #185 (Maximum update depth exceeded) on story/dialogue overlay open:
 *  useStoryContext/useDialogueContext returned a nested object literal
 *  (`storyConditionPlayer`), so every getSnapshot() produced a fresh reference,
 *  useShallow never stabilized, and useSyncExternalStore looped forever.
 *  These tests fail if anyone re-introduces an unstable (nested) literal.
 */

import { describe, it, expect } from 'vitest';
import { shallow } from 'zustand/vanilla/shallow';
import {
  selectStoryContext,
  selectDialogueContext,
} from './compositeSelectors';
import type { GameStoreState } from '../types';

/** Minimal store snapshot — only the fields these selectors read. */
function makeState(): GameStoreState {
  return {
    mainMenuOpen: false,
    introActive: false,
    combatActive: false,
    activeCutsceneId: null,
    showStoryOverlay: true,
    currentNodeId: 'corridor_door',
    playerState: {
      karma: 50,
      skills: { writing: 1, hacking: 1, intuition: 1, charisma: 1 },
      flags: { quiet_tea_zarema: true },
      progression: { currentAct: 1, level: 1, xp: 0, xpToNextLevel: 100 },
      inventory: [],
    },
    npcRelations: [],
    exploration: { timeOfDay: 12 },
  } as unknown as GameStoreState;
}

describe('composite selectors snapshot stability (React #185 regression)', () => {
  it('selectStoryContext returns a shallow-equal snapshot for the same state', () => {
    const state = makeState();
    const a = selectStoryContext(state);
    const b = selectStoryContext(state);
    expect(shallow(a, b)).toBe(true);
  });

  it('selectDialogueContext returns a shallow-equal snapshot for the same state', () => {
    const state = makeState();
    const a = selectDialogueContext(state);
    const b = selectDialogueContext(state);
    expect(shallow(a, b)).toBe(true);
  });

  it('selector snapshots contain no nested freshly-created objects', () => {
    const state = makeState();
    for (const select of [selectStoryContext, selectDialogueContext]) {
      const a = select(state) as Record<string, unknown>;
      const b = select(state) as Record<string, unknown>;
      for (const key of Object.keys(a)) {
        const va = a[key];
        const vb = b[key];
        if (typeof va === 'object' && va !== null) {
          // Object/array fields must come straight from the store (same ref),
          // never be rebuilt inside the selector.
          expect(vb, `selector field "${key}" must be reference-stable`).toBe(va);
        }
      }
    }
  });
});
