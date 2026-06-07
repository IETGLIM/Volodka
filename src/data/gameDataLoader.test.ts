import { describe, expect, it, vi } from 'vitest';

describe('gameDataLoader quest preload', () => {
  it('throws before narrative preload and serves definitions after', async () => {
    vi.resetModules();
    const loader = await import('@/data/gameDataLoader');

    expect(() => loader.getQuestDefinitions()).toThrow(/Quest data not loaded/);

    await loader.preloadNarrativeGameData();

    expect(loader.isQuestsGameDataLoaded()).toBe(true);
    expect(loader.getQuestDefinitions().length).toBeGreaterThan(0);
  });
});
