/** Codex / lore discovery — uiSlice. */
export interface LoreEvents {
  'lore:discovered': { id: string; title: string; rarity: string; category?: string };
  'codex:select_entry': { loreId: string };
}
