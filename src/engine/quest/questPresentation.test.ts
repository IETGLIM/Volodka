import { describe, expect, it } from 'vitest';
import { usesCinematicQuestCelebration } from './questPresentation';

describe('questPresentation', () => {
  it('routes first_reading through cinematic celebration', () => {
    expect(usesCinematicQuestCelebration('first_reading')).toBe(true);
    expect(usesCinematicQuestCelebration('maria_connection')).toBe(false);
  });
});
