import { describe, expect, it } from 'vitest';
import {
  FIRST_READING_POEM_ID,
  FIRST_READING_QUEST_ID,
} from './firstReadingCelebrationContent';

describe('firstReadingCelebrationContent', () => {
  it('exports stable ids for quest routing', () => {
    expect(FIRST_READING_QUEST_ID).toBe('first_reading');
    expect(FIRST_READING_POEM_ID).toBe('poem_2');
  });
});
