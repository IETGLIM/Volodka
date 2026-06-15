import { describe, expect, it, vi } from 'vitest';
import {
  pickNpcBarkLine,
  resolveNpcBarkForRelation,
  type NPCBarkTexts,
} from './npcBark';

describe('pickNpcBarkLine', () => {
  it('returns a string band as-is', () => {
    expect(pickNpcBarkLine('Привет')).toBe('Привет');
  });

  it('picks from a pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(pickNpcBarkLine(['a', 'b', 'c'])).toBe('c');
    vi.restoreAllMocks();
  });
});

describe('resolveNpcBarkForRelation', () => {
  const texts: NPCBarkTexts = {
    hostile: 'hostile',
    neutral: ['neutral-a', 'neutral-b'],
    friendly: 'friendly',
  };

  it('selects band by relation value', () => {
    expect(resolveNpcBarkForRelation(texts, 20)).toBe('hostile');
    expect(resolveNpcBarkForRelation(texts, 50)).toBe('neutral-a');
    expect(resolveNpcBarkForRelation(texts, 80)).toBe('friendly');
  });
});
