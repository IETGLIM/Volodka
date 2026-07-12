import { devWarn } from '@/shared/utils/devLog';

export type JournalNote = {
  id: string;
  text: string;
  speaker?: string;
  sceneId: string;
  timestamp: number;
};

type StoryNodeLike = {
  text: string;
  speaker?: string;
  sceneId: string;
};

export function resolveNoteTimestamp(
  nodeId: string,
  visitIndex: number,
  timestamps: Record<string, number>,
): number {
  const stored = timestamps[nodeId];
  if (stored !== undefined) return stored;
  return visitIndex;
}

export function buildJournalNotes(
  visitedNodes: readonly string[],
  timestamps: Record<string, number>,
  storyNodes: Record<string, StoryNodeLike>,
): JournalNote[] {
  const notes: JournalNote[] = [];

  visitedNodes.forEach((nodeId, visitIndex) => {
    const node = storyNodes[nodeId];
    if (!node) return;
    notes.push({
      id: nodeId,
      text: node.text,
      speaker: node.speaker,
      sceneId: node.sceneId,
      timestamp: resolveNoteTimestamp(nodeId, visitIndex, timestamps),
    });
  });

  return notes.sort((a, b) => b.timestamp - a.timestamp);
}

export function filterJournalNotes(notes: JournalNote[], searchQuery: string): JournalNote[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return notes;
  return notes.filter(
    (note) =>
      note.text.toLowerCase().includes(query)
      || note.id.toLowerCase().includes(query)
      || (note.speaker ?? '').toLowerCase().includes(query),
  );
}

export function logNotesLoadFailure(error: unknown): void {
  devWarn('[JournalPanel] Failed to preload visited narrative nodes:', error);
}
