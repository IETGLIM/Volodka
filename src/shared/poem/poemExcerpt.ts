/**
 * Shared poem excerpt helpers — single source of truth for every poem UI
 * (discovery reveal, first-reading celebration, power ritual, combat tooltip,
 * terminal boot frame). Full poem text only via poetry book / explicit read.
 */

export const POEM_EXCERPT_LINE_COUNT = 4;
/** Combat select/hover — keep pace; 1–2 lines from the same excerpt path. */
export const POEM_COMBAT_EXCERPT_LINE_COUNT = 2;

export type PoemExcerpt = {
  /** Up to `maxLines` non-empty lines for on-screen reveal. */
  lines: string[];
  /** True when the full poem has more non-empty lines than the excerpt. */
  isFragment: boolean;
  /** Non-empty line count in the source poem. */
  totalLineCount: number;
};

type PoemLike = { readonly lines: readonly string[] };

function resolveLines(poemOrLines: PoemLike | readonly string[]): readonly string[] {
  if (Array.isArray(poemOrLines)) return poemOrLines;
  return (poemOrLines as PoemLike).lines;
}

/** First N non-empty lines — cinematic fragment beat, not the full poem. */
export function getPoemExcerpt(
  poemOrLines: PoemLike | readonly string[],
  maxLines: number = POEM_EXCERPT_LINE_COUNT,
): PoemExcerpt {
  const limit = Math.max(0, Math.floor(maxLines));
  const nonEmpty = resolveLines(poemOrLines).filter((line) => line.trim().length > 0);
  const lines = nonEmpty.slice(0, limit);
  return {
    lines,
    isFragment: nonEmpty.length > lines.length,
    totalLineCount: nonEmpty.length,
  };
}

/** Join excerpt lines for single-stream typewriters (`useTypewriter`). */
export function formatPoemExcerptText(lines: readonly string[]): string {
  return lines.join('\n');
}

/** Combat ability tooltip / hover — same excerpt helper, shorter window. */
export function getPoemCombatExcerptLines(
  poemOrLines: PoemLike | readonly string[],
): string[] {
  return getPoemExcerpt(poemOrLines, POEM_COMBAT_EXCERPT_LINE_COUNT).lines;
}

/**
 * ASCII terminal frame for story nodes (e.g. terminal_boot_poem).
 * Lines come from `getPoemExcerpt` — never hardcode verse copies here.
 */
export function formatTerminalPoemFrame(
  poemOrLines: PoemLike | readonly string[],
  options?: { maxLines?: number; innerWidth?: number },
): string {
  const maxLines = options?.maxLines ?? POEM_EXCERPT_LINE_COUNT;
  const innerWidth = options?.innerWidth ?? 46;
  const { lines } = getPoemExcerpt(poemOrLines, maxLines);
  const bar = '─'.repeat(innerWidth);
  const pad = (text: string) => {
    const clipped = text.length > innerWidth - 2 ? text.slice(0, innerWidth - 2) : text;
    return `│  ${clipped}${' '.repeat(Math.max(0, innerWidth - 2 - clipped.length))}│`;
  };
  return [
    `┌${bar}┐`,
    `│${' '.repeat(innerWidth)}│`,
    ...lines.map(pad),
    `│${' '.repeat(innerWidth)}│`,
    `└${bar}┘`,
  ].join('\n');
}
