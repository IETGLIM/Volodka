import type { KarmaThresholds, NarrativeTextVariants } from '@/shared/types/definitions/narrative';
import { sanitizePlainText } from '@/shared/utils/sanitizePlainText';

export const DEFAULT_KARMA_THRESHOLDS: KarmaThresholds = { high: 65, low: 30 };

export function resolveNarrativeText(
  node: {
    readonly text: string;
    readonly textVariants?: NarrativeTextVariants;
    readonly karmaThresholds?: KarmaThresholds;
  },
  karma: number,
): string {
  const variants = node.textVariants;
  if (!variants) return sanitizePlainText(node.text);

  const thresholds = node.karmaThresholds ?? DEFAULT_KARMA_THRESHOLDS;
  if (karma >= thresholds.high && variants.highKarma) {
    return sanitizePlainText(variants.highKarma);
  }
  if (karma <= thresholds.low && variants.lowKarma) {
    return sanitizePlainText(variants.lowKarma);
  }
  if (variants.neutralKarma) return sanitizePlainText(variants.neutralKarma);
  return sanitizePlainText(node.text);
}

export function buildNarrativeLiveMessage(
  parts: {
    readonly contextNote?: string;
    readonly accessibilityAnnounce?: string;
    readonly speaker?: string;
  },
  displayedText: string,
  done: boolean,
): string {
  const suffix = done ? '' : '…';
  const spoken = `${displayedText}${suffix}`;
  const prefix = [parts.accessibilityAnnounce, parts.contextNote].filter(Boolean).join(' ');
  const body = parts.speaker && parts.speaker !== 'narrator'
    ? `${parts.speaker}: ${spoken}`
    : spoken;
  return prefix ? `${prefix} ${body}` : body;
}
