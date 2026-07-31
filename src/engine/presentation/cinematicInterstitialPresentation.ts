/**
 * Exclusive cinematic interstitial gate — one sequential busy signal for
 * matrix quote, first-reading celebration, and unified poem reveal.
 *
 * Dialogue / VN overlay remain store-owned (`showStoryOverlay` /
 * `diegeticNarrative`) and are OR'd by presentation-profile consumers.
 * Do not invent a second poem discovery flag — use poem reveal only.
 */

export type ExclusiveInterstitialKind =
  | 'matrix_quote'
  | 'first_reading_celebration'
  | 'poem_reveal';

let matrixQuoteActive = false;
let firstReadingCelebrationActive = false;
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

/** Unified poem reveal (discovery / power_ritual / explicit_read) — flag only, no orchestrator import. */
export function setPoemRevealInterstitialActive(active: boolean): void {
  if (poemRevealInterstitialActive === active) return;
  poemRevealInterstitialActive = active;
  notifyListeners();
}

/**
 * @deprecated Use setPoemRevealInterstitialActive — discovery is a poem-reveal mode, not a parallel interstitial.
 */
export function setPoemDiscoveryRevealInterstitialActive(active: boolean): void {
  setPoemRevealInterstitialActive(active);
}

/** Matrix quote, first-reading celebration, or poem reveal UI. */
export function isCinematicInterstitialActive(): boolean {
  return (
    matrixQuoteActive ||
    firstReadingCelebrationActive ||
    poemRevealInterstitialActive
  );
}

/** Active exclusive interstitial kinds (empty when idle). */
export function getActiveExclusiveInterstitialKinds(): ExclusiveInterstitialKind[] {
  const kinds: ExclusiveInterstitialKind[] = [];
  if (matrixQuoteActive) kinds.push('matrix_quote');
  if (firstReadingCelebrationActive) kinds.push('first_reading_celebration');
  if (poemRevealInterstitialActive) kinds.push('poem_reveal');
  return kinds;
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
