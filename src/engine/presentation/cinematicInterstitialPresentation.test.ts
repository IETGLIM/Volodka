import { describe, expect, it, beforeEach } from 'vitest';
import {
  getActiveExclusiveInterstitialKinds,
  isCinematicInterstitialActive,
  setFirstReadingCelebrationInterstitialActive,
  setMatrixQuoteInterstitialActive,
  setPoemDiscoveryRevealInterstitialActive,
  setPoemRevealInterstitialActive,
} from '@/engine/presentation/cinematicInterstitialPresentation';

describe('cinematicInterstitialPresentation', () => {
  beforeEach(() => {
    setMatrixQuoteInterstitialActive(false);
    setFirstReadingCelebrationInterstitialActive(false);
    setPoemRevealInterstitialActive(false);
  });

  it('is inactive by default', () => {
    expect(isCinematicInterstitialActive()).toBe(false);
    expect(getActiveExclusiveInterstitialKinds()).toEqual([]);
  });

  it('tracks matrix quote interstitial', () => {
    setMatrixQuoteInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
    expect(getActiveExclusiveInterstitialKinds()).toEqual(['matrix_quote']);
  });

  it('tracks first reading celebration interstitial', () => {
    setFirstReadingCelebrationInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
    expect(getActiveExclusiveInterstitialKinds()).toEqual(['first_reading_celebration']);
  });

  it('tracks unified poem reveal interstitial', () => {
    setPoemRevealInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
    expect(getActiveExclusiveInterstitialKinds()).toEqual(['poem_reveal']);
  });

  it('aliases legacy discovery setter onto poem reveal', () => {
    setPoemDiscoveryRevealInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
    expect(getActiveExclusiveInterstitialKinds()).toEqual(['poem_reveal']);
  });
});
