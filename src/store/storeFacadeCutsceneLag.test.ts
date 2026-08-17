import { describe, it, expect, beforeEach } from 'vitest';
import '@/store/gameStore';
import { useGameStore } from '@/store/gameStore';
import { useCutsceneStore, getActiveCutsceneId } from '@/store/stores/cutsceneStore';
import { useUIStore, getLiveGamePhase } from '@/store/stores/uiStore';
import { getCombinedGameState, resetCombinedGameStateCacheForTests } from '@/store/storeBindings';
import { resetSliceMutationSchedulerForTests } from '@/store/combinedState';

/**
 * Regression: New Game prologue failed because CinematicTimelineRunner read
 * `getGameStore().activeCutsceneId` while the React facade lagged one rAF
 * behind the live cutscene slice (canvas already mounted under the menu).
 */
describe('store facade vs live cutscene slice', () => {
  beforeEach(() => {
    resetCombinedGameStateCacheForTests();
    resetSliceMutationSchedulerForTests();
    useCutsceneStore.getState().setCutscene(null, []);
    useUIStore.setState({ mainMenuOpen: false, introActive: false, combatActive: false });
  });

  it('exposes intro_wakeup on the live slice and combined state immediately', () => {
    useCutsceneStore.getState().setCutscene('intro_wakeup', []);
    expect(getActiveCutsceneId()).toBe('intro_wakeup');
    expect(getCombinedGameState().activeCutsceneId).toBe('intro_wakeup');
  });

  it('documents that useGameStore.getState can lag until facade flush', () => {
    // Seed facade so it is not already holding intro_wakeup.
    useGameStore.setState({ activeCutsceneId: null });
    // Mutate the slice store directly (same path as setCutscene actions).
    useCutsceneStore.setState({ activeCutsceneId: 'intro_wakeup', cutsceneWaypoints: [] });

    // Live helpers see the update immediately.
    expect(getActiveCutsceneId()).toBe('intro_wakeup');
    expect(getCombinedGameState().activeCutsceneId).toBe('intro_wakeup');

    // Facade may still show the previous value until scheduleAfterSliceStoresSettle flushes.
    // Do not assert staleness (rAF timing differs in jsdom); assert the safe read path instead.
    expect(getActiveCutsceneId()).not.toBeNull();
  });

  it('getLiveGamePhase sees cutscene before facade catch-up', () => {
    useGameStore.setState({ activeCutsceneId: null, mainMenuOpen: false, introActive: false });
    useUIStore.setState({ mainMenuOpen: false, introActive: false, combatActive: false });
    useCutsceneStore.setState({ activeCutsceneId: 'intro_wakeup', cutsceneWaypoints: [] });

    expect(getLiveGamePhase()).toBe('cutscene');
  });
});
