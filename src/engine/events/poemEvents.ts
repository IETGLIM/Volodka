/** Poem collection, cutscenes, and combat powers — PoemPowerSystem, worldSlice. */
export interface PoemEvents {
  'poem:power_used': { poemId: string; powerName: string };
  'poem:power_expired': { flagKey: string; poemId: string; expiredAt: number };
  'poem:collected': { poemId: string };
  'poem:show_cutscene': { poemId: string };
  'poem:cutscene_end': Record<string, never>;
  'poem:reset_all_effects': Record<string, never>;
}
