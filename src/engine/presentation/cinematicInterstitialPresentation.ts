import { isPoemReadingCutsceneUiActive } from '@/engine/poemReading/poemReadingOrchestrator';

let matrixQuoteActive = false;
let firstReadingCelebrationActive = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

export function setMatrixQuoteInterstitialActive(active: boolean): void {
  if (matrixQuoteActive === active) return;
  matrixQuoteActive = active;
  notifyListeners();
}

export function setFirstReadingCelebrationInterstitialActive(active: boolean): void {
  if (firstReadingCelebrationActive === active) return;
  firstReadingCelebrationActive = active;
  notifyListeners();
}

/** Matrix quote, first-reading celebration, or poem-reading ritual UI. */
export function isCinematicInterstitialActive(): boolean {
  return matrixQuoteActive || firstReadingCelebrationActive || isPoemReadingCutsceneUiActive();
}

export function subscribeCinematicInterstitial(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** PoemReadingCutscene mount changes — refresh HUD profile subscribers. */
export function notifyPoemReadingInterstitialChanged(): void {
  notifyListeners();
}
