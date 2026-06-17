import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@/engine/EventBus';
import {
  initAccessibilitySettings,
  resetDefaultAccessibilityManager,
  setSkipPoemCutscenes,
} from '@/engine/accessibility/accessibilitySettings';
import { MAIN_POEM_IDS } from '@/data/poemCollectionMeta';
import {
  abortPoemReadingIfPending,
  completePoemReadingCutscene,
  getPendingPoemReadingId,
  hasReadPoemThisSession,
  isPoemReadingCutsceneUiActive,
  requestPoemPowerActivation,
  resetPoemReadingSession,
  setPoemReadingCutsceneUiActive,
  shouldSkipPoemReadingCutscene,
} from '@/engine/poemReading/poemReadingOrchestrator';

const lsStore: Record<string, string> = {};

function createLocalStorageMock() {
  return {
    getItem: (key: string) => lsStore[key] ?? null,
    setItem: (key: string, value: string) => {
      lsStore[key] = value;
    },
    removeItem: (key: string) => {
      delete lsStore[key];
    },
    clear: () => {
      for (const key of Object.keys(lsStore)) delete lsStore[key];
    },
  };
}

const activateSpy = vi.fn((_poemId: string) => true);
const canUseSpy = vi.fn((_poemId: string) => true);
const getPowerSpy = vi.fn((poemId: string) => ({
  poemId,
  name: 'Test Power',
  description: 'desc',
  cooldownMs: 60000,
  effect: () => {},
}));

vi.mock('@/engine/PoemPowerSystem', () => ({
  activatePoemPowerById: (poemId: string) => activateSpy(poemId),
  canUsePower: (poemId: string) => canUseSpy(poemId),
  getPoemPower: (poemId: string) => getPowerSpy(poemId),
}));

describe('poemReadingOrchestrator', () => {
  beforeEach(() => {
    for (const key of Object.keys(lsStore)) delete lsStore[key];
    vi.stubGlobal('localStorage', createLocalStorageMock());
    resetDefaultAccessibilityManager();
    initAccessibilitySettings();
    resetPoemReadingSession();
    activateSpy.mockClear();
    canUseSpy.mockReturnValue(true);
    getPowerSpy.mockImplementation((poemId: string) => ({
      poemId,
      name: 'Test Power',
      description: 'desc',
      cooldownMs: 60000,
      effect: () => {},
    }));
  });

  afterEach(() => {
    resetPoemReadingSession();
    resetDefaultAccessibilityManager();
    vi.unstubAllGlobals();
  });

  it('gates full ritual to MAIN_POEM_IDS only', () => {
    expect(shouldSkipPoemReadingCutscene(MAIN_POEM_IDS[0]!)).toBe(false);
    expect(shouldSkipPoemReadingCutscene('poem_tolpa')).toBe(true);
    expect(shouldSkipPoemReadingCutscene('poem_22')).toBe(true);
  });

  it('skips cutscene when skipPoemCutscenes accessibility setting is enabled', () => {
    setSkipPoemCutscenes(true);
    expect(shouldSkipPoemReadingCutscene('poem_1')).toBe(true);

    const result = requestPoemPowerActivation('poem_1');
    expect(result.status).toBe('activated');
    expect(activateSpy).toHaveBeenCalledWith('poem_1');
  });

  it('skips cutscene on repeat read in the same session', () => {
    const first = requestPoemPowerActivation('poem_1');
    expect(first.status).toBe('cutscene_pending');
    expect(getPendingPoemReadingId()).toBe('poem_1');

    completePoemReadingCutscene('poem_1');
    expect(hasReadPoemThisSession('poem_1')).toBe(true);
    activateSpy.mockClear();

    const second = requestPoemPowerActivation('poem_1');
    expect(second.status).toBe('activated');
    expect(activateSpy).toHaveBeenCalledWith('poem_1');
  });

  it('emits poem:show_cutscene then activates on complete for main poems', () => {
    const showEvents: string[] = [];
    const endEvents: string[] = [];
    const unsubShow = eventBus.on('poem:show_cutscene', ({ poemId }) => {
      showEvents.push(poemId);
    });
    const unsubEnd = eventBus.on('poem:cutscene_end', () => {
      endEvents.push('end');
    });

    const result = requestPoemPowerActivation('poem_3');
    expect(result.status).toBe('cutscene_pending');
    expect(showEvents).toEqual(['poem_3']);

    activateSpy.mockClear();
    expect(completePoemReadingCutscene('poem_3')).toBe(true);
    expect(activateSpy).toHaveBeenCalledWith('poem_3');
    expect(endEvents).toHaveLength(1);

    unsubShow();
    unsubEnd();
  });

  it('activates immediately in combat context', () => {
    const showEvents: string[] = [];
    const unsub = eventBus.on('poem:show_cutscene', ({ poemId }) => {
      showEvents.push(poemId);
    });

    const result = requestPoemPowerActivation('poem_1', 'combat');
    expect(result.status).toBe('activated');
    expect(showEvents).toHaveLength(0);
    expect(activateSpy).toHaveBeenCalledWith('poem_1');

    unsub();
  });

  it('recovers stale pending when cutscene UI is gone and retry succeeds', () => {
    const first = requestPoemPowerActivation('poem_1');
    expect(first.status).toBe('cutscene_pending');
    expect(getPendingPoemReadingId()).toBe('poem_1');

    setPoemReadingCutsceneUiActive('poem_1');
    setPoemReadingCutsceneUiActive(null);

    activateSpy.mockClear();
    const retry = requestPoemPowerActivation('poem_1');
    expect(retry.status).toBe('cutscene_pending');
    expect(getPendingPoemReadingId()).toBe('poem_1');
    expect(activateSpy).not.toHaveBeenCalled();
    expect(isPoemReadingCutsceneUiActive()).toBe(false);
  });

  it('returns cutscene_busy while cutscene UI is active', () => {
    requestPoemPowerActivation('poem_1');
    setPoemReadingCutsceneUiActive('poem_1');

    const retry = requestPoemPowerActivation('poem_2');
    expect(retry.status).toBe('failed');
    if (retry.status === 'failed') {
      expect(retry.reason).toBe('cutscene_busy');
    }
    expect(activateSpy).not.toHaveBeenCalled();
  });

  it('abortPoemReadingIfPending clears pending without activating power (closeAllPanels path)', () => {
    requestPoemPowerActivation('poem_1');
    setPoemReadingCutsceneUiActive('poem_1');

    activateSpy.mockClear();
    abortPoemReadingIfPending();

    expect(getPendingPoemReadingId()).toBeNull();
    expect(isPoemReadingCutsceneUiActive()).toBe(false);
    expect(activateSpy).not.toHaveBeenCalled();
    expect(hasReadPoemThisSession('poem_1')).toBe(false);
  });

  it('scene transition clears pending poem reading state', () => {
    requestPoemPowerActivation('poem_1');
    setPoemReadingCutsceneUiActive('poem_1');
    expect(getPendingPoemReadingId()).toBe('poem_1');

    eventBus.emit('scene:transition_start', {
      fromSceneId: 'cafe_evening',
      targetScene: 'volodka_room',
      spawnAt: [0, 0, 0],
    });

    expect(getPendingPoemReadingId()).toBeNull();
    activateSpy.mockClear();
    const retry = requestPoemPowerActivation('poem_1');
    expect(retry.status).toBe('cutscene_pending');
    expect(activateSpy).not.toHaveBeenCalled();
  });
});
