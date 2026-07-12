import { useSyncExternalStore } from 'react';
import {
  isCinematicInterstitialActive,
  subscribeCinematicInterstitial,
} from '@/engine/presentation/cinematicInterstitialPresentation';

/** Reactive read of matrix quote, first-reading celebration, or poem-reading ritual UI. */
export function useCinematicInterstitialActive(): boolean {
  return useSyncExternalStore(
    subscribeCinematicInterstitial,
    isCinematicInterstitialActive,
    isCinematicInterstitialActive,
  );
}
