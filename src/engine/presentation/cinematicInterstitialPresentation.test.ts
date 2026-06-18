import { describe, expect, it, beforeEach } from 'vitest';
import {
  isCinematicInterstitialActive,
  setFirstReadingCelebrationInterstitialActive,
  setMatrixQuoteInterstitialActive,
} from '@/engine/presentation/cinematicInterstitialPresentation';
import { setPoemReadingCutsceneUiActive } from '@/engine/poemReading/poemReadingOrchestrator';

describe('cinematicInterstitialPresentation', () => {
  beforeEach(() => {
    setMatrixQuoteInterstitialActive(false);
    setFirstReadingCelebrationInterstitialActive(false);
    setPoemReadingCutsceneUiActive(null);
  });

  it('is inactive by default', () => {
    expect(isCinematicInterstitialActive()).toBe(false);
  });

  it('tracks matrix quote interstitial', () => {
    setMatrixQuoteInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
  });

  it('tracks first reading celebration interstitial', () => {
    setFirstReadingCelebrationInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
  });

  it('tracks poem reading cutscene UI', () => {
    setPoemReadingCutsceneUiActive('poem_1');
    expect(isCinematicInterstitialActive()).toBe(true);
  });
});
