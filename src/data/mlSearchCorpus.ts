/**
 * Canon-safe search corpus for ML embeddings.
 * Metadata only — no poem body text, no dialogue nodes.
 * See docs/AI_CANON_POLICY.md.
 */

import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { getAllUnifiedPoems } from '@/data/unifiedPoemRegistry';
import type { LoreEntry } from '@/store/shared';

export type SearchCorpusKind = 'lore' | 'poem';

export interface SearchCorpusDocument {
  id: string;
  kind: SearchCorpusKind;
  /** Text fed to the embedding model (never poem body or dialogue). */
  text: string;
}

function loreDocumentText(entry: LoreEntry, includeBody: boolean): string {
  const parts = [entry.title, entry.category, entry.sceneId];
  if (entry.rarity) parts.push(entry.rarity);
  if (includeBody && entry.discovered && entry.body) {
    parts.push(entry.body.slice(0, 400));
  }
  return parts.join(' · ');
}

function poemDocumentText(
  canonicalName: string,
  poemTitle: string,
  worldDescription: string,
): string {
  return [canonicalName, poemTitle, worldDescription].join(' · ');
}

/** Build runtime corpus from lore entries + poem titles/metadata. */
export function buildSearchCorpus(entries: LoreEntry[]): SearchCorpusDocument[] {
  const loreDocs: SearchCorpusDocument[] = entries.map((entry) => ({
    id: entry.id,
    kind: 'lore',
    text: loreDocumentText(entry, true),
  }));

  const poemDocs: SearchCorpusDocument[] = getAllUnifiedPoems().map((poem) => ({
    id: poem.id,
    kind: 'poem',
    text: poemDocumentText(poem.canonicalName, poem.poemTitle, poem.worldDescription),
  }));

  return [...loreDocs, ...poemDocs];
}

/** Default corpus using initial lore seed + store overrides applied by caller. */
export function buildDefaultSearchCorpus(): SearchCorpusDocument[] {
  return buildSearchCorpus(INITIAL_LORE_ENTRIES);
}
