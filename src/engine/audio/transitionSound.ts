/* ─── Volodka RPG – Transition Sound Effects ───
 * Procedural cyberpunk transition sounds using Web Audio API.
 * No audio files needed — oscillators and noise generate:
 *   - A subtle digital whoosh/glitch when transitioning between scenes
 *   - Short (200-400ms), fitting the cyberpunk aesthetic
 *
 * Uses the shared AudioContext from SharedAudioContext.ts.
 * Subscribes to scene:transition and scene:loaded events via EventBus.
 */

import { eventBus } from '@/engine/EventBus';
import { getSharedAudioContext, whenAudioReady } from '@/engine/SharedAudioContext';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

/** Master volume for transition sounds (0–1). */
const TRANSITION_SFX_VOLUME = 0.12;

/** Duration of the "whoosh" component in seconds. */
const WHOOSH_DURATION = 0.35;

/** Duration of the "glitch" component in seconds. */
const GLITCH_DURATION = 0.18;

/** Duration of the "arrival" chime in seconds. */
const ARRIVAL_DURATION = 0.28;

/**
 * Play a procedural "digital whoosh" sound when a scene transition begins.
 * Uses filtered noise burst + frequency-sweeping oscillator for a
 * cyberpunk portal/teleport feel.
 */
function playTransitionWhoosh(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // ─── Noise burst (filtered white noise → whoosh texture) ───
  const noiseLength = Math.ceil(ctx.sampleRate * WHOOSH_DURATION);
  const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) {
    noiseData[i] = (Math.random() * 2 - 1);
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  // Bandpass filter → gives the noise a "whoosh" character
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(800, now);
  bandpass.frequency.exponentialRampToValueAtTime(3000, now + WHOOSH_DURATION * 0.6);
  bandpass.frequency.exponentialRampToValueAtTime(400, now + WHOOSH_DURATION);
  bandpass.Q.setValueAtTime(1.5, now);

  // Noise envelope: quick attack, medium decay
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.exponentialRampToValueAtTime(TRANSITION_SFX_VOLUME * 0.7, now + 0.03);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + WHOOSH_DURATION);

  noiseSource.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noiseSource.start(now);
  noiseSource.stop(now + WHOOSH_DURATION + 0.01);

  // ─── Frequency-sweeping oscillator (digital warp tone) ───
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + WHOOSH_DURATION * 0.4);
  osc.frequency.exponentialRampToValueAtTime(80, now + WHOOSH_DURATION);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.001, now);
  oscGain.gain.exponentialRampToValueAtTime(TRANSITION_SFX_VOLUME * 0.3, now + 0.02);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + WHOOSH_DURATION);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + WHOOSH_DURATION + 0.01);

  // Cleanup
  noiseSource.onended = () => {
    noiseSource.disconnect();
    bandpass.disconnect();
    noiseGain.disconnect();
  };
  osc.onended = () => {
    osc.disconnect();
    oscGain.disconnect();
  };
}

/**
 * Play a short "digital glitch" stinger — adds texture during
 * the transition's glitch phase. Very short (180ms), digital crackle.
 */
function playTransitionGlitch(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Rapidly modulated square wave → digital glitch
  const osc = ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(120, now);

  // Rapid frequency jumps for glitch effect
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const t = now + (GLITCH_DURATION * i) / steps;
    const freq = 80 + Math.random() * 600;
    osc.frequency.setValueAtTime(freq, t);
  }

  // Sharp envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(TRANSITION_SFX_VOLUME * 0.25, now + 0.01);
  gain.gain.setValueAtTime(TRANSITION_SFX_VOLUME * 0.1, now + GLITCH_DURATION * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, now + GLITCH_DURATION);

  // High-pass filter → thin, digital quality
  const hipass = ctx.createBiquadFilter();
  hipass.type = 'highpass';
  hipass.frequency.setValueAtTime(800, now);

  osc.connect(hipass);
  hipass.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + GLITCH_DURATION + 0.01);

  osc.onended = () => {
    osc.disconnect();
    hipass.disconnect();
    gain.disconnect();
  };
}

/**
 * Play a soft "arrival" chime when the new scene finishes loading.
 * Two gentle sine tones with slight detuning for a shimmer effect.
 */
function playArrivalChime(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary tone (C5)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now);

  // Slightly detuned for shimmer
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(526.5, now);

  // Gentle envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(TRANSITION_SFX_VOLUME * 0.4, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + ARRIVAL_DURATION);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + ARRIVAL_DURATION + 0.01);
  osc2.stop(now + ARRIVAL_DURATION + 0.01);

  const cleanup = () => {
    osc1.disconnect();
    osc2.disconnect();
    gain.disconnect();
  };
  osc1.onended = cleanup;
  osc2.onended = cleanup;
}

// ─── EventBus integration ───

let initialized = false;
const busUnsubs: Array<() => void> = [];

function initTransitionSounds(): void {
  if (initialized) return;
  initialized = true;

  // Scene transition starts → whoosh + glitch
  busUnsubs.push(
    eventBus.on('scene:transition', () => {
      whenAudioReady(() => {
        playTransitionWhoosh();
        // Delayed glitch for texture
        setTimeout(() => {
          whenAudioReady(playTransitionGlitch);
        }, 80);
      });
    }),
  );

  // Scene loaded → arrival chime
  busUnsubs.push(
    eventBus.on('scene:loaded', () => {
      whenAudioReady(playArrivalChime);
    }),
  );
}

/** Dispose transition sound subscriptions (HMR / engine teardown). */
export function disposeTransitionSounds(): void {
  for (const unsub of busUnsubs) unsub();
  busUnsubs.length = 0;
  initialized = false;
}

/** Ensure transition sounds are active (idempotent). */
export function ensureTransitionSounds(): void {
  initTransitionSounds();
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initTransitionSounds();
}

registerHmrDispose(disposeTransitionSounds);
