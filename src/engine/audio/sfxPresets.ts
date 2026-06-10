/* ─── Volodka RPG – Sound effect presets ─── */

import type { SfxConfig, FootstepConfig } from './types';

export const SFX_PRESETS: Record<string, SfxConfig> = {
  click: { type: 'square', frequency: 800, duration: 0.04, gain: 0.15 },
  confirm: { type: 'sine', frequency: 600, duration: 0.08, gain: 0.2 },
  cancel: { type: 'sawtooth', frequency: 300, duration: 0.06, gain: 0.12 },
  notify: { type: 'sine', frequency: 1000, duration: 0.1, gain: 0.18 },
  quest_complete: { type: 'sine', frequency: 520, duration: 0.25, gain: 0.2 },
  error: { type: 'square', frequency: 200, duration: 0.15, gain: 0.15 },
  ui_open: { type: 'sine', frequency: 440, duration: 0.05, gain: 0.1 },
  ui_close: { type: 'sine', frequency: 330, duration: 0.05, gain: 0.1 },
  combat_hit: { type: 'square', frequency: 180, duration: 0.09, gain: 0.22 },
  combat_miss: { type: 'sawtooth', frequency: 120, duration: 0.12, gain: 0.14 },
  combat_poem_power: { type: 'sine', frequency: 880, duration: 0.18, gain: 0.2 },
};

export const FOOTSTEP_PRESETS: Record<string, FootstepConfig> = {
  default: { baseFreq: 100, noiseDuration: 0.08, gain: 0.12, filterQ: 1.0, filterType: 'bandpass', clickFreq: 0, clickGain: 0 },
  wood: { baseFreq: 180, noiseDuration: 0.06, gain: 0.14, filterQ: 1.5, filterType: 'bandpass', clickFreq: 800, clickGain: 0.03 },
  concrete: { baseFreq: 80, noiseDuration: 0.07, gain: 0.1, filterQ: 1.0, filterType: 'bandpass', clickFreq: 0, clickGain: 0 },
  metal: { baseFreq: 400, noiseDuration: 0.1, gain: 0.08, filterQ: 2.0, filterType: 'bandpass', clickFreq: 1200, clickGain: 0.04 },
  carpet: { baseFreq: 60, noiseDuration: 0.12, gain: 0.05, filterQ: 0.8, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  snow: { baseFreq: 50, noiseDuration: 0.15, gain: 0.06, filterQ: 0.6, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  // ─── New material types ───
  tile: { baseFreq: 250, noiseDuration: 0.05, gain: 0.11, filterQ: 2.5, filterType: 'bandpass', clickFreq: 1500, clickGain: 0.05 },
  gravel: { baseFreq: 120, noiseDuration: 0.1, gain: 0.13, filterQ: 0.7, filterType: 'bandpass', clickFreq: 600, clickGain: 0.02 },
  grass: { baseFreq: 70, noiseDuration: 0.14, gain: 0.05, filterQ: 0.5, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  metal_grate: { baseFreq: 500, noiseDuration: 0.12, gain: 0.09, filterQ: 3.0, filterType: 'bandpass', clickFreq: 2000, clickGain: 0.06 },
};
