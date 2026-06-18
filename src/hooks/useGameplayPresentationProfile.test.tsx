import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@/store/gameStore';
import {
  resetSceneTransitionGuard,
  setSyncSceneTransitionInProgress,
} from '@/engine/core/sceneTransitionGuard';
import {
  cancelEncounterPresentation,
  registerEncounterCommitHandler,
  startEncounter,
} from '@/engine/combat/encounterPresentation';
import {
  setFirstReadingCelebrationInterstitialActive,
  setMatrixQuoteInterstitialActive,
} from '@/engine/presentation/cinematicInterstitialPresentation';
import { setPoemReadingCutsceneUiActive } from '@/engine/poemReading/poemReadingOrchestrator';
import {
  isExplorationHudProfile,
  isMotionFxProfile,
  shouldMountSceneTransitionFx,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';

vi.mock('@/engine/AudioEngine', () => ({
  audioEngine: {
    playSfx: vi.fn(),
    playStinger: vi.fn(),
  },
}));

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    mode: 'exploration',
    exploration: { currentSceneId: 'volodka_room' },
  }),
}));

vi.mock('@/engine/core/combatStartGate', () => ({
  deferCombatStartIfTransitionBusy: vi.fn(() => false),
  registerCombatStartGateTimeoutHandler: vi.fn(),
}));

function resetUiPhase(): void {
  const ui = useUIStore.getState();
  ui.setMainMenuOpen(false);
  ui.setIntroActive(false);
  ui.setCombatActive(false);
  ui.setShowStoryOverlay(false);
  ui.closeDiegeticNarrative();
  setMatrixQuoteInterstitialActive(false);
  setFirstReadingCelebrationInterstitialActive(false);
  setPoemReadingCutsceneUiActive(null);
}

describe('useGameplayPresentationProfile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetSceneTransitionGuard();
    cancelEncounterPresentation();
    resetUiPhase();
  });

  afterEach(() => {
    cancelEncounterPresentation();
    resetSceneTransitionGuard();
    resetUiPhase();
    vi.useRealTimers();
  });

  it('returns exploration by default', () => {
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('exploration');
  });

  it('returns transition when a scene change is in flight', () => {
    setSyncSceneTransitionInProgress(true);
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('transition');
  });

  it('returns encounter during the pre-combat beat', () => {
    registerEncounterCommitHandler(vi.fn());
    startEncounter({ source: 'creep', enemyType: 'system_daemon', encounterName: 'Test' });

    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('encounter');
  });

  it('returns combat when combat is active', () => {
    useUIStore.getState().setCombatActive(true);
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('combat');
  });

  it('returns narrative when story overlay is open', () => {
    useUIStore.getState().setShowStoryOverlay(true);
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('narrative');
  });

  it('returns narrative when diegetic narrative is active', () => {
    useUIStore.getState().openDiegeticNarrative('kitchen_table', 'story');
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('narrative');
  });

  it('returns narrative during matrix quote interstitial', () => {
    setMatrixQuoteInterstitialActive(true);
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('narrative');
  });

  it('returns narrative during poem reading cutscene', () => {
    setPoemReadingCutsceneUiActive('poem_1');
    const { result } = renderHook(() => useGameplayPresentationProfile());
    expect(result.current).toBe('narrative');
  });
});

describe('gameplay presentation profile helpers', () => {
  it('gates exploration-only HUD chrome', () => {
    expect(isExplorationHudProfile('exploration')).toBe(true);
    expect(isExplorationHudProfile('transition')).toBe(false);
    expect(isExplorationHudProfile('encounter')).toBe(false);
  });

  it('gates motion FX to exploration and combat', () => {
    expect(isMotionFxProfile('exploration')).toBe(true);
    expect(isMotionFxProfile('combat')).toBe(true);
    expect(isMotionFxProfile('encounter')).toBe(false);
    expect(isMotionFxProfile('transition')).toBe(false);
    expect(isMotionFxProfile('narrative')).toBe(false);
  });

  it('keeps scene transition FX mounted outside combat and encounter beats', () => {
    expect(shouldMountSceneTransitionFx('exploration')).toBe(true);
    expect(shouldMountSceneTransitionFx('transition')).toBe(true);
    expect(shouldMountSceneTransitionFx('narrative')).toBe(true);
    expect(shouldMountSceneTransitionFx('combat')).toBe(false);
    expect(shouldMountSceneTransitionFx('encounter')).toBe(false);
  });
});
