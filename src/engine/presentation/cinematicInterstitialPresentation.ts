/**
 * Exclusive cinematic interstitial gate — one sequential busy signal for
 * matrix quote, first-reading celebration, poem reveal, and quest completion UI.
 *
 * Dialogue / VN overlay remain store-owned forever (`showStoryOverlay` /
 * `diegeticNarrative`) and are OR'd by presentation-profile consumers.
 * Do not invent a parallel dialogue busy module or a second poem-discovery flag.
 */

export type ExclusiveInterstitialKind =
  | 'matrix_quote'
  | 'first_reading_celebration'
  | 'poem_reveal'
  | 'quest_complete'
  | 'quest_chain_unlock';

let matrixQuoteActive = false;
let firstReadingCelebrationActive = false;
let poemRevealInterstitialActive = false;
let questCompleteActive = false;
let questChainUnlockActive = false;
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

/** Quest-complete dialog (non-cinematic celebration path). */
export function setQuestCompleteInterstitialActive(active: boolean): void {
  if (questCompleteActive === active) return;
  questCompleteActive = active;
  notifyListeners();
}

/** Quest-chain unlock banner. */
export function setQuestChainUnlockInterstitialActive(active: boolean): void {
  if (questChainUnlockActive === active) return;
  questChainUnlockActive = active;
  notifyListeners();
}

/** Matrix quote, celebration, poem reveal, or quest completion UI. */
export function isCinematicInterstitialActive(): boolean {
  return (
    matrixQuoteActive ||
    firstReadingCelebrationActive ||
    poemRevealInterstitialActive ||
    questCompleteActive ||
    questChainUnlockActive
  );
}

/** Active exclusive interstitial kinds (empty when idle). */
export function getActiveExclusiveInterstitialKinds(): ExclusiveInterstitialKind[] {
  const kinds: ExclusiveInterstitialKind[] = [];
  if (matrixQuoteActive) kinds.push('matrix_quote');
  if (firstReadingCelebrationActive) kinds.push('first_reading_celebration');
  if (poemRevealInterstitialActive) kinds.push('poem_reveal');
  if (questCompleteActive) kinds.push('quest_complete');
  if (questChainUnlockActive) kinds.push('quest_chain_unlock');
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
