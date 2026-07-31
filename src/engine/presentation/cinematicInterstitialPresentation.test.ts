import { describe, expect, it, beforeEach } from 'vitest';
import {
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
    setPoemDiscoveryRevealInterstitialActive(false);
    setPoemRevealInterstitialActive(false);
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

  it('tracks unified poem reveal interstitial', () => {
    setPoemRevealInterstitialActive(true);
    expect(isCinematicInterstitialActive()).toBe(true);
  });
});
