import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';
import type { PoemRevealMode } from '@/engine/poemReveal/poemRevealTypes';

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
  /** Unified reveal pipeline (discovery | power_ritual | explicit_read). */
  'poem:show_reveal': { poemId: string; mode: PoemRevealMode };
  'poem:reveal_end': { poemId?: string; mode?: PoemRevealMode };
  /** @deprecated Prefer poem:show_reveal mode=power_ritual */
  'poem:show_cutscene': { poemId: string };
  /** @deprecated Prefer poem:reveal_end */
  'poem:cutscene_end': Record<string, never>;
  /** @deprecated Prefer poem:show_reveal mode=discovery */
  'poem:show_discovery_reveal': { poemId: string };
  /** @deprecated Prefer poem:reveal_end */
  'poem:discovery_reveal_end': { poemId?: string };
  'poem:reset_all_effects': Record<string, never>;
}
