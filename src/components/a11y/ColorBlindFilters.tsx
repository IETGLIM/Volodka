/* ─── Volodka RPG – Color-blind SVG filter definitions ───
 * Renders a hidden <svg> containing three <filter> elements that implement
 * the standard Daltonization correction matrices (2I − S, where S is the
 * Machado et al. 2009 simulation matrix). The filters shift colors so that
 * distinctions lost to a given color-vision deficiency become visible:
 *   • protanopia  — red/green shift (L-cone absent)
 *   • deuteranopia — red/green shift (M-cone absent)
 *   • tritanopia   — blue/yellow shift (S-cone absent)
 *
 * The wrapper `<svg>` is zero-sized and `aria-hidden` so it never affects
 * layout or screen-reader output. Reference the filters from CSS via
 * `filter: url(#protanopia-correct)` etc. — see RPGGameCanvas for usage.
 *
 * Mount ONCE near the root (OrchestratorContent renders it next to GameAnnouncer).
 */

const PROTANOPIA_CORRECTION_MATRIX = [
  ' 1.847714 -1.052583  0.204868 0 0',
  '-0.114503  1.213719 -0.099216 0 0',
  ' 0.003882  0.048116  0.948002 0 0',
  ' 0         0         0        1 0',
].join('\n  ');

const DEUTERANOPIA_CORRECTION_MATRIX = [
  ' 1.632678 -0.860646  0.227968 0 0',
  '-0.280085  1.327499 -0.047413 0 0',
  ' 0.011820 -0.042940  1.031119 0 0',
  ' 0         0         0        1 0',
].join('\n  ');

const TRITANOPIA_CORRECTION_MATRIX = [
  ' 0.744472  0.076749  0.178779 0 0',
  ' 0.078411  1.069191 -0.147602 0 0',
  '-0.004733 -0.691367  0.696100 0 0',
  ' 0         0         0        1 0',
].join('\n  ');

/** Hidden SVG containing the three Daltonization color-blindness correction filters. */
export function ColorBlindFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-a11y-color-blind-filters=""
      style={{ position: 'absolute', width: 0, height: 0, left: 0, top: 0, pointerEvents: 'none' }}
    >
      <defs>
        <filter id="protanopia-correct" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={PROTANOPIA_CORRECTION_MATRIX} />
        </filter>
        <filter id="deuteranopia-correct" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={DEUTERANOPIA_CORRECTION_MATRIX} />
        </filter>
        <filter id="tritanopia-correct" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={TRITANOPIA_CORRECTION_MATRIX} />
        </filter>
      </defs>
    </svg>
  );
}

/** Maps a color-blind mode setting to its CSS filter URL (or '' when disabled). */
export function colorBlindModeToFilter(
  mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia',
): string {
  switch (mode) {
    case 'protanopia':
      return 'url(#protanopia-correct)';
    case 'deuteranopia':
      return 'url(#deuteranopia-correct)';
    case 'tritanopia':
      return 'url(#tritanopia-correct)';
    case 'none':
    default:
      return '';
  }
}
