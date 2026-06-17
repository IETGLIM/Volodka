/* ─── Merge data-driven narrative texts into story nodes ─── */

import { describe, expect, it } from 'vitest';
import type { StoryNode } from '@/shared/types/game';
import { applyStoryTexts } from './applyStoryTexts';

describe('applyStoryTexts', () => {
  it('merges JSON prose onto structural nodes', () => {
    const structure = {
      start: {
        id: 'start',
        speaker: 'narrator',
        sceneId: 'volodka_room' as const,
        choices: [{ text: '', next: 'next_node' }],
      },
    } satisfies Record<string, Omit<StoryNode, 'text'> & { text?: string }>;

    const texts = {
      start: {
        text: 'Привет, мир.',
        choices: ['Дальше'],
      },
    };

    const nodes = applyStoryTexts(structure, texts);
    expect(nodes.start.text).toBe('Привет, мир.');
    expect(nodes.start.choices[0]?.text).toBe('Дальше');
  });
});
