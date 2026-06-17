import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';

/** Poem collection, cutscenes, and combat powers — PoemPowerSystem, worldSlice. */
export interface PoemEvents {
  'poem:power_used': { poemId: string; powerName: string };
  'poem:power_expired': { flagKey: string; poemId: string; expiredAt: number };
  /** Rhythm combo when two poem powers fire within the synergy window. */
  'poem:synergy_triggered': {
    synergyId: string;
    synergyName: string;
    poemIds: [string, string];
    triggeredByPoemId: string;
    pairedWithPoemId: string;
  };
  /** World-layer response when a poem power fires — VFX, audio, epigraph, hint flags. */
  'poem:world_event': {
    poemId: string;
    powerName: string;
    profile: PoemWorldEffectProfile;
    reducedMotion: boolean;
  };
  'poem:collected': { poemId: string };
  'poem:show_cutscene': { poemId: string };
  'poem:cutscene_end': Record<string, never>;
  'poem:reset_all_effects': Record<string, never>;
}
