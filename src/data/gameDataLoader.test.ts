import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  resetGameDataLoader,
  getGameDataLoadState,
  preloadBootGameData,
  preloadNarrativeGameData,
  isBootGameDataLoaded,
  isNarrativeGameDataLoaded,
  isQuestsGameDataLoaded,
} from './gameDataLoader';
import * as narrativePackRegistry from '@/data/narrative/narrativePackRegistry';

describe('gameDataLoader', () => {
  beforeEach(() => {
    resetGameDataLoader();
  });

  afterEach(() => {
    resetGameDataLoader();
    vi.restoreAllMocks();
  });

  it('resetGameDataLoader clears load flags and module refs', () => {
    expect(getGameDataLoadState()).toMatchObject({
      bootLoaded: false,
      narrativeLoaded: false,
      questsLoaded: false,
      bootModuleCount: 0,
      narrativeModuleCount: 0,
      storyNodeCount: 0,
      dialogueNodeCount: 0,
      loadedStoryPackCount: 0,
      loadedDialoguePackCount: 0,
    });
  });

  it('getGameDataLoadState reflects boot and narrative progress', async () => {
    await preloadBootGameData();

    expect(getGameDataLoadState()).toMatchObject({
      bootLoaded: true,
      narrativeLoaded: false,
      questsLoaded: false,
      bootModuleCount: 9,
      narrativeModuleCount: 0,
    });
    expect(isBootGameDataLoaded()).toBe(true);

    await preloadNarrativeGameData();

    const state = getGameDataLoadState();
    expect(state.narrativeLoaded).toBe(true);
    expect(state.questsLoaded).toBe(true);
    expect(state.narrativeModuleCount).toBe(2);
    expect(state.storyNodeCount).toBeGreaterThan(0);
    expect(state.dialogueNodeCount).toBeGreaterThan(0);
    expect(state.loadedStoryPackCount).toBeGreaterThan(0);
    expect(isNarrativeGameDataLoaded()).toBe(true);
    expect(isQuestsGameDataLoaded()).toBe(true);
  });

  it('does not mark questsLoaded when bootstrap narrative packs fail', async () => {
    const bootstrapSpy = vi
      .spyOn(narrativePackRegistry, 'loadBootstrapNarrativePacks')
      .mockRejectedValueOnce(new Error('bootstrap failed'));

    await expect(preloadNarrativeGameData()).rejects.toThrow('bootstrap failed');

    expect(isQuestsGameDataLoaded()).toBe(false);
    expect(isNarrativeGameDataLoaded()).toBe(false);
    expect(getGameDataLoadState().narrativeModuleCount).toBe(0);

    bootstrapSpy.mockRestore();

    await preloadNarrativeGameData();
    expect(isQuestsGameDataLoaded()).toBe(true);
    expect(isNarrativeGameDataLoaded()).toBe(true);
  });
});
