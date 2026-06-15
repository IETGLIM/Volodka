import { describe, expect, it } from 'vitest';
import { resolveNarrativeText } from './narrativePresentation';

describe('resolveNarrativeText', () => {
  const node = {
    text: 'base',
    textVariants: {
      highKarma: 'warm',
      neutralKarma: 'neutral',
      lowKarma: 'cold',
    },
    karmaThresholds: { high: 65, low: 30 },
  };

  it('selects karma band', () => {
    expect(resolveNarrativeText(node, 80)).toBe('warm');
    expect(resolveNarrativeText(node, 50)).toBe('neutral');
    expect(resolveNarrativeText(node, 10)).toBe('cold');
  });
});
