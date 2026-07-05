import { describe, expect, it } from 'vitest';
import type { DialogueNode } from '@/shared/types/game';
import {
  buildDialogueLiveMessage,
  resolveDialogueEntryNodeId,
  resolveDialogueText,
} from './resolveDialoguePresentation';

const karmaNode: Pick<DialogueNode, 'text' | 'textVariants' | 'karmaThresholds'> = {
  text: 'base',
  textVariants: {
    highKarma: 'warm',
    neutralKarma: 'neutral',
    lowKarma: 'cold',
  },
  karmaThresholds: { high: 65, low: 30 },
};

describe('resolveDialogueText', () => {
  it('returns base text when no variants', () => {
    expect(resolveDialogueText({ text: 'hello' }, 50)).toBe('hello');
  });

  it('picks karma band text', () => {
    expect(resolveDialogueText(karmaNode, 80)).toBe('warm');
    expect(resolveDialogueText(karmaNode, 50)).toBe('neutral');
    expect(resolveDialogueText(karmaNode, 10)).toBe('cold');
  });
});

describe('resolveDialogueEntryNodeId', () => {
  it('redirects repeat CHK visits to return node', () => {
    const visited = ['chk_ru_greeting'];
    expect(resolveDialogueEntryNodeId('chk_ru_greeting', visited)).toBe('chk_ru_return');
  });

  it('keeps first visit on greeting node', () => {
    expect(resolveDialogueEntryNodeId('chk_ru_greeting', [])).toBe('chk_ru_greeting');
  });

  it('redirects repeat Ritka visits to pier return node', () => {
    expect(resolveDialogueEntryNodeId('chk_ritka_greeting', ['chk_ritka_greeting'])).toBe(
      'chk_ritka_pier_return',
    );
  });
});

describe('buildDialogueLiveMessage', () => {
  it('prepends context note for screen readers', () => {
    const message = buildDialogueLiveMessage(
      { speaker: 'Ру', contextNote: 'Костёр трещит.' },
      'Привет',
      true,
      true,
    );
    expect(message).toBe('Костёр трещит. Ру: Привет');
  });
});
