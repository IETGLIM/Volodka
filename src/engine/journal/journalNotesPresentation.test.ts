import { describe, expect, it } from 'vitest';
import {
  buildJournalNotes,
  filterJournalNotes,
  resolveNoteTimestamp,
} from '@/engine/journal/journalNotesPresentation';

describe('resolveNoteTimestamp', () => {
  it('prefers stored timestamp over visit index', () => {
    expect(resolveNoteTimestamp('node_a', 3, { node_a: 1_700_000_000_000 })).toBe(1_700_000_000_000);
  });

  it('falls back to visit index for legacy saves', () => {
    expect(resolveNoteTimestamp('node_a', 3, {})).toBe(3);
  });
});

describe('buildJournalNotes', () => {
  it('sorts by timestamp descending with stable visit order fallback', () => {
    const notes = buildJournalNotes(
      ['older', 'newer'],
      { older: 100, newer: 200 },
      {
        older: { text: 'Old', sceneId: 'volodka_room' },
        newer: { text: 'New', sceneId: 'volodka_room' },
      },
    );
    expect(notes.map((note) => note.id)).toEqual(['newer', 'older']);
  });
});

describe('filterJournalNotes', () => {
  const notes = buildJournalNotes(
    ['note_a'],
    { note_a: 1 },
    { note_a: { text: 'Hello world', sceneId: 'volodka_room', speaker: 'Volodka' } },
  );

  it('returns all notes when search is empty', () => {
    expect(filterJournalNotes(notes, '')).toHaveLength(1);
  });

  it('filters by text content', () => {
    expect(filterJournalNotes(notes, 'hello')).toHaveLength(1);
    expect(filterJournalNotes(notes, 'missing')).toHaveLength(0);
  });
});
