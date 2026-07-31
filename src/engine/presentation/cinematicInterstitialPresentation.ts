let matrixQuoteActive = false;
let firstReadingCelebrationActive = false;
let poemDiscoveryRevealActive = false;
let poemRevealInterstitialActive = false;
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

export function setPoemDiscoveryRevealInterstitialActive(active: boolean): void {
  if (poemDiscoveryRevealActive === active) return;
  poemDiscoveryRevealActive = active;
  notifyListeners();
}

/** Unified poem reveal (discovery / power_ritual / explicit_read) — flag only, no orchestrator import. */
export function setPoemRevealInterstitialActive(active: boolean): void {
  if (poemRevealInterstitialActive === active) return;
  poemRevealInterstitialActive = active;
  notifyListeners();
}

/** Matrix quote, first-reading celebration, or any poem reveal UI. */
export function isCinematicInterstitialActive(): boolean {
  return (
    matrixQuoteActive ||
    firstReadingCelebrationActive ||
    poemDiscoveryRevealActive ||
    poemRevealInterstitialActive
  );
}

export function subscribeCinematicInterstitial(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** PoemRevealHost mount changes — refresh HUD profile subscribers. */
export function notifyPoemReadingInterstitialChanged(): void {
  notifyListeners();
}
