import { describe, expect, it, vi } from 'vitest';
import { POEMS } from '@/data/poems';

vi.mock('@/data/gameDataLoader', () => ({
  getPoemById: (poemId: string) => POEMS.find((p) => p.id === poemId) ?? null,
}));

import {
  FIRST_READING_POEM_ID,
  FIRST_READING_QUEST_ID,
  prepareFirstReadingCelebrationContent,
} from './firstReadingCelebrationContent';

describe('firstReadingCelebrationContent', () => {
  it('exports stable ids for quest routing', () => {
    expect(FIRST_READING_QUEST_ID).toBe('first_reading');
    expect(FIRST_READING_POEM_ID).toBe('poem_2');
  });

  it('typewriter body is a 4-line poem excerpt, not only the matrix quote', () => {
    const content = prepareFirstReadingCelebrationContent();
    expect(content.excerptLines.length).toBe(4);
    expect(content.excerptText).toContain('\n');
    expect(content.isFragment).toBe(true);
    expect(content.poemData?.title).toBeTruthy();
    expect(content.combatCue).toMatch(/^Бой · /);
    // Matrix quote remains as kicker, not the sole typed body.
    expect(content.quoteText.length).toBeGreaterThan(0);
    expect(content.excerptText).not.toBe(content.quoteText);
  });
});
