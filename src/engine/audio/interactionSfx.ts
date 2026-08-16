/* ─── Volodka RPG – Interaction SFX (procedural Web Audio) ───
 * Lightweight sound effects generated via OscillatorNode + GainNode on the
 * shared AudioContext. No external audio files required.
 *
 * Volume is intentionally low (gain ≤ 0.15) and durations are brief (50–200 ms)
 * so these feel like subtle UI feedback rather than intrusive sounds.
 *
 * Silent until the shared AudioContext is running (post user gesture).
 */

import { getSharedAudioContext } from '@/engine/SharedAudioContext';

/* ─── Sound type definitions ─── */

type InteractionSfxType = 'examine' | 'pickup' | 'door' | 'ui_click' | 'notification';

interface SfxRecipe {
  /** Oscillator waveform */
  wave: OscillatorType;
  /** Start frequency (Hz) */
  freqStart: number;
  /** End frequency (Hz) — same as start if no sweep */
  freqEnd: number;
  /** Peak gain (0..1, clamped to 0.15 max) */
  gain: number;
  /** Duration in seconds */
  duration: number;
  /** Frequency sweep timing (0 = no sweep) */
  sweepAt: number;
}

/* ─── Distinct sound recipes per type ─── */

const RECIPES: Record<InteractionSfxType, SfxRecipe> = {
  /** Short ascending tone — curious, perceptive */
  examine: {
    wave: 'sine',
    freqStart: 600,
    freqEnd: 1100,
    gain: 0.1,
    duration: 0.12,
    sweepAt: 0.06,
  },
  /** Pleasant two-tone chime — rewarding */
  pickup: {
    wave: 'sine',
    freqStart: 880,
    freqEnd: 1320,
    gain: 0.12,
    duration: 0.15,
    sweepAt: 0.07,
  },
  /** Low thud — heavy, physical */
  door: {
    wave: 'triangle',
    freqStart: 80,
    freqEnd: 55,
    gain: 0.15,
    duration: 0.2,
    sweepAt: 0.04,
  },
  /** Crisp click — snappy, responsive */
  ui_click: {
    wave: 'square',
    freqStart: 1800,
    freqEnd: 1200,
    gain: 0.06,
    duration: 0.05,
    sweepAt: 0,
  },
  /** Gentle ping — informative, non-intrusive */
  notification: {
    wave: 'sine',
    freqStart: 1046,
    freqEnd: 1046,
    gain: 0.1,
    duration: 0.1,
    sweepAt: 0,
  },
};

/* ─── Throttle state ─── */

let lastPlayTime = 0;
const THROTTLE_MS = 30;

/* ─── Main entry point ─── */

/**
 * Play a procedural interaction sound effect.
 * Uses the shared AudioContext — no new context is created.
 *
 * @param type  The kind of interaction sound to play.
 */
export function playSfx(type: InteractionSfxType): void {
  const ctx = getSharedAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const perfNow = performance.now();
  if (perfNow - lastPlayTime < THROTTLE_MS) return;
  lastPlayTime = perfNow;

  try {
    const recipe = RECIPES[type];
    const peakGain = Math.min(recipe.gain, 0.15);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(peakGain, now + 0.004);
    master.gain.setValueAtTime(peakGain, now + recipe.duration * 0.4);
    master.gain.exponentialRampToValueAtTime(0.0001, now + recipe.duration);
    master.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = recipe.wave;
    osc.frequency.setValueAtTime(recipe.freqStart, now);

    if (recipe.sweepAt > 0 && recipe.freqEnd !== recipe.freqStart) {
      osc.frequency.linearRampToValueAtTime(recipe.freqEnd, now + recipe.sweepAt);
    }

    osc.connect(master);
    osc.start(now);
    osc.stop(now + recipe.duration + 0.01);

    osc.onended = () => {
      try {
        osc.disconnect();
        master.disconnect();
      } catch {
        /* already torn down */
      }
    };

    /* ── For "pickup": add a second harmonic for chime richness ── */
    if (type === 'pickup') {
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.05);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, now);
      g2.gain.exponentialRampToValueAtTime(0.06, now + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.2);
      osc2.onended = () => {
        try { osc2.disconnect(); g2.disconnect(); } catch { /* noop */ }
      };
    }
  } catch {
    /* audio unavailable — fail silent */
  }
}

/** Type alias for the main entry point */
export type { InteractionSfxType };