/** Screen post-processing and combat feedback FX — ScreenEffects, GlitchEffect. */
export interface FxEvents {
  'fx:glitch': { intensity: number; duration: number };
  'fx:flash': { color: string; opacity: number; duration: number };
  'fx:shake': { intensity: number; duration: number };
  'fx:vignette': { intensity: number; duration: number };
  'fx:chromatic': { intensity: number; duration: number };
  'fx:slowmo': { duration: number };
  'fx:achievement': { title: string; description: string; icon?: string };
  'fx:xp_gain': { amount: number; source?: string };
  'fx:stat_change': { stat: string; delta: number; type: 'positive' | 'negative' };
  'fx:damage_vignette': { intensity: number; duration: number };
  'fx:karma_shift': { direction: 'light' | 'dark'; intensity: number };
  'fx:scene_dissolve': { duration: number; color: string };
}
