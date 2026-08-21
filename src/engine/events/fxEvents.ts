/** Screen post-processing and combat feedback FX — ScreenEffects, GlitchEffect. */
export interface FxEvents {
  'fx:glitch': { intensity: number; duration: number };
  'fx:flash': { color: string; opacity: number; duration: number };
  'fx:shake': { intensity: number; duration: number };
  'fx:vignette': { intensity: number; duration: number };
  'fx:chromatic': { intensity: number; duration: number };
  'fx:xp_gain': { amount: number; source?: string };
  'fx:stat_change': { stat: string; delta: number; type: 'positive' | 'negative' };
  'fx:damage_vignette': { intensity: number; duration: number };
  /** Combat-cinematic chromatic aberration burst (AaaCombatCinematic). duration in ms. */
  'fx:chromatic_burst': { intensity: number; duration: number };
  /** Full-screen color flash for combat hits (AaaCombatCinematic). duration in ms. */
  'fx:screen_flash': { color: string; duration: number };
}
